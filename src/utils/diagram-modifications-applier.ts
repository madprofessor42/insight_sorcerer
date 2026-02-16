/**
 * Diagram Modifications Applier
 * 
 * Applies LLM-suggested modifications to the diagram using Redux actions
 */

import type { Dispatch } from '@reduxjs/toolkit';
import type * as go from 'gojs';
import type { DiagramOperation, DiagramModificationProposal } from '../types/diagram-modifications';
import { 
  insertNode, 
  modifyNode, 
  removeNodes,
  insertLink,
  modifyLink,
  removeLinks
} from '../store/diagramSlice';
import type { RootState } from '../store/store';
import { getNodeDisplayName, getLinkDisplayName, findLinkLabelForEdge } from './diagram-data';
import { LINK_LABEL_CATEGORY } from '../config';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Find node by ID in the diagram
 */
function findNodeById(state: RootState, nodeId: string): go.ObjectData | undefined {
  return state.diagram.nodeDataArray.find((node: go.ObjectData) => node.key === nodeId);
}

/**
 * Find link by ID in the diagram
 */
function findLinkById(state: RootState, linkId: string): go.ObjectData | undefined {
  return state.diagram.linkDataArray.find((link: go.ObjectData) => link.key === linkId);
}

/**
 * Find node by display name in the diagram (fallback for name-based lookups)
 * Uses getNodeDisplayName to correctly match names (handles name/text fields)
 */
function findNodeByName(state: RootState, nodeName: string): go.ObjectData | undefined {
  return state.diagram.nodeDataArray.find((node: go.ObjectData) => {
    const displayName = getNodeDisplayName(node);
    return displayName.toLowerCase() === nodeName.toLowerCase();
  });
}

/**
 * Find link (flow/link) by display name in the diagram (fallback for name-based lookups)
 * Uses getLinkDisplayName to correctly match names (handles text field)
 */
function findLinkByName(state: RootState, linkName: string): go.ObjectData | undefined {
  return state.diagram.linkDataArray.find((link: go.ObjectData) => {
    const displayName = getLinkDisplayName(link);
    return displayName.toLowerCase() === linkName.toLowerCase();
  });
}

/**
 * Generate unique key for new elements
 */
