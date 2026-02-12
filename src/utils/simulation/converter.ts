/**
 * Converts GoJS diagram (nodes + links) to simulation Model.
 * 
 * Adapted from system_dynamics to work with go.ObjectData.
 */

// @ts-expect-error - simulation package has JS with JSDoc types
import { Model } from 'simulation';
// @ts-expect-error - simulation package has JS with JSDoc types
import type { Stock, Variable, Flow, Link } from 'simulation';
import type * as go from 'gojs';
import { DEFAULT_SIMULATION_CONFIG } from './constants';
import type { SimulationConfig } from './types';
import {
  createStockPrimitive,
  createVariablePrimitive,
  createFlowPrimitive,
  createLinkPrimitive,
  type ConversionError,
} from './primitiveFactory';

// Primitive types from simulation library
type SimulationPrimitive = Stock | Variable | Flow | Link;

// Internal types (not exported)
interface ConversionResult {
  success: boolean;
  model?: Model;
  primitiveMap?: Map<go.Key, SimulationPrimitive>;
  error?: string;
  errorDetails?: ConversionError[];
}

/**
 * Convert GoJS diagram to simulation Model.
 * 
 * Internal function used by runner.
 */
export function convertToSimulationModel(
  nodes: Array<go.ObjectData>,
  links: Array<go.ObjectData>,
  config?: SimulationConfig
): ConversionResult {
  const errors: ConversionError[] = [];
  
  try {
    // 1. Create model with configuration (merge with defaults)
    const finalConfig = { ...DEFAULT_SIMULATION_CONFIG, ...config };
    const model = new Model(finalConfig);

    // 2. Create lookup map for primitives (key → simulation primitive)
    // nanoid ensures unique keys across nodes and links, no prefix needed
    const primitiveMap = new Map<go.Key, SimulationPrimitive>();

    // 3. Create Stocks and Variables (Phase 1)
    for (const node of nodes) {
      const category = node.category as string | undefined;
      let result;
      
      if (category === 'Stock') {
        result = createStockPrimitive(model, node);
      } else if (category === 'Variable') {
        result = createVariablePrimitive(model, node);
      } else {
        // Skip other node types (Cloud, etc.)
        continue;
      }

      if (result.error) {
        errors.push(result.error);
      } else if (result.primitive) {
        primitiveMap.set(node.key, result.primitive);
      }
    }

    // 4. Create Flows (Phase 2)
    const flowLinks = links.filter(link => (link.category as string | undefined) === 'flow');
    for (const link of flowLinks) {
      const result = createFlowPrimitive(model, link, primitiveMap, nodes);
      
      if (result.error) {
        errors.push(result.error);
      } else if (result.primitive) {
        primitiveMap.set(link.key, result.primitive);
      }
    }

    // 5. Create Links (Phase 3)
    const linkLinks = links.filter(link => {
      const category = link.category as string | undefined;
      return !category || category === 'link';
    });
    for (const link of linkLinks) {
      const result = createLinkPrimitive(model, link, primitiveMap, nodes, links);
      
      if (result.error) {
        errors.push(result.error);
      }
      // Links don't need to be tracked in primitiveMap for series data
    }

    // 6. Return result
    if (errors.length > 0) {
      return {
        success: false,
        error: `Conversion completed with ${errors.length} error(s)`,
        errorDetails: errors,
      };
    }

    return {
      success: true,
      model,
      primitiveMap,
    };
  } catch (error) {
    return {
      success: false,
      error: `Fatal conversion error: ${error instanceof Error ? error.message : String(error)}`,
      errorDetails: errors,
    };
  }
}

