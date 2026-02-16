/**
 * Diagram Modifications Validation Script
 * 
 * Replaces the reviewer LLM agent with deterministic validation logic
 * Uses functions similar to link-validation.ts from frontend
 */

import type { 
  DiagramModificationProposal, 
  DiagramOperation
} from '../types/diagram-modifications';

// ============================================================================
// VALIDATION RESULT TYPE (for Script Validator)
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  correctedModifications?: DiagramModificationProposal;
}

// ============================================================================
// TYPES
// ============================================================================

interface DiagramContext {
  nodes: Array<{
    id: string;
    category: string;
    name?: string;
    text?: string;
  }>;
  links: Array<{
    id: string;
    category: string;
    from: string;
    to: string;
    text?: string;
  }>;
}

// ============================================================================
// LINK CONFIGURATION (simplified copy from frontend)
// ============================================================================

interface LinkConfig {
  allowedFromNodes: string[];
  allowedToNodes: string[];
  allowedFromEdges: string[];
  allowedToEdges: string[];
  canBeBidirectional: boolean;
  canEndOnCanvas: boolean;
}

const LINK_CONFIGURATIONS: Record<string, LinkConfig> = {
  link: {
    allowedFromNodes: [], // Empty = all allowed
    allowedToNodes: [], // Empty = all allowed
    allowedFromEdges: ['flow'], // Link can originate FROM a flow edge
    allowedToEdges: ['flow'], // Link can connect TO a flow edge
    canBeBidirectional: true,
    canEndOnCanvas: false,
  },
  flow: {
    allowedFromNodes: ['Stock', 'Cloud'],
    allowedToNodes: ['Stock', 'Cloud'],
    allowedFromEdges: [], // Flow CANNOT originate from edges
    allowedToEdges: [], // Flow CANNOT connect to edges
    canBeBidirectional: false,
    canEndOnCanvas: true,
  },
};

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Get link configuration
 */
function getLinkConfig(linkType: string): LinkConfig | undefined {
  return LINK_CONFIGURATIONS[linkType];
}

/**
 * Check if a link can be created from a specific node type
 */
function isValidLinkSource(linkType: string, fromNodeType: string): boolean {
  const config = getLinkConfig(linkType);
  if (!config) return true; // No config = allow all
  
  // Empty array means all types are allowed
  if (config.allowedFromNodes.length === 0) return true;
  
  return config.allowedFromNodes.includes(fromNodeType);
}

/**
 * Check if a link can be created to a specific node type
 */
function isValidLinkTarget(linkType: string, toNodeType: string): boolean {
  const config = getLinkConfig(linkType);
  if (!config) return true; // No config = allow all
  
  // Empty array means all types are allowed
  if (config.allowedToNodes.length === 0) return true;
  
  return config.allowedToNodes.includes(toNodeType);
}

/**
 * Check if link can originate FROM an edge type
 */
function isValidEdgeSource(linkType: string, edgeCategory: string): boolean {
  const config = getLinkConfig(linkType);
  if (!config) return false;
  return config.allowedFromEdges.includes(edgeCategory);
}

/**
 * Check if link can connect TO an edge type
 */
function isValidEdgeTarget(linkType: string, edgeCategory: string): boolean {
  const config = getLinkConfig(linkType);
  if (!config) return false;
  return config.allowedToEdges.includes(edgeCategory);
}

/**
 * Get error message for source node validation
 */
function getLinkValidationErrorFrom(linkType: string, config: LinkConfig): string {
  if (config.allowedFromNodes.length > 0) {
    return `Связи типа '${linkType}' можно создавать только ОТ: ${config.allowedFromNodes.join(', ')}`;
  }
  return 'Неверный источник связи';
}

/**
 * Get error message for target node validation
 */
function getLinkValidationErrorTo(linkType: string, config: LinkConfig): string {
  if (config.allowedToNodes.length > 0) {
    return `Связи типа '${linkType}' можно подключать только К: ${config.allowedToNodes.join(', ')}`;
  }
  return 'Неверная цель связи';
}

/**
 * Check if duplicate link exists
 */
function hasDuplicateLink(
  context: DiagramContext,
  fromId: string,
  toId: string,
  linkType: string,
  excludeLinkId?: string
): boolean {
  return context.links.some(
    (link) =>
      link.from === fromId &&
      link.to === toId &&
      link.category === linkType &&
      (excludeLinkId === undefined || link.id !== excludeLinkId)
  );
}

