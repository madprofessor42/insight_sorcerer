import { useEffect } from 'react';
import * as go from 'gojs';
import { DiagramWrapper } from './components/DiagramWrapper';
import { Palette } from './components/Palette';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { syncFromGoJS, addNode, resetSkipFlag } from './store/diagramSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const { nodeDataArray, linkDataArray, modelData, skipsDiagramUpdate } = useAppSelector(
    (state) => state.diagram
  );

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

  // Reset skipsDiagramUpdate flag after state updates
  useEffect(() => {
    if (skipsDiagramUpdate) {
      // Reset flag after a brief delay to allow React to process updates
      const timer = setTimeout(() => {
        dispatch(resetSkipFlag());
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [skipsDiagramUpdate, dispatch]);

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

  const handleNodeDrop = (nodeData: go.ObjectData, currentNodes: Array<go.ObjectData>) => {
    console.log('📦 handleNodeDrop called with:', nodeData);
    console.log('📦 Current nodes from diagram:', currentNodes);
    console.log('📦 New array length:', currentNodes.length + 1);
    
    // Dispatch Redux action to add node
    dispatch(addNode({
      nodeData,
      allNodes: currentNodes,
    }));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🔮 Insight Sorcerer</h1>
        <p>System Dynamics Modeling Tool</p>
      </header>
      
      <div className="main-content">
        <aside className="palette-panel">
          <Palette />
        </aside>
        
        <main className="diagram-panel">
          <DiagramWrapper
            nodeDataArray={nodeDataArray}
            linkDataArray={linkDataArray}
            modelData={modelData}
            skipsDiagramUpdate={skipsDiagramUpdate}
            onDiagramEvent={handleDiagramEvent}
            onModelChange={handleModelChange}
            onNodeDrop={handleNodeDrop}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
