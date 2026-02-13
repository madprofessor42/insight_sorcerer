/**
 * Chart Data Generation Utilities
 * 
 * Utilities for transforming simulation results into chart-compatible data structures.
 */

import type * as go from 'gojs';
import type { SimulationRunResult, ResultChartConfig } from './types';
import { generateChartColor } from './constants';
import { resolveNodeInfo, getLinkDisplayName } from '../diagram-data';

/**
 * Resolve display name for a simulation key.
 * Uses diagram-data utilities for consistency with the rest of the app.
 * Supports vector elements (key.vectorElement format).
 * 
 * @param key - Unique key (nanoid or nanoid.vectorElement) for node or link
 * @param nodes - Node data array
 * @param links - Link data array
 * @returns Display name for the chart
 */
export function resolveSimulationKeyName(
  key: go.Key | string | undefined,
  nodes: Array<go.ObjectData>,
  links: Array<go.ObjectData>
): string {
  if (!key) return 'Not set';
  
  const keyStr = String(key);
  
  // Check if this is a vector element (format: key.vectorElement)
  const dotIndex = keyStr.lastIndexOf('.');
  if (dotIndex > 0) {
    const parentKey = keyStr.substring(0, dotIndex);
    const vectorElement = keyStr.substring(dotIndex + 1);
    
    // Try to find parent node
    const node = nodes.find(n => String(n.key) === parentKey);
    if (node) {
      const nodeInfo = resolveNodeInfo(parentKey, nodes);
      return `${nodeInfo.name}.${vectorElement}`;
    }
    
    // Try to find parent link
    const link = links.find(l => String(l.key) === parentKey);
    if (link) {
      return `${getLinkDisplayName(link)}.${vectorElement}`;
    }
    
    // Parent not found - this can happen if the diagram changed since the config was saved
    // Return a readable name anyway (just show the vector element part)
    return `[Unknown].${vectorElement}`;
  }
  
  // Try to find as node first
  const node = nodes.find(n => String(n.key) === keyStr);
  if (node) {
    const nodeInfo = resolveNodeInfo(keyStr, nodes);
    return nodeInfo.name;
  }
  
  // Try to find as link
  const link = links.find(l => String(l.key) === keyStr);
  if (link) {
    return getLinkDisplayName(link);
  }
  
  // Fallback if not found - this can happen if the diagram changed
  // Show a meaningful fallback instead of just the key
  return `[Unknown: ${keyStr.substring(0, 8)}...]`;
}

/**
 * Chart info types for different visualizations
 */
export type TimeSeriesChartInfo = {
  type: 'timeSeries';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      borderWidth: number;
      pointRadius: number;
      pointHoverRadius: number;
      tension: number;
    }>;
  };
};

export type ScatterPlotChartInfo = {
  type: 'scatterPlot';
  title: string;
  xLabel?: string;
  yLabel?: string;
  data: {
    datasets: Array<{
      label: string;
      data: Array<{ x: number; y: number }>;
      borderColor: string;
      backgroundColor: string;
      pointRadius: number;
      pointHoverRadius: number;
    }>;
  };
  error?: string;
};

export type TableChartInfo = {
  type: 'table';
  title: string;
  times: number[];
  series: Array<{
    key: string;
    label: string;
    values: number[];
  }>;
};

export type ChartInfo = TimeSeriesChartInfo | ScatterPlotChartInfo | TableChartInfo;

/**
 * Generate time series chart data from simulation results
 */
export function generateTimeSeriesChartData(
  title: string,
  selectedKeys: string[],
  result: SimulationRunResult,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): TimeSeriesChartInfo {
  const datasets = selectedKeys
    .filter(key => result.series?.[key]) // Only include keys that have data
    .map((key, index) => {
      const label = resolveSimulationKeyName(key, nodeDataArray, linkDataArray);
      const values = result.series![key];
      
      return {
        label,
        data: values,
        borderColor: generateChartColor(index),
        backgroundColor: generateChartColor(index),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
      };
    });

  return {
    type: 'timeSeries',
    title,
    data: {
      labels: result.times!.map(t => t.toString()),
      datasets,
    },
  };
}

