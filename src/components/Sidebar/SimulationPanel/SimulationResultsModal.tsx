/**
 * Simulation Results Modal - displays simulation results with charts.
 * 
 * Pure presentational component. All business logic lives in useSimulationResults hook.
 * Each chart has inline editing with type-appropriate controls:
 * - timeSeries/table → checkbox grid
 * - scatterPlot → X/Y axis bubble selectors
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
import { CHART_COLORS, CHART_DIMENSIONS } from '../../../utils/simulation';
import { getChartOptions } from '../../../utils/simulation/chartConfig';
import type { ChartInfo, ScatterPlotChartInfo, TableChartInfo } from '../../../utils/simulation';
import { useSimulationResults, type ChartEditingState } from '../../../hooks/simulation';
import type { SelectableItem } from '../../../utils/simulation';
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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SimulationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationRunResult | null;
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  charts: ResultChartConfig[];
  onChartsUpdate?: (charts: ResultChartConfig[]) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SimulationResultsModal({
  isOpen,
  onClose,
  result,
  nodeDataArray,
  linkDataArray,
  charts,
  onChartsUpdate,
}: SimulationResultsModalProps) {
  const sim = useSimulationResults({
    result,
    nodeDataArray,
    linkDataArray,
    charts,
    onChartsUpdate,
  });

  const chartOptions = useMemo(() => getChartOptions(), []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulation Results"
      size="large"
    >
      <div className={styles.container}>
        {/* No results */}
        {!result && (
          <div className={styles.placeholder}>
            <p>No simulation results available</p>
          </div>
        )}

        {/* Error state */}
        {result && !result.success && (
          <ErrorDisplay result={result} />
        )}

        {/* Success state */}
        {result && result.success && (
          <>
            {/* Charts */}
            {sim.chartsData.length > 0 && (
              <div className={styles.chartsGrid}>
                {sim.chartsData.map((chartInfo, index) => {
                  const chartConfig = charts[index];
                  const isEditing = sim.editingState?.chartId === chartConfig?.id;

                  return (
                    <div key={chartConfig?.id ?? index} className={styles.chartWrapper}>
                      {/* Chart header with title and edit button */}
                      <div className={styles.chartWrapperHeader}>
                        <h3 className={styles.chartWrapperTitle}>{chartInfo.title}</h3>
                        {chartConfig && onChartsUpdate && (
                          <button
                            className={styles.chartEditBtn}
                            onClick={() => isEditing ? sim.cancelEditing() : sim.startEditing(chartConfig.id)}
                            title={isEditing ? 'Close editor' : 'Edit series'}
                          >
                            {isEditing ? '✕' : '⚙️'}
                          </button>
                        )}
                      </div>

                      {/* Inline editor — shown when this chart is being edited */}
                      {isEditing && sim.editingState && (
                        <ChartInlineEditor
                          editingState={sim.editingState}
                          availableItems={sim.availableItems}
                          onToggle={sim.handleToggleSeries}
                          onSelectAll={sim.handleSelectAllSeries}
                          onClearAll={sim.handleClearAllSeries}
                          onSetXAxis={sim.handleSetXAxis}
                          onSetYAxis={sim.handleSetYAxis}
                          onApply={sim.applyEditing}
                          onCancel={sim.cancelEditing}
                          canApply={sim.canApply}
                        />
                      )}

                      {/* Chart visualization */}
                      <div className={styles.chartContainer}>
                        <ChartContent
                          chartInfo={chartInfo}
                          chartOptions={chartOptions}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats bar */}
            <StatsBar
              timePoints={sim.timePointsCount}
              series={sim.seriesCount}
              charts={sim.chartsCount}
            />

            {/* Close button */}
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

// ─── Inline chart editor (per-chart) ─────────────────────────────────────────

function ChartInlineEditor({
  editingState,
  availableItems,
  onToggle,
  onSelectAll,
  onClearAll,
  onSetXAxis,
  onSetYAxis,
  onApply,
  onCancel,
  canApply,
}: {
  editingState: ChartEditingState;
  availableItems: SelectableItem[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSetXAxis: (key: string | undefined) => void;
  onSetYAxis: (key: string | undefined) => void;
  onApply: () => void;
  onCancel: () => void;
  canApply: boolean;
}) {
  if (editingState.chartType === 'scatterPlot') {
    return (
      <ScatterAxisEditor
        xAxisKey={editingState.xAxisKey}
        yAxisKey={editingState.yAxisKey}
        availableItems={availableItems}
        onSetXAxis={onSetXAxis}
        onSetYAxis={onSetYAxis}
        onApply={onApply}
        onCancel={onCancel}
        canApply={canApply}
      />
    );
  }

  return (
    <SeriesSelectorPanel
      selectedKeys={editingState.selectedKeys}
      availableItems={availableItems}
      onToggle={onToggle}
      onSelectAll={onSelectAll}
      onClearAll={onClearAll}
      onApply={onApply}
      onCancel={onCancel}
      canApply={canApply}
    />
  );
}

// ─── Scatter axis editor (bubble selectors for X and Y) ──────────────────────

function ScatterAxisEditor({
  xAxisKey,
  yAxisKey,
  availableItems,
  onSetXAxis,
  onSetYAxis,
  onApply,
  onCancel,
  canApply,
}: {
  xAxisKey: string | undefined;
  yAxisKey: string | undefined;
  availableItems: SelectableItem[];
  onSetXAxis: (key: string | undefined) => void;
  onSetYAxis: (key: string | undefined) => void;
  onApply: () => void;
  onCancel: () => void;
  canApply: boolean;
}) {
  return (
    <div className={styles.inlineEditor}>
      {/* X-Axis row */}
      <div className={styles.axisRow}>
        <div className={styles.axisLabel}>
          <span className={styles.axisLabelText}>X-Axis</span>
          {xAxisKey && (
            <button className={styles.axisClearBtn} onClick={() => onSetXAxis(undefined)}>Clear</button>
          )}
        </div>
        <div className={styles.axisBubbles}>
          {availableItems.length === 0 ? (
            <span className={styles.emptyHint}>No items available</span>
          ) : (
            availableItems.map(item => (
              <button
                key={item.key}
                className={`${styles.axisBubble} ${xAxisKey === item.key ? styles.axisBubbleSelected : ''}`}
                onClick={() => onSetXAxis(xAxisKey === item.key ? undefined : item.key)}
              >
                {item.displayName}
                {item.isVectorElement && <span className={styles.vectorBadge}>v</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Y-Axis row */}
      <div className={styles.axisRow}>
        <div className={styles.axisLabel}>
          <span className={styles.axisLabelText}>Y-Axis</span>
          {yAxisKey && (
            <button className={styles.axisClearBtn} onClick={() => onSetYAxis(undefined)}>Clear</button>
          )}
        </div>
        <div className={styles.axisBubbles}>
          {availableItems.length === 0 ? (
            <span className={styles.emptyHint}>No items available</span>
          ) : (
            availableItems.map(item => (
              <button
                key={item.key}
                className={`${styles.axisBubble} ${yAxisKey === item.key ? styles.axisBubbleSelected : ''}`}
                onClick={() => onSetYAxis(yAxisKey === item.key ? undefined : item.key)}
              >
                {item.displayName}
                {item.isVectorElement && <span className={styles.vectorBadge}>v</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.inlineEditorActions}>
        <button className={styles.clearAllBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.applyBtn} onClick={onApply} disabled={!canApply}>
          Apply & Save
        </button>
      </div>
    </div>
  );
}

// ─── Series selector for timeSeries / table ───────────────────────────────────

function SeriesSelectorPanel({
  selectedKeys,
  availableItems,
  onToggle,
  onSelectAll,
  onClearAll,
  onApply,
  onCancel,
  canApply,
}: {
  selectedKeys: Set<string>;
  availableItems: SelectableItem[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onApply: () => void;
  onCancel: () => void;
  canApply: boolean;
}) {
  return (
    <div className={styles.inlineEditor}>
      <div className={styles.selectorHeader}>
        <h4 className={styles.selectorTitle}>
          Select Series ({selectedKeys.size})
        </h4>
        <div className={styles.selectorActions}>
          <button onClick={onSelectAll} className={styles.selectAllBtn}>Select All</button>
          <button onClick={onClearAll} className={styles.clearAllBtn}>Clear</button>
        </div>
      </div>
      <div className={styles.seriesList}>
        {availableItems.map(item => (
          <label key={item.key} className={styles.seriesItem}>
            <input
              type="checkbox"
              checked={selectedKeys.has(item.key)}
              onChange={() => onToggle(item.key)}
              className={styles.seriesCheckbox}
            />
            <span className={styles.seriesName}>
              {item.displayName}
              {item.isVectorElement && (
                <span className={styles.vectorBadge}>vector</span>
              )}
            </span>
          </label>
        ))}
      </div>
      <div className={styles.inlineEditorActions}>
        <button className={styles.clearAllBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.applyBtn} onClick={onApply} disabled={!canApply}>
          Apply & Save
        </button>
      </div>
    </div>
  );
}

// ─── Chart content renderer ───────────────────────────────────────────────────

function ChartContent({
  chartInfo,
  chartOptions,
}: {
  chartInfo: ChartInfo;
  chartOptions: ReturnType<typeof getChartOptions>;
}) {
  const getScatterChartOptions = useCallback((xLabel: string, yLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: CHART_COLORS.text,
          font: { size: CHART_DIMENSIONS.fontSize.legend },
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
          font: { size: CHART_DIMENSIONS.fontSize.axisLabel, weight: 'bold' as const },
        },
        ticks: {
          color: CHART_COLORS.textSecondary,
          font: { size: CHART_DIMENSIONS.fontSize.tick },
        },
        grid: { color: CHART_COLORS.grid },
      },
      y: {
        title: {
          display: true,
          text: yLabel,
          color: CHART_COLORS.text,
          font: { size: CHART_DIMENSIONS.fontSize.axisLabel, weight: 'bold' as const },
        },
        ticks: {
          color: CHART_COLORS.textSecondary,
          font: { size: CHART_DIMENSIONS.fontSize.tick },
        },
        grid: { color: CHART_COLORS.grid },
      },
    },
  }), []);

  switch (chartInfo.type) {
    case 'timeSeries':
      return <Line data={chartInfo.data} options={chartOptions} />;

    case 'scatterPlot':
      return <ScatterChartContent chartInfo={chartInfo} getOptions={getScatterChartOptions} />;

    case 'table':
      return <TableChart chartInfo={chartInfo} />;
  }
}

/** Scatter chart content (handles error state) */
function ScatterChartContent({
  chartInfo,
  getOptions,
}: {
  chartInfo: ScatterPlotChartInfo;
  getOptions: (xLabel: string, yLabel: string) => Record<string, unknown>;
}) {
  if (chartInfo.error) {
    return <div className={styles.scatterError}>{chartInfo.error}</div>;
  }

  return (
    <Scatter
      data={chartInfo.data}
      options={getOptions(chartInfo.xLabel || 'X', chartInfo.yLabel || 'Y') as any}
    />
  );
}

/** Table chart display */
function TableChart({ chartInfo }: { chartInfo: TableChartInfo }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Time</th>
            {chartInfo.series.map(s => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartInfo.times.map((time, i) => (
            <tr key={i}>
              <td>{time}</td>
              {chartInfo.series.map(s => (
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
  );
}

// ─── Shared presentational sub-components ─────────────────────────────────────

/** Error display for failed simulation */
function ErrorDisplay({ result }: { result: SimulationRunResult }) {
  return (
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
  );
}

/** Stats bar showing summary numbers */
function StatsBar({ timePoints, series, charts }: { timePoints: number; series: number; charts: number }) {
  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Time Points:</span>
        <span className={styles.statValue}>{timePoints}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Series:</span>
        <span className={styles.statValue}>{series}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Charts:</span>
        <span className={styles.statValue}>{charts}</span>
      </div>
    </div>
  );
}