// ============================================================================
// CONTEXT PARSING
// ============================================================================

/**
 * Parse diagram context from JSON string
 */
function parseDiagramContext(contextJson: string): DiagramContext {
  try {
    const parsed = JSON.parse(contextJson);
    
    // Handle different context formats
    const nodes = parsed.nodes || parsed.nodeDataArray || [];
    const links = parsed.links || parsed.linkDataArray || [];
    
    return {
      nodes: nodes.map((n: any) => ({
        id: n.id || n.key,
        category: n.category,
        name: n.name || n.text,
        text: n.text || n.name,
      })),
      links: links.map((l: any) => ({
        id: l.id || l.key,
        category: l.category || 'link',
        from: l.from || l.fromId,
        to: l.to || l.toId,
        text: l.text || l.name,
      })),
    };
  } catch (error) {
    console.error('Failed to parse diagram context:', error);
    throw new Error('Invalid diagram context JSON');
  }
}

// ============================================================================
// OPERATION VALIDATORS
// ============================================================================

/**
 * Validate a single add_node operation
 */
function validateAddNode(
  operation: Extract<DiagramOperation, { operation: 'add_node' }>,
  context: DiagramContext,
  newNodesInProposal: Set<string>
): string[] {
  const issues: string[] = [];
  
  // Check if node with same name already exists
  const existingNode = context.nodes.find(
    (n) => n.name?.toLowerCase() === operation.name.toLowerCase()
  );
  
  if (existingNode) {
    issues.push(
      `Узел "${operation.name}" уже существует (ID: ${existingNode.id}). Используйте update_node вместо add_node.`
    );
  }
  
  // Track new node for later validation
  newNodesInProposal.add(operation.name);
  
  return issues;
}

/**
 * Validate a single update_node operation
 */
function validateUpdateNode(
  operation: Extract<DiagramOperation, { operation: 'update_node' }>,
  context: DiagramContext
): string[] {
  const issues: string[] = [];
  
  // Check if node exists
  const node = context.nodes.find((n) => n.id === operation.nodeId);
  if (!node) {
    issues.push(
      `Узел с ID "${operation.nodeId}" не найден в диаграмме. Проверьте правильность ID.`
    );
  }
  
  return issues;
}

/**
 * Validate a single delete_node operation
 */
function validateDeleteNode(
  operation: Extract<DiagramOperation, { operation: 'delete_node' }>,
  context: DiagramContext,
  allOperations: DiagramOperation[]
): string[] {
  const issues: string[] = [];
  
  // Check if node exists
  const node = context.nodes.find((n) => n.id === operation.nodeId);
  if (!node) {
    issues.push(
      `Узел с ID "${operation.nodeId}" не найден в диаграмме.`
    );
    return issues;
  }
  
  // Check if any links reference this node (orphan links check)
  const affectedLinks = context.links.filter(
    (link) => link.from === operation.nodeId || link.to === operation.nodeId
  );
  
  if (affectedLinks.length > 0) {
    // Check if these links are also being deleted
    const deletedLinkIds = allOperations
      .filter((op): op is Extract<DiagramOperation, { operation: 'delete_link' }> => op.operation === 'delete_link')
      .map((op) => op.linkId);
    
    const orphanLinks = affectedLinks.filter(
      (link) => !deletedLinkIds.includes(link.id)
    );
    
    if (orphanLinks.length > 0) {
      issues.push(
        `Удаление узла "${operation.name}" оставит orphan links: ${orphanLinks.map((l) => l.text || l.id).join(', ')}. Добавьте delete_link операции для этих связей.`
      );
    }
  }
  
  return issues;
}

/**
 * Validate a single add_link operation
 */
