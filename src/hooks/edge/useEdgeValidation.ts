import { useMemo } from 'react';
import * as go from 'gojs';
import { validateReverse, validateBidirectional } from '../../utils/link-validation';
import { getDiagramFromDOM } from '../../utils/diagram-access';

/**
 * Hook to validate edge operations
 * Returns validation results with human-readable reasons for UI display
 * @param selectedEdge - The currently selected edge data from linkDataArray
 * @returns Validation results for various edge operations
 */
export function useEdgeValidation(selectedEdge: go.ObjectData | null | undefined) {
  const reverseValidation = useMemo(() => {
    if (!selectedEdge) return { canReverse: false, reason: '' };

    const result = getDiagramFromDOM();
    if (!result) return { canReverse: false, reason: '' };

    const { model } = result;
    
    // Use centralized validation with automatic reason generation
    const validation = validateReverse(
      model,
      selectedEdge.from,
      selectedEdge.to,
      selectedEdge.category,
      selectedEdge.key
    );

    return {
      canReverse: validation.isValid,
      reason: validation.reason
    };
  }, [selectedEdge]);

  const bidirectionalValidation = useMemo(() => {
    if (!selectedEdge) return { canBeBidirectional: false, reason: '' };

    const result = getDiagramFromDOM();
    if (!result) return { canBeBidirectional: false, reason: '' };

    const { model } = result;
    
    // Use centralized validation for bidirectional with node information
    const validation = validateBidirectional(
      model,
      selectedEdge.from,
      selectedEdge.to,
      selectedEdge.category
    );

    return {
      canBeBidirectional: validation.isValid,
      reason: validation.reason
    };
  }, [selectedEdge]);

  return {
    canReverse: reverseValidation.canReverse,
    reverseReason: reverseValidation.reason,
    canBeBidirectional: bidirectionalValidation.canBeBidirectional,
    bidirectionalReason: bidirectionalValidation.reason,
  };
}

