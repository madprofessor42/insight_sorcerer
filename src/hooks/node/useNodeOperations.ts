import { useCallback } from 'react';
import * as go from 'gojs';
import { withNode } from '../../utils/diagram-access';

/**
 * Hook for node operations (update properties, etc.)
 */
export function useNodeOperations() {
  /**
   * Update a property of a node
   */
  const updateNodeProperty = useCallback((nodeKey: go.Key, propertyKey: string, value: any) => {
    withNode(nodeKey, (diagram, model, nodeData) => {
      diagram.startTransaction('update node property');
      model.setDataProperty(nodeData, propertyKey, value);
      diagram.commitTransaction('update node property');
      // GoJS automatically calls onModelChange, which then syncs with Redux
    });
  }, []);

  return {
    updateNodeProperty,
  };
}

