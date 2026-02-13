/**
 * Converts GoJS diagram (nodes + links) to simulation Model.
 * 
 * Adapted from system_dynamics to work with go.ObjectData.
 */

// @ts-expect-error - simulation package has JS with JSDoc types
import { Model } from 'simulation';
// @ts-expect-error - simulation package has JS with JSDoc types
import type { Stock, Variable, Converter, Flow, Link } from 'simulation';
import type * as go from 'gojs';
import { DEFAULT_SIMULATION_CONFIG } from './constants';
import type { SimulationConfig } from './types';
import {
  createStockPrimitive,
  createVariablePrimitive,
  createConverterPrimitive,
  createFlowPrimitive,
  createLinkPrimitive,
  type ConversionError,
} from './primitiveFactory';
import { getAvailableReferences } from '../diagram-data';
import { getNodeReferenceConfig } from '../../config/diagram-references';

// Primitive types from simulation library
type SimulationPrimitive = Stock | Variable | Converter | Flow | Link;

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

    // 3. Create Stocks, Variables, and Converters (Phase 1)
    const converterNodes: Array<go.ObjectData> = [];
    for (const node of nodes) {
      const category = node.category as string | undefined;
      let result;
      
      if (category === 'Stock') {
        result = createStockPrimitive(model, node);
      } else if (category === 'Variable') {
        result = createVariablePrimitive(model, node);
      } else if (category === 'Converter') {
        result = createConverterPrimitive(model, node);
        if (result.primitive) {
          converterNodes.push(node); // Track for Phase 2.5
        }
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

    // 4.5. Set Converter inputs (Phase 2.5) - must happen after Flows are created
    for (const node of converterNodes) {
      const converter = primitiveMap.get(node.key) as Converter;
      const inputValue = node.input as string | undefined;
      
      if (inputValue && inputValue !== 'Time') {
        // Use diagram-data utilities to properly resolve the input source
        // This handles LinkLabel nodes, bidirectional links, and all edge cases
        const config = getNodeReferenceConfig('Converter', 'input');
        
        if (config) {
          // Get all available references using the same logic as the UI
          const availableReferences = getAvailableReferences(
            node.key,
            nodes,
            links,
            config
          );
          
          // Find the reference that matches the inputValue
          const matchingRef = availableReferences.find(
            ref => String(ref.id) === inputValue || ref.name === inputValue
          );
          
          if (matchingRef) {
            // Get the primitive from the map using the resolved id
            const inputPrimitive = primitiveMap.get(matchingRef.id);
            
            if (inputPrimitive) {
              try {
                converter.input = inputPrimitive as Stock | Variable | Converter | Flow;
              } catch (error) {
                errors.push({
                  type: 'invalid_formula',
                  message: `Failed to set Converter input: ${error instanceof Error ? error.message : String(error)}`,
                  nodeKey: node.key,
                });
              }
            }
          }
        }
        // If not found, input will stay as "Time" (default set in primitiveFactory)
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
        error: `Conversion completed with ${errors.length} error(s). Details is ${errors.map(error => error.message).join(', ')}`,
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

