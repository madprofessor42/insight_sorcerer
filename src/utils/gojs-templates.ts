import * as go from 'gojs';

/**
 * Create node template map with different node types
 */
export function createNodeTemplateMap(): go.Map<string, go.Node> {
  const $ = go.GraphObject.make;
  const nodeTemplateMap = new go.Map<string, go.Node>();

  // Stock node template
  nodeTemplateMap.add('Stock', 
    $(go.Node, 'Auto',
      { locationSpot: go.Spot.Center },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Shape, 'Rectangle', {
        fill: '#4A90E2',
        stroke: '#2E5C8A',
        strokeWidth: 2,
        width: 120,
        height: 60,
        portId: '',
        fromLinkable: true,
        toLinkable: true,
        cursor: 'pointer'
      }),
      $(go.TextBlock, {
        margin: 8,
        stroke: 'white',
        font: 'bold 14px sans-serif',
        editable: true
      }, new go.Binding('text', 'name').makeTwoWay())
    )
  );

  // Variable node template
  nodeTemplateMap.add('Variable',
    $(go.Node, 'Auto',
      { locationSpot: go.Spot.Center },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Shape, 'Ellipse', {
        fill: '#50C878',
        stroke: '#2E7D4E',
        strokeWidth: 2,
        width: 100,
        height: 100,
        portId: '',
        fromLinkable: true,
        toLinkable: true,
        cursor: 'pointer'
      }),
      $(go.TextBlock, {
        margin: 8,
        stroke: 'white',
        font: 'bold 14px sans-serif',
        editable: true
      }, new go.Binding('text', 'name').makeTwoWay())
    )
  );

  return nodeTemplateMap;
}

/**
 * Create default node template (fallback)
 */
export function createDefaultNodeTemplate(): go.Node {
  const $ = go.GraphObject.make;
  
  return $(go.Node, 'Auto',
    { locationSpot: go.Spot.Center },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    $(go.Shape, 'RoundedRectangle', {
      fill: '#999',
      stroke: '#666',
      strokeWidth: 2,
      width: 100,
      height: 60,
      portId: '',
      fromLinkable: true,
      toLinkable: true,
      cursor: 'pointer'
    }),
    $(go.TextBlock, {
      margin: 8,
      stroke: 'white',
      font: 'bold 14px sans-serif',
      editable: true
    }, new go.Binding('text', 'name').makeTwoWay())
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

