import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';
import { canLinkBeBidirectional, normalizeLinkType } from '../config/diagram-rules';
import { hasDuplicateLink, findReverseLink } from '../utils/link-validators';

/**
 * Hook to manage link creation rules:
 * 1. Prevents duplicate links of the same type between the same nodes (A->B and A->B)
 * 2. Automatically converts to bidirectional when reverse link of the same type is created
 *    (only for link types that support bidirectional mode in diagram-rules)
 * 3. Allows multiple links of DIFFERENT types between the same nodes (A->B via link AND A->B via flow)
 */
export function useBidirectionalLinks(
  diagramRef: React.RefObject<ReactDiagram | null>
) {
  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;

    const handleLinkDrawn = (e: go.DiagramEvent) => {
      const link = e.subject as go.Link;
      if (!link || !(link instanceof go.Link)) return;

      const model = diagram.model as go.GraphLinksModel;
      if (!(model instanceof go.GraphLinksModel)) return;

      const linkType = normalizeLinkType(link.data.category);
      const fromKey = link.data.from;
      const toKey = link.data.to;

      // ALWAYS check for duplicate link of the same type (A->B and A->B with same category)
      if (hasDuplicateLink(model, fromKey, toKey, link.data.category, link.data.key)) {
        // Remove duplicate link
        diagram.startTransaction('remove duplicate');
        model.removeLinkData(link.data);
        diagram.commitTransaction('remove duplicate');
        console.warn(`⚠️ Duplicate link of type '${linkType}' already exists between these nodes`);
        return;
      }
      
      // Check if this link type can be bidirectional
      if (!canLinkBeBidirectional(linkType)) {
        return; // Allow creating 2 separate links (but no duplicates!)
      }

      // Check if reverse link of the SAME TYPE exists
      const reverseLink = findReverseLink(model, fromKey, toKey, link.data.category, link.data.key);

      if (reverseLink) {
        diagram.startTransaction('convert to bidirectional');
        
        // Remove the newly created link
        model.removeLinkData(link.data);
        
        // Make the existing reverse link bidirectional
        model.setDataProperty(reverseLink, 'bidirectional', true);
        
        diagram.commitTransaction('convert to bidirectional');
      }
    };

    diagram.addDiagramListener('LinkDrawn', handleLinkDrawn);

    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('LinkDrawn', handleLinkDrawn);
      }
    };
  }, [diagramRef]);
}

