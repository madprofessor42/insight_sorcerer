import * as go from 'gojs';
import { 
  LINK_CONFIGURATIONS, 
  NODE_CONFIGURATIONS,
  LINK_LABEL_CATEGORY,
  type LinkConfiguration,
  type NodeConfiguration
} from '../config';

/**
 * Helper function to create tooltip Adornment for nodes
 * Generates tooltip from displayProperties configuration where showAsTooltip is true
 * @param config - Node configuration containing displayProperties
 * @returns Tooltip Adornment or null if no tooltip properties defined
 */
function createNodeTooltip(config: NodeConfiguration): go.Adornment | null {
  // Filter properties that should be shown as tooltips
  const tooltipProperties = config.displayProperties.filter(prop => prop.showAsTooltip);
  
  // No tooltip if no properties configured
  if (tooltipProperties.length === 0) {
    return null;
  }
  
  // Create tooltip with vertical layout for multiple properties (using modern GoJS 2.2+ syntax)
  const panel = new go.Panel('Vertical');
  
  tooltipProperties.forEach(prop => {
    panel.add(
      new go.TextBlock({
        margin: 4,
        font: '12px sans-serif'
      }).bind('text', prop.dataKey, (value) => {
        const displayValue = value || prop.defaultValue || '';
        return prop.label ? `${prop.label}: ${displayValue}` : displayValue;
      })
    );
  });
  
  return new go.Adornment('Auto')
    .add(new go.Shape({ fill: '#FFFFCC' }))
    .add(panel);
}

/**
 * Helper function to create tooltip Adornment for links
 * Generates tooltip from displayProperties configuration where showAsTooltip is true
 * @param config - Link configuration containing displayProperties
 * @returns Tooltip Adornment or null if no tooltip properties defined
 */
function createLinkTooltip(config: LinkConfiguration): go.Adornment | null {
  // Filter properties that should be shown as tooltips
  const tooltipProperties = config.displayProperties.filter(prop => prop.showAsTooltip);
  
  // No tooltip if no properties configured
  if (tooltipProperties.length === 0) {
    return null;
  }
  
  // Create tooltip with vertical layout for multiple properties (using modern GoJS 2.2+ syntax)
  const panel = new go.Panel('Vertical');
  
  tooltipProperties.forEach(prop => {
    panel.add(
      new go.TextBlock({
        margin: 4,
        font: '12px sans-serif'
      }).bind('text', prop.dataKey, (value) => {
        const displayValue = value || prop.defaultValue || '';
        return prop.label ? `${prop.label}: ${displayValue}` : displayValue;
      })
    );
  });
  
  return new go.Adornment('Auto')
    .add(new go.Shape({ fill: '#FFFFCC' }))
    .add(panel);
}

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
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.9 * w, 0.4 * h, 0.8 * w, 0.1 * h, 0.95 * w, 0.3 * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.8 * h, 1.0 * w, 0.5 * h, 0.95 * w, 0.7 * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.3 * w, 0.85 * h, 0.6 * w, 0.9 * h, 0.4 * w, 0.9 * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.1 * w, 0.5 * h, 0.15 * w, 0.8 * h, 0.05 * w, 0.65 * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.2 * h, 0.05 * w, 0.35 * h, 0.2 * w, 0.15 * h));
    
    geo.add(fig);
    geo.spot1 = new go.Spot(0.2, 0.3);
    geo.spot2 = new go.Spot(0.8, 0.7);
    return geo;
  });
}

// Initialize cloud shape definition
defineCloudShape();


/**
 * Create node template map dynamically from configuration
 * All node types are generated from NODE_CONFIGURATIONS - fully dynamic!
 */
