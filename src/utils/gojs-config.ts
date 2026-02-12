import * as go from 'gojs';
import { nanoid } from 'nanoid';
import {
  createNodeTemplateMap,
  createLinkTemplateMap
} from './gojs-templates';
import { CustomLinkingTool, CustomRelinkingTool } from '../extensions';

/**
 * Initialize and configure a GoJS diagram
 */
export function initializeDiagram(): go.Diagram {
  // Using modern GoJS 2.2+ syntax without go.GraphObject.make
  const diagram = new go.Diagram({
    'undoManager.isEnabled': true,
    'grid.visible': true,
    'grid.gridCellSize': new go.Size(20, 20),
    // Enable infinite scrolling - allows panning without limits
    // This fixes the issue where canvas stops moving when nodes reach viewport edge
    scrollMode: go.ScrollMode.Infinite,
    // Initialize custom tools (proper GoJS extension pattern)
    // Enable unconnected links (links ending on canvas) - allows creating Cloud nodes by drawing links to empty space
    linkingTool: new CustomLinkingTool({ isUnconnectedLinkValid: true }),
    relinkingTool: new CustomRelinkingTool({ isUnconnectedLinkValid: true }),
    model: new go.GraphLinksModel({
      linkKeyProperty: 'key',
      nodeCategoryProperty: 'category',
      linkCategoryProperty: 'category',
      // Enable label nodes on links for edge-to-edge connections
      // This property tells GoJS which field in link data stores the array of label node keys
      linkLabelKeysProperty: 'labelKeys',
      // Use nanoid for generating unique keys for nodes and links
      // This ensures that nodes and links never have conflicting keys (e.g., both having -1)
      makeUniqueKeyFunction: (_model: go.Model, _data: go.ObjectData) => {
        return nanoid();
      },
      makeUniqueLinkKeyFunction: (_model: go.GraphLinksModel, _data: go.ObjectData) => {
        return nanoid();
      }
    })
  });

  // Configure DragSelectingTool for Shift + drag selection
  // DragSelectingTool is built-in and allows selecting multiple elements by dragging a box
  diagram.toolManager.dragSelectingTool.delay = 0;
  diagram.toolManager.dragSelectingTool.isPartialInclusion = true;

  // Set up node and link templates from configuration
  // All node and link types are defined in NODE_CONFIGURATIONS and LINK_CONFIGURATIONS
  diagram.nodeTemplateMap = createNodeTemplateMap();
  diagram.linkTemplateMap = createLinkTemplateMap();

  return diagram;
}
