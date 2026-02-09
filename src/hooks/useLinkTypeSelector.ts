import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setLinkType } from '../store/diagramSlice';
import type { LinkType } from '../store/diagramSlice';

/**
 * Hook to handle link type selection
 */
export function useLinkTypeSelector() {
  const dispatch = useAppDispatch();

  const handleLinkTypeChange = useCallback((type: LinkType) => {
    dispatch(setLinkType(type));
  }, [dispatch]);

  return { handleLinkTypeChange };
}

