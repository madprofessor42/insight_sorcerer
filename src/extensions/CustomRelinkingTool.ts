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
 * 
 * @category Tool Extension
 */
export class CustomRelinkingTool extends go.RelinkingTool {
  /**
   * Constructs a CustomRelinkingTool.
   * Use init parameter to configure tool properties like isUnconnectedLinkValid.
   */
  constructor(init?: Partial<CustomRelinkingTool>) {
    super();
    this.name = 'CustomRelinking';
    if (init) Object.assign(this, init);
  }

  /**
   * Override reconnectLink to redirect center port connections to outer port.
   * Handles special case when newNode is null (relink to canvas).
   */
  public override reconnectLink(
    existingLink: go.Link,
    newnode: go.Node | null,
    newport: go.GraphObject | null,
    toend: boolean
  ): boolean {
    // Redirect center port to outer port if it's a center port
    // Only do this if newnode exists (not relinking to canvas)
    const actualPort = (newport && newport.name === 'CENTER_PORT' && newnode)
      ? newnode.findObject('OUTER_SHAPE') || newport
      : newport;

    return super.reconnectLink(existingLink, newnode, actualPort, toend);
  }
}

