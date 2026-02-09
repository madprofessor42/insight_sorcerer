import { useCallback } from 'react';

export interface NodeData {
  category: string;
  name: string;
  [key: string]: any;
}

/**
 * Hook to handle drag and drop from palette to diagram
 */
export function usePaletteDragDrop() {
  const handleDragStart = useCallback((
    e: React.DragEvent,
    nodeType: string,
    nodeData: NodeData
  ) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.setData('nodeData', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return { handleDragStart };
}

