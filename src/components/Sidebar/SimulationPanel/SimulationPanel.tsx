/**
 * Simulation panel - UI for running simulations and viewing results.
 * 
 * Refactored following SRP - only handles UI rendering.
 */

import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setSimulationConfig } from '../../../store/diagramSlice';
import type { SimulationConfig } from '../../../types/simulation';
import { DEFAULT_SIMULATION_CONFIG } from '../../../types/simulation';
import { BugIcon } from '../../ui';
import { SimulationSettingsModal } from './SimulationSettingsModal';
import styles from './SimulationPanel.module.css';

export function SimulationPanel() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.diagram.simulationConfig);
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const selectedNodeKey = useAppSelector((state) => state.diagram.selectedNodeKey);
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
  const canRun = nodeDataArray.length > 0; // Simple check - can run if we have nodes
  
  const [showSettings, setShowSettings] = useState(false);

  // Only show when nothing is selected
  if (selectedNodeKey !== null || selectedEdgeKey !== null) {
    return null;
  }

  // Handle settings apply
  const handleApplySettings = useCallback((newConfig: SimulationConfig) => {
    dispatch(setSimulationConfig(newConfig));
  }, [dispatch]);

  // Handle run simulation
  const handleRunSimulation = useCallback(() => {
    // TODO: Implement simulation execution
    console.log('Running simulation with config:', config);
    alert('Simulation functionality will be implemented soon!');
  }, [config]);

  return (
    <section className={styles.panel}>
      {/* Header with bug icon button */}
      <div className={styles.header}>
        <h2 className={styles.title}>Simulation</h2>
        <button
          onClick={() => setShowSettings(true)}
          className={styles.settingsButton}
          title="Simulation Settings"
          aria-label="Open simulation settings"
        >
          <BugIcon width={18} height={18} />
        </button>
      </div>

      {/* Quick config display */}
      <div className={styles.configSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Start:</span>
          <span className={styles.summaryValue}>{config.timeStart ?? DEFAULT_SIMULATION_CONFIG.timeStart}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Length:</span>
          <span className={styles.summaryValue}>{config.timeLength ?? DEFAULT_SIMULATION_CONFIG.timeLength}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Step:</span>
          <span className={styles.summaryValue}>{config.timeStep ?? DEFAULT_SIMULATION_CONFIG.timeStep}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Units:</span>
          <span className={styles.summaryValue}>{config.timeUnits ?? DEFAULT_SIMULATION_CONFIG.timeUnits}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Algorithm:</span>
          <span className={styles.summaryValue}>{config.algorithm ?? DEFAULT_SIMULATION_CONFIG.algorithm}</span>
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={handleRunSimulation}
        disabled={!canRun}
        className={styles.runButton}
      >
        Run Simulation
      </button>

      {/* Settings Modal */}
      <SimulationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialConfig={config}
        onApply={handleApplySettings}
      />
    </section>
  );
}

