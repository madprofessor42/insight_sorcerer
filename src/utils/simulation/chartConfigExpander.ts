/**
 * Chart Configuration Expander
 * 
 * Utilities for automatically expanding vector primitives in chart configurations
 * after simulation. If a primitive was selected before simulation and turned out
 * to be a vector, replace it with its vector elements.
 */

import type { ResultChartConfig, SimulationRunResult } from './types';

/**
 * Expand vector keys in chart configurations based on simulation results.
 * 
 * If a selected key in a chart config doesn't exist in simulation results
 * but vector elements of that key do exist, replace the key with its elements.
 * 
 * Example:
 * - Before simulation: selectedKeys = ['population_key']
 * - After simulation: series has ['population_key.Mexico', 'population_key.USA']
 * - Result: selectedKeys = ['population_key.Mexico', 'population_key.USA']
 * 
 * @param charts - Current chart configurations
 * @param result - Simulation results
 * @returns Updated chart configurations with expanded vector keys
 */
export function expandVectorKeysInCharts(
  charts: ResultChartConfig[],
  result: SimulationRunResult
): ResultChartConfig[] {
  if (!result.success || !result.series) {
    return charts;
  }

  const seriesKeys = Object.keys(result.series);
  const seriesKeysSet = new Set(seriesKeys);

  return charts.map(chart => {
    switch (chart.type) {
      case 'timeSeries':
      case 'table': {
        const expandedKeys = expandKeys(chart.selectedKeys, seriesKeysSet, seriesKeys);
        
        if (expandedKeys.length !== chart.selectedKeys.length || 
            !expandedKeys.every((key, i) => key === chart.selectedKeys[i])) {
          return { ...chart, selectedKeys: expandedKeys };
        }
        return chart;
      }

      case 'scatterPlot': {
        const newXKey = expandSingleKey(chart.xAxisKey, seriesKeysSet, seriesKeys);
        const newYKey = expandSingleKey(chart.yAxisKey, seriesKeysSet, seriesKeys);
        
        if (newXKey !== chart.xAxisKey || newYKey !== chart.yAxisKey) {
          return { ...chart, xAxisKey: newXKey, yAxisKey: newYKey };
        }
        return chart;
      }
    }
  });
}

/**
 * Expand an array of keys, replacing keys that don't exist with their vector elements
 */
function expandKeys(
  keys: string[],
  seriesKeysSet: Set<string>,
  allSeriesKeys: string[]
): string[] {
  const result: string[] = [];

  for (const key of keys) {
    // If key exists in results, keep it
    if (seriesKeysSet.has(key)) {
      result.push(key);
      continue;
    }

    // Key doesn't exist - check if it has vector elements
    const vectorElements = allSeriesKeys.filter(seriesKey => 
      seriesKey.startsWith(`${key}.`)
    );

    if (vectorElements.length > 0) {
      // Replace with vector elements
      result.push(...vectorElements);
    } else {
      // Keep the original key (might be missing from results for other reasons)
      result.push(key);
    }
  }

  return result;
}

/**
 * Expand a single key (for scatter plot axes)
 */
function expandSingleKey(
  key: string | undefined,
  seriesKeysSet: Set<string>,
  allSeriesKeys: string[]
): string | undefined {
  if (!key) return key;

  // If key exists in results, keep it
  if (seriesKeysSet.has(key)) {
    return key;
  }

  // Key doesn't exist - check if it has vector elements
  const vectorElements = allSeriesKeys.filter(seriesKey => 
    seriesKey.startsWith(`${key}.`)
  );

  if (vectorElements.length > 0) {
    // For scatter plot, we can't use multiple elements, so use the first one
    return vectorElements[0];
  }

  // Keep the original key
  return key;
}
