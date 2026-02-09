import * as go from 'gojs';
import { type RefObject, useEffect } from 'react';
import type { ReactDiagram } from 'gojs-react';

/**
 * Custom LinkingTool that redirects links from center port to outer port
 * Also supports creating links to canvas (toNode: null) for flow links
 */
class CustomLinkingTool extends go.LinkingTool {
  
  /**
   * Override insertLink to redirect center port connections to outer port
   * Handles special case when toNode is null (link to canvas)
   */
  public insertLink(
    fromnode: go.Node,
    fromport: go.GraphObject,
    tonode: go.Node | null,
    toport: go.GraphObject | null
  ): go.Link | null {
    console.log(`🔧 CustomLinkingTool.insertLink: from=${fromnode.data.category}, tonode=${tonode ? tonode.data.category : 'null (canvas)'}`);
    
    // CRITICAL: When toNode is null, GoJS bypasses isValidLink
    // We must manually call validation here for unconnected links
    if (tonode === null && this.linkValidation) {
      console.log(`✅ Validating link to canvas...`);
      const isValid = this.linkValidation(fromnode, fromport, null, null, null);
      console.log(`  Validation result: ${isValid}`);
      if (!isValid) {
        console.log(`❌ Link to canvas blocked by validation`);
        return null; // Block link creation
      }
    }
    
    // Redirect center port to outer port for source
    const actualFromPort = fromport.name === 'CENTER_PORT' 
      ? fromnode.findObject('OUTER_SHAPE') || fromport
      : fromport;
    
    // Handle target port only if toNode exists
    const actualToPort = (tonode && toport && toport.name === 'CENTER_PORT')
      ? tonode.findObject('OUTER_SHAPE') || toport
      : toport;

    // Create link with actual ports (outer shapes)
    // toNode and toPort can be null for links to canvas
    const result = super.insertLink(fromnode, actualFromPort, tonode, actualToPort);
    console.log(`🔗 Link created: ${result ? 'SUCCESS' : 'FAILED'}, toNode: ${tonode ? tonode.data.category : 'null (canvas)'}`);
    return result;
  }
}

/**
 * Custom RelinkingTool that redirects links from center port to outer port
 * Also supports relinking to canvas (newNode: null) for flow links
 */
class CustomRelinkingTool extends go.RelinkingTool {
  /**
   * Override reconnectLink to redirect center port connections to outer port
   * Handles special case when newNode is null (relink to canvas)
   */
  public reconnectLink(
    existingLink: go.Link,
    newnode: go.Node | null,
    newport: go.GraphObject | null,
    toend: boolean
  ): boolean {
    // CRITICAL: When relinking to canvas (newnode is null), GoJS bypasses validation
    // We must manually call validation here for unconnected links
    if (newnode === null && this.linkValidation) {
      // Get the node that stays connected (the other end of the link)
      const stayingNode = toend ? existingLink.fromNode : existingLink.toNode;
      const stayingPort = toend ? existingLink.fromPort : existingLink.toPort;
      
      if (stayingNode && stayingPort) {
        // For relinking, validate in the direction of the relink
        const isValid = toend 
          ? this.linkValidation(stayingNode, stayingPort, null, null, existingLink)
          : this.linkValidation(stayingNode, stayingPort, null, null, existingLink);
        
        if (!isValid) {
          return false; // Block relink
        }
      }
    }
    
    // Redirect center port to outer port if it's a center port
    // Only do this if newnode exists (not relinking to canvas)
    const actualPort = (newport && newport.name === 'CENTER_PORT' && newnode)
      ? newnode.findObject('OUTER_SHAPE') || newport
      : newport;

    return super.reconnectLink(existingLink, newnode, actualPort, toend);
  }
}

/**
 * Hook to setup custom linking tools that connect links to outer shape edges
 * even when clicking on center port circle
 */
export function useCustomLinkingTool(diagramRef: RefObject<ReactDiagram | null>) {
  useEffect(() => {
    const diagram = diagramRef.current?.getDiagram();
    if (!diagram) return;

    // Replace the default tools with our custom ones
    const customLinkingTool = new CustomLinkingTool();
    const customRelinkingTool = new CustomRelinkingTool();
    
    // Enable unconnected links (links ending on canvas)
    customLinkingTool.isUnconnectedLinkValid = true;
    customRelinkingTool.isUnconnectedLinkValid = true;
    
    diagram.toolManager.linkingTool = customLinkingTool;
    diagram.toolManager.relinkingTool = customRelinkingTool;

  }, [diagramRef]);
}

