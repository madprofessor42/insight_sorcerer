/**
 * Centralized diagram access utilities
 * All GoJS diagram access logic in one place
 */

import * as go from 'gojs';

/**
 * Result of diagram access operation
 */
export interface DiagramAccessResult {
  diagram: go.Diagram;
  model: go.GraphLinksModel;
}

/**
 * Get the current diagram and model from the DOM
 * @param selector - CSS selector for the diagram div (default: '.diagram-component')
 * @returns Diagram and model, or null if not found or invalid
 */
export function getDiagramFromDOM(selector: string = '.diagram-component'): DiagramAccessResult | null {
  const diagramDiv = document.querySelector(selector) as HTMLDivElement;
  if (!diagramDiv) {
    console.warn('⚠️ Diagram div not found in DOM');
    return null;
  }

  const diagram = go.Diagram.fromDiv(diagramDiv);
  if (!diagram) {
    console.warn('⚠️ Diagram instance not found');
    return null;
  }

  const model = diagram.model as go.GraphLinksModel;
  if (!(model instanceof go.GraphLinksModel)) {
    console.warn('⚠️ Diagram model is not a GraphLinksModel');
    return null;
  }

  return { diagram, model };
}

/**
 * Find a node in the diagram by its key
 * @param diagram - The GoJS diagram instance
 * @param model - The GoJS model instance
 * @param nodeKey - The key of the node to find
 * @returns Node data and node object, or null if not found
 */
export function findNodeByKey(
  diagram: go.Diagram,
  model: go.GraphLinksModel,
  nodeKey: go.Key
): { nodeData: go.ObjectData; node: go.Node } | null {
  const nodeData = model.findNodeDataForKey(nodeKey);
  if (!nodeData) {
    console.warn(`⚠️ Node data not found for key: ${nodeKey}`);
    return null;
  }

  const node = diagram.findNodeForKey(nodeKey);
  if (!node) {
    console.warn(`⚠️ Node object not found for key: ${nodeKey}`);
    return null;
  }

  return { nodeData, node };
}

/**
 * Find a link in the diagram by its key
 * @param diagram - The GoJS diagram instance
 * @param model - The GoJS model instance
 * @param linkKey - The key of the link to find
 * @returns Link data and link object, or null if not found
 */
export function findLinkByKey(
  diagram: go.Diagram,
  model: go.GraphLinksModel,
  linkKey: go.Key
): { linkData: go.ObjectData; link: go.Link } | null {
  const linkData = model.findLinkDataForKey(linkKey);
  if (!linkData) {
    console.warn(`⚠️ Link data not found for key: ${linkKey}`);
    return null;
  }

  const link = diagram.findLinkForData(linkData);
  if (!link) {
    console.warn(`⚠️ Link object not found for key: ${linkKey}`);
    return null;
  }

  return { linkData, link };
}

/**
 * Execute an operation on a node with automatic diagram/model retrieval
 * @param nodeKey - The key of the node to operate on
 * @param operation - Function that performs the operation on the node
 * @param selector - Optional CSS selector for the diagram div
 * @returns true if operation succeeded, false otherwise
 */
export function withNode(
  nodeKey: go.Key,
  operation: (diagram: go.Diagram, model: go.GraphLinksModel, nodeData: go.ObjectData, node: go.Node) => void,
  selector?: string
): boolean {
  const result = getDiagramFromDOM(selector);
  if (!result) return false;

  const { diagram, model } = result;
  const nodeResult = findNodeByKey(diagram, model, nodeKey);
  if (!nodeResult) return false;

  const { nodeData, node } = nodeResult;
  operation(diagram, model, nodeData, node);
  return true;
}

/**
 * Execute an operation on a link with automatic diagram/model retrieval
 * @param linkKey - The key of the link to operate on
 * @param operation - Function that performs the operation on the link
 * @param selector - Optional CSS selector for the diagram div
 * @returns true if operation succeeded, false otherwise
 */
export function withLink(
  linkKey: go.Key,
  operation: (diagram: go.Diagram, model: go.GraphLinksModel, linkData: go.ObjectData, link: go.Link) => void,
  selector?: string
): boolean {
  const result = getDiagramFromDOM(selector);
  if (!result) return false;

  const { diagram, model } = result;
  const linkResult = findLinkByKey(diagram, model, linkKey);
  if (!linkResult) return false;

  const { linkData, link } = linkResult;
  operation(diagram, model, linkData, link);
  return true;
}

