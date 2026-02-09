import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';

/**
 * Setup drag-and-drop handlers for the diagram
 */
function setupDragDropHandlers(diagram: go.Diagram, diagramDiv: HTMLDivElement) {
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
}

/**
 * Hook to setup GoJS External Drag-and-Drop
 */
export function useDiagramDragDrop(diagramRef: React.RefObject<ReactDiagram | null>) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!diagramRef.current) return;
      const diagram = diagramRef.current.getDiagram();
      if (!(diagram instanceof go.Diagram)) return;

      const diagramDiv = diagram.div;
      if (!diagramDiv) return;

      return setupDragDropHandlers(diagram, diagramDiv);
    }, 100);

    return () => clearTimeout(timer);
  }, [diagramRef]); // No dependencies - static setup
}