function generateKey(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

/**
 * Apply add_node operation
 * If node with same name already exists, converts to update operation
 */
function applyAddNode(
  operation: Extract<DiagramOperation, { operation: 'add_node' }>,
  dispatch: Dispatch,
  state: RootState
): { success: boolean; message: string } {
  try {
    // Check if node already exists
    const existingNode = findNodeByName(state, operation.name);
    if (existingNode) {
      // Auto-convert to update
      console.warn(`Node "${operation.name}" already exists, converting add to update`);
      const existingName = getNodeDisplayName(existingNode);
      return applyUpdateNode({
        operation: 'update_node',
        nodeId: existingNode.key, // Use existing node's ID
        name: existingName,
        initialValue: operation.initialValue,
        value: operation.value,
        input: operation.input,
        values: operation.values,
        reasoning: operation.reasoning + ' (auto-converted from add to update)',
      }, dispatch, state);
    }

    const nodeData: go.ObjectData = {
      key: generateKey(),
      category: operation.category,
      name: operation.name,
      text: operation.name,
    };

    // Add type-specific properties based on node category
    if (operation.category === 'Stock') {
      // Stock uses initialValue
      if (operation.initialValue !== undefined) {
        nodeData.initialValue = operation.initialValue;
      }
    } else if (operation.category === 'Variable') {
      // Variable uses only 'value' field (can be number or formula)
      if (operation.value !== undefined) {
        nodeData.value = operation.value;
      }
    } else if (operation.category === 'Converter') {
      // Converter uses input and values
      if (operation.input) {
        nodeData.input = operation.input;
      }
      if (operation.values) {
        nodeData.values = operation.values;
      }
    }

    dispatch(insertNode(nodeData));
    return { 
      success: true, 
      message: `Added ${operation.category} "${operation.name}"` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to add node: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Apply update_node operation
 */
function applyUpdateNode(
  operation: Extract<DiagramOperation, { operation: 'update_node' }>,
  dispatch: Dispatch,
  state: RootState
): { success: boolean; message: string } {
  try {
    const nodeIndex = state.diagram.nodeDataArray.findIndex((node: go.ObjectData) => 
      node.key === operation.nodeId
    );
    
    if (nodeIndex === -1) {
      return { 
        success: false, 
        message: `Node with ID "${operation.nodeId}" not found` 
      };
    }

    const node = state.diagram.nodeDataArray[nodeIndex];
    const updatedNode: go.ObjectData = { ...node };
    const nodeName = getNodeDisplayName(node);
    
    // Update properties
    if (operation.newName) {
      updatedNode.name = operation.newName;
      updatedNode.text = operation.newName;
    }
    if (operation.initialValue !== undefined) {
      updatedNode.initialValue = operation.initialValue; // For Stock
    }
    if (operation.value !== undefined) {
      updatedNode.value = operation.value; // For Variable (can be number or formula)
    }
    if (operation.input) {
      updatedNode.input = operation.input; // For Converter
    }
    if (operation.values) {
      updatedNode.values = operation.values; // For Converter
    }

    dispatch(modifyNode({ index: nodeIndex, data: updatedNode }));
    return { 
      success: true, 
      message: `Updated node "${nodeName}"` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to update node: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Apply delete_node operation
 */
function applyDeleteNode(
  operation: Extract<DiagramOperation, { operation: 'delete_node' }>,
  dispatch: Dispatch,
  state: RootState
): { success: boolean; message: string } {
  try {
    const node = findNodeById(state, operation.nodeId);
    if (!node) {
      return { 
        success: false, 
        message: `Node with ID "${operation.nodeId}" not found` 
      };
    }

    const nodeName = getNodeDisplayName(node);
    dispatch(removeNodes([node.key]));
    return { 
      success: true, 
      message: `Deleted node "${nodeName}"` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to delete node: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Apply add_link operation
 * Handles both regular links and flows
 * 
 * Resolution logic for fromId/toId:
 * 1. Try to find in newlyCreatedFlows (flows created in this session)
 * 2. Try to find as edge by ID -> get its LinkLabel
 * 3. If not found, try to find edge by NAME -> get its LinkLabel
 * 4. If not found, try to find as node by ID
 * 5. If not found, try to find as node by NAME (for newly created nodes)
 * 
 * This allows LLM to reference flow edges by their name in add_link operations,
 * which is automatically converted to the LinkLabel connection.
 * 
 * If link with same endpoints already exists, converts to update operation.
 */
function applyAddLink(
  operation: Extract<DiagramOperation, { operation: 'add_link' }>,
  dispatch: Dispatch,
  state: RootState,
  newlyCreatedFlows: Map<string, go.Key>
): { success: boolean; message: string; flowKey?: go.Key } {
  try {
    let fromKey: go.Key;
    let toKey: go.Key;
    let fromName: string;
    let toName: string;

    // === RESOLVE "FROM" ===
    // Step 1: Check if it's a newly created flow in this session
    const newlyCreatedFlowKey = newlyCreatedFlows.get(operation.fromId);
    if (newlyCreatedFlowKey) {
      // This is a flow created in this session, use its LinkLabel key
      const edge = state.diagram.linkDataArray.find((link: go.ObjectData) => link.key === newlyCreatedFlowKey);
      console.log(`Found newly created flow by name: "${operation.fromId}" → LinkLabel key ${newlyCreatedFlowKey}`);
      fromKey = newlyCreatedFlowKey;
      fromName = edge ? getLinkDisplayName(edge) : operation.fromId;
    } else {
      // Step 2: Try to find as existing edge (by ID) - if found, get its LinkLabel
      let linkLabel = findLinkLabelForEdge(
        operation.fromId,
        state.diagram.nodeDataArray,
        state.diagram.linkDataArray
      );
      
      // Step 3: If not found by ID, try to find edge by name
      if (!linkLabel) {
        const edgeByName = findLinkByName(state, operation.fromId);
        if (edgeByName) {
          // Found a flow edge by name, get its LinkLabel
          linkLabel = findLinkLabelForEdge(
            edgeByName.key,
            state.diagram.nodeDataArray,
            state.diagram.linkDataArray
          );
          if (linkLabel) {
            console.log(`Found flow edge by name and converted to LinkLabel: "${operation.fromId}" → ${linkLabel.key}`);
          }
        }
      }
      
      if (linkLabel) {
        // fromId is a flow edge, use its LinkLabel
        const edge = state.diagram.linkDataArray.find((link: go.ObjectData) => 
          link.key === operation.fromId || getLinkDisplayName(link).toLowerCase() === operation.fromId.toLowerCase()
        );
        console.log(`Converting fromId from flow edge to its LinkLabel: ${operation.fromId} → ${linkLabel.key}`);
        fromKey = linkLabel.key;
        fromName = edge ? getLinkDisplayName(edge) : 'Flow';
      } else {
        // Step 4: Try to find as node (by ID first, then by name for newly created nodes)
        let fromNode = findNodeById(state, operation.fromId);
        if (!fromNode) {
          fromNode = findNodeByName(state, operation.fromId);
        }
        if (!fromNode) {
          return {
            success: false,
            message: `Source node or flow with ID/name "${operation.fromId}" not found`
          };
        }
        fromKey = fromNode.key;
        fromName = getNodeDisplayName(fromNode);
      }
    }

    // === RESOLVE "TO" ===
    // Step 1: Check if it's a newly created flow in this session
    const newlyCreatedToFlowKey = newlyCreatedFlows.get(operation.toId);
    if (newlyCreatedToFlowKey) {
      // This is a flow created in this session, use its LinkLabel key
      const edge = state.diagram.linkDataArray.find((link: go.ObjectData) => link.key === newlyCreatedToFlowKey);
      console.log(`Found newly created flow by name: "${operation.toId}" → LinkLabel key ${newlyCreatedToFlowKey}`);
      toKey = newlyCreatedToFlowKey;
      toName = edge ? getLinkDisplayName(edge) : operation.toId;
    } else {
      // Step 2: Try to find as existing edge (by ID) - if found, get its LinkLabel
      let toAsLinkLabel = findLinkLabelForEdge(
        operation.toId,
        state.diagram.nodeDataArray,
        state.diagram.linkDataArray
      );
      
      // Step 3: If not found by ID, try to find edge by name
      if (!toAsLinkLabel) {
        const edgeByName = findLinkByName(state, operation.toId);
        if (edgeByName) {
          // Found a flow edge by name, get its LinkLabel
          toAsLinkLabel = findLinkLabelForEdge(
            edgeByName.key,
            state.diagram.nodeDataArray,
            state.diagram.linkDataArray
          );
          if (toAsLinkLabel) {
            console.log(`Found flow edge by name and converted to LinkLabel: "${operation.toId}" → ${toAsLinkLabel.key}`);
          }
        }
      }
      
      if (toAsLinkLabel) {
        // toId is a flow edge, use its LinkLabel
        const edge = state.diagram.linkDataArray.find((link: go.ObjectData) => 
          link.key === operation.toId || getLinkDisplayName(link).toLowerCase() === operation.toId.toLowerCase()
        );
        console.log(`Converting toId from flow edge to its LinkLabel: ${operation.toId} → ${toAsLinkLabel.key}`);
        toKey = toAsLinkLabel.key;
        toName = edge ? getLinkDisplayName(edge) : 'Flow';
      } else {
        // Step 4: Try to find as node (by ID first, then by name for newly created nodes)
        let toNode = findNodeById(state, operation.toId);
        if (!toNode) {
          toNode = findNodeByName(state, operation.toId);
        }
        if (!toNode) {
          return {
            success: false,
            message: `Target node or flow with ID/name "${operation.toId}" not found`
          };
        }
        toKey = toNode.key;
        toName = getNodeDisplayName(toNode);
      }
    }

    // Check if link with same endpoints already exists
    const existingLink = state.diagram.linkDataArray.find((link: go.ObjectData) => 
      link.from === fromKey && link.to === toKey
    );

    if (existingLink) {
      // Auto-convert to update if same connection exists
      console.warn(`Link from "${fromName}" to "${toName}" already exists, converting add to update`);
      const existingLinkName = getLinkDisplayName(existingLink);
      return applyUpdateLink({
        operation: 'update_link',
        linkId: existingLink.key,
        name: existingLinkName,
        newName: operation.name,
        flowRate: operation.flowRate,
        bidirectional: operation.bidirectional,
        reasoning: operation.reasoning + ' (auto-converted from add to update)',
      }, dispatch, state);
    }

    // Create the link
    const linkKey = generateKey();
    const linkData: go.ObjectData = {
      key: linkKey,
      from: fromKey,
      to: toKey,
      category: operation.linkType,
    };

    if (operation.name) {
      linkData.text = operation.name;
    }
    if (operation.flowRate !== undefined) {
      linkData.flowRate = operation.flowRate;
    }
    if (operation.bidirectional !== undefined) {
      linkData.bidirectional = operation.bidirectional;
    }

    // For flow links, create LinkLabel node manually to enable immediate edge-to-edge connections
    let linkLabelKey: go.Key | undefined;
    if (operation.linkType === 'flow') {
      linkLabelKey = generateKey();
      const linkLabelData: go.ObjectData = {
        key: linkLabelKey,
        category: LINK_LABEL_CATEGORY,
      };
      
      // Add LinkLabel to link's labelKeys array
      linkData.labelKeys = [linkLabelKey];
      
      // Insert LinkLabel node first
      dispatch(insertNode(linkLabelData));
      console.log(`Created LinkLabel for flow "${operation.name || linkKey}": ${linkLabelKey}`);
    }

    dispatch(insertLink(linkData));
    
    return { 
      success: true, 
      message: `Added ${operation.linkType} from "${fromName}" to "${toName}"`,
      flowKey: linkLabelKey // Return LinkLabel key for tracking
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to add link: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Apply update_link operation
 */
function applyUpdateLink(
  operation: Extract<DiagramOperation, { operation: 'update_link' }>,
  dispatch: Dispatch,
  state: RootState
): { success: boolean; message: string } {
  try {
    const linkIndex = state.diagram.linkDataArray.findIndex((link: go.ObjectData) => 
      link.key === operation.linkId
    );
    
    if (linkIndex === -1) {
      return { 
        success: false, 
        message: `Link with ID "${operation.linkId}" not found` 
      };
    }

    const link = state.diagram.linkDataArray[linkIndex];
    const updatedLink: go.ObjectData = { ...link };
    const linkName = getLinkDisplayName(link);
    
    if (operation.newName) {
      updatedLink.text = operation.newName;
    }
    if (operation.flowRate !== undefined) {
      updatedLink.flowRate = operation.flowRate;
    }
    if (operation.bidirectional !== undefined) {
      updatedLink.bidirectional = operation.bidirectional;
    }

    dispatch(modifyLink({ index: linkIndex, data: updatedLink }));
    return { 
      success: true, 
      message: `Updated link "${linkName}"` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to update link: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Apply delete_link operation
 */
function applyDeleteLink(
  operation: Extract<DiagramOperation, { operation: 'delete_link' }>,
  dispatch: Dispatch,
  state: RootState
): { success: boolean; message: string } {
  try {
    const link = findLinkById(state, operation.linkId);
    if (!link) {
      return { 
        success: false, 
        message: `Link with ID "${operation.linkId}" not found` 
      };
    }

    const linkName = getLinkDisplayName(link);
    dispatch(removeLinks([link.key]));
    return { 
      success: true, 
      message: `Deleted link "${linkName}"` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to delete link: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// ============================================================================
// MAIN APPLIER
// ============================================================================

export interface ApplyResult {
  success: boolean;
  appliedCount: number;
  failedCount: number;
  messages: string[];
}

/**
 * Apply all operations from a diagram modification proposal
 */
export function applyDiagramModifications(
  proposal: DiagramModificationProposal,
  dispatch: Dispatch,
  getState: () => RootState
): ApplyResult {
  const results: ApplyResult = {
    success: true,
    appliedCount: 0,
    failedCount: 0,
    messages: [],
  };

  // Track newly created flows in this session (name -> key)
  // This is needed because LinkLabel nodes are created asynchronously by GoJS
  const newlyCreatedFlows = new Map<string, go.Key>();

  for (const operation of proposal.operations) {
    const state = getState();
    let result: { success: boolean; message: string; flowKey?: go.Key };

    switch (operation.operation) {
      case 'add_node':
        result = applyAddNode(operation, dispatch, state);
        break;
      case 'update_node':
        result = applyUpdateNode(operation, dispatch, state);
        break;
      case 'delete_node':
        result = applyDeleteNode(operation, dispatch, state);
        break;
      case 'add_link':
        result = applyAddLink(operation, dispatch, state, newlyCreatedFlows);
        // Track newly created flows
        if (result.success && result.flowKey && operation.name) {
          newlyCreatedFlows.set(operation.name, result.flowKey);
        }
        break;
      case 'update_link':
        result = applyUpdateLink(operation, dispatch, state);
        break;
      case 'delete_link':
        result = applyDeleteLink(operation, dispatch, state);
        break;
      default:
        result = {
          success: false,
          message: `Unknown operation type: ${(operation as any).operation}`,
        };
    }

    if (result.success) {
      results.appliedCount++;
    } else {
      results.failedCount++;
      results.success = false;
    }
    
    results.messages.push(`${result.success ? '✓' : '✗'} ${result.message}`);
  }

  return results;
}

