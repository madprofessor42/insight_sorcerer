import * as go from 'gojs';
import { useCallback } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { 
  setSelectedNodeKey, 
  clearSelectedNode,
  setSelectedEdgeKey, 
  clearSelectedEdge, 
  setSkips 
} from '../../store/diagramSlice';

/**
 * Hook to handle diagram selection events
 * Manages node and edge/link selection state in Redux
 */
export function useDiagramSelection() {
  const dispatch = useAppDispatch();

  const handleDiagramEvent = useCallback((e: go.DiagramEvent) => {
    const name = e.name;
    switch (name) {
      case 'ChangedSelection': {
        const diagram = e.diagram;
        const selection = diagram.selection;
        
        // Check if a node is selected
        const selectedNode = selection.filter((part) => part instanceof go.Node).first();
        
        // Check if a link (edge) is selected
        const selectedLink = selection.filter((part) => part instanceof go.Link).first();
        
        // Log selection changes for debugging (only when something is selected)
        if (selectedNode || selectedLink) {
          console.log('👆 Selected:', selectedNode?.data?.key || selectedLink?.data?.key);
        }
        
        // Update node selection
        if (selectedNode instanceof go.Node) {
          dispatch(setSelectedNodeKey(selectedNode.data.key));
        } else {
          dispatch(clearSelectedNode());
        }
        
        // Update link selection
        if (selectedLink instanceof go.Link) {
          dispatch(setSelectedEdgeKey(selectedLink.data.key));
        } else {
          dispatch(clearSelectedEdge());
        }
        
        // Set skipsDiagramUpdate flag (consistency with useDiagramModelSync)
        // Even though selectedNodeKey/selectedEdgeKey are not passed to ReactDiagram,
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

