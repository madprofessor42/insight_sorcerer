import { useRef, useState, useEffect, useCallback } from 'react';
import * as go from 'gojs';
import { Diagram, type DiagramHandle } from '../../components/Diagram';
import { DiagramOverview } from '../../components/DiagramOverview';
import { DiagramToolbar } from '../../components/DiagramToolbar';
import { Sidebar } from '../../components/Sidebar';
import { ToastProvider, MinimizedWindowsBar, type MinimizedWindow } from '../../components/ui';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearDiagram } from '../../store/diagramSlice';
import { useDiagramModelSync } from '../../hooks/diagram/useDiagramModelSync';
import { useDiagramSelection } from '../../hooks/diagram/useDiagramSelection';
import { useDiagramPersistence } from '../../hooks/diagram/useDiagramPersistence';
import { getLastOpenedDiagramId, saveLastOpenedDiagramId } from '../../utils/database';
import './DiagramEditor.css';

export function DiagramEditor() {
  const { selectedLinkType } = useAppSelector((state) => state.diagram);
  const dispatch = useAppDispatch();
  const handleModelChange = useDiagramModelSync();
  const handleDiagramEvent = useDiagramSelection();
  const { loadDiagram, getSavedDiagrams } = useDiagramPersistence();
  
  const diagramRef = useRef<DiagramHandle>(null);
  const [observedDiagram, setObservedDiagram] = useState<go.Diagram | null>(null);
  
  // Track current diagram for toolbar
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [currentDiagramName, setCurrentDiagramName] = useState<string>('');
  const hasLoadedRef = useRef(false);

  // Track minimized windows
  const [minimizedWindows, setMinimizedWindows] = useState<MinimizedWindow[]>([]);

  // Window management callbacks
  const handleWindowMinimize = useCallback((windowId: string, title: string, icon?: string) => {
    setMinimizedWindows((prev) => {
      // Don't add if already minimized
      if (prev.some((w) => w.id === windowId)) return prev;
      return [...prev, { id: windowId, title, icon }];
    });
  }, []);

  const handleWindowCloseFromTaskbar = useCallback((windowId: string) => {
    // Call the specific window's close handler
    const handler = sidebarCloseHandlersRef.current[windowId];
    if (handler) {
      handler();
    }
    // Remove from minimized list
    setMinimizedWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

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
        // If diagram was deleted, clear the last opened ID and start with new diagram
        await saveLastOpenedDiagramId(null);
        dispatch(clearDiagram());
        setCurrentDiagramId(null);
        setCurrentDiagramName('');
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

  // Create refs to store Sidebar's window handlers
  const sidebarRestoreHandlersRef = useRef<Record<string, () => void>>({});
  const sidebarCloseHandlersRef = useRef<Record<string, () => void>>({});

  const registerRestoreHandler = (windowId: string, handler: () => void) => {
    sidebarRestoreHandlersRef.current[windowId] = handler;
  };

  const registerCloseHandler = (windowId: string, handler: () => void) => {
    sidebarCloseHandlersRef.current[windowId] = handler;
  };

  const handleWindowRestoreFromTaskbar = useCallback((windowId: string) => {
    // Call the specific window's restore handler
    const handler = sidebarRestoreHandlersRef.current[windowId];
    if (handler) {
      handler();
    }
    // Remove from minimized list
    setMinimizedWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  return (
    <ToastProvider>
      <div className="diagram-editor">
        <Sidebar 
          onWindowMinimize={handleWindowMinimize}
          onWindowRestore={registerRestoreHandler}
          onWindowClose={registerCloseHandler}
        />
        
        <main className="diagram-panel">
          <div className="diagram-container">
            <DiagramToolbar 
              currentDiagramId={currentDiagramId}
              currentDiagramName={currentDiagramName}
              onDiagramChanged={(id, name) => {
                setCurrentDiagramId(id);
                setCurrentDiagramName(name);
              }}
              diagram={observedDiagram}
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

        {/* Minimized Windows Bar */}
        <MinimizedWindowsBar
          windows={minimizedWindows}
          onRestore={handleWindowRestoreFromTaskbar}
          onClose={handleWindowCloseFromTaskbar}
        />
      </div>
    </ToastProvider>
  );
}
