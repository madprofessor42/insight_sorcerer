/**
 * Simulation runner - executes simulation and returns results.
 * 
 * Clean separation of concerns: converter creates model, runner executes it.
 */

import type * as go from 'gojs';
import type { SimulationConfig, SimulationRunResult } from './types';
import { convertToSimulationModel } from './converter';

// Error type from simulation library
interface SimulationError extends Error {
  errorPrimitive?: {
    id?: string;
    name?: string;
  };
}

/**
 * Run simulation on the provided GoJS diagram.
 * 
 * @param nodes - GoJS node data array
 * @param links - GoJS link data array  
 * @param config - Optional simulation configuration
 * @returns Simulation results or error
 */
export async function runSimulation(
  nodes: Array<go.ObjectData>,
  links: Array<go.ObjectData>,
  config?: SimulationConfig
): Promise<SimulationRunResult> {
  try {
    // 1. Convert GoJS data to simulation model
    const conversion = convertToSimulationModel(nodes, links, config);
    
    if (!conversion.success || !conversion.model || !conversion.primitiveMap) {
      return {
        success: false,
        error: conversion.error ?? 'Failed to convert diagram to simulation model',
      };
    }

    const { model, primitiveMap } = conversion;

    // 2. Run simulation
    let results;
    try {
      results = model.simulate();
    } catch (error) {
      const simError = error as SimulationError;
      return {
        success: false,
        error: simError.message ?? 'Simulation failed',
        errorPrimitiveId: simError.errorPrimitive?.id,
        errorPrimitiveName: simError.errorPrimitive?.name,
      };
    }

    // 3. Extract time series for all primitives
    const times = results.times();
    const series: Record<string, number[]> = {};

    for (const [key, primitive] of primitiveMap.entries()) {
      try {
        const data = results.series(primitive);
        
        // Check if the first value is an object (vector/dictionary)
        if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
          // This is a vector result - expand each element into a separate series
          const vectorKeys = Object.keys(data[0]);
          
          for (const vectorKey of vectorKeys) {
            const vectorSeries: number[] = [];
            for (const timePoint of data) {
              vectorSeries.push(timePoint[vectorKey]);
            }
            // Use key format: primitiveKey.vectorElement
            series[`${String(key)}.${vectorKey}`] = vectorSeries;
          }
        } else {
          // Regular scalar series
          // Use nanoid key (guaranteed unique across nodes and links)
          series[String(key)] = data;
        }
      } catch {
        // Some primitives (like Links) don't have series data
        // This is expected, just skip them
        continue;
      }
    }

    return {
      success: true,
      times,
      series,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

