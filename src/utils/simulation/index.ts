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
  CHART_DIMENSIONS
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

