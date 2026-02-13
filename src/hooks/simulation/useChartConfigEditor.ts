/**
 * Hook for chart configuration editor business logic.
 * 
 * Manages the state and operations for creating/editing chart configurations.
 * Extracted from ResultChartsConfigModal to separate business logic from presentation.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  type ResultChartConfig,
  type ChartType,
  type SelectableItem,
  type SimulationRunResult,
  getAvailableChartItems,
} from '../../utils/simulation';
import { nanoid } from 'nanoid';

/**
 * Internal editing state for a chart being created/modified.
 * Uses Set for selectedKeys for efficient toggle operations.
 */
export interface EditingChart {
  id: string;
  type: ChartType;
  title: string;
  selectedKeys: Set<string>;
  xAxisKey?: string;
  yAxisKey?: string;
}

/** Chart type to default title mapping */
const DEFAULT_CHART_TITLES: Record<ChartType, string> = {
  timeSeries: 'New Time Series',
  scatterPlot: 'New Scatter Plot',
  table: 'New Table',
};

export interface UseChartConfigEditorParams {
  /** Whether the modal is open (triggers sync with external charts) */
  isOpen: boolean;
  /** External chart configurations (source of truth) */
  charts: ResultChartConfig[];
  /** Callback to save changes */
  onSave: (charts: ResultChartConfig[]) => void;
  /** Callback to close the modal */
  onClose: () => void;
  /** Current simulation result (for getting available vector elements) */
  simulationResult?: SimulationRunResult | null;
}

export interface UseChartConfigEditorReturn {
  // State
  localCharts: ResultChartConfig[];
  editingChart: EditingChart | null;
  availableItems: SelectableItem[];

  // Derived state
  isEditing: boolean;
  isEditingExisting: boolean;
  canSaveEdit: boolean;

  // Chart list operations
  handleAddChart: (type: ChartType) => void;
  handleEditChart: (chart: ResultChartConfig) => void;
  handleDeleteChart: (chartId: string) => void;

  // Editor operations
  handleCancelEdit: () => void;
  handleSaveEdit: () => void;
  handleSetTitle: (title: string) => void;

  // Item selection (timeSeries / table)
  handleToggleItem: (key: string) => void;
  handleSelectAll: () => void;
  handleClearAll: () => void;

  // Axis selection (scatterPlot)
  handleSetXAxis: (key: string | undefined) => void;
  handleSetYAxis: (key: string | undefined) => void;

  // Modal-level actions
  handleApply: () => void;
  handleCancel: () => void;
}

/**
 * Hook encapsulating all chart config editor business logic.
 */
