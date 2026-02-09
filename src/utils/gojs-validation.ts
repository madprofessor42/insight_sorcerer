import * as go from 'gojs';
import type { LinkType } from '../store/diagramSlice';

/**
 * Create link validation function for linking tool
 */
export function createLinkValidation(linkType: LinkType) {
  return (
    fromNode: go.Node | null,
    _fromPort: go.GraphObject | null,
    _toNode: go.Node | null,
    _toPort: go.GraphObject | null
  ): boolean => {
    if (!fromNode) return false;
    
    // If creating a flow link, validate that source is a Stock node
    if (linkType === 'flow') {
      const fromData = fromNode.data;
      if (fromData.category !== 'Stock') {
        console.warn('⚠️  Flow links can only be created from Stock nodes!');
        return false;
      }
    }
    
    return true;
  };
}

/**
 * Create link validation function for relinking tool
 */
export function createRelinkValidation() {
  return (
    fromNode: go.Node | null,
    _fromPort: go.GraphObject | null,
    _toNode: go.Node | null,
    _toPort: go.GraphObject | null,
    link: go.Link | null
  ): boolean => {
    if (!fromNode || !link) return false;
    
    // If the link is a flow, validate that source is a Stock node
    if (link.data.category === 'flow') {
      const fromData = fromNode.data;
      if (fromData.category !== 'Stock') {
        console.warn('⚠️  Flow links can only originate from Stock nodes!');
        return false;
      }
    }
    
    return true;
  };
}

