/**
 * Factory functions for creating simulation primitives from GoJS data.
 * 
 * Adapted from system_dynamics to work with go.ObjectData.
 * Properly handles Cloud nodes by checking node categories.
 */

// @ts-expect-error - simulation package has JS with JSDoc types
import type { Model, Stock, Variable, Converter, Flow, Link } from 'simulation';
import type * as go from 'gojs';
// Core utilities - basic property getters
import { 
  getNodeDisplayName, 
  getLinkDisplayName
} from '../diagram-data/core';
// Simulation utilities - endpoint resolution
import { 
  resolveFlowEndpointKey, 
  resolveLinkEndpoint,
  type SimulationConversionError 
} from '../diagram-data/simulation';

// Re-export for backward compatibility
export type ConversionError = SimulationConversionError;

// Primitive types from simulation library
type SimulationPrimitive = Stock | Variable | Converter | Flow | Link;

// Config object type for primitives
interface PrimitiveConfig {
  name: string;
  initial?: string | number;
  value?: string | number;
  rate?: string | number;
  units?: string;
  interpolation?: 'Discrete' | 'Linear';
  input?: string | SimulationPrimitive;
  values?: Array<{ x: number; y: number }>;
}

/**
 * Result type for primitive creation operations.
 */
export interface PrimitiveCreationResult<T = SimulationPrimitive> {
  primitive: T | null;
  error?: ConversionError;
}

/**
 * Wrapper for primitive creation with unified error handling.
 */
function createPrimitive<T extends SimulationPrimitive>(
  entityName: string,
  entityType: string,
  entityKey: go.Key,
  factory: () => T
): PrimitiveCreationResult<T> {
  try {
    return { primitive: factory() };
  } catch (error) {
    return {
      primitive: null,
      error: {
        type: 'invalid_formula',
        message: `Failed to create ${entityType} "${entityName}": ${error instanceof Error ? error.message : String(error)}`,
        nodeKey: entityType === 'stock' || entityType === 'variable' ? entityKey : undefined,
        linkKey: entityType === 'flow' || entityType === 'link' ? entityKey : undefined,
      },
    };
  }
}

/**
 * Create base config with optional units.
 */
function createConfig(
  name: string,
  mainField: { key: string; value: string | number | undefined },
  units?: string
): PrimitiveConfig {
  const config: PrimitiveConfig = {
    name,
    [mainField.key]: mainField.value ?? 0,
  };
  
  if (units) {
    config.units = units;
  }
  
  return config;
}

/**
 * Create Stock primitive from GoJS node data.
 * Uses core diagram-data utilities for consistent name resolution across the app.
 */
export function createStockPrimitive(
  model: Model,
  node: go.ObjectData
): PrimitiveCreationResult<Stock> {
  // Use core utility for name resolution (handles defaults)
  const nodeName = getNodeDisplayName(node);
  return createPrimitive<Stock>(nodeName, 'stock', node.key, () => {
    const config = createConfig(
      nodeName,
      { key: 'initial', value: node.initialValue as string | number | undefined },
      node.units as string | undefined
    );
    return model.Stock(config);
  });
}

/**
 * Create Variable primitive from GoJS node data.
 * Uses core diagram-data utilities for consistent name resolution across the app.
 */
export function createVariablePrimitive(
  model: Model,
  node: go.ObjectData
): PrimitiveCreationResult<Variable> {
  // Use core utility for name resolution (handles defaults)
  const nodeName = getNodeDisplayName(node);
  return createPrimitive<Variable>(nodeName, 'variable', node.key, () => {
    const config = createConfig(
      nodeName,
      { key: 'value', value: node.value as string | number | undefined },
      node.units as string | undefined
    );
    return model.Variable(config);
  });
}

/**
 * Parse converter data points from string format "x1,y1;x2,y2;..."
 */
function parseConverterValues(valuesStr: string | undefined): Array<{ x: number; y: number }> {
  if (!valuesStr || typeof valuesStr !== 'string') {
    return [{ x: 0, y: 0 }]; // Default single point
  }
  
  try {
    return valuesStr.split(';').map(pair => {
      const [x, y] = pair.trim().split(',').map(v => parseFloat(v.trim()));
      if (isNaN(x) || isNaN(y)) {
        throw new Error(`Invalid data point: ${pair}`);
      }
      return { x, y };
    });
  } catch (error) {
    console.warn('Failed to parse converter values:', error);
    return [{ x: 0, y: 0 }]; // Fallback
  }
}

