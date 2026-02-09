import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';
import type { LinkType } from '../store/diagramSlice';
import { createLinkValidation, createRelinkValidation } from '../utils/gojs-validation';

/**
 * Hook to manage link type validation and LinkDrawn events
 */
export function useLinkTypeValidation(
  diagramRef: React.RefObject<ReactDiagram | null>,
  selectedLinkType: LinkType
) {
  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;

    // Update linkingTool validation
    diagram.toolManager.linkingTool.linkValidation = createLinkValidation(selectedLinkType);

    // Update relinkingTool validation
    diagram.toolManager.relinkingTool.linkValidation = createRelinkValidation();

    // Create LinkDrawn event handler
    const linkDrawnHandler = (e: go.DiagramEvent) => {
      const link = e.subject;
      if (link instanceof go.Link) {
        diagram.model.setDataProperty(link.data, 'category', selectedLinkType);
        console.log(`🔗 Link created with type: ${selectedLinkType}`);
      }
    };

    // Add LinkDrawn listener
    diagram.addDiagramListener('LinkDrawn', linkDrawnHandler);

    console.log('🔄 Link validation updated for type:', selectedLinkType);

    // Cleanup: remove listener when component unmounts or selectedLinkType changes
    return () => {
      diagram.removeDiagramListener('LinkDrawn', linkDrawnHandler);
    };
  }, [diagramRef, selectedLinkType]);
}

