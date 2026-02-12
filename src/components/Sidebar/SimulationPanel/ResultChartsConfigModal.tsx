/**
 * Result Charts Configuration Modal - configure charts to display after simulation.
 * 
 * Supports: Time Series, Scatter Plot, and Table charts.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Modal, ModalActions } from '../../ui';
import { useAppSelector } from '../../../store/hooks';
import { 
  type ResultChartConfig, 
  type ChartType,
  type SelectableItem,
  getSelectableItems,
  resolveSimulationKeyName
} from '../../../utils/simulation';
import { nanoid } from 'nanoid';
import styles from './ResultChartsConfigModal.module.css';

export interface ResultChartsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  charts: ResultChartConfig[];
  onSave: (charts: ResultChartConfig[]) => void;
}

interface EditingChart {
  id: string;
  type: ChartType;
  title: string;
  selectedKeys: Set<string>;
  xAxisKey?: string;  // For scatter plot
  yAxisKey?: string;  // For scatter plot
}

export function ResultChartsConfigModal({
  isOpen,
  onClose,
  charts,
  onSave,
}: ResultChartsConfigModalProps) {
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);

  // Local state for editing
  const [localCharts, setLocalCharts] = useState<ResultChartConfig[]>(charts);
  const [editingChart, setEditingChart] = useState<EditingChart | null>(null);

  // Sync localCharts with incoming charts prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalCharts(charts);
    }
  }, [isOpen, charts]);

  // Get all available nodes and edges as selectable items using utility
  const availableItems = useMemo<SelectableItem[]>(() => {
    return getSelectableItems(nodeDataArray, linkDataArray);
  }, [nodeDataArray, linkDataArray]);

  // Start editing a new chart
  const handleAddChart = useCallback((type: ChartType) => {
    const titleMap: Record<ChartType, string> = {
      timeSeries: 'New Time Series',
      scatterPlot: 'New Scatter Plot',
      table: 'New Table',
    };
    
    setEditingChart({
      id: nanoid(),
      type,
      title: titleMap[type],
      selectedKeys: new Set(),
      xAxisKey: undefined,
      yAxisKey: undefined,
    });
  }, []);

  // Start editing existing chart
  const handleEditChart = useCallback((chart: ResultChartConfig) => {
    setEditingChart({
      id: chart.id,
      type: chart.type,
      title: chart.title,
      selectedKeys: new Set(chart.selectedKeys),
      xAxisKey: chart.type === 'scatterPlot' ? (chart as any).xAxisKey : undefined,
      yAxisKey: chart.type === 'scatterPlot' ? (chart as any).yAxisKey : undefined,
    });
  }, []);

  // Delete chart
  const handleDeleteChart = useCallback((chartId: string) => {
    setLocalCharts(prev => prev.filter(c => c.id !== chartId));
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingChart(null);
  }, []);

  // Save edited chart
  const handleSaveEdit = useCallback(() => {
    if (!editingChart) return;

    const baseConfig = {
      id: editingChart.id,
      type: editingChart.type,
      title: editingChart.title,
      selectedKeys: Array.from(editingChart.selectedKeys),
    };

    // Add type-specific configuration
    const chartConfig: ResultChartConfig = editingChart.type === 'scatterPlot'
      ? {
          ...baseConfig,
          xAxisKey: editingChart.xAxisKey,
          yAxisKey: editingChart.yAxisKey,
        } as any
      : baseConfig;

    setLocalCharts(prev => {
      const existing = prev.find(c => c.id === chartConfig.id);
      if (existing) {
        // Update existing
        return prev.map(c => c.id === chartConfig.id ? chartConfig : c);
      } else {
        // Add new
        return [...prev, chartConfig];
      }
    });

    setEditingChart(null);
  }, [editingChart]);

  // Toggle item selection
  const handleToggleItem = useCallback((key: string) => {
    if (!editingChart) return;

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
  }, [editingChart]);

  // Select all items
  const handleSelectAll = useCallback(() => {
    if (!editingChart) return;
    setEditingChart(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedKeys: new Set(availableItems.map(item => item.key)),
      };
    });
  }, [editingChart, availableItems]);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    if (!editingChart) return;
    setEditingChart(prev => {
      if (!prev) return prev;
      return { ...prev, selectedKeys: new Set() };
    });
  }, [editingChart]);

  // Apply changes
  const handleApply = useCallback(() => {
    onSave(localCharts);
    onClose();
  }, [localCharts, onSave, onClose]);

  // Cancel all changes
  const handleCancel = useCallback(() => {
    setLocalCharts(charts);
    setEditingChart(null);
    onClose();
  }, [charts, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Configure Result Charts"
      size="large"
      closeOnBackdropClick={false}
    >
      <div className={styles.container}>
        {/* Editor Section - shown when editing */}
        {editingChart && (
          <section className={styles.editorSection}>
            {/* Editor Header */}
            <div className={styles.editorHeader}>
              <h3 className={styles.editorTitle}>
                {localCharts.find(c => c.id === editingChart.id) ? 'Edit Chart' : 'Add New Chart'}
              </h3>
            </div>

            {/* Editor Content - Scrollable */}
            <div className={styles.editorContent}>
              {/* Chart Type Display */}
              <div className={styles.formField}>
                <label className={styles.label}>Chart Type</label>
                <div className={styles.chartTypeDisplay}>
                  {editingChart.type === 'timeSeries' && 'Time Series'}
                  {editingChart.type === 'scatterPlot' && 'Scatter Plot'}
                  {editingChart.type === 'table' && 'Table'}
                </div>
              </div>

              {/* Title Input */}
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="chart-title">
                  Chart Title
                </label>
                <input
                  id="chart-title"
                  type="text"
                  className={styles.input}
                  value={editingChart.title}
                  onChange={(e) => setEditingChart(prev => prev ? { ...prev, title: e.target.value } : prev)}
                  placeholder="Enter chart title..."
                />
              </div>

              {/* Scatter Plot Axis Selection with Bubbles */}
              {editingChart.type === 'scatterPlot' && (
                <>
                  {/* X-Axis Selection */}
                  <div className={styles.selectorSection}>
                    <div className={styles.selectorHeader}>
                      <span className={styles.selectorLabel}>
                        X-Axis Variable {editingChart.xAxisKey && '✓'}
                      </span>
                      {editingChart.xAxisKey && (
                        <button
                          type="button"
                          className={styles.selectAllButton}
                          onClick={() => setEditingChart(prev => prev ? { ...prev, xAxisKey: undefined } : prev)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={styles.selectedBubbles}>
                      {editingChart.xAxisKey ? (
                        <div className={styles.selectedBubble}>
                          {availableItems.find(i => i.key === editingChart.xAxisKey)?.displayName || editingChart.xAxisKey}
                          <span
                            className={styles.removeIcon}
                            onClick={() => setEditingChart(prev => prev ? { ...prev, xAxisKey: undefined } : prev)}
                          >
                            ×
                          </span>
                        </div>
                      ) : (
                        <span className={styles.emptySelection}>
                          Click on an item below to select X-axis
                        </span>
                      )}
                    </div>
                    <div className={styles.availableBubbles}>
                      {availableItems.length === 0 ? (
                        <span className={styles.emptySelection}>
                          No items available
                        </span>
                      ) : (
                        availableItems.map(item => (
                          <div
                            key={item.key}
                            className={`${styles.bubble} ${
                              editingChart.xAxisKey === item.key ? styles.selected : ''
                            }`}
                            onClick={() => setEditingChart(prev => prev ? { ...prev, xAxisKey: item.key } : prev)}
                          >
                            {item.displayName}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Y-Axis Selection */}
                  <div className={styles.selectorSection}>
                    <div className={styles.selectorHeader}>
                      <span className={styles.selectorLabel}>
                        Y-Axis Variable {editingChart.yAxisKey && '✓'}
                      </span>
                      {editingChart.yAxisKey && (
                        <button
                          type="button"
                          className={styles.selectAllButton}
                          onClick={() => setEditingChart(prev => prev ? { ...prev, yAxisKey: undefined } : prev)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={styles.selectedBubbles}>
                      {editingChart.yAxisKey ? (
                        <div className={styles.selectedBubble}>
                          {availableItems.find(i => i.key === editingChart.yAxisKey)?.displayName || editingChart.yAxisKey}
                          <span
                            className={styles.removeIcon}
                            onClick={() => setEditingChart(prev => prev ? { ...prev, yAxisKey: undefined } : prev)}
                          >
                            ×
                          </span>
                        </div>
                      ) : (
                        <span className={styles.emptySelection}>
                          Click on an item below to select Y-axis
                        </span>
                      )}
                    </div>
                    <div className={styles.availableBubbles}>
                      {availableItems.length === 0 ? (
                        <span className={styles.emptySelection}>
                          No items available
                        </span>
                      ) : (
                        availableItems.map(item => (
                          <div
                            key={item.key}
                            className={`${styles.bubble} ${
                              editingChart.yAxisKey === item.key ? styles.selected : ''
                            }`}
                            onClick={() => setEditingChart(prev => prev ? { ...prev, yAxisKey: item.key } : prev)}
                          >
                            {item.displayName}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Item Selection - for Time Series and Table */}
              {(editingChart.type === 'timeSeries' || editingChart.type === 'table') && (
                <>
                  {/* Selected Items Display */}
                  <div className={styles.selectorSection}>
                    <div className={styles.selectorHeader}>
                      <span className={styles.selectorLabel}>
                        Selected ({editingChart.selectedKeys.size})
                      </span>
                      {editingChart.selectedKeys.size > 0 && (
                        <button
                          type="button"
                          className={styles.selectAllButton}
                          onClick={handleClearAll}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={styles.selectedBubbles}>
                      {editingChart.selectedKeys.size === 0 ? (
                        <span className={styles.emptySelection}>
                          Click on items below to add
                        </span>
                      ) : (
                        Array.from(editingChart.selectedKeys).map(key => {
                          const item = availableItems.find(i => i.key === key);
                          return (
                            <div key={key} className={styles.selectedBubble}>
                              {item?.displayName || key}
                              <span
                                className={styles.removeIcon}
                                onClick={() => handleToggleItem(key)}
                              >
                                ×
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Available Items Selector */}
                  <div className={styles.selectorSection}>
                    <div className={styles.selectorHeader}>
                      <span className={styles.selectorLabel}>
                        Available Items
                      </span>
                      <button
                        type="button"
                        className={styles.selectAllButton}
                        onClick={handleSelectAll}
                      >
                        Select All
                      </button>
                    </div>
                    <div className={styles.availableBubbles}>
                      {availableItems.length === 0 ? (
                        <span className={styles.emptySelection}>
                          No items available
                        </span>
                      ) : (
                        availableItems.map(item => (
                          <div
                            key={item.key}
                            className={`${styles.bubble} ${
                              editingChart.selectedKeys.has(item.key) ? styles.selected : ''
                            }`}
                            onClick={() => handleToggleItem(item.key)}
                          >
                            {item.displayName}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Editor Actions */}
            <div className={styles.editorActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveEdit}
                disabled={
                  !editingChart.title.trim() || 
                  (editingChart.type === 'timeSeries' && editingChart.selectedKeys.size === 0) ||
                  (editingChart.type === 'scatterPlot' && (!editingChart.xAxisKey || !editingChart.yAxisKey)) ||
                  (editingChart.type === 'table' && editingChart.selectedKeys.size === 0)
                }
              >
                {localCharts.find(c => c.id === editingChart.id) ? 'Update' : 'Add'}
              </button>
            </div>
          </section>
        )}

        {/* Charts List - shown when not editing */}
        {!editingChart && (
          <>
            {/* Header with Add Buttons */}
            <div className={styles.header}>
              <h3 className={styles.headerTitle}>Configured Charts</h3>
              <div className={styles.addButtonsContainer}>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => handleAddChart('timeSeries')}
                  title="Add Time Series Chart"
                >
                  + Time Series
                </button>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => handleAddChart('scatterPlot')}
                  title="Add Scatter Plot"
                >
                  + Scatter Plot
                </button>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => handleAddChart('table')}
                  title="Add Table"
                >
                  + Table
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {localCharts.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3 className={styles.emptyStateTitle}>No charts configured</h3>
                  <p className={styles.emptyStateText}>
                    Click a button above to add a chart
                  </p>
                </div>
              ) : (
                <div className={styles.chartsList}>
                  {localCharts.map(chart => {
                    const typeLabel = 
                      chart.type === 'timeSeries' ? 'Time Series' :
                      chart.type === 'scatterPlot' ? 'Scatter Plot' :
                      'Table';
                    
                    const itemsInfo = 
                      chart.type === 'scatterPlot' 
                        ? `X: ${resolveSimulationKeyName((chart as any).xAxisKey, nodeDataArray, linkDataArray)}, Y: ${resolveSimulationKeyName((chart as any).yAxisKey, nodeDataArray, linkDataArray)}`
                        : `${chart.selectedKeys.length} item${chart.selectedKeys.length !== 1 ? 's' : ''}`;
                    
                    return (
                      <div key={chart.id} className={styles.chartItem}>
                        <div className={styles.chartHeader}>
                          <div>
                            <div className={styles.chartTitle}>{chart.title}</div>
                            <div className={styles.chartType}>
                              {typeLabel} • {itemsInfo}
                            </div>
                          </div>
                          <div className={styles.chartActions}>
                            <button
                              type="button"
                              className={styles.editButton}
                              onClick={() => handleEditChart(chart)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={styles.deleteButton}
                              onClick={() => handleDeleteChart(chart.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Actions - shown when not editing */}
        {!editingChart && (
          <div className={styles.footer}>
            <ModalActions
              cancelLabel="CANCEL"
              confirmLabel="APPLY"
              onCancel={handleCancel}
              onConfirm={handleApply}
              confirmVariant="primary"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

