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
 * - Converter: lookup table converters (have input/output values)
 * - flow: rate connections between stocks (have flowRate)
 * 
 * Types NOT included:
 * - Cloud: automatic endpoints, no data
 * - link: dependency connections, no time series
 * - LinkLabel: invisible connection points on edges
 */
export const VISUALIZABLE_TYPES = {
  /** Node types that have simulation series data */
  nodes: ['Stock', 'Variable', 'Converter'] as const,
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
  series?: Record<string, number[]>; // unique key (nanoid or nanoid.vectorElement) → values
  error?: string;
  errorPrimitiveId?: string;
  errorPrimitiveName?: string;
}

/**
 * Type of result chart
 */
export type ChartType = 'timeSeries' | 'scatterPlot' | 'table';

/**
 * Base fields shared by all chart configurations (internal use only)
 */
interface BaseChartConfig {
  id: string;
  title: string;
  selectedKeys: string[]; // node/edge keys to display
}

/**
 * Time series chart configuration
 */
export interface TimeSeriesChartConfig extends BaseChartConfig {
  type: 'timeSeries';
}

/**
 * Scatter plot chart configuration
 */
export interface ScatterPlotChartConfig extends BaseChartConfig {
  type: 'scatterPlot';
  xAxisKey?: string;
  yAxisKey?: string;
}

/**
 * Table chart configuration
 */
export interface TableChartConfig extends BaseChartConfig {
  type: 'table';
}

/**
 * Discriminated union of all chart configuration types.
 * Use `chart.type` to narrow the type and access type-specific fields.
 */
export type ResultChartConfig = TimeSeriesChartConfig | ScatterPlotChartConfig | TableChartConfig;
