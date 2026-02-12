/**
 * Simulation utilities for insight_sorcerer.
 * 
 * Public API for running simulations on GoJS diagrams.
 */

export { runSimulation } from './runner';
export { 
  DEFAULT_SIMULATION_CONFIG, 
  TIME_UNITS,
  generateChartColor,
  CHART_DIMENSIONS,
  CHART_COLORS
} from './constants';
export { getChartOptions } from './chartConfig';
export { 
  VISUALIZABLE_TYPES
} from './types';
export type { 
  SimulationConfig, 
  SimulationRunResult,
  ResultChartConfig,
  ChartType,
  TimeSeriesChartConfig,
  ScatterPlotChartConfig,
  TableChartConfig
} from './types';

// Chart data generation utilities
export {
  resolveSimulationKeyName,
  generateTimeSeriesChartData,
  generateScatterPlotChartData,
  generateTableChartData,
  generateDefaultChart,
  generateChartDataFromConfig,
  generateAllChartsData,
  type ChartInfo,
  type TimeSeriesChartInfo,
  type ScatterPlotChartInfo,
  type TableChartInfo
} from './chartDataGenerator';

// Selectable items utilities
export {
  getSelectableItems,
  type SelectableItem
} from './selectableItems';

// Form validation utilities
export {
  configToFormState,
  formStateToConfig,
  validateSimulationConfig,
  getFormValidationError,
  type SettingsFormState,
  type TimeUnit,
  type Algorithm
} from './formValidation';

// Converter data utilities
export {
  parseDataPoints,
  formatDataPoints,
  type DataPoint
} from './converter-data';

