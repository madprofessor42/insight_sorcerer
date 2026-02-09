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
 * 
 * @category Tool Extension
 */
export class CustomLinkingTool extends go.LinkingTool {
  /**
   * Constructs a CustomLinkingTool.
   * Use init parameter to configure tool properties like isUnconnectedLinkValid.
   */
  constructor(init?: Partial<CustomLinkingTool>) {
    super();
    this.name = 'CustomLinking';
    if (init) Object.assign(this, init);
  }

  /**
   * Override insertLink to redirect center port connections to outer port.
   * Handles special case when toNode is null (link to canvas).
   */
  public override insertLink(
    fromnode: go.Node,
    fromport: go.GraphObject,
    tonode: go.Node | null,
    toport: go.GraphObject | null
  ): go.Link | null {
    console.log(`🔧 CustomLinkingTool.insertLink: from=${fromnode.data.category}, tonode=${tonode ? tonode.data.category : 'null (canvas)'}`);
    
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

