import * as go from 'gojs';
import { 
  LINK_CONFIGURATIONS, 
  NODE_CONFIGURATIONS,
  LINK_LABEL_CATEGORY,
  type LinkConfiguration,
  type NodeConfiguration
} from '../config/diagram-rules';

/**
 * Helper function to create tooltip Adornment for nodes
 * Generates tooltip from displayProperties configuration where showAsTooltip is true
 * @param config - Node configuration containing displayProperties
 * @returns Tooltip Adornment or null if no tooltip properties defined
 */
function createNodeTooltip(config: NodeConfiguration): go.Adornment | null {
  const $ = go.GraphObject.make;
  
  // Filter properties that should be shown as tooltips
  const tooltipProperties = config.displayProperties.filter(prop => prop.showAsTooltip);
  
  // No tooltip if no properties configured
  if (tooltipProperties.length === 0) {
    return null;
  }
  
  // Create tooltip with vertical layout for multiple properties
  const tooltipContent: go.GraphObject[] = [];
  
  tooltipProperties.forEach(prop => {
    tooltipContent.push(
      $(go.TextBlock, 
        { 
          margin: 4,
          font: '12px sans-serif'
        },
        // Show label and value, or just value if label is empty
        new go.Binding('text', prop.dataKey, (value) => {
          const displayValue = value || prop.defaultValue || '';
          return prop.label ? `${prop.label}: ${displayValue}` : displayValue;
        })
      )
    );
  });
  
  return $(go.Adornment, 'Auto',
    $(go.Shape, { fill: '#FFFFCC' }),
    $(go.Panel, 'Vertical',
      ...tooltipContent
    )
  );
}

/**
 * Helper function to create tooltip Adornment for links
 * Generates tooltip from displayProperties configuration where showAsTooltip is true
 * @param config - Link configuration containing displayProperties
 * @returns Tooltip Adornment or null if no tooltip properties defined
 */
