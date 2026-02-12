/**
 * Types for simulation integration in insight_sorcerer.
 * 
 * Adapted from system_dynamics to work with GoJS data structures.
 */

/**
 * Configuration for simulation run
 */
export interface SimulationConfig {
  timeStart?: number;
  timeLength?: number;
  timeStep?: number;
  timeUnits?: 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years';
  algorithm?: 'Euler' | 'RK4';
}

/**
 * Result of simulation run
 */
export interface SimulationRunResult {
  success: boolean;
  times?: number[];
  series?: Record<string, number[]>; // unique key (nanoid) → values
  error?: string;
  errorPrimitiveId?: string;
  errorPrimitiveName?: string;
}

/**
 * Type of result chart
 */
export type ChartType = 'timeSeries' | 'scatterPlot' | 'table';

/**
 * Configuration for a single result chart
 */
export interface ResultChartConfig {
  id: string; // unique chart ID
  type: ChartType;
  title: string;
  selectedKeys: string[]; // node/edge keys to display
}

/**
 * Time series specific configuration
 */
export interface TimeSeriesChartConfig extends ResultChartConfig {
  type: 'timeSeries';
}

/**
 * Scatter plot specific configuration (placeholder for future)
 */
export interface ScatterPlotChartConfig extends ResultChartConfig {
  type: 'scatterPlot';
  xAxisKey?: string;
  yAxisKey?: string;
}

/**
 * Table specific configuration (placeholder for future)
 */
export interface TableChartConfig extends ResultChartConfig {
  type: 'table';
}

