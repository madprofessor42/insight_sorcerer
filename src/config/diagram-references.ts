/**
 * Reference configurations for formula input bubbles
 */

import type { ReferenceConfig } from './diagram-types';
import type { NodeType } from './diagram-types';
import type { LinkType } from './diagram-links';

/**
 * Reference configurations for formula fields.
 * Key format: 'NodeType.propertyName' or 'LinkType.propertyName'
 * 
 * This centralizes all reference logic in one place for easy configuration.
 * Each configuration explicitly declares what types of connections to show.
 * 
 * Key concepts:
 * - `incoming: ['link']` - show nodes/edges connected TO this element via 'link' type
 * - `outgoing: ['flow']` - show nodes/edges this element connects TO via 'flow' type
 * - `includeIncomingConnectingEdges: ['flow']` - ALSO show the 'flow' edges themselves (independent of incoming)
 * - `includeOutgoingConnectingEdges: ['link']` - ALSO show the 'link' edges themselves (independent of outgoing)
 * 
 * Note: includeIncoming/OutgoingConnectingEdges works INDEPENDENTLY from incoming/outgoing.
 * Example:
 *   incoming: ['link'],
 *   includeIncomingConnectingEdges: ['flow']
 * Result: Shows nodes connected via 'link' + shows 'flow' edges themselves (even though 'flow' not in incoming)
 */
export const REFERENCE_CONFIGURATIONS: Record<string, ReferenceConfig> = {
  // Stock.initialValue - show incoming connections via 'link' type
  'Stock.initialValue': {
    incoming: ['link'],                             // Show nodes/edges connected via 'link'
  },
  
  // Variable.value - show incoming connections via 'link' type
  'Variable.value': {
    incoming: ['link'],                             // Show nodes/edges connected via 'link'
  },
  
  // Flow.flowRate - show source stock, target stock, and variables connected via 'link'
  'flow.flowRate': {
    includeSourceNode: true,                        // Show the Stock flow comes from
    includeTargetNode: true,                        // Show the Stock flow goes to
    incoming: ['link'],                             // Show nodes connected TO flow via 'link' (Variable -> Link -> Flow)
  },
  
  // Converter.input - show incoming connections via 'link' type (Stock/Variable/Converter connected to this Converter)
  'Converter.input': {
    incoming: ['link'],                             // Show nodes/edges connected via 'link'
  },
};

/**
 * Get reference configuration for a specific node property
 */
export function getNodeReferenceConfig(nodeType: NodeType, propertyKey: string): ReferenceConfig | undefined {
  return REFERENCE_CONFIGURATIONS[`${nodeType}.${propertyKey}`];
}

/**
 * Get reference configuration for a specific link property
 */
export function getLinkReferenceConfig(linkType: LinkType, propertyKey: string): ReferenceConfig | undefined {
  return REFERENCE_CONFIGURATIONS[`${linkType}.${propertyKey}`];
}

