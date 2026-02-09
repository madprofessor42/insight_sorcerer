import * as go from 'gojs';
import { useCallback } from 'react';
import { Diagram } from '../../components/Diagram';
import { Sidebar } from '../../components/Sidebar';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useDiagramModelSync } from '../../hooks/useDiagramModelSync';
import { setSelectedEdge, clearSelectedEdge } from '../../store/diagramSlice';
import './DiagramEditor.css';

export function DiagramEditor() {
  const { selectedLinkType } = useAppSelector((state) => state.diagram);
  const dispatch = useAppDispatch();
  const handleModelChange = useDiagramModelSync();

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

  return (
    <div className="diagram-editor">
      <Sidebar />
      
      <main className="diagram-panel">
        <Diagram
          selectedLinkType={selectedLinkType}
          onDiagramEvent={handleDiagramEvent}
          onModelChange={handleModelChange}
        />
      </main>
    </div>
  );
}
