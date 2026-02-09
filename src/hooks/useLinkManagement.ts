import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';
import type { LinkType } from '../store/diagramSlice';
import { canLinkBeBidirectional, normalizeLinkType } from '../config/diagram-rules';
import { hasDuplicateLink, findReverseLink, createLinkValidation, createRelinkValidation } from '../utils/link-validation';

/**
 * Centralized hook for all link management:
 * 1. Sets up GoJS validation for linking/relinking tools
 * 2. Handles LinkDrawn event to set link category
 * 3. Prevents duplicate links of the same type
 * 4. Automatically converts to bidirectional when reverse link is created
 *    (only for link types that support bidirectional mode)
 */
export function useLinkManagement(
  diagramRef: React.RefObject<ReactDiagram | null>,
  selectedLinkType: LinkType
) {
  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;

    // ========================================================================
    // SETUP: Configure GoJS tools validation
    // ========================================================================
    
    // Update linkingTool validation
    diagram.toolManager.linkingTool.linkValidation = createLinkValidation(selectedLinkType);

    // Update relinkingTool validation
    diagram.toolManager.relinkingTool.linkValidation = createRelinkValidation();

    // ========================================================================
    // EVENT HANDLER: LinkDrawn
    // ========================================================================
    
    const handleLinkDrawn = (e: go.DiagramEvent) => {
      const link = e.subject as go.Link;
      if (!link || !(link instanceof go.Link)) return;

      const model = diagram.model as go.GraphLinksModel;
      if (!(model instanceof go.GraphLinksModel)) return;

      // Step 1: Set link category (type) and initialize properties
      diagram.model.setDataProperty(link.data, 'category', selectedLinkType);
      
      // Initialize bidirectional property if not set (prevents binding errors)
      if (link.data.bidirectional === undefined) {
        diagram.model.setDataProperty(link.data, 'bidirectional', false);
      }
      
      const linkType = normalizeLinkType(link.data.category);
      const fromKey = link.data.from;
      const toKey = link.data.to;
      
      // For links ending on canvas, ensure we have points saved
      if (toKey === undefined && link.points.count > 0) {
        const points = link.points.toArray();
        diagram.model.setDataProperty(link.data, 'points', points);
      }

      // Step 2: Check for duplicate links only if connecting to a node
      // Links to canvas (toKey === undefined) are always allowed
      if (toKey !== undefined && hasDuplicateLink(model, fromKey, toKey, link.data.category, link.data.key)) {
        diagram.startTransaction('remove duplicate');
        model.removeLinkData(link.data);
        diagram.commitTransaction('remove duplicate');
        console.warn(`⚠️ Duplicate link of type '${linkType}' already exists between these nodes`);
        return;
      }
      
      // Step 3: Skip bidirectional logic for links to canvas
      if (toKey === undefined) {
        return;
      }
      
      // Step 4: Check if this link type can be bidirectional
      if (!canLinkBeBidirectional(linkType)) {
        return;
      }

      // Step 5: Check if reverse link of the SAME TYPE exists
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

    // ========================================================================
    // REGISTER EVENT LISTENER
    // ========================================================================
    
    diagram.addDiagramListener('LinkDrawn', handleLinkDrawn);

    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('LinkDrawn', handleLinkDrawn);
      }
    };
  }, [diagramRef, selectedLinkType]);
}

