import * as go from 'gojs';
import { useCallback } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setSelectedEdgeKey, clearSelectedEdge, setSkips } from '../../store/diagramSlice';

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
          // Store only the key - actual data comes from linkDataArray
          dispatch(setSelectedEdgeKey(selectedLink.data.key));
        } else {
          // No link selected - clear
          dispatch(clearSelectedEdge());
        }
        
        // Set skipsDiagramUpdate flag (consistency with useDiagramModelSync)
        // Even though selectedEdgeKey is not passed to ReactDiagram,
        // we follow the pattern: any Redux update from GoJS should set skipsDiagramUpdate
        dispatch(setSkips(true));
        break;
      }
      default:
        break;
    }
  }, [dispatch]);

  return handleDiagramEvent;
}

