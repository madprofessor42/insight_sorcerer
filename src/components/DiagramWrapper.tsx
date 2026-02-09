import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useEffect, useRef } from 'react';

interface DiagramProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData, diagram: go.Diagram | null) => void;
  onNodeDrop?: (nodeData: go.ObjectData, currentNodes: Array<go.ObjectData>) => void;
}

export const DiagramWrapper = (props: DiagramProps) => {
  const diagramRef = useRef<ReactDiagram>(null);

  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('ChangedSelection', props.onDiagramEvent);
    }
    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('ChangedSelection', props.onDiagramEvent);
      }
    };
  }, [props.onDiagramEvent]);

  // Setup drag and drop handlers
  useEffect(() => {
    let diagramDiv: HTMLDivElement | null = null;
    let handleDragEnter: ((e: DragEvent) => void) | null = null;
    let handleDragOver: ((e: DragEvent) => void) | null = null;
    let handleDrop: ((e: DragEvent) => void) | null = null;

    // Wait for diagram to be fully initialized
    const timer = setTimeout(() => {
      if (!diagramRef.current) return;
      const diagram = diagramRef.current.getDiagram();
      if (!(diagram instanceof go.Diagram)) return;

      diagramDiv = diagram.div;
      if (!diagramDiv) return;

      handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      handleDrop = (e: DragEvent) => {
        console.log('🎯 Drop event triggered');
        e.preventDefault();
        e.stopPropagation();
        
        const can = e.target as HTMLCanvasElement;
        if (!(can instanceof HTMLCanvasElement)) {
          console.log('❌ Target is not canvas');
          return;
        }

        const bbox = can.getBoundingClientRect();
        const mx = e.clientX - bbox.left;
        const my = e.clientY - bbox.top;
        const point = diagram.transformViewToDoc(new go.Point(mx, my));

        const nodeType = e.dataTransfer?.getData('nodeType');
        const nodeDataStr = e.dataTransfer?.getData('nodeData');
        
        if (!nodeType || !nodeDataStr) {
          console.log('❌ No nodeType or nodeData');
          return;
        }
        
        const nodeData = JSON.parse(nodeDataStr);
        
        // Get the current node data from GoJS model to preserve any position changes
        const model = diagram.model as go.GraphLinksModel;
        const currentNodeData = model.nodeDataArray.map(nd => ({ ...nd }));
        console.log('📊 Current nodes in diagram:', currentNodeData);
        
        const newdata = {
          ...nodeData,
          loc: go.Point.stringify(point)
        };
        
        console.log('✅ Calling onNodeDrop with:', newdata);
        
        // Call the parent callback with both current nodes and new node
        if (props.onNodeDrop) {
          props.onNodeDrop(newdata, currentNodeData);
        }
      };

      diagramDiv.addEventListener('dragenter', handleDragEnter);
      diagramDiv.addEventListener('dragover', handleDragOver);
      diagramDiv.addEventListener('drop', handleDrop);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (diagramDiv && handleDragEnter && handleDragOver && handleDrop) {
        diagramDiv.removeEventListener('dragenter', handleDragEnter);
        diagramDiv.removeEventListener('dragover', handleDragOver);
        diagramDiv.removeEventListener('drop', handleDrop);
      }
    };
  }, [props.onNodeDrop]);

  const initDiagram = (): go.Diagram => {
    const $ = go.GraphObject.make;
    
    const diagram = $(go.Diagram, {
      'undoManager.isEnabled': true,
      'grid.visible': true,
      'grid.gridCellSize': new go.Size(20, 20),
      model: new go.GraphLinksModel({
        linkKeyProperty: 'key',
        nodeCategoryProperty: 'category',
        makeUniqueKeyFunction: (m: go.Model, data: any) => {
          let k = data.key || 1;
          while (m.findNodeDataForKey(k)) k++;
          data.key = k;
          return k;
        },
        makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
          let k = data.key || -1;
          while (m.findLinkDataForKey(k)) k--;
          data.key = k;
          return k;
        }
      })
    });

    // Define node template map for different node types
    const nodeTemplateMap = new go.Map<string, go.Node>();

    // Stock node template
    nodeTemplateMap.add('Stock', 
      $(go.Node, 'Auto',
        { locationSpot: go.Spot.Center },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, 'Rectangle', {
          fill: '#4A90E2',
          stroke: '#2E5C8A',
          strokeWidth: 2,
          width: 120,
          height: 60,
          portId: '',
          fromLinkable: true,
          toLinkable: true,
          cursor: 'pointer'
        }),
        $(go.TextBlock, {
          margin: 8,
          stroke: 'white',
          font: 'bold 14px sans-serif',
          editable: true
        }, new go.Binding('text', 'name').makeTwoWay())
      )
    );

    // Variable node template
    nodeTemplateMap.add('Variable',
      $(go.Node, 'Auto',
        { locationSpot: go.Spot.Center },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, 'Ellipse', {
          fill: '#50C878',
          stroke: '#2E7D4E',
          strokeWidth: 2,
          width: 100,
          height: 100,
          portId: '',
          fromLinkable: true,
          toLinkable: true,
          cursor: 'pointer'
        }),
        $(go.TextBlock, {
          margin: 8,
          stroke: 'white',
          font: 'bold 14px sans-serif',
          editable: true
        }, new go.Binding('text', 'name').makeTwoWay())
      )
    );

    diagram.nodeTemplateMap = nodeTemplateMap;

    // Default node template (fallback)
    diagram.nodeTemplate =
      $(go.Node, 'Auto',
        { locationSpot: go.Spot.Center },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, 'RoundedRectangle', {
          fill: '#999',
          stroke: '#666',
          strokeWidth: 2,
          width: 100,
          height: 60,
          portId: '',
          fromLinkable: true,
          toLinkable: true,
          cursor: 'pointer'
        }),
        $(go.TextBlock, {
          margin: 8,
          stroke: 'white',
          font: 'bold 14px sans-serif',
          editable: true
        }, new go.Binding('text', 'name').makeTwoWay())
      );

    // Link template
    diagram.linkTemplate =
      $(go.Link,
        { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
        $(go.Shape, { strokeWidth: 2, stroke: '#666' }),
        $(go.Shape, { toArrow: 'Standard', stroke: '#666', fill: '#666' })
      );

    return diagram;
  };

  const handleModelChange = (e: go.IncrementalData) => {
    const diagram = diagramRef.current?.getDiagram() || null;
    props.onModelChange(e, diagram);
  };

  return (
    <ReactDiagram
      ref={diagramRef}
      divClassName='diagram-component'
      initDiagram={initDiagram}
      nodeDataArray={props.nodeDataArray}
      linkDataArray={props.linkDataArray}
      modelData={props.modelData}
      onModelChange={handleModelChange}
      skipsDiagramUpdate={props.skipsDiagramUpdate}
    />
  );
};

