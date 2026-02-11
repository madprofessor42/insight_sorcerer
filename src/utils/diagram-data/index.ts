/**
 * Diagram Data Utilities - Barrel Export
 * 
 * This module provides utilities for resolving and transforming GoJS diagram data.
 * 
 * Architecture:
 * - core.ts: Fundamental utilities (defaults, type guards, basic getters)
 * - display.ts: UI display utilities (DebugPanel, resolution functions)
 * - simulation.ts: Simulation-specific endpoint resolution
 */

// ============================================================================
// CORE - Fundamental utilities used everywhere
// ============================================================================
export {
  // Default value utilities
  getDefaultNodePropertyValue,
  getDefaultLinkPropertyValue,
  getDefaultNodeName,
  getDefaultLinkText,
  
  // Type guards and checks
  isLinkLabelNodeData,
  
  // Composite key utilities (to distinguish nodes and edges with same numeric key)
  makeNodeCompositeKey,
  makeEdgeCompositeKey,
  
  // Basic property getters
  getNodeDisplayName,
  getLinkDisplayName,
  getLinkType,
  isLinkBidirectional,
  getLinkDirectionSymbol,
  getLinkColor,
  getLinkLabel,
  
  // Parent edge lookup
  findParentEdgeForLabelNode,
} from './core';

// ============================================================================
// DISPLAY - UI display utilities (DebugPanel, etc.)
// ============================================================================
export {
  // Resolution functions
  resolveNodeInfo,
  resolveEdgeInfo,
  resolveConnectionEndpoint,
  resolveLinkInfo,
  
  // Type guard
  isEdgeEndpoint,
  
  // Types
  type NodeDisplayInfo,
  type EdgeDisplayInfo,
  type ConnectionEndpointInfo,
  type LinkDisplayInfo,
} from './display';

// ============================================================================
// SIMULATION - Simulation-specific utilities
// ============================================================================
export {
  resolveFlowEndpointKey,
  resolveLinkEndpoint,
  type SimulationConversionError,
} from './simulation';

// ============================================================================
// REFERENCES - Formula input reference utilities
// ============================================================================
export {
  getAvailableReferences,
  getAvailableReferencesForEdge,
} from './references';
