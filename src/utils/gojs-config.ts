import * as go from 'gojs';
import {
  createNodeTemplateMap,
  createDefaultNodeTemplate,
  createLinkTemplateMap,
  createDefaultLinkTemplate
} from './gojs-templates';
import { CustomLinkingTool, CustomRelinkingTool } from '../extensions';

/**
 * Initialize and configure a GoJS diagram
 */
export function initializeDiagram(): go.Diagram {
  const $ = go.GraphObject.make;
  
  const diagram = $(go.Diagram, {
    'undoManager.isEnabled': true,
    'grid.visible': true,
    'grid.gridCellSize': new go.Size(20, 20),
    // Initialize custom tools (proper GoJS extension pattern)
    // Enable unconnected links (links ending on canvas) - allows creating Cloud nodes by drawing links to empty space
    linkingTool: $(CustomLinkingTool, { isUnconnectedLinkValid: true }),
    relinkingTool: $(CustomRelinkingTool, { isUnconnectedLinkValid: true }),
    model: new go.GraphLinksModel({
      linkKeyProperty: 'key',
      nodeCategoryProperty: 'category',
      linkCategoryProperty: 'category',
      // Let GoJS handle automatic key generation using its built-in mechanism
      // Keys will be generated automatically when nodes/links are added without a key property
      // GoJS will ensure uniqueness within the model
    })
  });

  // Set up node templates
  diagram.nodeTemplateMap = createNodeTemplateMap();
  diagram.nodeTemplate = createDefaultNodeTemplate();

  // Set up link templates
  diagram.linkTemplateMap = createLinkTemplateMap();
  diagram.linkTemplate = createDefaultLinkTemplate();

  return diagram;
}

