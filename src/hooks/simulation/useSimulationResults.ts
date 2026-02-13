/**
 * Hook for simulation results display business logic.
 * 
 * Manages chart data generation and per-chart inline editing.
 * Supports different editing modes for each chart type:
 * - timeSeries/table: multi-select checkboxes
 * - scatterPlot: X/Y axis bubble selectors
 * 
 * Extracted from SimulationResultsModal to separate business logic from presentation.
 */

import { useMemo, useCallback, useState } from 'react';
import type * as go from 'gojs';
import type {
  SimulationRunResult,
  ResultChartConfig,
  ScatterPlotChartConfig,
  SelectableItem,
} from '../../utils/simulation';
import {
  generateAllChartsData,
  getSelectableItemsFromResults,
} from '../../utils/simulation';
import type { ChartInfo } from '../../utils/simulation';

// ─── Editing state types ──────────────────────────────────────────────────────

/** Editing state for timeSeries / table charts */
interface MultiSelectEditing {
  chartId: string;
  chartType: 'timeSeries' | 'table';
  selectedKeys: Set<string>;
}

/** Editing state for scatter plot charts */
interface ScatterEditing {
  chartId: string;
  chartType: 'scatterPlot';
  xAxisKey: string | undefined;
  yAxisKey: string | undefined;
}

/** Union of all editing states */
export type ChartEditingState = MultiSelectEditing | ScatterEditing;

// ─── Hook interface ───────────────────────────────────────────────────────────

export interface UseSimulationResultsParams {
  result: SimulationRunResult | null;
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  charts: ResultChartConfig[];
  onChartsUpdate?: (charts: ResultChartConfig[]) => void;
}

export interface UseSimulationResultsReturn {
  // Computed data
  availableItems: SelectableItem[];
  chartsData: ChartInfo[];

  // Stats
  timePointsCount: number;
  seriesCount: number;
  chartsCount: number;

  // Per-chart editing
  editingState: ChartEditingState | null;
  startEditing: (chartId: string) => void;
  cancelEditing: () => void;
  applyEditing: () => void;
  canApply: boolean;

  // Multi-select actions (timeSeries / table)
  handleToggleSeries: (key: string) => void;
  handleSelectAllSeries: () => void;
  handleClearAllSeries: () => void;

  // Scatter plot actions
  handleSetXAxis: (key: string | undefined) => void;
  handleSetYAxis: (key: string | undefined) => void;
}

// ─── Hook implementation ──────────────────────────────────────────────────────

export function useSimulationResults({
  result,
  nodeDataArray,
  linkDataArray,
  charts,
  onChartsUpdate,
}: UseSimulationResultsParams): UseSimulationResultsReturn {
  const [editingState, setEditingState] = useState<ChartEditingState | null>(null);

  // Get available items from results (includes vector elements)
  const availableItems = useMemo<SelectableItem[]>(() => {
    if (!result?.success) return [];
    return getSelectableItemsFromResults(result, nodeDataArray, linkDataArray);
  }, [result, nodeDataArray, linkDataArray]);

  // Generate chart data for display.
  // When editing a chart, use the editing state to preview changes live.
  const chartsData = useMemo(() => {
    if (!result) return [];

    const effectiveCharts = applyEditingPreview(charts, editingState);

    // If no charts exist and no editing, show default
    if (effectiveCharts.length === 0) {
      return generateAllChartsData([], result, nodeDataArray, linkDataArray);
    }

    return generateAllChartsData(effectiveCharts, result, nodeDataArray, linkDataArray);
  }, [result, nodeDataArray, linkDataArray, charts, editingState]);

  // --- Stats ---

  const timePointsCount = result?.times?.length ?? 0;
  const seriesCount = result?.series ? Object.keys(result.series).length : 0;
  const chartsCount = chartsData.length;

  // --- Per-chart editing ---

  const startEditing = useCallback((chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;

    switch (chart.type) {
      case 'timeSeries':
      case 'table':
        setEditingState({
          chartId: chart.id,
          chartType: chart.type,
          selectedKeys: new Set(chart.selectedKeys),
        });
        break;
      case 'scatterPlot':
        setEditingState({
          chartId: chart.id,
          chartType: 'scatterPlot',
          xAxisKey: chart.xAxisKey,
          yAxisKey: chart.yAxisKey,
        });
        break;
    }
  }, [charts]);

  const cancelEditing = useCallback(() => {
    setEditingState(null);
  }, []);

  const applyEditing = useCallback(() => {
    if (!editingState || !onChartsUpdate) return;

    const updatedCharts = charts.map(c => {
      if (c.id !== editingState.chartId) return c;

      if (editingState.chartType === 'scatterPlot') {
        return {
          ...c,
          xAxisKey: editingState.xAxisKey,
          yAxisKey: editingState.yAxisKey,
        } as ScatterPlotChartConfig;
      }
      // timeSeries / table
      return {
        ...c,
        selectedKeys: Array.from(editingState.selectedKeys),
      };
    });

    onChartsUpdate(updatedCharts);
    setEditingState(null);
  }, [editingState, charts, onChartsUpdate]);

  const canApply = !!onChartsUpdate;

  // --- Multi-select actions (timeSeries / table) ---

  const handleToggleSeries = useCallback((key: string) => {
    setEditingState(prev => {
      if (!prev || prev.chartType === 'scatterPlot') return prev;
      const newSet = new Set(prev.selectedKeys);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return { ...prev, selectedKeys: newSet };
    });
  }, []);

  const handleSelectAllSeries = useCallback(() => {
    setEditingState(prev => {
      if (!prev || prev.chartType === 'scatterPlot') return prev;
      return { ...prev, selectedKeys: new Set(availableItems.map(i => i.key)) };
    });
  }, [availableItems]);

  const handleClearAllSeries = useCallback(() => {
    setEditingState(prev => {
      if (!prev || prev.chartType === 'scatterPlot') return prev;
      return { ...prev, selectedKeys: new Set() };
    });
  }, []);

  // --- Scatter plot actions ---

  const handleSetXAxis = useCallback((key: string | undefined) => {
    setEditingState(prev => {
      if (!prev || prev.chartType !== 'scatterPlot') return prev;
      return { ...prev, xAxisKey: key };
    });
  }, []);

  const handleSetYAxis = useCallback((key: string | undefined) => {
    setEditingState(prev => {
      if (!prev || prev.chartType !== 'scatterPlot') return prev;
      return { ...prev, yAxisKey: key };
    });
  }, []);

  return {
    availableItems,
    chartsData,
    timePointsCount,
    seriesCount,
    chartsCount,
    editingState,
    startEditing,
    cancelEditing,
    applyEditing,
    canApply,
    handleToggleSeries,
    handleSelectAllSeries,
    handleClearAllSeries,
    handleSetXAxis,
    handleSetYAxis,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Merge editing state into charts for live preview while editing.
 */
function applyEditingPreview(
  charts: ResultChartConfig[],
  editing: ChartEditingState | null
): ResultChartConfig[] {
  if (!editing) return charts;

  return charts.map(c => {
    if (c.id !== editing.chartId) return c;

    if (editing.chartType === 'scatterPlot') {
      return {
        ...c,
        xAxisKey: editing.xAxisKey,
        yAxisKey: editing.yAxisKey,
      } as ScatterPlotChartConfig;
    }

    return {
      ...c,
      selectedKeys: Array.from(editing.selectedKeys),
    };
  });
}
