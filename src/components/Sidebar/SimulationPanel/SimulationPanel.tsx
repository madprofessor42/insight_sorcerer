/**
 * Simulation panel - UI for running simulations and viewing results.
 * 
 * Refactored following SRP - only handles UI rendering.
 */

import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setSimulationConfig, setResultCharts, setLastSimulationSeriesKeys } from '../../../store/diagramSlice';
import type { SimulationConfig } from '../../../utils/simulation';
import { DEFAULT_SIMULATION_CONFIG, expandVectorKeysInCharts } from '../../../utils/simulation';
import { BugIcon, ChartIcon } from '../../ui';
import { SimulationSettingsModal } from './SimulationSettingsModal';
import { SimulationResultsModal } from './SimulationResultsModal';
import { ResultChartsConfigModal } from './ResultChartsConfigModal';
import { runSimulation } from '../../../utils/simulation';
import type { SimulationRunResult } from '../../../utils/simulation';
import styles from './SimulationPanel.module.css';

export function SimulationPanel() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.diagram.simulationConfig);
  const resultCharts = useAppSelector((state) => state.diagram.resultCharts);
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);
  const selectedNodeKey = useAppSelector((state) => state.diagram.selectedNodeKey);
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
  const canRun = nodeDataArray.length > 0; // Simple check - can run if we have nodes
  
  const [showSettings, setShowSettings] = useState(false);
  const [showChartsConfig, setShowChartsConfig] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Handle settings apply
  const handleApplySettings = useCallback((newConfig: SimulationConfig) => {
    dispatch(setSimulationConfig(newConfig));
  }, [dispatch]);

  // Handle charts config apply
  const handleApplyChartsConfig = useCallback((charts: typeof resultCharts) => {
    dispatch(setResultCharts(charts));
  }, [dispatch]);

  // Handle run simulation
  const handleRunSimulation = useCallback(async () => {
    setIsRunning(true);
    try {
      const result = await runSimulation(nodeDataArray, linkDataArray, config);
      setSimulationResult(result);
      
      // Save series keys to Redux store (for preserving vector elements across reloads)
      if (result.success && result.series) {
        dispatch(setLastSimulationSeriesKeys(Object.keys(result.series)));
        
        // Auto-expand vector keys in chart configurations
        // If a selected primitive turned out to be a vector, replace it with its elements
        const expandedCharts = expandVectorKeysInCharts(resultCharts, result);
        if (JSON.stringify(expandedCharts) !== JSON.stringify(resultCharts)) {
          dispatch(setResultCharts(expandedCharts));
        }
      }
      
      setShowResults(true);
    } catch (error) {
      const errorResult: SimulationRunResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      setSimulationResult(errorResult);
      setShowResults(true);
    } finally {
      setIsRunning(false);
    }
  }, [nodeDataArray, linkDataArray, config, resultCharts, dispatch]);

  // Only show when nothing is selected
  if (selectedNodeKey !== null || selectedEdgeKey !== null) {
    return null;
  }

  return (
    <section className={styles.panel}>
      {/* Header with title and config buttons */}
      <div className={styles.header}>
        <h2 className={styles.title}>Simulation</h2>
        <div className={styles.headerButtons}>
          <button
            onClick={() => setShowSettings(true)}
            className={styles.settingsButton}
            title="Simulation Settings"
            aria-label="Open simulation settings"
          >
            <BugIcon width={18} height={18} />
          </button>
          <button
            onClick={() => setShowChartsConfig(true)}
            className={styles.chartsButton}
            title="Configure Result Charts"
            aria-label="Configure result charts"
          >
            <ChartIcon width={18} height={18} />
          </button>
        </div>
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
        disabled={!canRun || isRunning}
        className={styles.runButton}
      >
        {isRunning ? 'Running...' : 'Run Simulation'}
      </button>

      {/* Settings Modal */}
      <SimulationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialConfig={config}
        onApply={handleApplySettings}
      />

      {/* Result Charts Config Modal */}
      <ResultChartsConfigModal
        isOpen={showChartsConfig}
        onClose={() => setShowChartsConfig(false)}
        charts={resultCharts}
        onSave={handleApplyChartsConfig}
        simulationResult={simulationResult}
      />

      {/* Results Modal */}
      <SimulationResultsModal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        result={simulationResult}
        nodeDataArray={nodeDataArray}
        linkDataArray={linkDataArray}
        charts={resultCharts}
        onChartsUpdate={handleApplyChartsConfig}
      />
    </section>
  );
}

