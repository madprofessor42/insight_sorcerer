/*
 * CustomRelinkingTool - Extension for GoJS RelinkingTool
 * 
 * This is an extension and not part of the main GoJS library.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * 
 * This custom relinking tool redirects links from center port to outer port
 * and supports relinking to canvas (newNode: null) for flow links.
 */

import * as go from 'gojs';

/**
 * Custom RelinkingTool that redirects links from center port to outer port.
 * Also supports relinking to canvas (newNode: null) for flow links.
 * 
 * @category Tool Extension
 */
export class CustomRelinkingTool extends go.RelinkingTool {
  /**
   * Constructs a CustomRelinkingTool and configures it for unconnected links.
   */
  constructor(init?: Partial<CustomRelinkingTool>) {
    super();
    this.name = 'CustomRelinking';
    // Enable unconnected links (links ending on canvas)
    this.isUnconnectedLinkValid = true;
    if (init) Object.assign(this, init);
  }

  /**
   * Override reconnectLink to redirect center port connections to outer port.
   * Handles special case when newNode is null (relink to canvas).
   * 
   * CRITICAL: When relinking to canvas (newnode is null), GoJS bypasses validation.
   * We must manually call validation here for unconnected links.
   */
  public override reconnectLink(
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

