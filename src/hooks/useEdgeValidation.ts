import { useMemo } from 'react';
import * as go from 'gojs';
import type { SelectedEdgeData } from '../store/diagramSlice';
import { canReverseLink } from '../utils/link-validation';

/**
 * Hook to validate edge operations
 * @param selectedEdge - The currently selected edge
 * @returns Validation results for various edge operations
 */
export function useEdgeValidation(selectedEdge: SelectedEdgeData | null) {
  const canReverse = useMemo(() => {
    if (!selectedEdge) return false;

    // Find the diagram
    const diagram = go.Diagram.fromDiv(document.querySelector('.diagram-component') as HTMLDivElement);
    if (!diagram) return false;

    const model = diagram.model as go.GraphLinksModel;
    if (!(model instanceof go.GraphLinksModel)) return false;

    // Check if reversing would create a duplicate
    return canReverseLink(
      model,
      selectedEdge.from,
      selectedEdge.to,
      selectedEdge.category,
      selectedEdge.key
    );
  }, [selectedEdge]);

  return {
    canReverse,
  };
}

