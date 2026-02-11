/**
 * Utility functions for getting available references for formula inputs
 */

import * as go from 'gojs';
import type { AvailableReference } from '../../components/ui';
import type { NodeType, LinkType, ReferenceConfig } from '../../config/diagram-rules';
import { isLinkLabelNodeData, findParentEdgeForLabelNode, getLinkDisplayName, getLinkType, getNodeDisplayName } from './core';

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

  // Include incoming links (link type, not flow type)
  if (config.includeIncomingLinks) {
    linkDataArray.forEach((link) => {
      if (link.to === currentNodeKey && link.from !== undefined) {
        const linkType = getLinkType(link);
        if (linkType !== 'link') return; // Only include 'link' type
        
        const sourceNode = nodeDataArray.find((node) => node.key === link.from);
        if (sourceNode && sourceNode.category !== 'Cloud' && !isLinkLabelNodeData(sourceNode) && !addedKeys.has(sourceNode.key)) {
          const name = getNodeDisplayName(sourceNode);
          references.push({
            id: sourceNode.key,
            name: name,
            type: (sourceNode.category || 'Variable') as NodeType,
          });
          addedKeys.add(sourceNode.key);
        }
      }
    });
  }

  // Include outgoing links (link type, not flow type)
  if (config.includeOutgoingLinks) {
    linkDataArray.forEach((link) => {
      if (link.from === currentNodeKey && link.to !== undefined) {
        const linkType = getLinkType(link);
        if (linkType !== 'link') return; // Only include 'link' type
        
        const targetNode = nodeDataArray.find((node) => node.key === link.to);
        if (targetNode && targetNode.category !== 'Cloud' && !isLinkLabelNodeData(targetNode) && !addedKeys.has(targetNode.key)) {
          const name = getNodeDisplayName(targetNode);
          references.push({
            id: targetNode.key,
            name: name,
            type: (targetNode.category || 'Variable') as NodeType,
          });
          addedKeys.add(targetNode.key);
        }
      }
    });
  }

  // Include incoming flows (flows connected TO this node via LinkLabel)
  if (config.includeIncomingFlows) {
    linkDataArray.forEach((link) => {
      if (link.to === currentNodeKey && link.from !== undefined) {
        const sourceNode = nodeDataArray.find((node) => node.key === link.from);
        if (sourceNode && isLinkLabelNodeData(sourceNode)) {
          // This is a LinkLabel - get the parent flow edge
          const parentEdge = findParentEdgeForLabelNode(sourceNode.key, linkDataArray);
          if (parentEdge && getLinkType(parentEdge) === 'flow' && !addedKeys.has(parentEdge.key)) {
            const edgeName = getLinkDisplayName(parentEdge);
            references.push({
              id: parentEdge.key,
              name: edgeName,
              type: 'flow' as LinkType,
            });
            addedKeys.add(parentEdge.key);
          }
        }
      }
    });
  }

  // Include outgoing flows (flows connected FROM this node via LinkLabel)
  if (config.includeOutgoingFlows) {
    linkDataArray.forEach((link) => {
      if (link.from === currentNodeKey && link.to !== undefined) {
        const targetNode = nodeDataArray.find((node) => node.key === link.to);
        if (targetNode && isLinkLabelNodeData(targetNode)) {
          // This is a LinkLabel - get the parent flow edge
          const parentEdge = findParentEdgeForLabelNode(targetNode.key, linkDataArray);
          if (parentEdge && getLinkType(parentEdge) === 'flow' && !addedKeys.has(parentEdge.key)) {
            const edgeName = getLinkDisplayName(parentEdge);
            references.push({
              id: parentEdge.key,
              name: edgeName,
              type: 'flow' as LinkType,
            });
            addedKeys.add(parentEdge.key);
          }
        }
      }
    });
  }

  return references;
}

/**
 * Get all available references (all nodes except current and clouds)
 * 
 * @param currentNodeKey - The key of the current node being edited
 * @param nodeDataArray - All nodes in the diagram
 * @returns Array of available references
 */
export function getAllAvailableReferences(
  currentNodeKey: go.Key,
  nodeDataArray: Array<go.ObjectData>
): AvailableReference[] {
  const references: AvailableReference[] = [];

  nodeDataArray.forEach((node) => {
    if (node.key !== currentNodeKey && 
        node.category !== 'Cloud' && 
        !isLinkLabelNodeData(node)) {
      const name = getNodeDisplayName(node);
      references.push({
        id: node.key,
        name: name,
        type: (node.category || 'Variable') as NodeType,
      });
    }
  });

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
    if (sourceNode && sourceNode.category !== 'Cloud' && !addedKeys.has(sourceNode.key)) {
      const name = getNodeDisplayName(sourceNode);
      references.push({
        id: sourceNode.key,
        name: name,
        type: (sourceNode.category || 'Variable') as NodeType,
      });
      addedKeys.add(sourceNode.key);
    }
  }

  // Include target node of the edge
  if (config.includeTargetNode && targetNodeKey !== undefined) {
    const targetNode = nodeDataArray.find((node) => node.key === targetNodeKey);
    if (targetNode && targetNode.category !== 'Cloud' && !addedKeys.has(targetNode.key)) {
      const name = getNodeDisplayName(targetNode);
      references.push({
        id: targetNode.key,
        name: name,
        type: (targetNode.category || 'Variable') as NodeType,
      });
      addedKeys.add(targetNode.key);
    }
  }

  // Include nodes/edges connected TO this edge (source edge connections)
  // E.g., Variable -> Link -> Flow (Variable is connected TO Flow)
  if (config.includeSourceEdge) {
    const labelKeys = currentEdge.labelKeys;
    if (Array.isArray(labelKeys)) {
      labelKeys.forEach((labelKey) => {
        linkDataArray.forEach((link) => {
          // Incoming connections to LinkLabel (nodes/edges connecting TO this edge)
          if (link.to === labelKey && link.from !== undefined) {
            const node = nodeDataArray.find((n) => n.key === link.from);
            if (node && !isLinkLabelNodeData(node) && node.category !== 'Cloud' && !addedKeys.has(node.key)) {
              const name = getNodeDisplayName(node);
              references.push({
                id: node.key,
                name: name,
                type: (node.category || 'Variable') as NodeType,
              });
              addedKeys.add(node.key);
            }
          }
        });
      });
    }
  }

  // Include nodes/edges that this edge connects TO (target edge connections)
  // E.g., Flow -> Link -> Variable (Flow connects TO Variable)
  if (config.includeTargetEdge) {
    const labelKeys = currentEdge.labelKeys;
    if (Array.isArray(labelKeys)) {
      labelKeys.forEach((labelKey) => {
        linkDataArray.forEach((link) => {
          // Outgoing connections from LinkLabel (nodes/edges this edge connects TO)
          if (link.from === labelKey && link.to !== undefined) {
            const node = nodeDataArray.find((n) => n.key === link.to);
            if (node && !isLinkLabelNodeData(node) && node.category !== 'Cloud' && !addedKeys.has(node.key)) {
              const name = getNodeDisplayName(node);
              references.push({
                id: node.key,
                name: name,
                type: (node.category || 'Variable') as NodeType,
              });
              addedKeys.add(node.key);
            }
          }
        });
      });
    }
  }

  return references;
}

