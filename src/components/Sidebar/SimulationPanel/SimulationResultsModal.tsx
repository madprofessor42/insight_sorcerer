/**
 * Simulation Results Modal - displays simulation results with chart.
 * 
 * Shows either success (chart + statistics) or error message.
 */

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Modal } from '../../ui';
import type { SimulationRunResult } from '../../../utils/simulation';
import { generateChartColor } from '../../../utils/simulation/constants';
import { getChartOptions } from '../../../utils/simulation/chartConfig';
import { resolveNodeInfo, getLinkDisplayName } from '../../../utils/diagram-data';
import type * as go from 'gojs';
import styles from './SimulationResultsModal.module.css';

// Register Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface SimulationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationRunResult | null;
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
}

/**
 * Resolve display name for a simulation key.
 * Uses diagram-data utilities for consistency with the rest of the app.
 * 
 * @param key - Unique key (nanoid) for node or link
 * @param nodes - Node data array
 * @param links - Link data array
 * @returns Display name for the chart
 */
function resolveSimulationKeyName(
  key: go.Key,
  nodes: Array<go.ObjectData>,
  links: Array<go.ObjectData>
): string {
  // Try to find as node first
  const node = nodes.find(n => n.key === key);
  if (node) {
    const nodeInfo = resolveNodeInfo(key, nodes);
    return nodeInfo.name;
  }
  
  // Try to find as link
  const link = links.find(l => l.key === key);
  if (link) {
    return getLinkDisplayName(link);
  }
  
  // Fallback if not found
  return String(key);
}

export function SimulationResultsModal({
  isOpen,
  onClose,
  result,
  nodeDataArray,
  linkDataArray,
}: SimulationResultsModalProps) {
  const chartData = useMemo(() => {
    if (!result?.success || !result.times || !result.series) {
      return null;
    }

    // Create datasets for each series - resolve names on-demand from series keys
    const datasets = Object.entries(result.series).map(([key, values], index) => {
      // Use diagram-data utilities to resolve display name
      const label = resolveSimulationKeyName(key, nodeDataArray, linkDataArray);
      
      return {
        label,
        data: values,
        borderColor: generateChartColor(index),
        backgroundColor: generateChartColor(index),
        borderWidth: 2,
        pointRadius: 0, // Hide points for cleaner look
        pointHoverRadius: 4,
        tension: 0.1, // Slight curve
      };
    });

    return {
      labels: result.times.map(t => t.toString()),
      datasets,
    };
  }, [result, nodeDataArray, linkDataArray]);

  const chartOptions = useMemo(() => getChartOptions(), []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulation Results"
      size="large"
    >
      <div className={styles.container}>
        {!result && (
          <div className={styles.placeholder}>
            <p>No simulation results available</p>
          </div>
        )}

        {result && !result.success && (
          <div className={styles.error}>
            <h3 className={styles.errorTitle}>Simulation Failed</h3>
            <p className={styles.errorMessage}>{result.error}</p>
            {result.errorPrimitiveName && (
              <p className={styles.errorDetail}>
                Error in: <strong>{result.errorPrimitiveName}</strong>
                {result.errorPrimitiveId && ` (ID: ${result.errorPrimitiveId})`}
              </p>
            )}
          </div>
        )}

        {result && result.success && chartData && (
          <>
            <div className={styles.chartContainer}>
              <Line data={chartData} options={chartOptions} />
            </div>
            
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Time Points:</span>
                <span className={styles.statValue}>{result.times?.length || 0}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Series:</span>
                <span className={styles.statValue}>
                  {Object.keys(result.series || {}).length}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={onClose} className={styles.closeButton}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