export function createNodeTemplateMap(): go.Map<string, go.Node> {
  const nodeTemplateMap = new go.Map<string, go.Node>();

  // Generate template for each configured node type (using modern GoJS 2.2+ syntax)
  NODE_CONFIGURATIONS.forEach(config => {
    const { id, style, port, displayProperties, selectConnectedLinksOnClick } = config;
    
    // Create node with Spot panel type
    const node = new go.Node('Spot', {
      locationSpot: go.Spot.Center,
      selectable: true,
      deletable: true
    });
    
    // Add location binding (two-way)
    node.bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify);
    
    // Create outer shape (main visual element)
    node.add(
      new go.Shape(style.shape, {
        name: 'OUTER_SHAPE',
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        width: style.width,
        height: style.height,
        cursor: 'move',
        portId: 'outer',
        // Outer shape is for dragging only - links redirect to it via CustomLinkingTool
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides
      })
    );
    
    // Create text block for main label (from displayProperties)
    const mainLabelProperty = displayProperties.find(prop => prop.showAsMainLabel);
    if (mainLabelProperty) {
      node.add(
        new go.TextBlock({
          margin: 8,
          stroke: style.textColor,
          font: style.font,
          editable: mainLabelProperty.editable || false,
          text: mainLabelProperty.defaultValue || ''
        }).bindTwoWay('text', mainLabelProperty.dataKey)
      );
    }
    
    // Create center port if configured
    if (port.showCenterPort) {
      node.add(
        new go.Shape('Circle', {
          name: 'CENTER_PORT',
          alignment: go.Spot.Center,
          width: port.centerPortSize || 20,
          height: port.centerPortSize || 20,
          fill: port.centerPortFill || style.stroke,
          stroke: port.centerPortStroke || style.stroke,
          strokeWidth: 2,
          cursor: 'pointer',
          portId: 'center',
          fromLinkable: port.fromLinkable,
          toLinkable: port.toLinkable,
          opacity: 0 // Invisible by default, shown on hover (but still active for linking!)
        })
      );
    }
    
    
    // Add mouse handlers for center port visibility (only if port exists)
    if (port.showCenterPort) {
      node.mouseEnter = (_e: go.InputEvent, thisObj: go.GraphObject) => {
        if (thisObj instanceof go.Node) {
          const centerPort = thisObj.findObject('CENTER_PORT');
          if (centerPort) centerPort.opacity = 1;
        }
      };
      node.mouseLeave = (_e: go.InputEvent, thisObj: go.GraphObject) => {
        if (thisObj instanceof go.Node) {
          const centerPort = thisObj.findObject('CENTER_PORT');
          if (centerPort) centerPort.opacity = 0;
        }
      };
    }
    
    // Add custom click handler for Cloud (select node + connected links)
    if (selectConnectedLinksOnClick) {
      node.click = (e: go.InputEvent, nodeObj: go.GraphObject) => {
        if (!(nodeObj instanceof go.Node)) return;
        const diagram = nodeObj.diagram;
        if (!diagram) return;
        
        // Collect node and all its connected links
        const selection = new go.Set<go.Part>();
        selection.add(nodeObj);
        
        // Add all links connected to this node
        nodeObj.findLinksConnected().each((link: go.Link) => {
          selection.add(link);
        });
        
        // Select all collected parts
        diagram.selectCollection(selection);
        
        // Prevent default selection behavior
        e.handled = true;
      };
    }
    
    // Create tooltip if there are tooltip properties
    const tooltip = createNodeTooltip(config);
    if (tooltip) {
      node.toolTip = tooltip;
    }
    
    // Add the node template to map
    nodeTemplateMap.add(id, node);
  });

  // Add LinkLabel node template for edge-to-edge connections
  // These are small invisible nodes that sit on links and serve as connection points
  const linkLabelNode = new go.Node({
    selectable: false, // User cannot select label nodes directly
    movable: false, // Cannot be dragged away from parent link
    avoidable: false, // Links should not avoid label nodes
    layerName: 'Foreground' // Place above links
  }).add(
    new go.Shape('Ellipse', {
      width: 12,
      height: 12,
      fill: 'black',
      stroke: null,
      portId: '', // Default port
      fromLinkable: true,
      toLinkable: true,
      cursor: 'pointer'
    })
  );
  
  nodeTemplateMap.add(LINK_LABEL_CATEGORY, linkLabelNode);

  return nodeTemplateMap;
}

/**
 * Create link template map dynamically from configuration
 * All link types are generated from LINK_CONFIGURATIONS - fully dynamic!
 */
