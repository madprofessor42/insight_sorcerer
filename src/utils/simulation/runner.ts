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

    for (const [prefixedKey, primitive] of primitiveMap.entries()) {
      try {
        const data = results.series(primitive);
        // Keep the prefixed key to avoid collisions
        series[prefixedKey] = data;
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