/**
 * Create Converter primitive from GoJS node data.
 * Uses core diagram-data utilities for consistent name resolution across the app.
 */
export function createConverterPrimitive(
  model: Model,
  node: go.ObjectData
): PrimitiveCreationResult<Converter> {
  // Use core utility for name resolution (handles defaults)
  const nodeName = getNodeDisplayName(node);
  return createPrimitive<Converter>(nodeName, 'converter', node.key, () => {
    const config: PrimitiveConfig = {
      name: nodeName,
      interpolation: (node.interpolation as 'Discrete' | 'Linear' | undefined) || 'Linear',
      input: (node.input as string | undefined) || 'Time',
      values: parseConverterValues(node.values as string | undefined),
    };
    
    if (node.units) {
      config.units = node.units as string;
    }
    
    return model.Converter(config);
  });
}

/**
 * Create Flow primitive from GoJS link data.
 * Handles Cloud nodes (which should be null in simulation).
 * Uses diagram-data utilities for proper node resolution.
 */
export function createFlowPrimitive(
  model: Model,
  link: go.ObjectData,
  primitiveMap: Map<go.Key, SimulationPrimitive>,
  nodeDataArray: Array<go.ObjectData>
): PrimitiveCreationResult<Flow> {
  // Resolve source and target using diagram-data utilities
  const sourceKey = resolveFlowEndpointKey(link.from as go.Key | null | undefined, nodeDataArray);
  const targetKey = resolveFlowEndpointKey(link.to as go.Key | null | undefined, nodeDataArray);
  
  // Get Stock primitives from map (null is valid for Cloud nodes)
  const source = sourceKey ? (primitiveMap.get(sourceKey) as Stock | undefined) || null : null;
  const target = targetKey ? (primitiveMap.get(targetKey) as Stock | undefined) || null : null;

  // Use diagram-data utility for name resolution (handles defaults, etc.)
  const linkName = getLinkDisplayName(link);
  return createPrimitive<Flow>(linkName, 'flow', link.key, () => {
    const config = createConfig(
      linkName,
      { key: 'rate', value: link.flowRate as string | number | undefined },
      link.units as string | undefined
    );
    return model.Flow(source, target, config);
  });
}

/**
 * Create Link primitive from GoJS link data.
 * For bidirectional links, creates two links (both directions).
 * Handles edge-to-edge connections via LinkLabel nodes.
 * Uses diagram-data utilities for proper endpoint resolution.
 */
export function createLinkPrimitive(
  model: Model,
  link: go.ObjectData,
  primitiveMap: Map<go.Key, SimulationPrimitive>,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): PrimitiveCreationResult<Link> {
  // Resolve source endpoint using diagram-data utilities
  const sourceResult = resolveLinkEndpoint(
    link.from as go.Key | null | undefined,
    nodeDataArray,
    linkDataArray,
    'source'
  );
  
  if (sourceResult.error) {
    return { primitive: null, error: { ...sourceResult.error, linkKey: link.key } };
  }
  
  // Resolve target endpoint using diagram-data utilities
  const targetResult = resolveLinkEndpoint(
    link.to as go.Key | null | undefined,
    nodeDataArray,
    linkDataArray,
    'target'
  );
  
  if (targetResult.error) {
    return { primitive: null, error: { ...targetResult.error, linkKey: link.key } };
  }
  
  // Get primitives from map
  const source = primitiveMap.get(sourceResult.mapKey!);
  const target = primitiveMap.get(targetResult.mapKey!);

  if (!source) {
    return {
      primitive: null,
      error: {
        type: 'missing_node',
        message: `Link references missing source primitive: ${sourceResult.mapKey}`,
        linkKey: link.key,
      },
    };
  }
  
  if (!target) {
    return {
      primitive: null,
      error: {
        type: 'missing_node',
        message: `Link references missing target primitive: ${targetResult.mapKey}`,
        linkKey: link.key,
      },
    };
  }

  // Use diagram-data utility for name resolution (handles defaults, etc.)
  const linkName = getLinkDisplayName(link);
  return createPrimitive<Link>(linkName, 'link', link.key, () => {
    // Create forward link (source → target)
    const forwardLink = model.Link(source, target);
    
    // For bidirectional links, create reverse link (target → source)
    if (link.bidirectional === true) {
      model.Link(target, source);
    }
    
    return forwardLink;
  });
}

