import { useRef, useState, useEffect } from 'react';
import * as go from 'gojs';
import { Diagram, type DiagramHandle } from '../../components/Diagram';
import { DiagramOverview } from '../../components/DiagramOverview';
import { Sidebar } from '../../components/Sidebar';
import { ToastProvider } from '../../components/Toast';
import { useAppSelector } from '../../store/hooks';
import { useDiagramModelSync } from '../../hooks/diagram/useDiagramModelSync';
import { useDiagramSelection } from '../../hooks/diagram/useDiagramSelection';
import './DiagramEditor.css';

export function DiagramEditor() {
  const { selectedLinkType } = useAppSelector((state) => state.diagram);
  const handleModelChange = useDiagramModelSync();
  const handleDiagramEvent = useDiagramSelection();
  
  const diagramRef = useRef<DiagramHandle>(null);
  const [observedDiagram, setObservedDiagram] = useState<go.Diagram | null>(null);

  // Update observed diagram for Overview when diagram is ready
  useEffect(() => {
    // Use a small delay to ensure diagram is fully initialized
    const timer = setTimeout(() => {
      const diagram = diagramRef.current?.getDiagram();
      if (diagram && diagram !== observedDiagram) {
        setObservedDiagram(diagram);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [observedDiagram]);

  return (
    <ToastProvider>
      <div className="diagram-editor">
        <Sidebar />
        
        <main className="diagram-panel">
          <div className="diagram-container">
            <Diagram
              ref={diagramRef}
              selectedLinkType={selectedLinkType}
              onDiagramEvent={handleDiagramEvent}
              onModelChange={handleModelChange}
            />
            
            <div className="overview-container">
              <DiagramOverview observedDiagram={observedDiagram} />
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
