import * as go from 'gojs';
import { LINK_CONFIGURATIONS } from '../config/diagram-rules';

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
        deletable: true,
        // When clicking on Cloud, select both Cloud and its connected links
        click: (e: go.InputEvent, node: go.GraphObject) => {
          if (!(node instanceof go.Node)) return;
          const diagram = node.diagram;
          if (!diagram) return;
          
          // Collect Cloud node and all its connected links
          const selection = new go.Set<go.Part>();
          selection.add(node);
          
          // Add all links connected to this Cloud node
          node.findLinksConnected().each((link: go.Link) => {
            selection.add(link);
          });
          
          // Select all collected parts (Cloud + its links)
          diagram.selectCollection(selection);
          
          // Prevent default selection behavior
          e.handled = true;
        }
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
 * Create link template map dynamically from configuration
 * All link types are generated from LINK_CONFIGURATIONS - fully dynamic!
 */
export function createLinkTemplateMap(): go.Map<string, go.Link> {
  const $ = go.GraphObject.make;
  const linkTemplateMap = new go.Map<string, go.Link>();

  // Generate template for each configured link type
  LINK_CONFIGURATIONS.forEach(config => {
    const { id, style } = config;
    
    linkTemplateMap.add(id,
      $(go.Link,
        { 
          routing: go.Link.Normal, 
          curve: go.Link.Bezier,
          curviness: 0, // Default to straight line (not NaN which auto-calculates)
          reshapable: true, // Allow user to reshape by dragging handles
          adjusting: go.Link.Scale, // Scale intermediate points when nodes move (better than End)
          toShortLength: style.toShortLength,
          fromShortLength: style.fromShortLength,
          cursor: 'pointer', // Show pointer cursor on hover
        },
        // Save link route points to model (GoJS automatically converts List2 → Array<number>)
        new go.Binding('points').makeTwoWay(),
        new go.Binding('curviness').makeTwoWay(), // Save curviness to model
        new go.Binding('bidirectional').makeTwoWay(), // Save bidirectional state to model
        // Invisible thick shape for larger click area
        $(go.Shape, { isPanelMain: true, stroke: 'transparent', strokeWidth: style.clickAreaWidth }),
        // Visible shape
        $(go.Shape, { isPanelMain: true, strokeWidth: style.strokeWidth, stroke: style.stroke }),
        // From arrow (shown only when bidirectional)
        $(go.Shape, { 
          fromArrow: 'BackwardTriangle', 
          stroke: style.stroke, 
          fill: style.stroke, 
          scale: style.arrowScale,
          strokeWidth: 0, // No outline, just fill
          visible: false 
        },
          new go.Binding('visible', 'bidirectional', (b) => b === true)),
        // To arrow (always shown)
        $(go.Shape, { 
          toArrow: 'Standard', 
          stroke: style.stroke, 
          fill: style.stroke,
          scale: style.arrowScale,
          strokeWidth: 0 // No outline, just fill
        })
      )
    );
  });

  return linkTemplateMap;
}

/**
 * Create default link template (fallback) - uses DEFAULT_LINK_TYPE configuration
 */
export function createDefaultLinkTemplate(): go.Link {
  const $ = go.GraphObject.make;
  
  // Get default configuration
  const defaultConfig = LINK_CONFIGURATIONS.find(c => c.id === 'link');
  const style = defaultConfig?.style || {
    stroke: '#666',
    strokeWidth: 2,
    arrowScale: 1.3,
    clickAreaWidth: 12,
    toShortLength: 4,
    fromShortLength: 4
  };
  
  return $(go.Link,
    { 
      routing: go.Link.Normal, 
      curve: go.Link.Bezier,
      curviness: 0,
      reshapable: true,
      adjusting: go.Link.Scale,
      cursor: 'pointer',
      toShortLength: style.toShortLength,
      fromShortLength: style.fromShortLength,
    },
    new go.Binding('points').makeTwoWay(), // Save link route points
    new go.Binding('curviness').makeTwoWay(),
    new go.Binding('bidirectional').makeTwoWay(),
    // Invisible thick shape for larger click area
    $(go.Shape, { isPanelMain: true, stroke: 'transparent', strokeWidth: style.clickAreaWidth }),
    // Visible shape
    $(go.Shape, { isPanelMain: true, strokeWidth: style.strokeWidth, stroke: style.stroke }),
    // From arrow (shown only when bidirectional)
    $(go.Shape, { 
      fromArrow: 'BackwardTriangle', 
      stroke: style.stroke, 
      fill: style.stroke, 
      scale: style.arrowScale,
      strokeWidth: 0,
      visible: false 
    },
      new go.Binding('visible', 'bidirectional', (b) => b === true)),
    // To arrow (always shown)
    $(go.Shape, { 
      toArrow: 'Standard', 
      stroke: style.stroke, 
      fill: style.stroke,
      scale: style.arrowScale,
      strokeWidth: 0
    })
  );
}