function validateAddLink(
  operation: Extract<DiagramOperation, { operation: 'add_link' }>,
  context: DiagramContext,
  newNodesInProposal: Set<string>,
  newLinksInProposal: Map<string, string> // name -> linkType
): string[] {
  const issues: string[] = [];
  const linkType = operation.linkType;
  const config = getLinkConfig(linkType);
  
  if (!config) {
    issues.push(`Неизвестный тип связи: "${linkType}"`);
    return issues;
  }
  
  // Find FROM node/edge
  let fromNode = context.nodes.find((n) => n.id === operation.fromId);
  let fromIsNewNode = false;
  let fromIsNewLink = false;
  
  // Check if fromId refers to a newly created node in this proposal
  if (!fromNode && newNodesInProposal.has(operation.fromId)) {
    fromIsNewNode = true;
    // We'll need to assume the node will be created correctly
    // Can't validate type without knowing what was added
  }
  
  let fromLink = context.links.find((l) => l.id === operation.fromId);
  
  // Check if fromId refers to a newly created link (flow edge) in this proposal
  if (!fromNode && !fromLink && !fromIsNewNode && newLinksInProposal.has(operation.fromId)) {
    fromIsNewLink = true;
    const newLinkType = newLinksInProposal.get(operation.fromId);
    // Validate edge-to-edge connection
    if (!isValidEdgeSource(linkType, newLinkType!)) {
      issues.push(
        `Связи типа '${linkType}' не могут начинаться от edge типа '${newLinkType}'`
      );
    }
  }
  
  if (!fromNode && !fromLink && !fromIsNewNode && !fromIsNewLink) {
    issues.push(
      `Source "${operation.fromId}" не найден в диаграмме. Проверьте ID или имя.`
    );
  }
  
  // Find TO node/edge
  let toNode = context.nodes.find((n) => n.id === operation.toId);
  let toIsNewNode = false;
  let toIsNewLink = false;
  
  // Check if toId refers to a newly created node in this proposal
  if (!toNode && newNodesInProposal.has(operation.toId)) {
    toIsNewNode = true;
  }
  
  let toLink = context.links.find((l) => l.id === operation.toId);
  
  // Check if toId refers to a newly created link (flow edge) in this proposal
  if (!toNode && !toLink && !toIsNewNode && newLinksInProposal.has(operation.toId)) {
    toIsNewLink = true;
    const newLinkType = newLinksInProposal.get(operation.toId);
    // Validate edge-to-edge connection
    if (!isValidEdgeTarget(linkType, newLinkType!)) {
      issues.push(
        `Связи типа '${linkType}' не могут заканчиваться на edge типа '${newLinkType}'`
      );
    }
  }
  
  if (!toNode && !toLink && !toIsNewNode && !toIsNewLink) {
    issues.push(
      `Target "${operation.toId}" не найден в диаграмме. Проверьте ID или имя.`
    );
  }
  
  // If we have validation errors already, stop here
  if (issues.length > 0) return issues;
  
  // === VALIDATE LINK SOURCE ===
  if (fromLink) {
    // Source is an existing edge (link) - check edge-to-edge validation
    if (!isValidEdgeSource(linkType, fromLink.category)) {
      issues.push(
        `Связи типа '${linkType}' не могут начинаться от edge типа '${fromLink.category}'`
      );
    }
  } else if (fromIsNewLink) {
    // Source is a new edge - validation already done above
  } else if (fromNode && !fromIsNewNode) {
    // Source is a regular existing node
    if (!isValidLinkSource(linkType, fromNode.category)) {
      issues.push(getLinkValidationErrorFrom(linkType, config));
    }
  }
  // If fromIsNewNode, skip validation (can't validate without knowing node type)
  
  // === VALIDATE LINK TARGET ===
  if (toLink) {
    // Target is an existing edge (link) - check edge-to-edge validation
    if (!isValidEdgeTarget(linkType, toLink.category)) {
      issues.push(
        `Связи типа '${linkType}' не могут заканчиваться на edge типа '${toLink.category}'`
      );
    }
  } else if (toIsNewLink) {
    // Target is a new edge - validation already done above
  } else if (toNode && !toIsNewNode) {
    // Target is a regular existing node
    if (!isValidLinkTarget(linkType, toNode.category)) {
      issues.push(getLinkValidationErrorTo(linkType, config));
    }
  }
  // If toIsNewNode, skip validation
  
  // === CHECK FOR DUPLICATES ===
  if (fromNode && toNode) {
    if (hasDuplicateLink(context, fromNode.id, toNode.id, linkType)) {
      issues.push(
        `Связь типа '${linkType}' между "${fromNode.name}" и "${toNode.name}" уже существует. Используйте update_link вместо add_link.`
      );
    }
  }
  
  // === CHECK FLOW CONNECTED TO NEW CLOUD ===
  // If Flow uses Cloud as endpoint, it should be a NEW Cloud (not existing)
  // Flow between Stock → Stock doesn't need Cloud at all (valid case)
  if (linkType === 'flow') {
    // Check if fromId is an existing Cloud (not a new one)
    const fromIsExistingCloud = fromNode && fromNode.category === 'Cloud' && !fromIsNewNode;
    // Check if toId is an existing Cloud (not a new one)
    const toIsExistingCloud = toNode && toNode.category === 'Cloud' && !toIsNewNode;
    
    if (fromIsExistingCloud || toIsExistingCloud) {
      issues.push(
        `Flow "${operation.name || 'unnamed'}" подключен к существующему Cloud. При создании Flow необходимо создавать НОВЫЙ Cloud (add_node category="Cloud"), а не использовать существующий.`
      );
    }
  }
  
  return issues;
}

