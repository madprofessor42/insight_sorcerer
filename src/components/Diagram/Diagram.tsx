import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useEffect, useRef } from 'react';
import type { LinkType } from '../../store/diagramSlice';

interface DiagramProps {
  selectedLinkType: LinkType;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData, diagram: go.Diagram | null) => void;
}

export function Diagram(props: DiagramProps) {
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

  // Update link validation when selectedLinkType changes
  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;

    // Update linkingTool validation
    diagram.toolManager.linkingTool.linkValidation = (fromNode: go.Node | null, _fromPort: go.GraphObject | null, _toNode: go.Node | null, _toPort: go.GraphObject | null) => {
      if (!fromNode) return false;
      
      const linkType = props.selectedLinkType;
      
      // If creating a flow link, validate that source is a Stock node
      if (linkType === 'flow') {
        const fromData = fromNode.data;
        if (fromData.category !== 'Stock') {
          console.warn('⚠️  Flow links can only be created from Stock nodes!');
          return false;
        }
      }
      
      return true;
    };

    // Update relinkingTool validation
    diagram.toolManager.relinkingTool.linkValidation = (fromNode: go.Node | null, _fromPort: go.GraphObject | null, _toNode: go.Node | null, _toPort: go.GraphObject | null, link: go.Link | null) => {
      if (!fromNode || !link) return false;
      
      // If the link is a flow, validate that source is a Stock node
      if (link.data.category === 'flow') {
        const fromData = fromNode.data;
        if (fromData.category !== 'Stock') {
          console.warn('⚠️  Flow links can only originate from Stock nodes!');
          return false;
        }
      }
      
      return true;
    };

    // Create LinkDrawn event handler
    const linkDrawnHandler = (e: go.DiagramEvent) => {
      const link = e.subject;
      if (link instanceof go.Link) {
        const linkType = props.selectedLinkType;
        diagram.model.setDataProperty(link.data, 'category', linkType);
        console.log(`🔗 Link created with type: ${linkType}`);
      }
    };

    // Add LinkDrawn listener
    diagram.addDiagramListener('LinkDrawn', linkDrawnHandler);

    console.log('🔄 Link validation updated for type:', props.selectedLinkType);

    // Cleanup: remove listener when component unmounts or selectedLinkType changes
    return () => {
      diagram.removeDiagramListener('LinkDrawn', linkDrawnHandler);
    };
  }, [props.selectedLinkType]);

  // Setup GoJS External Drag-and-Drop (best practice)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!diagramRef.current) return;
      const diagram = diagramRef.current.getDiagram();
      if (!(diagram instanceof go.Diagram)) return;

      const diagramDiv = diagram.div;
      if (!diagramDiv) return;

      // Use GoJS built-in external drag-and-drop support
      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        const can = e.target as HTMLCanvasElement;
        if (!(can instanceof HTMLCanvasElement)) return;

        // Show feedback by setting dragging cursor
        diagram.currentCursor = 'pointer';
      };

      const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        
        const can = e.target as HTMLCanvasElement;
        if (!(can instanceof HTMLCanvasElement)) return;

        const nodeDataStr = e.dataTransfer?.getData('nodeData');
        if (!nodeDataStr) return;

        const bbox = can.getBoundingClientRect();
        const mx = e.clientX - bbox.left;
        const my = e.clientY - bbox.top;
        const point = diagram.transformViewToDoc(new go.Point(mx, my));

        // BEST PRACTICE: Use GoJS transaction to add node directly to model
        diagram.startTransaction('Add Node from Palette');
        try {
          const nodeData = JSON.parse(nodeDataStr);
          
          // Add node directly to GoJS model (not through React!)
          // GoJS will automatically trigger onModelChange which will sync to Redux
          diagram.model.addNodeData({
            ...nodeData,
            loc: go.Point.stringify(point)
          });
          
          console.log('✅ Node added to GoJS model via transaction');
          diagram.commitTransaction('Add Node from Palette');
        } catch (err) {
          console.error('❌ Error adding node:', err);
          diagram.rollbackTransaction();
        }
      };

      diagramDiv.addEventListener('dragover', handleDragOver);
      diagramDiv.addEventListener('drop', handleDrop);

      return () => {
        diagramDiv.removeEventListener('dragover', handleDragOver);
        diagramDiv.removeEventListener('drop', handleDrop);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []); // No dependencies - static setup

  const initDiagram = (): go.Diagram => {
    const $ = go.GraphObject.make;
    
    const diagram = $(go.Diagram, {
      'undoManager.isEnabled': true,
      'grid.visible': true,
      'grid.gridCellSize': new go.Size(20, 20),
      model: new go.GraphLinksModel({
        linkKeyProperty: 'key',
        nodeCategoryProperty: 'category',
        linkCategoryProperty: 'category',
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

    // Link template map for different link types
    const linkTemplateMap = new go.Map<string, go.Link>();

    // Regular link template
    linkTemplateMap.add('link',
      $(go.Link,
        { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
        $(go.Shape, { strokeWidth: 2, stroke: '#666' }),
        $(go.Shape, { toArrow: 'Standard', stroke: '#666', fill: '#666' })
      )
    );

    // Flow link template (thicker, blue, only from Stock)
    linkTemplateMap.add('flow',
      $(go.Link,
        { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
        $(go.Shape, { strokeWidth: 6, stroke: '#4A90E2' }),
        $(go.Shape, { toArrow: 'Standard', stroke: '#4A90E2', fill: '#4A90E2', scale: 1.5 })
      )
    );

    diagram.linkTemplateMap = linkTemplateMap;

    // Default link template (fallback - same as 'link')
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
      onModelChange={handleModelChange}
      // BEST PRACTICE: Pass empty arrays - GoJS manages its own state
      // We don't update these after initialization
      nodeDataArray={[]}
      linkDataArray={[]}
    />
  );
}

