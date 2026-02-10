import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';
import type { LinkType } from '../../config/diagram-rules';
import { normalizeLinkType, LINK_LABEL_CATEGORY, linkTypeNeedsLabelNode } from '../../config/diagram-rules';
import { 
  hasDuplicateLink, 
  findReverseLink, 
  createLinkValidation, 
  createRelinkValidation,
  validateCanEndOnCanvas,
  validateBidirectional
} from '../../utils/link-validation';

/**
 * Centralized hook for all link management:
 * 1. Sets up GoJS validation for linking/relinking tools
 * 2. Sets archetypeLinkData with category for proper link creation
 * 3. Sets archetypeLabelNodeData for edge-to-edge label nodes
 * 4. Handles LinkDrawn event to set link category
 * 5. Prevents duplicate links of the same type
 * 6. Automatically converts to bidirectional when reverse link is created
 *    (only for link types that support bidirectional mode)
 * 7. Automatically deletes Cloud nodes when their connected links are removed
 * 8. Cascade-deletes LinkLabel nodes and their connected links when parent link is removed
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
    // SETUP: Configure GoJS tools validation and archetype data
    // ========================================================================
    
    // Update linkingTool validation
    diagram.toolManager.linkingTool.linkValidation = createLinkValidation(selectedLinkType);

    // Update relinkingTool validation
    diagram.toolManager.relinkingTool.linkValidation = createRelinkValidation();

    // CRITICAL: Set archetypeLinkData with the selected link type's category
    // This is needed so CustomLinkingTool.insertLink() can read the category
    // and decide whether to create a label node for edge-to-edge connections
    diagram.toolManager.linkingTool.archetypeLinkData = { category: selectedLinkType };

    // Set archetypeLabelNodeData based on whether this link type needs label nodes
    // A link needs a label node when OTHER link types reference it in
    // their allowedFromEdges or allowedToEdges (e.g., 'flow' is referenced by 'link')
    if (linkTypeNeedsLabelNode(selectedLinkType)) {
      diagram.toolManager.linkingTool.archetypeLabelNodeData = { category: LINK_LABEL_CATEGORY };
    } else {
      diagram.toolManager.linkingTool.archetypeLabelNodeData = null;
    }

    // ========================================================================
    // EVENT HANDLER: LinkDrawn
    // ========================================================================
    
    const handleLinkDrawn = (e: go.DiagramEvent) => {
      const link = e.subject as go.Link;
      if (!link || !(link instanceof go.Link)) return;

      const model = diagram.model as go.GraphLinksModel;
      if (!(model instanceof go.GraphLinksModel)) return;

      // Step 1: Set link category (type) and initialize properties
      // Note: category may already be set from archetypeLinkData, but ensure it's correct
      diagram.model.setDataProperty(link.data, 'category', selectedLinkType);
      
      // Initialize bidirectional property if not set (prevents binding errors)
      if (link.data.bidirectional === undefined) {
        diagram.model.setDataProperty(link.data, 'bidirectional', false);
      }
      
      const linkType = normalizeLinkType(link.data.category);
      const fromKey = link.data.from;
      const toKey = link.data.to;
      
      console.log(`🔗 LinkDrawn: type=${linkType}, from=${fromKey}, to=${toKey}, points=${link.points.count}`);
      
      // Step 1.5: If link ends on canvas, validate and create a Cloud node at endpoint
      if (toKey === undefined) {
        // Get fromNode data for validation
        const fromNodeData = model.findNodeDataForKey(fromKey);
        if (!fromNodeData) {
          console.warn(`⚠️ Source node not found - removing link`);
          model.removeLinkData(link.data);
          return;
        }
        
        // Validate if this link can end on canvas
        // validateCanEndOnCanvas handles ALL cases including LinkLabel rejection
        const canvasValidation = validateCanEndOnCanvas(linkType, fromNodeData.category);
        if (!canvasValidation.isValid) {
          console.warn(`⚠️ ${canvasValidation.reason} - removing link`);
          model.removeLinkData(link.data);
          return;
        }
        
        // Get endpoint coordinates from diagram.lastInput (where user released mouse)
        // We can't use link.points because GoJS doesn't store points for unconnected links
        const endPoint = diagram.lastInput.documentPoint.copy();
        
        console.log(`🌥️  Creating Cloud node at endpoint (${endPoint.x.toFixed(0)}, ${endPoint.y.toFixed(0)})`);
        
        // NOTE: LinkDrawn event is already called within a GoJS transaction,
        // so we don't need to start a new one - just modify the model directly
        
        // Add Cloud node to model (GoJS will auto-generate unique key)
        const cloudNodeData = {
          category: 'Cloud',
          name: '', // Empty name by default
          loc: go.Point.stringify(endPoint) // Position at link endpoint
        };
        
        model.addNodeData(cloudNodeData);
        
        // Get the auto-generated key from the newly created node
        const cloudKey = model.getKeyForNodeData(cloudNodeData);
        
        // Update link to connect to the new Cloud node
        diagram.model.setDataProperty(link.data, 'to', cloudKey);
        
        console.log(`✅ Created Cloud node with auto-generated key '${cloudKey}' and connected link`);
        
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
      
      // Step 4: Check if this specific link can be physically bidirectional
      const bidirectionalValidation = validateBidirectional(model, fromKey, actualToKey, link.data.category);
      if (!bidirectionalValidation.isValid) {
        console.log(`ℹ️  ${bidirectionalValidation.reason} - keeping as separate links`);
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
    // EVENT HANDLER: SelectionDeleted
    // ========================================================================
    
    const handleSelectionDeleted = (e: go.DiagramEvent) => {
      const deletedParts = e.subject as go.Set<go.Part>;
      if (!deletedParts || !(deletedParts instanceof go.Set)) return;

      const model = diagram.model as go.GraphLinksModel;
      if (!(model instanceof go.GraphLinksModel)) return;

      // Collect Cloud nodes that were explicitly deleted by user
      const explicitlyDeletedCloudKeys = new Set<go.Key>();
      
      // Collect Cloud nodes that might need to be auto-deleted
      const cloudNodesToCheck = new Set<go.Key>();
      
      // Collect LinkLabel node keys whose parent link was deleted
      // These MUST be cascade-deleted along with any links connected to them
      const labelNodeKeysToDelete = new Set<go.Key>();

      // First pass: identify what was deleted
      deletedParts.each((part) => {
        if (part instanceof go.Node && part.data.category === 'Cloud') {
          // Cloud node was explicitly selected and deleted by user
          explicitlyDeletedCloudKeys.add(part.data.key);
          console.log(`🌥️🗑️  Cloud node '${part.data.key}' explicitly deleted by user`);
        } else if (part instanceof go.Link) {
          const link = part as go.Link;
          const fromKey = link.data.from;
          const toKey = link.data.to;

          console.log(`🗑️  Link deleted: from=${fromKey}, to=${toKey}`);

          // Check if fromNode is a Cloud (and wasn't explicitly deleted)
          const fromNodeData = model.findNodeDataForKey(fromKey);
          if (fromNodeData && fromNodeData.category === 'Cloud' && !explicitlyDeletedCloudKeys.has(fromKey)) {
            cloudNodesToCheck.add(fromKey);
          }

          // Check if toNode is a Cloud (and wasn't explicitly deleted)
          const toNodeData = model.findNodeDataForKey(toKey);
          if (toNodeData && toNodeData.category === 'Cloud' && !explicitlyDeletedCloudKeys.has(toKey)) {
            cloudNodesToCheck.add(toKey);
          }
          
          // Collect LinkLabel nodes associated with this deleted link
          // These MUST be deleted (cascade) since their parent link is gone
          const labelKeys = link.data.labelKeys;
          if (Array.isArray(labelKeys)) {
            labelKeys.forEach((labelKey: go.Key) => {
              labelNodeKeysToDelete.add(labelKey);
            });
          }
        }
      });

      // Second pass: auto-delete orphaned Cloud nodes
      cloudNodesToCheck.forEach((cloudKey) => {
        const cloudNode = diagram.findNodeForKey(cloudKey);
        if (!cloudNode) return;

        // Count remaining links connected to this Cloud
        const connectedLinks = cloudNode.findLinksConnected();
        const linkCount = connectedLinks.count;

        if (linkCount === 0) {
          console.log(`🌥️💨 Auto-deleting orphaned Cloud node '${cloudKey}' (no remaining links)`);
          const nodeData = model.findNodeDataForKey(cloudKey);
          if (nodeData) {
            model.removeNodeData(nodeData);
            console.log(`✅ Orphaned Cloud node '${cloudKey}' removed`);
          }
        } else {
          console.log(`ℹ️  Cloud node '${cloudKey}' kept (${linkCount} link(s) remaining)`);
        }
      });
      
      // Third pass: cascade-delete LinkLabel nodes and their connected links
      // When a parent link is deleted, its label nodes MUST be removed.
      // Any links connected to these label nodes (edge-to-edge links) must also be removed.
      labelNodeKeysToDelete.forEach((labelKey) => {
        const labelNode = diagram.findNodeForKey(labelKey);
        if (!labelNode) return; // Already deleted
        
        console.log(`🏷️💨 Cascade-deleting LinkLabel node '${labelKey}' (parent link deleted)`);
        
        // First, remove all links connected to this label node
        // (these are edge-to-edge links that used this label as a port)
        const connectedLinks = labelNode.findLinksConnected();
        const linksToRemove: go.ObjectData[] = [];
        connectedLinks.each((connLink: go.Link) => {
          linksToRemove.push(connLink.data);
        });
        
        linksToRemove.forEach((linkData) => {
          console.log(`  🔗💨 Removing connected edge-to-edge link '${linkData.key}'`);
          model.removeLinkData(linkData);
        });
        
        // Then remove the label node itself
        const nodeData = model.findNodeDataForKey(labelKey);
        if (nodeData) {
          model.removeNodeData(nodeData);
          console.log(`✅ LinkLabel node '${labelKey}' and ${linksToRemove.length} connected link(s) removed`);
        }
      });
    };

    // ========================================================================
    // REGISTER EVENT LISTENERS
    // ========================================================================
    
    diagram.addDiagramListener('LinkDrawn', handleLinkDrawn);
    diagram.addDiagramListener('SelectionDeleted', handleSelectionDeleted);

    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('LinkDrawn', handleLinkDrawn);
        diagram.removeDiagramListener('SelectionDeleted', handleSelectionDeleted);
      }
    };
  }, [diagramRef, selectedLinkType]);
}
