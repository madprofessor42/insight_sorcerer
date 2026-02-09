import * as go from 'gojs';
import { type RefObject, useEffect } from 'react';
import type { ReactDiagram } from 'gojs-react';

/**
 * Custom LinkingTool that redirects links from center port to outer port
 */
class CustomLinkingTool extends go.LinkingTool {
  /**
   * Override insertLink to redirect center port connections to outer port
   */
  public insertLink(
    fromnode: go.Node,
    fromport: go.GraphObject,
    tonode: go.Node,
    toport: go.GraphObject
  ): go.Link | null {
    // Redirect center port to outer port
    const actualFromPort = fromport.name === 'CENTER_PORT' 
      ? fromnode.findObject('OUTER_SHAPE') || fromport
      : fromport;
    
    const actualToPort = toport.name === 'CENTER_PORT'
      ? tonode.findObject('OUTER_SHAPE') || toport
      : toport;

    // Create link with actual ports (outer shapes)
    return super.insertLink(fromnode, actualFromPort, tonode, actualToPort);
  }
}

/**
 * Custom RelinkingTool that redirects links from center port to outer port
 */
class CustomRelinkingTool extends go.RelinkingTool {
  /**
   * Override reconnectLink to redirect center port connections to outer port
   */
  public reconnectLink(
    existingLink: go.Link,
    newnode: go.Node | null,
    newport: go.GraphObject | null,
    toend: boolean
  ): boolean {
    // Redirect center port to outer port if it's a center port
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
    diagram.toolManager.linkingTool = new CustomLinkingTool();
    diagram.toolManager.relinkingTool = new CustomRelinkingTool();

  }, [diagramRef]);
}