export function createLinkTemplateMap(): go.Map<string, go.Link> {
  const linkTemplateMap = new go.Map<string, go.Link>();

  // Generate template for each configured link type (using modern GoJS 2.2+ syntax)
  LINK_CONFIGURATIONS.forEach(config => {
    const { id, style, displayProperties } = config;
    
    // Create link with configuration
    const link = new go.Link({
      routing: go.Routing.Normal,
      curve: go.Curve.Bezier,
      curviness: 0, // Default to straight line (not NaN which auto-calculates)
      reshapable: true, // Allow user to reshape by dragging handles
      adjusting: go.LinkAdjusting.Scale, // Scale intermediate points when nodes move (better than End)
      toShortLength: style.toShortLength,
      fromShortLength: style.fromShortLength,
      cursor: 'pointer' // Show pointer cursor on hover
    });
    
    // Add bindings for link properties (two-way)
    link.bindTwoWay('points'); // Save link route points to model
    link.bindTwoWay('curviness'); // Save curviness to model
    link.bindTwoWay('bidirectional'); // Save bidirectional state to model
    
    // Add invisible thick shape for larger click area
    link.add(
      new go.Shape({ isPanelMain: true, stroke: 'transparent', strokeWidth: style.clickAreaWidth })
    );
    
    // Add visible shape
    link.add(
      new go.Shape({ isPanelMain: true, strokeWidth: style.strokeWidth, stroke: style.stroke })
    );
    
    // Add from arrow (shown only when bidirectional)
    link.add(
      new go.Shape({
        fromArrow: 'BackwardTriangle',
        stroke: style.stroke,
        fill: style.stroke,
        scale: style.arrowScale,
        strokeWidth: 0, // No outline, just fill
        visible: false
      }).bind('visible', 'bidirectional', (b) => b === true)
    );
    
    // Add to arrow (always shown)
    link.add(
      new go.Shape({
        toArrow: 'Standard',
        stroke: style.stroke,
        fill: style.stroke,
        scale: style.arrowScale,
        strokeWidth: 0 // No outline, just fill
      })
    );
    
    // Add TextBlock labels for properties that are NOT tooltips
    const labelProperties = displayProperties.filter(prop => !prop.showAsTooltip);
    labelProperties.forEach(prop => {
      // Create a panel with background shape and text for better visibility
      const panel = new go.Panel('Auto', {
        segmentOrientation: go.Orientation.Upright, // Keep panel readable
        // Use middle of the link if not specified
        segmentIndex: prop.segmentIndex !== undefined ? prop.segmentIndex : NaN, // NaN = middle
        segmentFraction: prop.segmentFraction !== undefined ? prop.segmentFraction : 0.5,
        visible: false // Hidden by default, shown only when text is not empty
      });
      
      // Add positioning offset if specified
      if (prop.segmentOffset) {
        panel.segmentOffset = new go.Point(prop.segmentOffset.x, prop.segmentOffset.y);
      }
      
      // Show panel only when text is not empty (one-way binding)
      panel.bind('visible', prop.dataKey, (val) => {
        return val !== undefined && val !== null && val !== '';
      });
      
      // Background shape with border - uses link's color
      panel.add(
        new go.Shape('RoundedRectangle', {
          fill: 'rgba(255, 255, 255, 0.95)', // Almost opaque white
          stroke: style.stroke, // Use link's color for border
          strokeWidth: 1.5,
          parameter1: 3 // Corner radius
        })
      );
      
      // Text with improved styling - uses link's color
      panel.add(
        new go.TextBlock({
          margin: new go.Margin(4, 6, 4, 6), // top, right, bottom, left padding
          font: 'bold 12px sans-serif', // Bold and larger font
          stroke: style.stroke, // Use link's color for text
          editable: prop.editable || false,
          textAlign: 'center'
        }).bindTwoWay('text', prop.dataKey)
      );
      
      link.add(panel);
    });
    
    // Create tooltip if there are tooltip properties
    const tooltip = createLinkTooltip(config);
    if (tooltip) {
      link.toolTip = tooltip;
    }
    
    // Add the link template to map
    linkTemplateMap.add(id, link);
  });

  return linkTemplateMap;
}