/**
 * Validate a single update_link operation
 */
function validateUpdateLink(
  operation: Extract<DiagramOperation, { operation: 'update_link' }>,
  context: DiagramContext
): string[] {
  const issues: string[] = [];
  
  // Check if link exists
  const link = context.links.find((l) => l.id === operation.linkId);
  if (!link) {
    issues.push(
      `Связь с ID "${operation.linkId}" не найдена в диаграмме. Проверьте правильность ID.`
    );
  }
  
  // If bidirectional is being set, validate that link type supports it
  if (operation.bidirectional !== undefined && link) {
    const config = getLinkConfig(link.category);
    if (config && !config.canBeBidirectional) {
      issues.push(
        `Связи типа '${link.category}' не могут быть двунаправленными`
      );
    }
  }
  
  return issues;
}

/**
 * Validate a single delete_link operation
 */
function validateDeleteLink(
  operation: Extract<DiagramOperation, { operation: 'delete_link' }>,
  context: DiagramContext
): string[] {
  const issues: string[] = [];
  
  // Check if link exists
  const link = context.links.find((l) => l.id === operation.linkId);
  if (!link) {
    issues.push(
      `Связь с ID "${operation.linkId}" не найдена в диаграмме.`
    );
  }
  
  return issues;
}

// ============================================================================
// ADDITIONAL VALIDATION HELPERS
// ============================================================================

/**
 * Check if a node has required fields filled
 */
function hasRequiredFields(operation: Extract<DiagramOperation, { operation: 'add_node' }>): string[] {
  const issues: string[] = [];
  
  switch (operation.category) {
    case 'Stock':
      if (operation.initialValue === undefined || operation.initialValue === '') {
        issues.push(`Stock "${operation.name}" должен иметь заполненное поле initialValue`);
      }
      break;
    case 'Variable':
      if (operation.value === undefined || operation.value === '') {
        issues.push(`Variable "${operation.name}" должен иметь заполненное поле value`);
      }
      break;
    case 'Converter':
      if (!operation.input || operation.input === '') {
        issues.push(`Converter "${operation.name}" должен иметь заполненное поле input`);
      }
      if (!operation.values || operation.values === '') {
        issues.push(`Converter "${operation.name}" должен иметь заполненное поле values`);
      }
      break;
    case 'Cloud':
      // Cloud не требует дополнительных полей
      break;
  }
  
  return issues;
}

/**
 * Check if add_link has required fields filled
 */
function hasRequiredLinkFields(operation: Extract<DiagramOperation, { operation: 'add_link' }>): string[] {
  const issues: string[] = [];
  
  if (operation.linkType === 'flow') {
    if (operation.flowRate === undefined || operation.flowRate === '') {
      issues.push(`Flow link "${operation.name || 'unnamed'}" должен иметь заполненное поле flowRate`);
    }
  }
  
  return issues;
}

/**
 * Extract element names from formula string
 * Looks for patterns like [ElementName] and returns all element names
 */
function extractFormulaReferences(formula: string | undefined): string[] {
  if (!formula || typeof formula !== 'string') return [];
  
  // Match all [ElementName] patterns
  const matches = formula.matchAll(/\[([^\]]+)\]/g);
  const references: string[] = [];
  
  for (const match of matches) {
    references.push(match[1].trim());
  }
  
  return references;
}

