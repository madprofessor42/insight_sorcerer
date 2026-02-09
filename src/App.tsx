import { useState, useEffect } from 'react';
import * as go from 'gojs';
import { DiagramWrapper } from './components/DiagramWrapper';
import { Palette } from './components/Palette';
import './App.css';

function App() {
  const [nodeDataArray, setNodeDataArray] = useState<Array<go.ObjectData>>([]);
  const [linkDataArray, setLinkDataArray] = useState<Array<go.ObjectData>>([]);
  const [modelData, setModelData] = useState<go.ObjectData>({});
  const [skipsDiagramUpdate, setSkipsDiagramUpdate] = useState(false);

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
    setNodeDataArray(currentNodes);

    // Get links from GoJS (with all latest changes already applied)
    const currentLinks = model.linkDataArray.map(ld => ({ ...ld }));
    console.log('📊 Syncing links from GoJS:', currentLinks.length);
    setLinkDataArray(currentLinks);

    // Update model data if changed
    if (changes.modelData) {
      setModelData(changes.modelData);
    }

    // IMPORTANT: Set skipsDiagramUpdate to true since GoJS already has this update
    // This prevents a feedback loop where React updates trigger diagram updates
    setSkipsDiagramUpdate(true);
  };

  // Reset skipsDiagramUpdate flag after state updates
  useEffect(() => {
    if (skipsDiagramUpdate) {
      // Reset flag after a brief delay to allow React to process updates
      const timer = setTimeout(() => {
        setSkipsDiagramUpdate(false);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [skipsDiagramUpdate]);

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
    
    // Use the current nodes from diagram (with latest positions) 
    // instead of React state to avoid losing position changes
    const newArray = [...currentNodes, nodeData];
    console.log('📦 New array length:', newArray.length);
    
    // Don't skip diagram update - we're setting new data
    setSkipsDiagramUpdate(false);
    setNodeDataArray(newArray);
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
