import { useCallback } from 'react';
import * as go from 'gojs';
import type { SelectedEdgeData } from '../store/diagramSlice';

/**
 * Hook for edge operations (reset curve, reverse, bidirectional)
 */
export function useEdgeOperations() {

  const resetCurve = useCallback((edgeData: SelectedEdgeData) => {
    // Find the diagram and link
    const diagram = go.Diagram.fromDiv(document.querySelector('.diagram-component') as HTMLDivElement);
    if (!diagram) return;

    const model = diagram.model as go.GraphLinksModel;
    if (!(model instanceof go.GraphLinksModel)) return;

    // Find link by key
    const linkData = model.findLinkDataForKey(edgeData.key);
    if (!linkData) return;
    
    const link = diagram.findLinkForData(linkData);
    if (!link) return;

    diagram.startTransaction('reset curve');
    
    // Temporarily disable adjusting to force fresh calculation
    const oldAdjusting = link.adjusting;
    link.adjusting = go.Link.None;
    
    // Delete saved points from data
    delete link.data.points;
    
    // Reset curviness to 0
    link.curviness = 0;
    diagram.model.setDataProperty(link.data, 'curviness', 0);
    
    // Force complete route recalculation
    link.invalidateRoute();
    link.updateRoute();
    
    // Restore adjusting
    link.adjusting = oldAdjusting;
    
    diagram.commitTransaction('reset curve');
  }, []);

  const reverseDirection = useCallback((edgeData: SelectedEdgeData) => {
    const diagram = go.Diagram.fromDiv(document.querySelector('.diagram-component') as HTMLDivElement);
    if (!diagram) return;

    const model = diagram.model as go.GraphLinksModel;
    if (!(model instanceof go.GraphLinksModel)) return;

    // Find link by key
    const linkData = model.findLinkDataForKey(edgeData.key);
    if (!linkData) return;
    
    const link = diagram.findLinkForData(linkData);
    if (!link) return;

    diagram.startTransaction('reverse link');
    
    // Swap from and to
    const fromKey = link.data.from;
    const toKey = link.data.to;
    
    diagram.model.setDataProperty(link.data, 'from', toKey);
    diagram.model.setDataProperty(link.data, 'to', fromKey);
    
    // Reset curve shape since direction changed
    delete link.data.points;
    link.curviness = 0;
    diagram.model.setDataProperty(link.data, 'curviness', 0);
    
    diagram.commitTransaction('reverse link');
  }, []);

  const makeBidirectional = useCallback((edgeData: SelectedEdgeData) => {
    const diagram = go.Diagram.fromDiv(document.querySelector('.diagram-component') as HTMLDivElement);
    if (!diagram) return;

    const model = diagram.model as go.GraphLinksModel;
    if (!(model instanceof go.GraphLinksModel)) return;

    // Find link by key
    const linkData = model.findLinkDataForKey(edgeData.key);
    if (!linkData) return;
    
    const link = diagram.findLinkForData(linkData);
    if (!link) return;

    // Check if reverse link already exists
    const fromKey = link.data.from;
    const toKey = link.data.to;
    
    const reverseExists = model.linkDataArray.some(
      (linkData: go.ObjectData) => linkData.from === toKey && linkData.to === fromKey
    );

    if (reverseExists) {
      alert('Обратная связь уже существует!');
      return;
    }

    diagram.startTransaction('make bidirectional');
    
    // Create reverse link with same category
    const newLinkData = {
      from: toKey,
      to: fromKey,
      category: link.data.category || 'link',
    };
    
    model.addLinkData(newLinkData);
    
    diagram.commitTransaction('make bidirectional');
  }, []);

  return {
    resetCurve,
    reverseDirection,
    makeBidirectional,
  };
}

