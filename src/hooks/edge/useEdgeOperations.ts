import { useCallback } from 'react';
import * as go from 'gojs';
import { withLink } from '../../utils/diagram-access';
import { validateBidirectional, validateReverse } from '../../utils/link-validation';

/**
 * Hook for edge operations (reset curve, reverse, bidirectional)
 */
export function useEdgeOperations() {

  /**
   * Reset link curve to default straight line
   * Note: No validation needed - this is a pure UI operation that doesn't
   * change the graph structure, only the visual representation of the link
   */
  const resetCurve = useCallback((edgeData: go.ObjectData) => {
    withLink(edgeData.key, (diagram, _model, _linkData, link) => {
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
    });
  }, []);

  const reverseDirection = useCallback((edgeData: go.ObjectData) => {
    withLink(edgeData.key, (diagram, model, _linkData, link) => {
      // Validate if this link can be reversed
      const validation = validateReverse(
        model, 
        link.data.from, 
        link.data.to, 
        link.data.category, 
        link.data.key
      );
      
      if (!validation.isValid) {
        console.warn(`⚠️  ${validation.reason}`);
        return;
      }

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
    });
  }, []);

  const toggleBidirectional = useCallback((edgeData: go.ObjectData) => {
    withLink(edgeData.key, (diagram, model, _linkData, link) => {
      // Validate if this specific link can be bidirectional
      const validation = validateBidirectional(model, link.data.from, link.data.to, link.data.category);
      
      if (!validation.isValid) {
        console.warn(`⚠️  ${validation.reason}`);
        return;
      }

      diagram.startTransaction('toggle bidirectional');
      
      // Toggle bidirectional property
      const currentValue = link.data.bidirectional === true;
      model.setDataProperty(link.data, 'bidirectional', !currentValue);
      
      diagram.commitTransaction('toggle bidirectional');
    });
  }, []);

  /**
   * Update a property on an edge
   * Follows GoJS best practices: change GoJS model → onModelChange syncs to Redux
   */
  const updateEdgeProperty = useCallback((edgeKey: go.Key, propertyKey: string, value: any) => {
    withLink(edgeKey, (diagram, model, linkData) => {
      diagram.startTransaction('update link property');
      model.setDataProperty(linkData, propertyKey, value);
      diagram.commitTransaction('update link property');
      // GoJS will automatically call onModelChange
      // → useDiagramModelSync will sync to Redux
      // → EdgePanel will get updated selectedEdge from Redux
    });
  }, []);

  return {
    resetCurve,
    reverseDirection,
    toggleBidirectional,
    updateEdgeProperty,
  };
}

