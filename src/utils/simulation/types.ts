/**
 * Types for simulation integration in insight_sorcerer.
 * 
 * Adapted from system_dynamics to work with GoJS data structures.
 */

/**
 * Node and link types that produce simulation series data for visualization.
 * 
 * These types correspond to simulation primitives that generate time series data:
 * - Stock: accumulation nodes (have initialValue)
 * - Variable: calculated values (have value formula)
 * - flow: rate connections between stocks (have flowRate)
 * 
 * Types NOT included:
 * - Cloud: automatic endpoints, no data
 * - link: dependency connections, no time series
 * - LinkLabel: invisible connection points on edges
 */
export const VISUALIZABLE_TYPES = {
  /** Node types that have simulation series data */
  nodes: ['Stock', 'Variable'] as const,
  /** Link types that have simulation series data */
  links: ['flow'] as const,
} as const;

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

