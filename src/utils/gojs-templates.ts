import * as go from 'gojs';

/**
 * Create node template map with different node types
 */
export function createNodeTemplateMap(): go.Map<string, go.Node> {
  const $ = go.GraphObject.make;
  const nodeTemplateMap = new go.Map<string, go.Node>();

  // Stock node template - center circle for interaction, links draw from rectangle edges
  nodeTemplateMap.add('Stock', 
    $(go.Node, 'Spot',
      { 
        locationSpot: go.Spot.Center
      },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
      // Outer shape - for dragging and visual bounds (named for custom linking tool)
      $(go.Shape, 'Rectangle', {
        name: 'OUTER_SHAPE',
        fill: '#4A90E2',
        stroke: '#2E5C8A',
        strokeWidth: 2,
        width: 120,
        height: 60,
        cursor: 'move',
        portId: 'outer',
        // NO fromLinkable/toLinkable - this is for dragging only
        // Links will be redirected here by CustomLinkingTool
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides
      }),
      // Text
      $(go.TextBlock, {
        margin: 8,
        stroke: 'white',
        font: 'bold 14px sans-serif',
        editable: true
      }, new go.Binding('text', 'name').makeTwoWay()),
      // Center circle - clickable port that delegates to outer shape
      $(go.Shape, 'Circle', {
        name: 'CENTER_PORT',
        alignment: go.Spot.Center,
        width: 20,
        height: 20,
        fill: '#2E5C8A',
        stroke: '#1E3C5A',
        strokeWidth: 2,
        cursor: 'pointer',
        portId: 'center',
        fromLinkable: true,
        toLinkable: true
      })
    )
  );

  // Variable node template - center circle for interaction, links draw from ellipse edges
  nodeTemplateMap.add('Variable',
    $(go.Node, 'Spot',
      { 
        locationSpot: go.Spot.Center
      },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
      // Outer shape - for dragging and visual bounds (named for custom linking tool)
      $(go.Shape, 'Ellipse', {
        name: 'OUTER_SHAPE',
        fill: '#50C878',
        stroke: '#2E7D4E',
        strokeWidth: 2,
        width: 100,
        height: 100,
        cursor: 'move',
        portId: 'outer',
        // NO fromLinkable/toLinkable - this is for dragging only
        // Links will be redirected here by CustomLinkingTool
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides
      }),
      // Text
      $(go.TextBlock, {
        margin: 8,
        stroke: 'white',
        font: 'bold 14px sans-serif',
        editable: true
      }, new go.Binding('text', 'name').makeTwoWay()),
      // Center circle - clickable port that delegates to outer shape
      $(go.Shape, 'Circle', {
        name: 'CENTER_PORT',
        alignment: go.Spot.Center,
        width: 20,
        height: 20,
        fill: '#2E7D4E',
        stroke: '#1E5D3E',
        strokeWidth: 2,
        cursor: 'pointer',
        portId: 'center',
        fromLinkable: true,
        toLinkable: true
      })
    )
  );

  return nodeTemplateMap;
}

/**
 * Create default node template (fallback) - center circle for interaction, links draw from shape edges
 */
export function createDefaultNodeTemplate(): go.Node {
  const $ = go.GraphObject.make;
  
  return $(go.Node, 'Spot',
    { 
      locationSpot: go.Spot.Center
    },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    // Outer shape - for dragging and visual bounds (named for custom linking tool)
    $(go.Shape, 'RoundedRectangle', {
      name: 'OUTER_SHAPE',
      fill: '#999',
      stroke: '#666',
      strokeWidth: 2,
      width: 100,
      height: 60,
      cursor: 'move',
      portId: 'outer',
      // NO fromLinkable/toLinkable - this is for dragging only
      // Links will be redirected here by CustomLinkingTool
      fromSpot: go.Spot.AllSides,
      toSpot: go.Spot.AllSides
    }),
    // Text
    $(go.TextBlock, {
      margin: 8,
      stroke: 'white',
      font: 'bold 14px sans-serif',
      editable: true
    }, new go.Binding('text', 'name').makeTwoWay()),
    // Center circle - clickable port that delegates to outer shape
    $(go.Shape, 'Circle', {
      name: 'CENTER_PORT',
      alignment: go.Spot.Center,
      width: 20,
      height: 20,
      fill: '#666',
      stroke: '#444',
      strokeWidth: 2,
      cursor: 'pointer',
      portId: 'center',
      fromLinkable: true,
      toLinkable: true
    })
  );
}

/**
 * Create link template map with different link types
 */
export function createLinkTemplateMap(): go.Map<string, go.Link> {
  const $ = go.GraphObject.make;
  const linkTemplateMap = new go.Map<string, go.Link>();

  // Regular link template
  linkTemplateMap.add('link',
    $(go.Link,
      { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
      $(go.Shape, { strokeWidth: 2, stroke: '#666' }),
      $(go.Shape, { toArrow: 'Standard', stroke: '#666', fill: '#666' })
    )
  );

  // Flow link template (thicker, blue, only from Stock)
  linkTemplateMap.add('flow',
    $(go.Link,
      { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
      $(go.Shape, { strokeWidth: 6, stroke: '#4A90E2' }),
      $(go.Shape, { toArrow: 'Standard', stroke: '#4A90E2', fill: '#4A90E2', scale: 1.5 })
    )
  );

  return linkTemplateMap;
}

/**
 * Create default link template (fallback)
 */
export function createDefaultLinkTemplate(): go.Link {
  const $ = go.GraphObject.make;
  
  return $(go.Link,
    { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
    $(go.Shape, { strokeWidth: 2, stroke: '#666' }),
    $(go.Shape, { toArrow: 'Standard', stroke: '#666', fill: '#666' })
  );
}