/**
 * Generate scatter plot chart data from simulation results
 */
export function generateScatterPlotChartData(
  title: string,
  xAxisKey: string | undefined,
  yAxisKey: string | undefined,
  result: SimulationRunResult,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): ScatterPlotChartInfo {
  if (!xAxisKey || !yAxisKey || !result.series?.[xAxisKey] || !result.series?.[yAxisKey]) {
    return {
      type: 'scatterPlot',
      title,
      data: { datasets: [] },
      error: 'Invalid axis configuration',
    };
  }
  
  const xValues = result.series[xAxisKey];
  const yValues = result.series[yAxisKey];
  const scatterData = xValues.map((x, i) => ({ x, y: yValues[i] }));
  
  const xLabel = resolveSimulationKeyName(xAxisKey, nodeDataArray, linkDataArray);
  const yLabel = resolveSimulationKeyName(yAxisKey, nodeDataArray, linkDataArray);
  
  return {
    type: 'scatterPlot',
    title,
    xLabel,
    yLabel,
    data: {
      datasets: [{
        label: `${xLabel} vs ${yLabel}`,
        data: scatterData,
        borderColor: generateChartColor(0),
        backgroundColor: generateChartColor(0),
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    },
  };
}

/**
 * Generate table chart data from simulation results
 */
export function generateTableChartData(
  title: string,
  selectedKeys: string[],
  result: SimulationRunResult,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): TableChartInfo {
  const selectedData = selectedKeys
    .filter(key => result.series?.[key])
    .map(key => ({
      key,
      label: resolveSimulationKeyName(key, nodeDataArray, linkDataArray),
      values: result.series![key],
    }));
  
  return {
    type: 'table',
    title,
    times: result.times!,
    series: selectedData,
  };
}

/**
 * Generate default chart showing all series
 */
export function generateDefaultChart(
  result: SimulationRunResult,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): TimeSeriesChartInfo {
  const datasets = Object.entries(result.series!).map(([key, values], index) => {
    const label = resolveSimulationKeyName(key, nodeDataArray, linkDataArray);
    
    return {
      label,
      data: values,
      borderColor: generateChartColor(index),
      backgroundColor: generateChartColor(index),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.1,
    };
  });

  return {
    type: 'timeSeries',
    title: 'All Results',
    data: {
      labels: result.times!.map(t => t.toString()),
      datasets,
    },
  };
}

/**
 * Generate chart data for a single configured chart
 */
export function generateChartDataFromConfig(
  chart: ResultChartConfig,
  result: SimulationRunResult,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): ChartInfo {
  if (chart.type === 'timeSeries') {
    return generateTimeSeriesChartData(
      chart.title,
      chart.selectedKeys,
      result,
      nodeDataArray,
      linkDataArray
    );
  } else if (chart.type === 'scatterPlot') {
    return generateScatterPlotChartData(
      chart.title,
      (chart as any).xAxisKey,
      (chart as any).yAxisKey,
      result,
      nodeDataArray,
      linkDataArray
    );
  } else if (chart.type === 'table') {
    return generateTableChartData(
      chart.title,
      chart.selectedKeys,
      result,
      nodeDataArray,
      linkDataArray
    );
  }
  
  // Fallback
  return generateDefaultChart(result, nodeDataArray, linkDataArray);
}

/**
 * Generate all chart data from configurations
 */
export function generateAllChartsData(
  charts: ResultChartConfig[],
  result: SimulationRunResult,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): ChartInfo[] {
  if (!result?.success || !result.times || !result.series) {
    return [];
  }

  // If no charts configured, show all series in a default chart
  if (charts.length === 0) {
    return [generateDefaultChart(result, nodeDataArray, linkDataArray)];
  }

  // Generate data for each configured chart
  return charts.map(chart => 
    generateChartDataFromConfig(chart, result, nodeDataArray, linkDataArray)
  );
}

