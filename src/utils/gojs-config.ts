import * as go from 'gojs';
import {
  createNodeTemplateMap,
  createDefaultNodeTemplate,
  createLinkTemplateMap,
  createDefaultLinkTemplate
} from './gojs-templates';

/**
 * Initialize and configure a GoJS diagram
 */
export function initializeDiagram(): go.Diagram {
  const $ = go.GraphObject.make;
  
  const diagram = $(go.Diagram, {
    'undoManager.isEnabled': true,
    'grid.visible': true,
    'grid.gridCellSize': new go.Size(20, 20),
    model: new go.GraphLinksModel({
      linkKeyProperty: 'key',
      nodeCategoryProperty: 'category',
      linkCategoryProperty: 'category',
      makeUniqueKeyFunction: (m: go.Model, data: any) => {
        let k = data.key || 1;
        while (m.findNodeDataForKey(k)) k++;
        data.key = k;
        return k;
      },
      makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
        let k = data.key || -1;
        while (m.findLinkDataForKey(k)) k--;
        data.key = k;
        return k;
      }
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