/**
 * Check if formula references are properly connected
 * Validates that all elements mentioned in formulas have corresponding connections
 */
function validateFormulaReferences(
  operation: Extract<DiagramOperation, { operation: 'add_node' | 'update_node' }>,
  context: DiagramContext,
  allOperations: DiagramOperation[]
): string[] {
  const issues: string[] = [];
  
  // Get formula value based on node type
  let formulaValue: string | undefined;
  
  if (operation.operation === 'add_node') {
    switch (operation.category) {
      case 'Stock':
        formulaValue = operation.initialValue ? String(operation.initialValue) : undefined;
        break;
      case 'Variable':
        formulaValue = operation.value ? String(operation.value) : undefined;
        break;
      case 'Converter':
        // Converter uses input field for reference
        formulaValue = operation.input ? String(operation.input) : undefined;
        break;
      case 'Cloud':
        // Cloud doesn't have formulas
        return issues;
    }
  } else {
    // update_node
    const value = operation.value || operation.initialValue || operation.input;
    formulaValue = value ? String(value) : undefined;
  }
  
  // Extract all referenced element names from formula
  const referencedElements = extractFormulaReferences(formulaValue);
  
  if (referencedElements.length === 0) {
    return issues; // No references to validate
  }
  
  // Get the node ID (for update_node) or name (for add_node)
  const currentNodeId = operation.operation === 'update_node' 
    ? operation.nodeId 
    : operation.name;
  
  // For each referenced element, check if there's a connection
  for (const refElementName of referencedElements) {
    // Find the referenced node in the context
    const referencedNode = context.nodes.find(
      (n) => n.name?.toLowerCase() === refElementName.toLowerCase()
    );
    
    // Check if referenced element is being created in this proposal
    const referencedIsNew = allOperations.some(
      (op): op is Extract<DiagramOperation, { operation: 'add_node' }> => 
        op.operation === 'add_node' && 
        op.name.toLowerCase() === refElementName.toLowerCase()
    );
    
    // Check if referenced element is being created as a link (flow edge)
    const referencedIsNewLink = allOperations.some(
      (op): op is Extract<DiagramOperation, { operation: 'add_link' }> => 
        op.operation === 'add_link' && 
        op.name?.toLowerCase() === refElementName.toLowerCase()
    );
    
    if (!referencedNode && !referencedIsNew && !referencedIsNewLink) {
      issues.push(
        `Формула ссылается на элемент "[${refElementName}]", который не существует в диаграмме. Проверьте правильность имени или создайте этот элемент.`
      );
      continue;
    }
    
    // Now check if there's a connection from the referenced element to the current node
    const referencedNodeId = referencedNode?.id || refElementName; // Use name for new nodes
    
    // Check existing links
    const hasExistingConnection = context.links.some((link) => {
      // Link type should be 'link' (not 'flow')
      if (link.category !== 'link') return false;
      
      // Check if link connects from referenced element to current node
      const connectsFromRef = link.from === referencedNodeId && link.to === currentNodeId;
      
      // For update_node, also check by ID in context
      const currentNodeInContext = context.nodes.find(n => n.id === currentNodeId);
      const connectsByName = currentNodeInContext && 
        link.from === referencedNodeId && 
        link.to === currentNodeInContext.id;
      
      return connectsFromRef || connectsByName;
    });
    
    // Check if connection is being created in this proposal
    const hasNewConnection = allOperations.some(
      (op): op is Extract<DiagramOperation, { operation: 'add_link' }> => 
        op.operation === 'add_link' && 
        op.linkType === 'link' &&
        op.fromId === refElementName && 
        op.toId === currentNodeId
    );
    
    if (!hasExistingConnection && !hasNewConnection) {
      const nodeName = operation.name || currentNodeId;
      issues.push(
        `Формула в "${nodeName}" ссылается на "[${refElementName}]", но нет связи (link) от "${refElementName}" к "${nodeName}". Добавьте add_link операцию: fromId="${refElementName}", toId="${nodeName}", linkType="link".`
      );
    }
  }
  
  return issues;
}

/**
 * Check if flow formula references are properly connected
 * Validates that all elements mentioned in flowRate formulas have corresponding connections to the flow edge
 */
