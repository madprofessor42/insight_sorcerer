import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useRef } from 'react';
import type { LinkType } from '../../config/diagram-rules';
import { initializeDiagram } from '../../utils/gojs-config';
import { useDiagramEvents } from '../../hooks/diagram/useDiagramEvents';
import { useLinkManagement } from '../../hooks/edge/useLinkManagement';
import { useDiagramDragDrop } from '../../hooks/diagram/useDiagramDragDrop';
import { useCustomLinkingTool } from '../../hooks/tools/useCustomLinkingTool';

interface DiagramProps {
  selectedLinkType: LinkType;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData, diagram: go.Diagram | null) => void;
}

export function Diagram(props: DiagramProps) {
  const diagramRef = useRef<ReactDiagram>(null);

  // Setup custom linking tool FIRST (before validation is set)
  // This must be before useLinkManagement to avoid overwriting validation
  useCustomLinkingTool(diagramRef);

  // Setup diagram event listeners
  useDiagramEvents(diagramRef, props.onDiagramEvent);

  // Setup centralized link management (validation, duplicates, bidirectional)
  // This must be AFTER useCustomLinkingTool to set validation on the custom tool
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
      // BEST PRACTICE: Pass empty arrays - GoJS manages its own state
      // We don't update these after initialization
      nodeDataArray={[]}
      linkDataArray={[]}
    />
  );
}
