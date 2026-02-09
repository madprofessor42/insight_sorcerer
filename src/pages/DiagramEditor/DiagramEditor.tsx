import * as go from 'gojs';
import { useCallback } from 'react';
import { Diagram } from '../../components/Diagram';
import { Sidebar } from '../../components/Sidebar';
import { useAppSelector } from '../../store/hooks';
import { useDiagramModelSync } from '../../hooks/useDiagramModelSync';
import './DiagramEditor.css';

export function DiagramEditor() {
  const { selectedLinkType } = useAppSelector((state) => state.diagram);
  const handleModelChange = useDiagramModelSync();

  const handleDiagramEvent = useCallback((e: go.DiagramEvent) => {
    const name = e.name;
    switch (name) {
      case 'ChangedSelection': {
        // Handle selection changes if needed
        break;
      }
      default:
        break;
    }
  }, []);

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
