/**
 * Hook for auto-saving simulation config to localStorage on every change
 */

import { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/hooks';
import { saveSimulationConfig } from './useDiagramAutoSave';

/**
 * Auto-save simulation config whenever it changes
 */
export function useSimulationConfigAutoSave() {
  const simulationConfig = useAppSelector((state) => state.diagram.simulationConfig);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid saving on initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log('🔵 useSimulationConfigAutoSave: First render, skipping save');
      return;
    }
    
    // Save to localStorage whenever config changes
    console.log('🔵 useSimulationConfigAutoSave: Config changed, saving...', simulationConfig);
    saveSimulationConfig(simulationConfig);
  }, [simulationConfig]);
}

