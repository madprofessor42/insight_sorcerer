import * as go from 'gojs';
import { useCallback } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setSelectedEdge, clearSelectedEdge } from '../../store/diagramSlice';

/**
 * Hook to handle diagram selection events
 * Manages edge/link selection state in Redux
 */
export function useDiagramSelection() {
  const dispatch = useAppDispatch();

  const handleDiagramEvent = useCallback((e: go.DiagramEvent) => {
    const name = e.name;
    switch (name) {
      case 'ChangedSelection': {
        const diagram = e.diagram;
        const selection = diagram.selection;
        
        // Check if a link (edge) is selected
        const selectedLink = selection.filter((part) => part instanceof go.Link).first();
        
        if (selectedLink instanceof go.Link) {
          // Link is selected - store only serializable data in Redux
          const serializableData = {
            key: selectedLink.data.key,
            from: selectedLink.data.from,
            to: selectedLink.data.to,
            category: selectedLink.data.category,
            bidirectional: selectedLink.data.bidirectional === true,
          };
          dispatch(setSelectedEdge(serializableData));
        } else {
          // No link selected - clear Redux state
          dispatch(clearSelectedEdge());
        }
        break;
      }
      default:
        break;
    }
  }, [dispatch]);

  return handleDiagramEvent;
}

