import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import type { LinkType } from '../../config';
import { initializeDiagram } from '../../utils/gojs-config';
import { useDiagramEvents } from '../../hooks/diagram/useDiagramEvents';
import { useLinkManagement } from '../../hooks/edge/useLinkManagement';
import { useDiagramDragDrop } from '../../hooks/diagram/useDiagramDragDrop';
import { useAppSelector } from '../../store/hooks';

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
  
  // Expose getDiagram method to parent components
  useImperativeHandle(ref, () => ({
    getDiagram: () => diagramRef.current?.getDiagram() || null,
  }));
  
  // Get diagram data from Redux (GoJS best practice: pass data to ReactDiagram)
  const { nodeDataArray, linkDataArray, modelData, skipsDiagramUpdate } = useAppSelector(
    (state) => state.diagram
  );

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
