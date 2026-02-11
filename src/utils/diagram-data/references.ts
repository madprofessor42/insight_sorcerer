/**
 * Utility functions for getting available references for formula inputs
 */

import * as go from 'gojs';
import type { AvailableReference } from '../../components/ui';
import type { NodeType, LinkType, ReferenceConfig } from '../../config/diagram-rules';
import { 
  isLinkLabelNodeData, 
  findParentEdgeForLabelNode, 
  getLinkDisplayName, 
  getLinkType, 
  getNodeDisplayName,
  isLinkBidirectional 
} from './core';

// ============================================================================
// HELPER FUNCTIONS - Internal utilities for building reference lists
// ============================================================================

/**
 * Helper: Try to add a node to references if it meets criteria
 */
function tryAddNodeReference(
  node: go.ObjectData,
  references: AvailableReference[],
  addedKeys: Set<go.Key>
): boolean {
  if (node && 
      node.category !== 'Cloud' && 
      !isLinkLabelNodeData(node) && 
      !addedKeys.has(node.key)) {
    const name = getNodeDisplayName(node);
    references.push({
      id: node.key,
      name: name,
      type: (node.category || 'Variable') as NodeType,
    });
    addedKeys.add(node.key);
    return true;
  }
  return false;
}

/**
 * Helper: Try to add an edge to references if it meets criteria
 */
function tryAddEdgeReference(
  edge: go.ObjectData,
  edgeType: LinkType,
  references: AvailableReference[],
  addedKeys: Set<go.Key>
): boolean {
  if (edge && !addedKeys.has(edge.key)) {
    const edgeName = getLinkDisplayName(edge);
    references.push({
      id: edge.key,
      name: edgeName,
      type: edgeType,
    });
    addedKeys.add(edge.key);
    return true;
  }
  return false;
}

/**
 * Helper: Process links with bidirectional support
 * Handles both primary direction and opposite direction for bidirectional links
 * 
 * @param link - The link to process
 * @param currentKey - Current node/label key being processed
 * @param primaryDirection - 'incoming' (link.to === currentKey) or 'outgoing' (link.from === currentKey)
 * @param nodeDataArray - All nodes in the diagram
 * @param processor - Function to process the found node/edge
 */
function processLinkWithBidirectional(
  link: go.ObjectData,
  currentKey: go.Key,
  primaryDirection: 'incoming' | 'outgoing',
  nodeDataArray: Array<go.ObjectData>,
  processor: (node: go.ObjectData) => void
): void {
  const isBidirectional = isLinkBidirectional(link);
  
  // Primary direction
  if (primaryDirection === 'incoming' && link.to === currentKey && link.from !== undefined) {
    const sourceNode = nodeDataArray.find((node) => node.key === link.from);
    if (sourceNode) {
      processor(sourceNode);
    }
  } else if (primaryDirection === 'outgoing' && link.from === currentKey && link.to !== undefined) {
    const targetNode = nodeDataArray.find((node) => node.key === link.to);
    if (targetNode) {
      processor(targetNode);
    }
  }
  
  // Opposite direction for bidirectional links
  if (isBidirectional) {
    if (primaryDirection === 'incoming' && link.from === currentKey && link.to !== undefined) {
      const targetNode = nodeDataArray.find((node) => node.key === link.to);
      if (targetNode) {
        processor(targetNode);
      }
    } else if (primaryDirection === 'outgoing' && link.to === currentKey && link.from !== undefined) {
      const sourceNode = nodeDataArray.find((node) => node.key === link.from);
      if (sourceNode) {
        processor(sourceNode);
      }
    }
  }
}

/**
 * Get available references for a node based on reference configuration
 * 
 * @param currentNodeKey - The key of the current node being edited
 * @param nodeDataArray - All nodes in the diagram
 * @param linkDataArray - All links in the diagram
 * @param config - Reference configuration defining what to include
 * @returns Array of available references
 */
