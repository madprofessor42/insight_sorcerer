import { useMemo } from 'react';
import * as go from 'gojs';
import type { SelectedEdgeData } from '../store/diagramSlice';
import { hasDuplicateLink } from '../utils/link-validation';
import { isValidLinkSource, isValidLinkTarget, getLinkValidationErrorFrom, getLinkValidationErrorTo, DEFAULT_LINK_TYPE } from '../config/diagram-rules';
import type { LinkType } from '../store/diagramSlice';

/**
 * Hook to validate edge operations
 * @param selectedEdge - The currently selected edge
 * @returns Validation results for various edge operations:
 * - canReverse: whether the link can be reversed
 * - reverseReason: explanation message (shown in tooltip)
 */
export function useEdgeValidation(selectedEdge: SelectedEdgeData | null) {
  const reverseValidation = useMemo(() => {
    if (!selectedEdge) return { canReverse: false, reason: '' };

    // Find the diagram
    const diagram = go.Diagram.fromDiv(document.querySelector('.diagram-component') as HTMLDivElement);
    if (!diagram) return { canReverse: false, reason: '' };

    const model = diagram.model as go.GraphLinksModel;
    if (!(model instanceof go.GraphLinksModel)) return { canReverse: false, reason: '' };

    const fromKey = selectedEdge.from;
    const toKey = selectedEdge.to;
    const linkType = (selectedEdge.category || DEFAULT_LINK_TYPE) as LinkType;
    const linkKey = selectedEdge.key;

    // Check if reversing (toKey -> fromKey) would create a duplicate
    if (hasDuplicateLink(model, toKey, fromKey, linkType, linkKey)) {
      return { canReverse: false, reason: 'Разворот создаст дубликат связи' };
    }

    // Check if reversed direction would violate validation rules
    const fromNodeData = model.findNodeDataForKey(fromKey);
    const toNodeData = model.findNodeDataForKey(toKey);
    
    if (!fromNodeData || !toNodeData) return { canReverse: false, reason: '' };
    
    // Validate that toNode can be a source (after reverse)
    if (!isValidLinkSource(linkType, toNodeData.category)) {
      return { 
        canReverse: false, 
        reason: getLinkValidationErrorFrom(linkType)
      };
    }
    
    // Validate that fromNode can be a target (after reverse)
    if (!isValidLinkTarget(linkType, fromNodeData.category)) {
      return { 
        canReverse: false, 
        reason: getLinkValidationErrorTo(linkType)
      };
    }

    return { canReverse: true, reason: 'Развернуть направление связи' };
  }, [selectedEdge]);

  return {
    canReverse: reverseValidation.canReverse,
    reverseReason: reverseValidation.reason,
  };
}

