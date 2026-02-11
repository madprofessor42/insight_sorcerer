/**
 * Factory functions for creating simulation primitives from GoJS data.
 * 
 * Adapted from system_dynamics to work with go.ObjectData.
 * Properly handles Cloud nodes by checking node categories.
 */

// @ts-expect-error - simulation package has JS with JSDoc types
import type { Model, Stock, Variable, Flow, Link } from 'simulation';
import type * as go from 'gojs';

// Internal error type
export interface ConversionError {
  type: 'missing_node' | 'missing_link' | 'invalid_formula' | 'circular_dependency';
  message: string;
  nodeKey?: string | number;
  linkKey?: string | number;
}

// Primitive types from simulation library
type SimulationPrimitive = Stock | Variable | Flow | Link;

// Config object type for primitives
interface PrimitiveConfig {
  name: string;
  initial?: string | number;
  value?: string | number;
  rate?: string | number;
  units?: string;
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
 * Get node name from GoJS node data.
 */
function getNodeName(node: go.ObjectData): string {
  return (node.name as string) || (node.text as string) || 'Unnamed';
}

/**
 * Get link name from GoJS link data.
 */
function getLinkName(link: go.ObjectData): string {
  return (link.text as string) || 'Flow';
}

/**
 * Create Stock primitive from GoJS node data.
 */
export function createStockPrimitive(
  model: Model,
  node: go.ObjectData
): PrimitiveCreationResult<Stock> {
  const nodeName = getNodeName(node);
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
 */
export function createVariablePrimitive(
  model: Model,
  node: go.ObjectData
): PrimitiveCreationResult<Variable> {
  const nodeName = getNodeName(node);
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
 * Create Flow primitive from GoJS link data.
 * Handles Cloud nodes (which should be null in simulation).
 */
export function createFlowPrimitive(
  model: Model,
  link: go.ObjectData,
  primitiveMap: Map<string, SimulationPrimitive>,
  nodeDataArray: Array<go.ObjectData>
): PrimitiveCreationResult<Flow> {
  // Get source and target keys
  const sourceKey = link.from as go.Key | null | undefined;
  const targetKey = link.to as go.Key | null | undefined;
  
  let source: Stock | null = null;
  let target: Stock | null = null;

  // Resolve source - only if it exists and is not a Cloud
  if (sourceKey !== null && sourceKey !== undefined) {
    const sourceNode = nodeDataArray.find(n => n.key === sourceKey);
    if (sourceNode && sourceNode.category === 'Cloud') {
      // Cloud nodes should be null in simulation
      source = null;
    } else {
      // Try to get Stock from primitiveMap (use node: prefix)
      const mapKey = `node:${sourceKey}`;
      source = (primitiveMap.get(mapKey) as Stock) || null;
    }
  }

  // Resolve target - only if it exists and is not a Cloud
  if (targetKey !== null && targetKey !== undefined) {
    const targetNode = nodeDataArray.find(n => n.key === targetKey);
    if (targetNode && targetNode.category === 'Cloud') {
      // Cloud nodes should be null in simulation
      target = null;
    } else {
      // Try to get Stock from primitiveMap (use node: prefix)
      const mapKey = `node:${targetKey}`;
      target = (primitiveMap.get(mapKey) as Stock) || null;
    }
  }

  const linkName = getLinkName(link);
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
 * Skips Cloud nodes (Links cannot connect to Clouds).
 */
export function createLinkPrimitive(
  model: Model,
  link: go.ObjectData,
  primitiveMap: Map<string, SimulationPrimitive>,
  nodeDataArray: Array<go.ObjectData>
): PrimitiveCreationResult<Link> {
  const sourceKey = link.from as go.Key | null | undefined;
  const targetKey = link.to as go.Key | null | undefined;
  
  // Check if source or target is a Cloud node
  const sourceNode = sourceKey ? nodeDataArray.find(n => n.key === sourceKey) : null;
  const targetNode = targetKey ? nodeDataArray.find(n => n.key === targetKey) : null;

  if (sourceNode?.category === 'Cloud') {
    return {
      primitive: null,
      error: {
        type: 'missing_node',
        message: `Link cannot connect from Cloud node`,
        linkKey: link.key,
      },
    };
  }

  if (targetNode?.category === 'Cloud') {
    return {
      primitive: null,
      error: {
        type: 'missing_node',
        message: `Link cannot connect to Cloud node`,
        linkKey: link.key,
      },
    };
  }
  
  // Look up primitives in the map (use node: prefix)
  const source = sourceKey ? (primitiveMap.get(`node:${sourceKey}`) ?? null) : null;
  const target = targetKey ? (primitiveMap.get(`node:${targetKey}`) ?? null) : null;

  if (!source) {
    return {
      primitive: null,
      error: {
        type: 'missing_node',
        message: `Link references missing source node: ${sourceKey}`,
        linkKey: link.key,
      },
    };
  }
  
  if (!target) {
    return {
      primitive: null,
      error: {
        type: 'missing_node',
        message: `Link references missing target node: ${targetKey}`,
        linkKey: link.key,
      },
    };
  }

  const linkName = getLinkName(link);
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