export function getAvailableReferences(
  currentNodeKey: go.Key,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>,
  config: ReferenceConfig
): AvailableReference[] {
  const references: AvailableReference[] = [];
  const addedKeys = new Set<go.Key>();

  // Include incoming connections (both nodes and edges)
  // Config specifies which LINK TYPES to include (not node/edge types)
  // E.g., incoming: ['link'] means "all incoming via 'link' type connections"
  if (config.incoming) {
    linkDataArray.forEach((link) => {
      const linkType = getLinkType(link);
      // Check if this link type is in the config
      if (!config.incoming!.includes(linkType)) return;
      
      processLinkWithBidirectional(
        link,
        currentNodeKey,
        'incoming',
        nodeDataArray,
        (node) => {
          // Check if it's a LinkLabel node - if so, get parent edge
          if (isLinkLabelNodeData(node)) {
            const parentEdge = findParentEdgeForLabelNode(node.key, linkDataArray);
            if (parentEdge) {
              const edgeType = getLinkType(parentEdge);
              tryAddEdgeReference(parentEdge, edgeType, references, addedKeys);
            }
          } else {
            // Regular node
            tryAddNodeReference(node, references, addedKeys);
          }
        }
      );
    });
  }

  // Include outgoing connections (both nodes and edges)
  // Config specifies which LINK TYPES to include (not node/edge types)
  // E.g., outgoing: ['link'] means "all outgoing via 'link' type connections"
  if (config.outgoing) {
    linkDataArray.forEach((link) => {
      const linkType = getLinkType(link);
      // Check if this link type is in the config
      if (!config.outgoing!.includes(linkType)) return;
      
      processLinkWithBidirectional(
        link,
        currentNodeKey,
        'outgoing',
        nodeDataArray,
        (node) => {
          // Check if it's a LinkLabel node - if so, get parent edge
          if (isLinkLabelNodeData(node)) {
            const parentEdge = findParentEdgeForLabelNode(node.key, linkDataArray);
            if (parentEdge) {
              const edgeType = getLinkType(parentEdge);
              tryAddEdgeReference(parentEdge, edgeType, references, addedKeys);
            }
          } else {
            // Regular node
            tryAddNodeReference(node, references, addedKeys);
          }
        }
      );
    });
  }

  return references;
}

/**
 * Get available references for an edge based on reference configuration
 * 
 * @param currentEdge - The edge being edited
 * @param nodeDataArray - All nodes in the diagram
 * @param linkDataArray - All links in the diagram
 * @param config - Reference configuration defining what to include
 * @returns Array of available references
 */
export function getAvailableReferencesForEdge(
  currentEdge: go.ObjectData,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>,
  config: ReferenceConfig
): AvailableReference[] {
  const references: AvailableReference[] = [];
  const addedKeys = new Set<go.Key>();

  const sourceNodeKey = currentEdge.from;
  const targetNodeKey = currentEdge.to;

  // Include source node of the edge
  if (config.includeSourceNode && sourceNodeKey !== undefined) {
    const sourceNode = nodeDataArray.find((node) => node.key === sourceNodeKey);
    if (sourceNode) {
      tryAddNodeReference(sourceNode, references, addedKeys);
    }
  }

  // Include target node of the edge
  if (config.includeTargetNode && targetNodeKey !== undefined) {
    const targetNode = nodeDataArray.find((node) => node.key === targetNodeKey);
    if (targetNode) {
      tryAddNodeReference(targetNode, references, addedKeys);
    }
  }

  // Include nodes/edges connected TO this edge (via edge's LinkLabel)
  // E.g., Variable -> Link -> Flow (Variable is connected TO Flow)
  // For bidirectional links, show in both directions
  if (config.incomingToEdge) {
    const labelKeys = currentEdge.labelKeys;
    if (Array.isArray(labelKeys)) {
      labelKeys.forEach((labelKey) => {
        linkDataArray.forEach((link) => {
          const linkType = getLinkType(link);
          // Check if this link type is in the config
          if (!config.incomingToEdge!.includes(linkType)) return;
          
          processLinkWithBidirectional(
            link,
            labelKey,
            'incoming',
            nodeDataArray,
            (node) => tryAddNodeReference(node, references, addedKeys)
          );
        });
      });
    }
  }

  // Include nodes/edges that this edge connects TO (via edge's LinkLabel)
  // E.g., Flow -> Link -> Variable (Flow connects TO Variable)
  // For bidirectional links, show in both directions
  if (config.outgoingFromEdge) {
    const labelKeys = currentEdge.labelKeys;
    if (Array.isArray(labelKeys)) {
      labelKeys.forEach((labelKey) => {
        linkDataArray.forEach((link) => {
          const linkType = getLinkType(link);
          // Check if this link type is in the config
          if (!config.outgoingFromEdge!.includes(linkType)) return;
          
          processLinkWithBidirectional(
            link,
            labelKey,
            'outgoing',
            nodeDataArray,
            (node) => tryAddNodeReference(node, references, addedKeys)
          );
        });
      });
    }
  }

  return references;
}


