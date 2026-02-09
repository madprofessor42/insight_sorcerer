import * as go from 'gojs';

/**
 * Define custom cloud shape for Cloud nodes
 * This creates a cloud-like shape using bezier curves
 * Cloud nodes are automatically created when drawing links to canvas
 */
function defineCloudShape() {
  go.Shape.defineFigureGenerator('FlowCloud', (_shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0.5 * w, 0.2 * h, true); // Start at top center
    
    // Create cloud-like shape with curves
    fig.add(new go.PathSegment(go.PathSegment.Bezier, 0.9 * w, 0.4 * h, 0.8 * w, 0.1 * h, 0.95 * w, 0.3 * h));
    fig.add(new go.PathSegment(go.PathSegment.Bezier, 0.8 * w, 0.8 * h, 1.0 * w, 0.5 * h, 0.95 * w, 0.7 * h));
    fig.add(new go.PathSegment(go.PathSegment.Bezier, 0.3 * w, 0.85 * h, 0.6 * w, 0.9 * h, 0.4 * w, 0.9 * h));
    fig.add(new go.PathSegment(go.PathSegment.Bezier, 0.1 * w, 0.5 * h, 0.15 * w, 0.8 * h, 0.05 * w, 0.65 * h));
    fig.add(new go.PathSegment(go.PathSegment.Bezier, 0.5 * w, 0.2 * h, 0.05 * w, 0.35 * h, 0.2 * w, 0.15 * h));
    
    geo.add(fig);
    geo.spot1 = new go.Spot(0.2, 0.3);
    geo.spot2 = new go.Spot(0.8, 0.7);
    return geo;
  });
}

// Initialize cloud shape definition
defineCloudShape();

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
        locationSpot: go.Spot.Center,
        // Show/hide connection handler on hover
        mouseEnter: (_e: go.InputEvent, thisObj: go.GraphObject) => {
          if (thisObj instanceof go.Node) {
            const port = thisObj.findObject('CENTER_PORT');
            if (port) port.opacity = 1;
          }
        },
        mouseLeave: (_e: go.InputEvent, thisObj: go.GraphObject) => {
          if (thisObj instanceof go.Node) {
            const port = thisObj.findObject('CENTER_PORT');
            if (port) port.opacity = 0;
          }
        }
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
        toLinkable: true,
        opacity: 0 // Invisible by default, shown on hover (but still active for linking!)
      })
    )
  );

  // Variable node template - center circle for interaction, links draw from ellipse edges
  nodeTemplateMap.add('Variable',
    $(go.Node, 'Spot',
      { 
        locationSpot: go.Spot.Center,
        // Show/hide connection handler on hover
        mouseEnter: (_e: go.InputEvent, thisObj: go.GraphObject) => {
          if (thisObj instanceof go.Node) {
            const port = thisObj.findObject('CENTER_PORT');
            if (port) port.opacity = 1;
          }
        },
        mouseLeave: (_e: go.InputEvent, thisObj: go.GraphObject) => {
          if (thisObj instanceof go.Node) {
            const port = thisObj.findObject('CENTER_PORT');
            if (port) port.opacity = 0;
          }
        }
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
        toLinkable: true,
        opacity: 0 // Invisible by default, shown on hover (but still active for linking!)
      })
    )
  );

  // Cloud node template - automatically created when linking to canvas
  // This node CANNOT be created manually through sidebar
  // Cloud nodes don't have UI handlers for creating links, but can be source/target when reversing existing links
  nodeTemplateMap.add('Cloud',
    $(go.Node, 'Spot',
      { 
        locationSpot: go.Spot.Center,
        selectable: true,
        deletable: true
        // No visual linking handlers - links can only be reversed to/from Cloud, not created manually
      },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
      // Cloud shape - outer visual element (can receive connections programmatically)
      $(go.Shape, 'FlowCloud', {
        name: 'OUTER_SHAPE',
        fill: 'white',
        stroke: '#4A90E2',
        strokeWidth: 2,
        width: 80,
        height: 64,
        cursor: 'move',
        portId: 'outer',
        // Can accept connections but not create them
        fromLinkable: false,
        toLinkable: false,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides
      }),
      // Text (optional, can be edited)
      $(go.TextBlock, {
        margin: 8,
        stroke: '#4A90E2',
        font: 'bold 12px sans-serif',
        editable: true,
        text: '' // Empty by default
      }, new go.Binding('text', 'name').makeTwoWay())
      // No CENTER_PORT - Cloud is a passive endpoint
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
      locationSpot: go.Spot.Center,
      // Show/hide connection handler on hover
      mouseEnter: (_e: go.InputEvent, thisObj: go.GraphObject) => {
        if (thisObj instanceof go.Node) {
          const port = thisObj.findObject('CENTER_PORT');
          if (port) port.visible = true;
        }
      },
      mouseLeave: (_e: go.InputEvent, thisObj: go.GraphObject) => {
        if (thisObj instanceof go.Node) {
          const port = thisObj.findObject('CENTER_PORT');
          if (port) port.visible = false;
        }
      }
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
      toLinkable: true,
      visible: false // Hidden by default, shown on hover
    })
  );
}

/**
 * Create link template map with different link types
 */
