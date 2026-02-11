import { useRef, useState, useEffect } from 'react';
import * as go from 'gojs';
import { Diagram, type DiagramHandle } from '../../components/Diagram';
import { DiagramOverview } from '../../components/DiagramOverview';
import { DiagramToolbar } from '../../components/DiagramToolbar';
import { Sidebar } from '../../components/Sidebar';
import { ToastProvider } from '../../components/ui';
import { useAppSelector } from '../../store/hooks';
import { useDiagramModelSync } from '../../hooks/diagram/useDiagramModelSync';
import { useDiagramSelection } from '../../hooks/diagram/useDiagramSelection';
import { useDiagramPersistence } from '../../hooks/diagram/useDiagramPersistence';
import { getLastOpenedDiagramId } from '../../utils/database';
import './DiagramEditor.css';

export function DiagramEditor() {
  const { selectedLinkType } = useAppSelector((state) => state.diagram);
  const handleModelChange = useDiagramModelSync();
  const handleDiagramEvent = useDiagramSelection();
  const { loadDiagram, getSavedDiagrams } = useDiagramPersistence();
  
  const diagramRef = useRef<DiagramHandle>(null);
  const [observedDiagram, setObservedDiagram] = useState<go.Diagram | null>(null);
  
  // Track current diagram for toolbar
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [currentDiagramName, setCurrentDiagramName] = useState<string>('');
  const hasLoadedRef = useRef(false);

  // Load last opened diagram on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadLastDiagram = async () => {
      try {
        const lastOpenedId = await getLastOpenedDiagramId();
        if (lastOpenedId) {
          await loadDiagram(lastOpenedId);
          const diagrams = await getSavedDiagrams();
          const diagram = diagrams.find(d => d.id === lastOpenedId);
          if (diagram) {
            setCurrentDiagramId(lastOpenedId);
            setCurrentDiagramName(diagram.name);
          }
        }
      } catch (err) {
        console.error('Failed to load last diagram:', err);
      }
    };

    loadLastDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <DiagramToolbar 
              currentDiagramId={currentDiagramId}
              currentDiagramName={currentDiagramName}
              onDiagramChanged={(id, name) => {
                setCurrentDiagramId(id);
                setCurrentDiagramName(name);
              }}
            />
            
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
