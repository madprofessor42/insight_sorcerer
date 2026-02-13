import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import type { LinkType } from '../../config';
import { initializeDiagram } from '../../utils/gojs-config';
import { useDiagramEvents } from '../../hooks/diagram/useDiagramEvents';
import { useLinkManagement } from '../../hooks/edge/useLinkManagement';
import { useDiagramDragDrop } from '../../hooks/diagram/useDiagramDragDrop';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setSkips, clearSelectedNode, clearSelectedEdge } from '../../store/diagramSlice';

interface DiagramProps {
  selectedLinkType: LinkType;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData, diagram: go.Diagram | null) => void;
}

export interface DiagramHandle {
  getDiagram: () => go.Diagram | null;
}

export const Diagram = forwardRef<DiagramHandle, DiagramProps>((props, ref) => {
  const diagramRef = useRef<ReactDiagram>(null);
  const dispatch = useAppDispatch();
  
  // Expose getDiagram method to parent components
  useImperativeHandle(ref, () => ({
    getDiagram: () => diagramRef.current?.getDiagram() || null,
  }));
  
  // Get diagram data from Redux (GoJS best practice: pass data to ReactDiagram)
  const { 
    nodeDataArray, 
    linkDataArray, 
    modelData, 
    skipsDiagramUpdate,
    selectedNodeKey,
    selectedEdgeKey
  } = useAppSelector((state) => state.diagram);

  // Reset skipsDiagramUpdate after ReactDiagram processes the update
  // This ensures the flag is only true during the render cycle to prevent circular updates
  useEffect(() => {
    if (skipsDiagramUpdate) {
      // Use requestAnimationFrame to ensure ReactDiagram has processed the update
      // This delays the reset until after the browser has painted
      const rafId = requestAnimationFrame(() => {
        dispatch(setSkips(false));
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [skipsDiagramUpdate, dispatch]);

  // Validate selection state - clear if selected element no longer exists
  // This prevents stale selection references after nodes/edges are modified or removed
  useEffect(() => {
    if (selectedNodeKey !== null) {
      const nodeExists = nodeDataArray.some(node => node.key === selectedNodeKey);
      if (!nodeExists) {
        dispatch(clearSelectedNode());
      }
    }
  }, [selectedNodeKey, nodeDataArray, dispatch]);

  useEffect(() => {
    if (selectedEdgeKey !== null) {
      const edgeExists = linkDataArray.some(link => link.key === selectedEdgeKey);
      if (!edgeExists) {
        dispatch(clearSelectedEdge());
      }
    }
  }, [selectedEdgeKey, linkDataArray, dispatch]);

  // Setup diagram event listeners
  useDiagramEvents(diagramRef, props.onDiagramEvent);

  // Setup centralized link management (validation, duplicates, bidirectional)
  // Custom linking tools are initialized in gojs-config.ts
  useLinkManagement(diagramRef, props.selectedLinkType);

  // Setup drag-and-drop
  useDiagramDragDrop(diagramRef);

  const handleModelChange = (e: go.IncrementalData) => {
    const diagram = diagramRef.current?.getDiagram() || null;
    props.onModelChange(e, diagram);
  };

  return (
    <ReactDiagram
      ref={diagramRef}
      divClassName='diagram-component'
      initDiagram={initializeDiagram}
      onModelChange={handleModelChange}
      // CRITICAL: Pass data from Redux (GoJS best practice for two-way sync)
      nodeDataArray={nodeDataArray}
      linkDataArray={linkDataArray}
      modelData={modelData}
      // CRITICAL: Skip diagram updates when changes come FROM GoJS
      // This prevents circular updates
      skipsDiagramUpdate={skipsDiagramUpdate}
    />
  );
});

Diagram.displayName = 'Diagram';