export function createLinkTemplateMap(): go.Map<string, go.Link> {
  const $ = go.GraphObject.make;
  const linkTemplateMap = new go.Map<string, go.Link>();

  // Regular link template - Bezier curves, reshapable
  linkTemplateMap.add('link',
    $(go.Link,
      { 
        routing: go.Link.Normal, 
        curve: go.Link.Bezier,
        curviness: 0, // Default to straight line (not NaN which auto-calculates)
        reshapable: true, // Allow user to reshape by dragging handles
        adjusting: go.Link.Scale, // Scale intermediate points when nodes move (better than End)
        toShortLength: 4, // Shortens path to prevent interfering with arrowhead
        fromShortLength: 4, // Same for bidirectional arrows
      },
      new go.Binding('points').makeTwoWay(), // Save all route points to model (critical for preserving shape!)
      new go.Binding('curviness').makeTwoWay(), // Save curviness to model
      new go.Binding('bidirectional').makeTwoWay(), // Save bidirectional state to model
      // Invisible thick shape for larger click area
      $(go.Shape, { isPanelMain: true, stroke: 'transparent', strokeWidth: 12 }),
      // Visible shape
      $(go.Shape, { isPanelMain: true, strokeWidth: 2, stroke: '#666' }),
      // From arrow (shown only when bidirectional)
      $(go.Shape, { 
        fromArrow: 'BackwardTriangle', 
        stroke: '#666', 
        fill: '#666', 
        scale: 1.3,
        strokeWidth: 0, // No outline, just fill
        visible: false 
      },
        new go.Binding('visible', 'bidirectional', (b) => b === true)),
      // To arrow (always shown now, as links always connect to nodes)
      $(go.Shape, { 
        toArrow: 'Standard', 
        stroke: '#666', 
        fill: '#666',
        scale: 1.3,
        strokeWidth: 0 // No outline, just fill
      })
    )
  );

  // Flow link template (thicker, blue, Bezier curves, reshapable)
  linkTemplateMap.add('flow',
    $(go.Link,
      { 
        routing: go.Link.Normal, 
        curve: go.Link.Bezier,
        curviness: 0, // Default to straight line (not NaN which auto-calculates)
        reshapable: true, // Allow user to reshape by dragging handles
        adjusting: go.Link.Scale, // Scale intermediate points when nodes move (better than End)
        toShortLength: 8, // Shortens path to prevent interfering with arrowhead
        fromShortLength: 8, // Same for bidirectional arrows
      },
      new go.Binding('points').makeTwoWay(), // Save all route points to model (critical for preserving shape!)
      new go.Binding('curviness').makeTwoWay(), // Save curviness to model
      new go.Binding('bidirectional').makeTwoWay(), // Save bidirectional state to model
      // Invisible thick shape for larger click area
      $(go.Shape, { isPanelMain: true, stroke: 'transparent', strokeWidth: 14 }),
      // Visible shape (thicker blue flow)
      $(go.Shape, { isPanelMain: true, strokeWidth: 6, stroke: '#4A90E2' }),
      // From arrow (shown only when bidirectional)
      $(go.Shape, { 
        fromArrow: 'BackwardTriangle', 
        stroke: '#4A90E2', 
        fill: '#4A90E2', 
        scale: 2.0,
        strokeWidth: 0, // No outline, just fill
        visible: false 
      },
        new go.Binding('visible', 'bidirectional', (b) => b === true)),
      // To arrow (always shown now, as links always connect to nodes)
      $(go.Shape, { 
        toArrow: 'Standard', 
        stroke: '#4A90E2', 
        fill: '#4A90E2', 
        scale: 2.0,
        strokeWidth: 0 // No outline, just fill
      })
    )
  );

  return linkTemplateMap;
}

/**
 * Create default link template (fallback) - Bezier curves, reshapable
 */
export function createDefaultLinkTemplate(): go.Link {
  const $ = go.GraphObject.make;
  
  return $(go.Link,
    { 
      routing: go.Link.Normal, 
      curve: go.Link.Bezier,
      curviness: 0, // Default to straight line (not NaN which auto-calculates)
      reshapable: true, // Allow user to reshape by dragging handles
      adjusting: go.Link.Scale, // Scale intermediate points when nodes move (better than End)
      toShortLength: 4, // Shortens path to prevent interfering with arrowhead
      fromShortLength: 4, // Same for bidirectional arrows
    },
    new go.Binding('points').makeTwoWay(), // Save all route points to model (critical for preserving shape!)
    new go.Binding('curviness').makeTwoWay(), // Save curviness to model
    new go.Binding('bidirectional').makeTwoWay(), // Save bidirectional state to model
    // Invisible thick shape for larger click area
    $(go.Shape, { isPanelMain: true, stroke: 'transparent', strokeWidth: 12 }),
    // Visible shape
    $(go.Shape, { isPanelMain: true, strokeWidth: 2, stroke: '#666' }),
    // From arrow (shown only when bidirectional)
    $(go.Shape, { 
      fromArrow: 'BackwardTriangle', 
      stroke: '#666', 
      fill: '#666', 
      scale: 1.3,
      strokeWidth: 0, // No outline, just fill
      visible: false 
    },
      new go.Binding('visible', 'bidirectional', (b) => b === true)),
    // To arrow (always shown now, as links always connect to nodes)
    $(go.Shape, { 
      toArrow: 'Standard', 
      stroke: '#666', 
      fill: '#666',
      scale: 1.3,
      strokeWidth: 0 // No outline, just fill
    })
  );
}