function validateFlowFormulaReferences(
  operation: Extract<DiagramOperation, { operation: 'add_link' }>,
  context: DiagramContext,
  allOperations: DiagramOperation[]
): string[] {
  const issues: string[] = [];
  
  // Only validate flow links
  if (operation.linkType !== 'flow') return issues;
  
  const flowRate = operation.flowRate ? String(operation.flowRate) : undefined;
  const referencedElements = extractFormulaReferences(flowRate);
  
  if (referencedElements.length === 0) {
    return issues; // No references to validate
  }
  
  const flowName = operation.name || 'unnamed';
  
  // For each referenced element, check if there's a connection to this flow
  for (const refElementName of referencedElements) {
    // Find the referenced node in the context
    const referencedNode = context.nodes.find(
      (n) => n.name?.toLowerCase() === refElementName.toLowerCase()
    );
    
    // Check if referenced element is being created in this proposal
    const referencedIsNew = allOperations.some(
      (op): op is Extract<DiagramOperation, { operation: 'add_node' }> => 
        op.operation === 'add_node' && 
        op.name.toLowerCase() === refElementName.toLowerCase()
    );
    
    if (!referencedNode && !referencedIsNew) {
      issues.push(
        `Flow "${flowName}": формула flowRate ссылается на элемент "[${refElementName}]", который не существует в диаграмме. Проверьте правильность имени или создайте этот элемент.`
      );
      continue;
    }
    
    // Check if there's a connection from the referenced element to this flow (edge-to-edge)
    // This should be a separate add_link operation with toId = flowName
    const hasNewConnection = allOperations.some(
      (op): op is Extract<DiagramOperation, { operation: 'add_link' }> => 
        op.operation === 'add_link' && 
        op.linkType === 'link' &&
        op.fromId === refElementName && 
        op.toId === flowName
    );
    
    if (!hasNewConnection) {
      issues.push(
        `Flow "${flowName}": flowRate ссылается на "[${refElementName}]", но нет связи (link) от "${refElementName}" к flow "${flowName}". Добавьте add_link операцию (edge-to-edge): fromId="${refElementName}", toId="${flowName}", linkType="link".`
      );
    }
  }
  
  return issues;
}

/**
 * Check for orphan nodes (nodes without any connections)
 * Also checks that newly created flow edges have connections (for edge-to-edge)
 */
