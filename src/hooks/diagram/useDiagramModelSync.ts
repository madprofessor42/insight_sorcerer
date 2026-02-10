import { useCallback, useRef } from 'react';
import * as go from 'gojs';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  insertNode, 
  modifyNode, 
  removeNodes,
  insertLink,
  modifyLink,
  removeLinks,
  modifyModel,
  setSkips
} from '../../store/diagramSlice';

/**
 * Clean non-serializable GoJS objects from link data
 * 
 * PROBLEM: When links are created OR modified (moved nodes, reshaped links),
 * GoJS sends modifiedLinkData with List2 objects for 'points' property.
 * These are NOT serializable for Redux!
 * 
 * SOLUTION: Remove 'points' property containing List2.
 * GoJS will recalculate route points when the link is rendered.
 * 
 * NOTE: We DON'T convert List2 to Array because:
 * 1. List2 contains Point2 objects (also non-serializable)
 * 2. GoJS recalculates points based on node positions anyway
 * 3. Simpler to just skip 'points' and let GoJS handle routing
 */
function cleanLinkData(data: go.ObjectData): go.ObjectData {
  // If points is a List2 (GoJS class instance), remove it
  if (data.points instanceof go.List) {
    const { points, ...rest } = data;
    return rest;
  }
  return data;
}

/**
 * Hook to handle GoJS model changes and sync with Redux
 * Following GoJS best practices for incremental updates
 */
export function useDiagramModelSync() {
  const dispatch = useAppDispatch();
  const { nodeDataArray, linkDataArray } = useAppSelector((state) => state.diagram);
  
  // Maps to store key -> arr index for quick lookups (GoJS best practice)
  const mapNodeKeyIdx = useRef(new Map<go.Key, number>());
  const mapLinkKeyIdx = useRef(new Map<go.Key, number>());

  // Update map of node keys to their index in the array
  const refreshNodeIndex = useCallback((nodeArr: Array<go.ObjectData>) => {
    mapNodeKeyIdx.current.clear();
    nodeArr.forEach((n: go.ObjectData, idx: number) => {
      mapNodeKeyIdx.current.set(n.key, idx);
    });
  }, []);

  // Update map of link keys to their index in the array
  const refreshLinkIndex = useCallback((linkArr: Array<go.ObjectData>) => {
    mapLinkKeyIdx.current.clear();
    linkArr.forEach((l: go.ObjectData, idx: number) => {
      mapLinkKeyIdx.current.set(l.key, idx);
    });
  }, []);

  // Keep indexes in sync with Redux state
  if (mapNodeKeyIdx.current.size !== nodeDataArray.length) {
    refreshNodeIndex(nodeDataArray);
  }
  if (mapLinkKeyIdx.current.size !== linkDataArray.length) {
    refreshLinkIndex(linkDataArray);
  }

  const handleModelChange = useCallback((
    changes: go.IncrementalData,
    diagram: go.Diagram | null
  ) => {
    if (!changes || !diagram) return;

    const insertedNodeKeys = changes.insertedNodeKeys;
    const modifiedNodeData = changes.modifiedNodeData;
    const removedNodeKeys = changes.removedNodeKeys;
    const insertedLinkKeys = changes.insertedLinkKeys;
    const modifiedLinkData = changes.modifiedLinkData;
    const removedLinkKeys = changes.removedLinkKeys;
    const modifiedModelData = changes.modelData;

    console.log('🔄 Model changes:', {
      insertedNodes: insertedNodeKeys?.length || 0,
      modifiedNodes: modifiedNodeData?.length || 0,
      removedNodes: removedNodeKeys?.length || 0,
      insertedLinks: insertedLinkKeys?.length || 0,
      modifiedLinks: modifiedLinkData?.length || 0,
      removedLinks: removedLinkKeys?.length || 0,
    });

    // Maintain maps of modified data so insertions don't need slow lookups
    const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
    const modifiedLinkMap = new Map<go.Key, go.ObjectData>();

    // React 18+ automatically batches updates, so no manual batching needed
    // Process node modifications
    if (modifiedNodeData) {
      modifiedNodeData.forEach((nd: go.ObjectData) => {
        modifiedNodeMap.set(nd.key, nd);
        const idx = mapNodeKeyIdx.current.get(nd.key);
        if (idx !== undefined && idx >= 0) {
          dispatch(modifyNode({ index: idx, data: nd }));
        }
      });
    }

    // Process node insertions
    if (insertedNodeKeys) {
      insertedNodeKeys.forEach((key: go.Key) => {
        const nd = modifiedNodeMap.get(key);
        const idx = mapNodeKeyIdx.current.get(key);
        if (nd && idx === undefined) {
          // Update our index map
          mapNodeKeyIdx.current.set(nd.key, nodeDataArray.length);
          dispatch(insertNode(nd));
        }
      });
    }

    // Process node removals
    if (removedNodeKeys) {
      dispatch(removeNodes(removedNodeKeys));
      // Refresh index after removal
      refreshNodeIndex(nodeDataArray.filter(n => !removedNodeKeys.includes(n.key)));
    }

    // Process link modifications
    if (modifiedLinkData) {
      modifiedLinkData.forEach((ld: go.ObjectData) => {
        // Clean non-serializable objects (List2 for points) from ALL link data
        const cleanedData = cleanLinkData(ld);
        modifiedLinkMap.set(ld.key, cleanedData);
        const idx = mapLinkKeyIdx.current.get(ld.key);
        if (idx !== undefined && idx >= 0) {
          dispatch(modifyLink({ index: idx, data: cleanedData }));
        }
      });
    }

    // Process link insertions
    if (insertedLinkKeys) {
      insertedLinkKeys.forEach((key: go.Key) => {
        const ld = modifiedLinkMap.get(key);
        const idx = mapLinkKeyIdx.current.get(key);
        if (ld && idx === undefined) {
          // Link data already cleaned in modifiedLinkData processing above
          mapLinkKeyIdx.current.set(ld.key, linkDataArray.length);
          dispatch(insertLink(ld));
        }
      });
    }

    // Process link removals
    if (removedLinkKeys) {
      dispatch(removeLinks(removedLinkKeys));
      // Refresh index after removal
      refreshLinkIndex(linkDataArray.filter(l => !removedLinkKeys.includes(l.key)));
    }

    // Handle model data changes
    if (modifiedModelData) {
      dispatch(modifyModel(modifiedModelData));
    }

    // CRITICAL: Set skipsDiagramUpdate to true
    // The GoJS model already knows about these updates, so we don't send them back
    dispatch(setSkips(true));
  }, [dispatch, nodeDataArray, linkDataArray, refreshNodeIndex, refreshLinkIndex]);

  return handleModelChange;
}