export function useChartConfigEditor({
  isOpen,
  charts,
  onSave,
  onClose,
  simulationResult,
}: UseChartConfigEditorParams): UseChartConfigEditorReturn {
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);
  const lastSimulationSeriesKeys = useAppSelector((state) => state.diagram.lastSimulationSeriesKeys);

  // Local state for editing
  const [localCharts, setLocalCharts] = useState<ResultChartConfig[]>(charts);
  const [editingChart, setEditingChart] = useState<EditingChart | null>(null);

  // Sync localCharts with incoming charts prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalCharts(charts);
    }
  }, [isOpen, charts]);

  // Get all available items for chart configuration
  const availableItems = useMemo<SelectableItem[]>(() => {
    return getAvailableChartItems(
      nodeDataArray,
      linkDataArray,
      simulationResult,
      lastSimulationSeriesKeys
    );
  }, [simulationResult, lastSimulationSeriesKeys, nodeDataArray, linkDataArray]);

  // --- Derived state ---

  const isEditing = editingChart !== null;
  const isEditingExisting = editingChart !== null && localCharts.some(c => c.id === editingChart.id);

  const canSaveEdit = useMemo(() => {
    if (!editingChart) return false;
    if (!editingChart.title.trim()) return false;
    
    switch (editingChart.type) {
      case 'timeSeries':
      case 'table':
        return editingChart.selectedKeys.size > 0;
      case 'scatterPlot':
        return !!editingChart.xAxisKey && !!editingChart.yAxisKey;
    }
  }, [editingChart]);

  // --- Chart list operations ---

  const handleAddChart = useCallback((type: ChartType) => {
    setEditingChart({
      id: nanoid(),
      type,
      title: DEFAULT_CHART_TITLES[type],
      selectedKeys: new Set(),
      xAxisKey: undefined,
      yAxisKey: undefined,
    });
  }, []);

  const handleEditChart = useCallback((chart: ResultChartConfig) => {
    // Filter out keys that no longer have valid primitives in the diagram
    const availableKeys = new Set(availableItems.map(item => item.key));
    const validSelectedKeys = chart.selectedKeys.filter(key => availableKeys.has(key));
    
    // Validate scatter plot axes
    let xAxisKey: string | undefined;
    let yAxisKey: string | undefined;
    
    if (chart.type === 'scatterPlot') {
      xAxisKey = chart.xAxisKey && availableKeys.has(chart.xAxisKey) ? chart.xAxisKey : undefined;
      yAxisKey = chart.yAxisKey && availableKeys.has(chart.yAxisKey) ? chart.yAxisKey : undefined;
    }
    
    setEditingChart({
      id: chart.id,
      type: chart.type,
      title: chart.title,
      selectedKeys: new Set(validSelectedKeys),
      xAxisKey,
      yAxisKey,
    });
  }, [availableItems]);

  const handleDeleteChart = useCallback((chartId: string) => {
    setLocalCharts(prev => prev.filter(c => c.id !== chartId));
  }, []);

  // --- Editor operations ---

  const handleCancelEdit = useCallback(() => {
    setEditingChart(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingChart) return;

    const chartConfig = buildChartConfig(editingChart);

    setLocalCharts(prev => {
      const existingIndex = prev.findIndex(c => c.id === chartConfig.id);
      if (existingIndex >= 0) {
        return prev.map(c => c.id === chartConfig.id ? chartConfig : c);
      }
      return [...prev, chartConfig];
    });

    setEditingChart(null);
  }, [editingChart]);

  const handleSetTitle = useCallback((title: string) => {
    setEditingChart(prev => prev ? { ...prev, title } : prev);
  }, []);

  // --- Item selection (timeSeries / table) ---

  const handleToggleItem = useCallback((key: string) => {
    setEditingChart(prev => {
      if (!prev) return prev;
      const newSelected = new Set(prev.selectedKeys);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      return { ...prev, selectedKeys: newSelected };
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setEditingChart(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedKeys: new Set(availableItems.map(item => item.key)),
      };
    });
  }, [availableItems]);

  const handleClearAll = useCallback(() => {
    setEditingChart(prev => {
      if (!prev) return prev;
      return { ...prev, selectedKeys: new Set() };
    });
  }, []);

  // --- Axis selection (scatterPlot) ---

  const handleSetXAxis = useCallback((key: string | undefined) => {
    setEditingChart(prev => prev ? { ...prev, xAxisKey: key } : prev);
  }, []);

  const handleSetYAxis = useCallback((key: string | undefined) => {
    setEditingChart(prev => prev ? { ...prev, yAxisKey: key } : prev);
  }, []);

  // --- Modal-level actions ---

  const handleApply = useCallback(() => {
    onSave(localCharts);
    onClose();
  }, [localCharts, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setLocalCharts(charts);
    setEditingChart(null);
    onClose();
  }, [charts, onClose]);

  return {
    localCharts,
    editingChart,
    availableItems,
    isEditing,
    isEditingExisting,
    canSaveEdit,
    handleAddChart,
    handleEditChart,
    handleDeleteChart,
    handleCancelEdit,
    handleSaveEdit,
    handleSetTitle,
    handleToggleItem,
    handleSelectAll,
    handleClearAll,
    handleSetXAxis,
    handleSetYAxis,
    handleApply,
    handleCancel,
  };
}

/**
 * Convert editing state back to a persisted chart config.
 */
function buildChartConfig(editing: EditingChart): ResultChartConfig {
  const selectedKeys = Array.from(editing.selectedKeys);

  switch (editing.type) {
    case 'timeSeries':
      return { id: editing.id, type: 'timeSeries', title: editing.title, selectedKeys };
    case 'table':
      return { id: editing.id, type: 'table', title: editing.title, selectedKeys };
    case 'scatterPlot':
      return {
        id: editing.id,
        type: 'scatterPlot',
        title: editing.title,
        selectedKeys,
        xAxisKey: editing.xAxisKey,
        yAxisKey: editing.yAxisKey,
      };
  }
}

