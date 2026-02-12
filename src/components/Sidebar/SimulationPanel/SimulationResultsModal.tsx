/**
 * Simulation Results Modal - displays simulation results with chart.
 * 
 * Shows either success (chart + statistics) or error message.
 * Supports multiple configured charts.
 */

import { useMemo, useCallback } from 'react';
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
import { Line, Scatter } from 'react-chartjs-2';
import { Modal } from '../../ui';
import type { SimulationRunResult, ResultChartConfig } from '../../../utils/simulation';
import { CHART_COLORS, CHART_DIMENSIONS, generateAllChartsData } from '../../../utils/simulation';
import { getChartOptions } from '../../../utils/simulation/chartConfig';
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
  charts: ResultChartConfig[];
}

export function SimulationResultsModal({
  isOpen,
  onClose,
  result,
  nodeDataArray,
  linkDataArray,
  charts,
}: SimulationResultsModalProps) {
  // Generate chart data for each configured chart using utility
  const chartsData = useMemo(() => {
    if (!result) return [];
    return generateAllChartsData(charts, result, nodeDataArray, linkDataArray);
  }, [result, nodeDataArray, linkDataArray, charts]);

  const getScatterChartOptions = useCallback((xLabel: string, yLabel: string) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: CHART_COLORS.text,
            font: {
              size: CHART_DIMENSIONS.fontSize.legend,
            },
          },
        },
        tooltip: {
          backgroundColor: CHART_COLORS.background,
          titleColor: CHART_COLORS.text,
          bodyColor: CHART_COLORS.textSecondary,
          borderColor: CHART_COLORS.border,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          type: 'linear' as const,
          title: {
            display: true,
            text: xLabel,
            color: CHART_COLORS.text,
            font: {
              size: CHART_DIMENSIONS.fontSize.axisLabel,
              weight: 'bold' as const,
            },
          },
          ticks: {
            color: CHART_COLORS.textSecondary,
            font: {
              size: CHART_DIMENSIONS.fontSize.tick,
            },
          },
          grid: {
            color: CHART_COLORS.grid,
          },
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            color: CHART_COLORS.text,
            font: {
              size: CHART_DIMENSIONS.fontSize.axisLabel,
              weight: 'bold' as const,
            },
          },
          ticks: {
            color: CHART_COLORS.textSecondary,
            font: {
              size: CHART_DIMENSIONS.fontSize.tick,
            },
          },
          grid: {
            color: CHART_COLORS.grid,
          },
        },
      },
    };
  }, []);

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

        {result && result.success && chartsData.length > 0 && (
          <>
            <div className={styles.chartsGrid}>
              {chartsData.map((chartInfo, index) => (
                <div key={index} className={styles.chartWrapper}>
                  <h3 className={styles.chartWrapperTitle}>{chartInfo.title}</h3>
                  <div className={styles.chartContainer}>
                    {chartInfo.type === 'timeSeries' && (
                      <Line data={chartInfo.data} options={chartOptions} />
                    )}
                    {chartInfo.type === 'scatterPlot' && (
                      <>
                        {(chartInfo as any).error ? (
                          <div className={styles.scatterError}>
                            {(chartInfo as any).error}
                          </div>
                        ) : (
                          <Scatter 
                            data={chartInfo.data} 
                            options={getScatterChartOptions(
                              (chartInfo as any).xLabel || 'X',
                              (chartInfo as any).yLabel || 'Y'
                            )} 
                          />
                        )}
                      </>
                    )}
                    {chartInfo.type === 'table' && (
                      <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>Time</th>
                              {(chartInfo as any).series.map((s: any) => (
                                <th key={s.key}>{s.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(chartInfo as any).times.map((time: number, i: number) => (
                              <tr key={i}>
                                <td>{time}</td>
                                {(chartInfo as any).series.map((s: any) => (
                                  <td key={s.key}>
                                    {typeof s.values[i] === 'number' 
                                      ? s.values[i].toFixed(4) 
                                      : s.values[i]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              <div className={styles.stat}>
                <span className={styles.statLabel}>Charts:</span>
                <span className={styles.statValue}>{chartsData.length}</span>
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

