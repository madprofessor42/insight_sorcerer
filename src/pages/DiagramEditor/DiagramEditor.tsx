import { Diagram } from '../../components/Diagram';
import { Sidebar } from '../../components/Sidebar';
import { useAppSelector } from '../../store/hooks';
import { useDiagramModelSync } from '../../hooks/diagram/useDiagramModelSync';
import { useDiagramSelection } from '../../hooks/diagram/useDiagramSelection';
import './DiagramEditor.css';

export function DiagramEditor() {
  const { selectedLinkType } = useAppSelector((state) => state.diagram);
  const handleModelChange = useDiagramModelSync();
  const handleDiagramEvent = useDiagramSelection();

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
