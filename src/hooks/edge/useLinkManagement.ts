import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';
import type { LinkType } from '../../config/diagram-rules';
import { canLinkBeBidirectional, canLinkEndOnCanvas, normalizeLinkType, isValidLinkTarget } from '../../config/diagram-rules';
import { hasDuplicateLink, findReverseLink, createLinkValidation, createRelinkValidation } from '../../utils/link-validation';

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
      
      console.log(`🔗 LinkDrawn: type=${linkType}, from=${fromKey}, to=${toKey}, points=${link.points.count}`);
      
      // Step 1.5: If link ends on canvas, create a Cloud node at endpoint
      // Only for link types that allow ending on canvas AND connecting to Cloud nodes
      if (toKey === undefined && canLinkEndOnCanvas(linkType)) {
        // CRITICAL: Check if this link type can connect to Cloud nodes
        // If not, the link should not be created at all
        if (!isValidLinkTarget(linkType, 'Cloud')) {
          console.warn(`⚠️ Links of type '${linkType}' cannot connect to Cloud nodes - removing link`);
          // Remove the link since it cannot connect to Cloud
          model.removeLinkData(link.data);
          return;
        }
        
        // Get endpoint coordinates from diagram.lastInput (where user released mouse)
        // We can't use link.points because GoJS doesn't store points for unconnected links
        const endPoint = diagram.lastInput.documentPoint.copy();
        
        console.log(`🌥️  Creating Cloud node at endpoint (${endPoint.x.toFixed(0)}, ${endPoint.y.toFixed(0)})`);
        
        // Generate unique key for the new Cloud node
        const cloudKey = `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // NOTE: LinkDrawn event is already called within a GoJS transaction,
        // so we don't need to start a new one - just modify the model directly
        
        // Add Cloud node to model
        model.addNodeData({
          key: cloudKey,
          category: 'Cloud',
          name: '', // Empty name by default
          loc: go.Point.stringify(endPoint) // Position at link endpoint
        });
        
        // Update link to connect to the new Cloud node
        diagram.model.setDataProperty(link.data, 'to', cloudKey);
        
        console.log(`✅ Created Cloud node '${cloudKey}' and connected link`);
        
        // Continue with normal link processing
        // (duplicate check, bidirectional logic will now apply)
      }

      // Step 2: Get the actual toKey (might have been updated after Cloud creation)
      const actualToKey = link.data.to;
      
      // Step 3: Check for duplicate links
      if (hasDuplicateLink(model, fromKey, actualToKey, link.data.category, link.data.key)) {
        diagram.startTransaction('remove duplicate');
        model.removeLinkData(link.data);
        diagram.commitTransaction('remove duplicate');
        console.warn(`⚠️ Duplicate link of type '${linkType}' already exists between these nodes`);
        return;
      }
      
      // Step 4: Check if this link type can be bidirectional
      if (!canLinkBeBidirectional(linkType)) {
        return;
      }

      // Step 5: Check if reverse link of the SAME TYPE exists
      const reverseLink = findReverseLink(model, fromKey, actualToKey, link.data.category, link.data.key);

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

