/*
 * CustomLinkingTool - Extension for GoJS LinkingTool
 * 
 * This is an extension and not part of the main GoJS library.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * 
 * This custom linking tool redirects links from center port to outer port
 * and supports creating links to canvas (toNode: null) for flow links.
 */

import * as go from 'gojs';

/**
 * Custom LinkingTool that redirects links from center port to outer port.
 * Also supports creating links to canvas (toNode: null) for flow links.
 * 
 * @category Tool Extension
 */
export class CustomLinkingTool extends go.LinkingTool {
  /**
   * Constructs a CustomLinkingTool and configures it for unconnected links.
   */
  constructor(init?: Partial<CustomLinkingTool>) {
    super();
    this.name = 'CustomLinking';
    // Enable unconnected links (links ending on canvas)
    this.isUnconnectedLinkValid = true;
    if (init) Object.assign(this, init);
  }

  /**
   * Override insertLink to redirect center port connections to outer port.
   * Handles special case when toNode is null (link to canvas).
   * 
   * CRITICAL: When toNode is null, GoJS bypasses isValidLink.
   * We must manually call validation here for unconnected links.
   */
  public override insertLink(
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

