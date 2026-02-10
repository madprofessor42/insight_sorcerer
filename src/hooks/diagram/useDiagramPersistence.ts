/**
 * Custom hook for diagram persistence (save/load to IndexedDB)
 * 
 * Provides functions to save current diagram state and load saved diagrams
 */

import { useCallback, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { loadDiagram as loadDiagramAction } from '../../store/diagramSlice';
import {
  saveDiagram as saveDiagramToDB,
  loadDiagram as loadDiagramFromDB,
  getAllDiagramMetadata,
  deleteDiagram as deleteDiagramFromDB,
  generateDiagramId,
  type DiagramMetadata,
} from '../../utils/database';
import { getDiagramFromDOM } from '../../utils/diagram-access';

export interface UseDiagramPersistenceReturn {
  /** Save current diagram to IndexedDB */
  saveDiagram: (name: string, id?: string) => Promise<string>;
  /** Load a diagram from IndexedDB */
  loadDiagram: (id: string) => Promise<void>;
  /** Get list of all saved diagrams */
  getSavedDiagrams: () => Promise<DiagramMetadata[]>;
  /** Delete a saved diagram */
  deleteDiagram: (id: string) => Promise<void>;
  /** Current save/load operation status */
  status: 'idle' | 'saving' | 'loading' | 'error';
  /** Error message if status is 'error' */
  error: string | null;
  /** Clear error message */
  clearError: () => void;
}

/**
 * Hook for managing diagram persistence to IndexedDB
 * 
 * IMPORTANT: Gets data directly from GoJS diagram (not Redux) to preserve
 * link routing points and other GoJS-specific properties that aren't in Redux.
 */
export function useDiagramPersistence(): UseDiagramPersistenceReturn {
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<'idle' | 'saving' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  /**
   * Save current diagram to IndexedDB
   * Gets data directly from GoJS diagram to preserve routing points and other properties
   * @param name - Display name for the diagram
   * @param id - Optional existing ID (for updating), generates new ID if not provided
   * @returns The diagram ID
   */
  const saveDiagram = useCallback(
    async (name: string, id?: string): Promise<string> => {
      setStatus('saving');
      setError(null);

      try {
        // Get diagram directly from DOM to access full GoJS model
        const diagram = getDiagramFromDOM();
        if (!diagram) {
          throw new Error('Diagram not found. Please make sure the diagram is initialized.');
        }

        // Get full model data from GoJS (includes routing points, etc.)
        // Use toJson() to get properly serialized data
        const modelJson = diagram.model.toJson();
        const modelObj = JSON.parse(modelJson);

        const diagramId = id || generateDiagramId();
        
        await saveDiagramToDB(
          diagramId,
          name,
          modelObj.nodeDataArray || [],
          modelObj.linkDataArray || [],
          modelObj.modelData || {}
        );

        setStatus('idle');
        return diagramId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save diagram';
        setError(message);
        setStatus('error');
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Load a diagram from IndexedDB and update Redux state
   * @param id - Diagram ID to load
   */
  const loadDiagram = useCallback(
    async (id: string): Promise<void> => {
      setStatus('loading');
      setError(null);

      try {
        const diagram = await loadDiagramFromDB(id);

        dispatch(
          loadDiagramAction({
            nodeDataArray: diagram.nodeDataArray,
            linkDataArray: diagram.linkDataArray,
            modelData: diagram.modelData,
          })
        );

        setStatus('idle');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load diagram';
        setError(message);
        setStatus('error');
        throw new Error(message);
      }
    },
    [dispatch]
  );

  /**
   * Get list of all saved diagrams (metadata only)
   */
  const getSavedDiagrams = useCallback(async (): Promise<DiagramMetadata[]> => {
    try {
      return await getAllDiagramMetadata();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load diagram list';
      setError(message);
      setStatus('error');
      throw new Error(message);
    }
  }, []);

  /**
   * Delete a saved diagram
   * @param id - Diagram ID to delete
   */
  const deleteDiagram = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      await deleteDiagramFromDB(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete diagram';
      setError(message);
      setStatus('error');
      throw new Error(message);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    saveDiagram,
    loadDiagram,
    getSavedDiagrams,
    deleteDiagram,
    status,
    error,
    clearError,
  };
}