function createLinkTooltip(config: LinkConfiguration): go.Adornment | null {
  const $ = go.GraphObject.make;
  
  // Filter properties that should be shown as tooltips
  const tooltipProperties = config.displayProperties.filter(prop => prop.showAsTooltip);
  
  // No tooltip if no properties configured
  if (tooltipProperties.length === 0) {
    return null;
  }
  
  // Create tooltip with vertical layout for multiple properties
  const tooltipContent: go.GraphObject[] = [];
  
  tooltipProperties.forEach(prop => {
    tooltipContent.push(
      $(go.TextBlock, 
        { 
          margin: 4,
          font: '12px sans-serif'
        },
        // Show label and value, or just value if label is empty
        new go.Binding('text', prop.dataKey, (value) => {
          const displayValue = value || prop.defaultValue || '';
          return prop.label ? `${prop.label}: ${displayValue}` : displayValue;
        })
      )
    );
  });
  
  return $(go.Adornment, 'Auto',
    $(go.Shape, { fill: '#FFFFCC' }),
    $(go.Panel, 'Vertical',
      ...tooltipContent
    )
  );
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
 * Create node template map dynamically from configuration
 * All node types are generated from NODE_CONFIGURATIONS - fully dynamic!
 */
export function createNodeTemplateMap(): go.Map<string, go.Node> {
  const $ = go.GraphObject.make;
  const nodeTemplateMap = new go.Map<string, go.Node>();

  // Generate template for each configured node type
  NODE_CONFIGURATIONS.forEach(config => {
    const { id, style, port, displayProperties, selectConnectedLinksOnClick } = config;
    
    // Build node template elements
    const nodeElements: go.GraphObject[] = [];
    
    // Create outer shape (main visual element)
    nodeElements.push(
      $(go.Shape, style.shape, {
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
      nodeElements.push(
        $(go.TextBlock, {
          margin: 8,
          stroke: style.textColor,
          font: style.font,
          editable: mainLabelProperty.editable || false,
          text: mainLabelProperty.defaultValue || ''
        }, new go.Binding('text', mainLabelProperty.dataKey).makeTwoWay())
      );
    }
    
    // Create center port if configured
    if (port.showCenterPort) {
      nodeElements.push(
        $(go.Shape, 'Circle', {
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
    
    // Build node config object
    const nodeConfig: any = {
      locationSpot: go.Spot.Center,
      selectable: true,
      deletable: true
    };
    
    // Add mouse handlers for center port visibility (only if port exists)
    if (port.showCenterPort) {
      nodeConfig.mouseEnter = (_e: go.InputEvent, thisObj: go.GraphObject) => {
        if (thisObj instanceof go.Node) {
          const centerPort = thisObj.findObject('CENTER_PORT');
          if (centerPort) centerPort.opacity = 1;
        }
      };
      nodeConfig.mouseLeave = (_e: go.InputEvent, thisObj: go.GraphObject) => {
        if (thisObj instanceof go.Node) {
          const centerPort = thisObj.findObject('CENTER_PORT');
          if (centerPort) centerPort.opacity = 0;
        }
      };
    }
    
    // Add custom click handler for Cloud (select node + connected links)
    if (selectConnectedLinksOnClick) {
      nodeConfig.click = (e: go.InputEvent, node: go.GraphObject) => {
        if (!(node instanceof go.Node)) return;
        const diagram = node.diagram;
        if (!diagram) return;
        
        // Collect node and all its connected links
        const selection = new go.Set<go.Part>();
        selection.add(node);
        
        // Add all links connected to this node
        node.findLinksConnected().each((link: go.Link) => {
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
      nodeConfig.toolTip = tooltip;
    }
    
    // Create and add the node template
    nodeTemplateMap.add(id,
      $(go.Node, 'Spot',
        nodeConfig,
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        ...nodeElements
      )
    );
  });

  // Add LinkLabel node template for edge-to-edge connections
  // These are small invisible nodes that sit on links and serve as connection points
  nodeTemplateMap.add(LINK_LABEL_CATEGORY,
    $(go.Node, {
      selectable: false, // User cannot select label nodes directly
      movable: false, // Cannot be dragged away from parent link
      avoidable: false, // Links should not avoid label nodes
      layerName: 'Foreground' // Place above links
    },
      $(go.Shape, 'Ellipse', {
        width: 12,
        height: 12,
        fill: 'black',
        stroke: null,
        portId: '', // Default port
        fromLinkable: true,
        toLinkable: true,
        cursor: 'pointer'
      })
    )
  );

  return nodeTemplateMap;
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
    const { id, style, displayProperties } = config;
    
    // Build link template elements array
    const linkElements: go.GraphObject[] = [];
    
    // Add invisible thick shape for larger click area
    linkElements.push(
      $(go.Shape, { isPanelMain: true, stroke: 'transparent', strokeWidth: style.clickAreaWidth })
    );
    
    // Add visible shape
    linkElements.push(
      $(go.Shape, { isPanelMain: true, strokeWidth: style.strokeWidth, stroke: style.stroke })
    );
    
    // Add from arrow (shown only when bidirectional)
    linkElements.push(
      $(go.Shape, { 
        fromArrow: 'BackwardTriangle', 
        stroke: style.stroke, 
        fill: style.stroke, 
        scale: style.arrowScale,
        strokeWidth: 0, // No outline, just fill
        visible: false 
      },
        new go.Binding('visible', 'bidirectional', (b) => b === true))
    );
    
    // Add to arrow (always shown)
    linkElements.push(
      $(go.Shape, { 
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
      const panelConfig: any = {
        segmentOrientation: go.Link.OrientUpright, // Keep panel readable
        // Use middle of the link if not specified
        segmentIndex: prop.segmentIndex !== undefined ? prop.segmentIndex : NaN, // NaN = middle
        segmentFraction: prop.segmentFraction !== undefined ? prop.segmentFraction : 0.5,
        visible: false // Hidden by default, shown only when text is not empty
      };
      
      // Add positioning offset if specified
      if (prop.segmentOffset) {
        panelConfig.segmentOffset = new go.Point(prop.segmentOffset.x, prop.segmentOffset.y);
      }
      
      linkElements.push(
        $(go.Panel, 'Auto', panelConfig,
          // Show panel only when text is not empty
          new go.Binding('visible', prop.dataKey, (val) => {
            return val !== undefined && val !== null && val !== '';
          }), // One-way binding only - don't write boolean back to data!
          // Background shape with border - uses link's color
          $(go.Shape, 'RoundedRectangle',
            {
              fill: 'rgba(255, 255, 255, 0.95)', // Almost opaque white
              stroke: style.stroke, // Use link's color for border
              strokeWidth: 1.5,
              parameter1: 3 // Corner radius
            }
          ),
          // Text with improved styling - uses link's color
          $(go.TextBlock,
            {
              margin: new go.Margin(4, 6, 4, 6), // top, right, bottom, left padding
              font: 'bold 12px sans-serif', // Bold and larger font
              stroke: style.stroke, // Use link's color for text
              editable: prop.editable || false,
              textAlign: 'center'
            },
            new go.Binding('text', prop.dataKey).makeTwoWay()
          )
        )
      );
    });
    
    // Create tooltip if there are tooltip properties
    const tooltip = createLinkTooltip(config);
    
    // Create the link template
    const linkConfig: any = { 
      routing: go.Link.Normal, 
      curve: go.Link.Bezier,
      curviness: 0, // Default to straight line (not NaN which auto-calculates)
      reshapable: true, // Allow user to reshape by dragging handles
      adjusting: go.Link.Scale, // Scale intermediate points when nodes move (better than End)
      toShortLength: style.toShortLength,
      fromShortLength: style.fromShortLength,
      cursor: 'pointer' // Show pointer cursor on hover
    };
    
    // Add tooltip if exists
    if (tooltip) {
      linkConfig.toolTip = tooltip;
    }
    
    linkTemplateMap.add(id,
      $(go.Link,
        linkConfig,
        // Save link route points to model (GoJS automatically converts List2 → Array<number>)
        new go.Binding('points').makeTwoWay(),
        new go.Binding('curviness').makeTwoWay(), // Save curviness to model
        new go.Binding('bidirectional').makeTwoWay(), // Save bidirectional state to model
        ...linkElements
      )
    );
  });

  return linkTemplateMap;
}
