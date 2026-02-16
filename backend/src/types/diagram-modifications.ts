/**
 * Diagram Modification Types
 * 
 * Zod schemas for LLM structured output when proposing diagram changes
 */

import { z } from 'zod';

// ============================================================================
// NODE OPERATIONS
// ============================================================================

/**
 * Add a new node to the diagram
 */
export const AddNodeSchema = z.object({
  operation: z.literal('add_node'),
  category: z.enum(['Stock', 'Variable', 'Converter', 'Cloud']).describe('Type of node to add'),
  name: z.string().describe('Name of the new node'),
  initialValue: z.union([z.string(), z.number()]).optional().describe('Initial value for Stock nodes (can be number or formula)'),
  value: z.union([z.string(), z.number()]).optional().describe('Value for Variable nodes (can be number or formula string)'),
  input: z.string().optional().describe('Input source for Converter nodes'),
  values: z.string().optional().describe('Data points for Converter nodes (format: x1,y1;x2,y2;x3,y3)'),
  reasoning: z.string().describe('Explanation why this node should be added'),
});

/**
 * Update an existing node's properties
 */
export const UpdateNodeSchema = z.object({
  operation: z.literal('update_node'),
  nodeId: z.string().describe('ID of the node to update (from diagram JSON)'),
  name: z.string().describe('Current name of the node (for UI display)'),
  newName: z.string().optional().describe('New name for the node'),
  initialValue: z.union([z.string(), z.number()]).optional().describe('New initial value for Stock nodes (can be number or formula)'),
  value: z.union([z.string(), z.number()]).optional().describe('New value for Variable nodes (can be number or formula string)'),
  input: z.string().optional().describe('New input source for Converter nodes'),
  values: z.string().optional().describe('New data points for Converter nodes'),
  reasoning: z.string().describe('Explanation why this node should be updated'),
});

/**
 * Delete an existing node
 */
export const DeleteNodeSchema = z.object({
  operation: z.literal('delete_node'),
  nodeId: z.string().describe('ID of the node to delete (from diagram JSON)'),
  name: z.string().describe('Name of the node (for UI display)'),
  reasoning: z.string().describe('Explanation why this node should be deleted'),
});

// ============================================================================
// LINK OPERATIONS
// ============================================================================

/**
 * Add a new link between nodes
 */
export const AddLinkSchema = z.object({
  operation: z.literal('add_link'),
  linkType: z.enum(['link', 'flow']).describe('Type of link/connection'),
  fromId: z.string().describe('ID of the source node or flow edge (from diagram JSON links array)'),
  toId: z.string().describe('ID of the target node or flow edge (from diagram JSON links array)'),
  name: z.string().optional().describe('Name/label for the link'),
  flowRate: z.union([z.string(), z.number()]).optional().describe('Flow rate formula for Flow links'),
  bidirectional: z.boolean().optional().describe('Whether the link is bidirectional'),
  reasoning: z.string().describe('Explanation why this link should be added'),
});

/**
 * Update an existing link's properties
 */
export const UpdateLinkSchema = z.object({
  operation: z.literal('update_link'),
  linkId: z.string().describe('ID of the link to update (from diagram JSON)'),
  name: z.string().describe('Current name of the link (for UI display)'),
  newName: z.string().optional().describe('New name for the link'),
  flowRate: z.union([z.string(), z.number()]).optional().describe('New flow rate formula'),
  bidirectional: z.boolean().optional().describe('New bidirectional setting'),
  reasoning: z.string().describe('Explanation why this link should be updated'),
});

/**
 * Delete an existing link
 */
export const DeleteLinkSchema = z.object({
  operation: z.literal('delete_link'),
  linkId: z.string().describe('ID of the link to delete (from diagram JSON)'),
  name: z.string().describe('Name of the link (for UI display)'),
  reasoning: z.string().describe('Explanation why this link should be deleted'),
});

// ============================================================================
// COMBINED MODIFICATION SCHEMA
// ============================================================================

/**
 * Union of all possible diagram operations
 */
export const DiagramOperationSchema = z.discriminatedUnion('operation', [
  AddNodeSchema,
  UpdateNodeSchema,
  DeleteNodeSchema,
  AddLinkSchema,
  UpdateLinkSchema,
  DeleteLinkSchema,
]);

/**
 * Complete diagram modification proposal from LLM
 */
export const DiagramModificationProposalSchema = z.object({
  reasoning: z.string().describe('Overall explanation of all proposed changes'),
  operations: z.array(DiagramOperationSchema).describe('List of operations to perform'),
});

// ============================================================================
// TypeScript TYPES (derived from Zod schemas)
// ============================================================================

export type AddNode = z.infer<typeof AddNodeSchema>;
export type UpdateNode = z.infer<typeof UpdateNodeSchema>;
export type DeleteNode = z.infer<typeof DeleteNodeSchema>;
export type AddLink = z.infer<typeof AddLinkSchema>;
export type UpdateLink = z.infer<typeof UpdateLinkSchema>;
export type DeleteLink = z.infer<typeof DeleteLinkSchema>;
export type DiagramOperation = z.infer<typeof DiagramOperationSchema>;
export type DiagramModificationProposal = z.infer<typeof DiagramModificationProposalSchema>;

