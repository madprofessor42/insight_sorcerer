/**
 * Result Charts Configuration Modal - configure charts to display after simulation.
 * 
 * For now, only Time Series charts are supported.
 * Future: Scatter Plot and Table views.
 */

import { useState, useCallback, useMemo } from 'react';
import { Modal, ModalActions } from '../../ui';
import { useAppSelector } from '../../../store/hooks';
import { resolveNodeInfo, getLinkDisplayName } from '../../../utils/diagram-data';
import type { ResultChartConfig } from '../../../utils/simulation';
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
  title: string;
  selectedKeys: Set<string>;
}

/**
 * Available node/edge item for selection
 */
interface SelectableItem {
  key: string;
  displayName: string;
  type: 'node' | 'edge';
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

  // Get all available nodes and edges as selectable items
  const availableItems = useMemo<SelectableItem[]>(() => {
    const items: SelectableItem[] = [];

    // Add nodes
    for (const node of nodeDataArray) {
      const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
      items.push({
        key: String(node.key),
        displayName: nodeInfo.name,
        type: 'node',
      });
    }

    // Add edges (links)
    for (const link of linkDataArray) {
      items.push({
        key: String(link.key),
        displayName: getLinkDisplayName(link),
        type: 'edge',
      });
    }

    return items;
  }, [nodeDataArray, linkDataArray]);

  // Start editing a new chart
  const handleAddChart = useCallback(() => {
    setEditingChart({
      id: nanoid(),
      title: 'New Time Series',
      selectedKeys: new Set(),
    });
  }, []);

  // Start editing existing chart
  const handleEditChart = useCallback((chart: ResultChartConfig) => {
    setEditingChart({
      id: chart.id,
      title: chart.title,
      selectedKeys: new Set(chart.selectedKeys),
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

    const chartConfig: ResultChartConfig = {
      id: editingChart.id,
      type: 'timeSeries',
      title: editingChart.title,
      selectedKeys: Array.from(editingChart.selectedKeys),
    };

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
            <h3 className={styles.editorTitle}>
              {localCharts.find(c => c.id === editingChart.id) ? 'Edit Chart' : 'Add New Chart'}
            </h3>

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

            {/* Selected Items Display */}
            <div className={styles.selectorSection}>
              <div className={styles.selectorHeader}>
                <span className={styles.selectorLabel}>
                  Selected Items ({editingChart.selectedKeys.size})
                </span>
                {editingChart.selectedKeys.size > 0 && (
                  <button
                    type="button"
                    className={styles.selectAllButton}
                    onClick={handleClearAll}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className={styles.selectedBubbles}>
                {editingChart.selectedKeys.size === 0 ? (
                  <span className={styles.emptySelection}>
                    No items selected. Click on bubbles below to add.
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
                  Available Nodes & Edges
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
                    No nodes or edges available in diagram
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
                disabled={!editingChart.title.trim() || editingChart.selectedKeys.size === 0}
              >
                {localCharts.find(c => c.id === editingChart.id) ? 'Update' : 'Add'} Chart
              </button>
            </div>
          </section>
        )}

        {/* Charts List - shown when not editing */}
        {!editingChart && (
          <>
            {localCharts.length === 0 ? (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>No charts configured</h3>
                <p className={styles.emptyStateText}>
                  Add a chart to visualize simulation results
                </p>
              </div>
            ) : (
              <div className={styles.chartsList}>
                {localCharts.map(chart => (
                  <div key={chart.id} className={styles.chartItem}>
                    <div className={styles.chartHeader}>
                      <div>
                        <div className={styles.chartTitle}>{chart.title}</div>
                        <div className={styles.chartType}>Time Series</div>
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
                    <div className={styles.chartInfo}>
                      {chart.selectedKeys.length} item{chart.selectedKeys.length !== 1 ? 's' : ''} selected
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className={styles.addButton}
              onClick={handleAddChart}
            >
              + Add Time Series Chart
            </button>
          </>
        )}

        {/* Modal Actions - shown when not editing */}
        {!editingChart && (
          <ModalActions
            cancelLabel="CANCEL"
            confirmLabel="APPLY"
            onCancel={handleCancel}
            onConfirm={handleApply}
            confirmVariant="primary"
          />
        )}
      </div>
    </Modal>
  );
}