function checkForOrphanNodes(allOperations: DiagramOperation[]): string[] {
  const issues: string[] = [];
  
  // Get all add_node operations
  const addedNodes = allOperations.filter(
    (op): op is Extract<DiagramOperation, { operation: 'add_node' }> => op.operation === 'add_node'
  );
  
  // Get all add_link operations
  const addedLinks = allOperations.filter(
    (op): op is Extract<DiagramOperation, { operation: 'add_link' }> => op.operation === 'add_link'
  );
  
  // Check each new node
  for (const node of addedNodes) {
    const nodeName = node.name;
    
    // Check if this node is referenced in any link (as fromId or toId)
    // This includes both direct connections and connections to/from flow edges
    const hasConnection = addedLinks.some(
      (link) => link.fromId === nodeName || link.toId === nodeName
    );
    
    if (!hasConnection) {
      // Cloud nodes can be orphans (they might be used later for flows)
      if (node.category !== 'Cloud') {
        issues.push(
          `Узел "${nodeName}" (${node.category}) создается без связей. Каждый узел должен иметь хотя бы одну связь.`
        );
      }
    }
  }
  
  return issues;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate diagram modifications using deterministic rules
 * Replaces the reviewer LLM agent
 */
export function validateDiagramModifications(
  diagramContext: string,
  proposedModifications: DiagramModificationProposal
): ValidationResult {
  const issues: string[] = [];
  
  try {
    // Parse diagram context
    const context = parseDiagramContext(diagramContext);
    
    console.log('[Validation Script] Starting validation:', {
      nodesCount: context.nodes.length,
      linksCount: context.links.length,
      operationsCount: proposedModifications.operations.length,
    });
    
    // Track newly added nodes in this proposal (for validating links to new nodes)
    const newNodesInProposal = new Set<string>();
    // Track newly added links in this proposal (for validating edge-to-edge connections)
    const newLinksInProposal = new Map<string, string>(); // name -> linkType
    
    // Validate each operation
    for (const operation of proposedModifications.operations) {
      let operationIssues: string[] = [];
      
      switch (operation.operation) {
        case 'add_node':
          operationIssues = validateAddNode(operation, context, newNodesInProposal);
          // Check required fields for add_node
          operationIssues.push(...hasRequiredFields(operation));
          // Check formula references
          operationIssues.push(...validateFormulaReferences(operation, context, proposedModifications.operations));
          break;
        case 'update_node':
          operationIssues = validateUpdateNode(operation, context);
          // Check formula references for update_node
          operationIssues.push(...validateFormulaReferences(operation, context, proposedModifications.operations));
          break;
        case 'delete_node':
          operationIssues = validateDeleteNode(operation, context, proposedModifications.operations);
          break;
        case 'add_link':
          operationIssues = validateAddLink(operation, context, newNodesInProposal, newLinksInProposal);
          // Check required fields for add_link (e.g., flowRate for flows)
          operationIssues.push(...hasRequiredLinkFields(operation));
          // Check flow formula references (edge-to-edge connections)
          operationIssues.push(...validateFlowFormulaReferences(operation, context, proposedModifications.operations));
          // Track this new link for future edge-to-edge validations
          if (operation.name) {
            newLinksInProposal.set(operation.name, operation.linkType);
          }
          break;
        case 'update_link':
          operationIssues = validateUpdateLink(operation, context);
          break;
        case 'delete_link':
          operationIssues = validateDeleteLink(operation, context);
          break;
        default:
          operationIssues = [`Неизвестный тип операции: ${(operation as any).operation}`];
      }
      
      if (operationIssues.length > 0) {
        issues.push(...operationIssues.map((issue) => `[${operation.operation}] ${issue}`));
      }
    }
    
    // Check for orphan nodes (nodes without connections)
    const orphanIssues = checkForOrphanNodes(proposedModifications.operations);
    if (orphanIssues.length > 0) {
      issues.push(...orphanIssues.map((issue) => `[orphan_node] ${issue}`));
    }
    
    // Check operation order (nodes/links should be created before links that reference them)
    const nodeCreationIndex = new Map<string, number>();
    const linkCreationIndex = new Map<string, number>();
    
    proposedModifications.operations.forEach((op, index) => {
      if (op.operation === 'add_node') {
        nodeCreationIndex.set(op.name, index);
      } else if (op.operation === 'add_link' && op.name) {
        linkCreationIndex.set(op.name, index);
      }
    });
    
    proposedModifications.operations.forEach((op, index) => {
      if (op.operation === 'add_link') {
        // Check if fromId refers to a new node
        const fromNodeIndex = nodeCreationIndex.get(op.fromId);
        if (fromNodeIndex !== undefined && fromNodeIndex > index) {
          issues.push(
            `[add_link] Порядок операций нарушен: связь использует fromId="${op.fromId}" (node), который создается позже (операция ${fromNodeIndex}).`
          );
        }
        
        // Check if fromId refers to a new link (flow edge)
        const fromLinkIndex = linkCreationIndex.get(op.fromId);
        if (fromLinkIndex !== undefined && fromLinkIndex > index) {
          issues.push(
            `[add_link] Порядок операций нарушен: связь использует fromId="${op.fromId}" (flow edge), который создается позже (операция ${fromLinkIndex}).`
          );
        }
        
        // Check if toId refers to a new node
        const toNodeIndex = nodeCreationIndex.get(op.toId);
        if (toNodeIndex !== undefined && toNodeIndex > index) {
          issues.push(
            `[add_link] Порядок операций нарушен: связь использует toId="${op.toId}" (node), который создается позже (операция ${toNodeIndex}).`
          );
        }
        
        // Check if toId refers to a new link (flow edge)
        const toLinkIndex = linkCreationIndex.get(op.toId);
        if (toLinkIndex !== undefined && toLinkIndex > index) {
          issues.push(
            `[add_link] Порядок операций нарушен: связь использует toId="${op.toId}" (flow edge), который создается позже (операция ${toLinkIndex}). Flow должен быть создан РАНЬШЕ!`
          );
        }
      }
    });
    
    console.log('[Validation Script] Validation completed:', {
      isValid: issues.length === 0,
      issuesCount: issues.length,
    });
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error('[Validation Script] Validation error:', error);
    return {
      isValid: false,
      issues: [
        `Ошибка валидации: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

