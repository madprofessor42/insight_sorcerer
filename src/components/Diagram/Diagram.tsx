import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useRef } from 'react';
import type { LinkType } from '../../store/diagramSlice';
import { initializeDiagram } from '../../utils/gojs-config';
import { useDiagramEvents } from '../../hooks/useDiagramEvents';
import { useLinkTypeValidation } from '../../hooks/useLinkTypeValidation';
import { useDiagramDragDrop } from '../../hooks/useDiagramDragDrop';
import { useCustomLinkingTool } from '../../hooks/useCustomLinkingTool';
import { useBidirectionalLinks } from '../../hooks/useBidirectionalLinks';

interface DiagramProps {
  selectedLinkType: LinkType;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData, diagram: go.Diagram | null) => void;
}

export function Diagram(props: DiagramProps) {
  const diagramRef = useRef<ReactDiagram>(null);

  // Setup diagram event listeners
  useDiagramEvents(diagramRef, props.onDiagramEvent);

  // Setup link type validation
  useLinkTypeValidation(diagramRef, props.selectedLinkType);

  // Setup drag-and-drop
  useDiagramDragDrop(diagramRef);

  // Setup custom linking tool for center port to edge linking
  useCustomLinkingTool(diagramRef);

  // Setup automatic bidirectional link conversion
  useBidirectionalLinks(diagramRef);

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
      // BEST PRACTICE: Pass empty arrays - GoJS manages its own state
      // We don't update these after initialization
      nodeDataArray={[]}
      linkDataArray={[]}
    />
  );
}
