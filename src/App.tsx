import * as go from 'gojs';
import { DiagramWrapper } from './components/DiagramWrapper';
import { Sidebar } from './components/Sidebar';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { syncFromGoJS } from './store/diagramSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  // Only read selectedLinkType - diagram data is stored but NOT passed back to GoJS!
  const { selectedLinkType } = useAppSelector((state) => state.diagram);

  const handleModelChange = (changes: go.IncrementalData, diagram: go.Diagram | null) => {
    if (!changes) return;
    if (!diagram) return;

    console.log('🔍 handleModelChange called:', {
      insertedNodeKeys: changes.insertedNodeKeys,
      modifiedNodeData: changes.modifiedNodeData,
      removedNodeKeys: changes.removedNodeKeys
    });

    // Check if there are any changes that need processing
    const hasChanges = 
      (changes.insertedNodeKeys && changes.insertedNodeKeys.length > 0) ||
      (changes.modifiedNodeData && changes.modifiedNodeData.length > 0) ||
      (changes.removedNodeKeys && changes.removedNodeKeys.length > 0) ||
      (changes.insertedLinkKeys && changes.insertedLinkKeys.length > 0) ||
      (changes.modifiedLinkData && changes.modifiedLinkData.length > 0) ||
      (changes.removedLinkKeys && changes.removedLinkKeys.length > 0) ||
      changes.modelData;

    if (!hasChanges) return;

    // IMPORTANT: Get the current state directly from GoJS model
    // This is the single source of truth - no manual updates!
    const model = diagram.model as go.GraphLinksModel;
    
    // Get nodes from GoJS (with all latest changes already applied)
    const currentNodes = model.nodeDataArray.map(nd => ({ ...nd }));
    console.log('📊 Syncing nodes from GoJS:', currentNodes.length);

    // Get links from GoJS (with all latest changes already applied)
    const currentLinks = model.linkDataArray.map(ld => ({ ...ld }));
    console.log('📊 Syncing links from GoJS:', currentLinks.length);

    // Dispatch Redux action to sync from GoJS
    dispatch(syncFromGoJS({
      nodes: currentNodes,
      links: currentLinks,
      modelData: changes.modelData,
    }));
  };

  const handleDiagramEvent = (e: go.DiagramEvent) => {
    const name = e.name;
    switch (name) {
      case 'ChangedSelection': {
        // Handle selection changes if needed
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar />
        
        <main className="diagram-panel">
          <DiagramWrapper
            selectedLinkType={selectedLinkType}
            onDiagramEvent={handleDiagramEvent}
            onModelChange={handleModelChange}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
