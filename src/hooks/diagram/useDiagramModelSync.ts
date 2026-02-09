import { useCallback } from 'react';
import * as go from 'gojs';
import { useAppDispatch } from '../../store/hooks';
import { syncFromGoJS } from '../../store/diagramSlice';

/**
 * Check if there are any changes that need processing
 */
function hasModelChanges(changes: go.IncrementalData): boolean {
  return (
    (changes.insertedNodeKeys && changes.insertedNodeKeys.length > 0) ||
    (changes.modifiedNodeData && changes.modifiedNodeData.length > 0) ||
    (changes.removedNodeKeys && changes.removedNodeKeys.length > 0) ||
    (changes.insertedLinkKeys && changes.insertedLinkKeys.length > 0) ||
    (changes.modifiedLinkData && changes.modifiedLinkData.length > 0) ||
    (changes.removedLinkKeys && changes.removedLinkKeys.length > 0) ||
    !!changes.modelData
  );
}

/**
 * Extract current state from GoJS model
 */
function extractModelState(diagram: go.Diagram) {
  const model = diagram.model as go.GraphLinksModel;
  
  // Get nodes from GoJS (with all latest changes already applied)
  const currentNodes = model.nodeDataArray.map(nd => ({ ...nd }));
  console.log('📊 Syncing nodes from GoJS:', currentNodes.length);

  // Get links from GoJS (with all latest changes already applied)
  const currentLinks = model.linkDataArray.map(ld => ({ ...ld }));
  console.log('📊 Syncing links from GoJS:', currentLinks.length);

  return { currentNodes, currentLinks };
}

/**
 * Hook to handle GoJS model changes and sync with Redux
 */
export function useDiagramModelSync() {
  const dispatch = useAppDispatch();

  const handleModelChange = useCallback((
    changes: go.IncrementalData,
    diagram: go.Diagram | null
  ) => {
    if (!changes) return;
    if (!diagram) return;

    console.log('🔍 handleModelChange called:', {
      insertedNodeKeys: changes.insertedNodeKeys,
      modifiedNodeData: changes.modifiedNodeData,
      removedNodeKeys: changes.removedNodeKeys
    });

    // Check if there are any changes that need processing
    if (!hasModelChanges(changes)) return;

    // IMPORTANT: Get the current state directly from GoJS model
    // This is the single source of truth - no manual updates!
    const { currentNodes, currentLinks } = extractModelState(diagram);

    // Dispatch Redux action to sync from GoJS
    dispatch(syncFromGoJS({
      nodes: currentNodes,
      links: currentLinks,
      modelData: changes.modelData,
    }));
  }, [dispatch]);

  return handleModelChange;
}

