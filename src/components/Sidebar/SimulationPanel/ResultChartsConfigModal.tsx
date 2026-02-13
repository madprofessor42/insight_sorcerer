/**
 * Result Charts Configuration Modal - configure charts to display after simulation.
 * 
 * Pure presentational component. All business logic lives in useChartConfigEditor hook.
 * Supports: Time Series, Scatter Plot, and Table charts.
 */

import { Modal, ModalActions } from '../../ui';
import { useAppSelector } from '../../../store/hooks';
import { 
  type ResultChartConfig, 
  type SimulationRunResult,
  type SelectableItem,
  resolveSimulationKeyName,
} from '../../../utils/simulation';
import { useChartConfigEditor, type EditingChart } from '../../../hooks/simulation';
import styles from './ResultChartsConfigModal.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ResultChartsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  charts: ResultChartConfig[];
  onSave: (charts: ResultChartConfig[]) => void;
  simulationResult?: SimulationRunResult | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResultChartsConfigModal({
  isOpen,
  onClose,
  charts,
  onSave,
  simulationResult,
}: ResultChartsConfigModalProps) {
  const editor = useChartConfigEditor({
    isOpen,
    charts,
    onSave,
    onClose,
    simulationResult,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={editor.handleCancel}
      title="Configure Result Charts"
      size="large"
      closeOnBackdropClick={false}
    >
      <div className={styles.container}>
        {editor.isEditing ? (
          <ChartEditor editor={editor} />
        ) : (
          <ChartList editor={editor} />
        )}
      </div>
    </Modal>
  );
}

// ─── Chart Editor (editing/creating a chart) ─────────────────────────────────

interface ChartEditorProps {
  editor: ReturnType<typeof useChartConfigEditor>;
}

function ChartEditor({ editor }: ChartEditorProps) {
  const { editingChart, availableItems, isEditingExisting, canSaveEdit } = editor;
  if (!editingChart) return null;

  return (
    <section className={styles.editorSection}>
      {/* Header */}
      <div className={styles.editorHeader}>
        <h3 className={styles.editorTitle}>
          {isEditingExisting ? 'Edit Chart' : 'Add New Chart'}
        </h3>
      </div>

      {/* Scrollable Content */}
      <div className={styles.editorContent}>
        <ChartTypeField type={editingChart.type} />

        <TitleField
          title={editingChart.title}
          onTitleChange={editor.handleSetTitle}
        />

        {editingChart.type === 'scatterPlot' && (
          <ScatterAxesSelector
            editingChart={editingChart}
            availableItems={availableItems}
            onSetXAxis={editor.handleSetXAxis}
            onSetYAxis={editor.handleSetYAxis}
          />
        )}

        {(editingChart.type === 'timeSeries' || editingChart.type === 'table') && (
          <MultiItemSelector
            editingChart={editingChart}
            availableItems={availableItems}
            onToggleItem={editor.handleToggleItem}
            onSelectAll={editor.handleSelectAll}
            onClearAll={editor.handleClearAll}
          />
        )}
      </div>

      {/* Footer actions */}
      <div className={styles.editorActions}>
        <button type="button" className={styles.cancelButton} onClick={editor.handleCancelEdit}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={editor.handleSaveEdit}
          disabled={!canSaveEdit}
        >
          {isEditingExisting ? 'Update' : 'Add'}
        </button>
      </div>
    </section>
  );
}

// ─── Chart List (overview of all charts) ─────────────────────────────────────

interface ChartListProps {
  editor: ReturnType<typeof useChartConfigEditor>;
}

function ChartList({ editor }: ChartListProps) {
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);

  return (
    <>
      {/* Header with Add Buttons */}
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Configured Charts</h3>
        <div className={styles.addButtonsContainer}>
          <button type="button" className={styles.addButton} onClick={() => editor.handleAddChart('timeSeries')} title="Add Time Series Chart">
            + Time Series
          </button>
          <button type="button" className={styles.addButton} onClick={() => editor.handleAddChart('scatterPlot')} title="Add Scatter Plot">
            + Scatter Plot
          </button>
          <button type="button" className={styles.addButton} onClick={() => editor.handleAddChart('table')} title="Add Table">
            + Table
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {editor.localCharts.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyStateTitle}>No charts configured</h3>
            <p className={styles.emptyStateText}>Click a button above to add a chart</p>
          </div>
        ) : (
          <div className={styles.chartsList}>
            {editor.localCharts.map(chart => (
              <ChartListItem
                key={chart.id}
                chart={chart}
                nodeDataArray={nodeDataArray}
                linkDataArray={linkDataArray}
                onEdit={editor.handleEditChart}
                onDelete={editor.handleDeleteChart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <ModalActions
          cancelLabel="CANCEL"
          confirmLabel="APPLY"
          onCancel={editor.handleCancel}
          onConfirm={editor.handleApply}
          confirmVariant="primary"
        />
      </div>
    </>
  );
}

// ─── Small presentational sub-components ──────────────────────────────────────

/** Read-only chart type display */
function ChartTypeField({ type }: { type: string }) {
  const labels: Record<string, string> = {
    timeSeries: 'Time Series',
    scatterPlot: 'Scatter Plot',
    table: 'Table',
  };

  return (
    <div className={styles.formField}>
      <label className={styles.label}>Chart Type</label>
      <div className={styles.chartTypeDisplay}>{labels[type] ?? type}</div>
    </div>
  );
}

/** Title input field */
function TitleField({ title, onTitleChange }: { title: string; onTitleChange: (v: string) => void }) {
  return (
    <div className={styles.formField}>
      <label className={styles.label} htmlFor="chart-title">Chart Title</label>
      <input
        id="chart-title"
        type="text"
        className={styles.input}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Enter chart title..."
      />
    </div>
  );
}

/** Scatter plot X/Y axis selector */
function ScatterAxesSelector({
  editingChart,
  availableItems,
  onSetXAxis,
  onSetYAxis,
}: {
  editingChart: EditingChart;
  availableItems: SelectableItem[];
  onSetXAxis: (key: string | undefined) => void;
  onSetYAxis: (key: string | undefined) => void;
}) {
  return (
    <>
      <AxisSelector
        label="X-Axis Variable"
        selectedKey={editingChart.xAxisKey}
        availableItems={availableItems}
        onSelect={onSetXAxis}
      />
      <AxisSelector
        label="Y-Axis Variable"
        selectedKey={editingChart.yAxisKey}
        availableItems={availableItems}
        onSelect={onSetYAxis}
      />
    </>
  );
}

/** Single-axis bubble selector (for scatter plot) */
function AxisSelector({
  label,
  selectedKey,
  availableItems,
  onSelect,
}: {
  label: string;
  selectedKey: string | undefined;
  availableItems: SelectableItem[];
  onSelect: (key: string | undefined) => void;
}) {
  return (
    <div className={styles.selectorSection}>
      <div className={styles.selectorHeader}>
        <span className={styles.selectorLabel}>
          {label} {selectedKey && '✓'}
        </span>
        {selectedKey && (
          <button type="button" className={styles.selectAllButton} onClick={() => onSelect(undefined)}>
            Clear
          </button>
        )}
      </div>

      <div className={styles.selectedBubbles}>
        {selectedKey ? (
          <div className={styles.selectedBubble}>
            {availableItems.find(i => i.key === selectedKey)?.displayName}
            <span className={styles.removeIcon} onClick={() => onSelect(undefined)}>×</span>
          </div>
        ) : (
          <span className={styles.emptySelection}>Click on an item below to select {label.toLowerCase()}</span>
        )}
      </div>

      <div className={styles.availableBubbles}>
        {availableItems.length === 0 ? (
          <span className={styles.emptySelection}>No items available</span>
        ) : (
          availableItems.map(item => (
            <div
              key={item.key}
              className={`${styles.bubble} ${selectedKey === item.key ? styles.selected : ''}`}
              onClick={() => onSelect(item.key)}
            >
              {item.displayName}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Multi-item bubble selector (for timeSeries / table) */
function MultiItemSelector({
  editingChart,
  availableItems,
  onToggleItem,
  onSelectAll,
  onClearAll,
}: {
  editingChart: EditingChart;
  availableItems: SelectableItem[];
  onToggleItem: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  return (
    <>
      {/* Selected items display */}
      <div className={styles.selectorSection}>
        <div className={styles.selectorHeader}>
          <span className={styles.selectorLabel}>Selected ({editingChart.selectedKeys.size})</span>
          {editingChart.selectedKeys.size > 0 && (
            <button type="button" className={styles.selectAllButton} onClick={onClearAll}>Clear</button>
          )}
        </div>
        <div className={styles.selectedBubbles}>
          {editingChart.selectedKeys.size === 0 ? (
            <span className={styles.emptySelection}>Click on items below to add</span>
          ) : (
            Array.from(editingChart.selectedKeys).map(key => {
              const item = availableItems.find(i => i.key === key);
              return (
                <div key={key} className={styles.selectedBubble}>
                  {item?.displayName}
                  <span className={styles.removeIcon} onClick={() => onToggleItem(key)}>×</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Available items */}
      <div className={styles.selectorSection}>
        <div className={styles.selectorHeader}>
          <span className={styles.selectorLabel}>Available Items</span>
          <button type="button" className={styles.selectAllButton} onClick={onSelectAll}>Select All</button>
        </div>
        <div className={styles.availableBubbles}>
          {availableItems.length === 0 ? (
            <span className={styles.emptySelection}>No items available</span>
          ) : (
            availableItems.map(item => (
              <div
                key={item.key}
                className={`${styles.bubble} ${editingChart.selectedKeys.has(item.key) ? styles.selected : ''}`}
                onClick={() => onToggleItem(item.key)}
              >
                {item.displayName}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/** Single chart item in the list */
function ChartListItem({
  chart,
  nodeDataArray,
  linkDataArray,
  onEdit,
  onDelete,
}: {
  chart: ResultChartConfig;
  nodeDataArray: Array<Record<string, unknown>>;
  linkDataArray: Array<Record<string, unknown>>;
  onEdit: (chart: ResultChartConfig) => void;
  onDelete: (chartId: string) => void;
}) {
  const typeLabel =
    chart.type === 'timeSeries' ? 'Time Series' :
    chart.type === 'scatterPlot' ? 'Scatter Plot' :
    'Table';

  const itemsInfo =
    chart.type === 'scatterPlot'
      ? `X: ${resolveSimulationKeyName(chart.xAxisKey, nodeDataArray, linkDataArray)}, Y: ${resolveSimulationKeyName(chart.yAxisKey, nodeDataArray, linkDataArray)}`
      : `${chart.selectedKeys.length} item${chart.selectedKeys.length !== 1 ? 's' : ''}`;

  return (
    <div className={styles.chartItem}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>{chart.title}</div>
          <div className={styles.chartType}>{typeLabel} • {itemsInfo}</div>
        </div>
        <div className={styles.chartActions}>
          <button type="button" className={styles.editButton} onClick={() => onEdit(chart)}>Edit</button>
          <button type="button" className={styles.deleteButton} onClick={() => onDelete(chart.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
