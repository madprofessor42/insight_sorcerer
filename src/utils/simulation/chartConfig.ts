/**
 * Chart.js configuration for simulation results visualization.
 * 
 * Extracted configuration following KISS principle.
 */

import type { ChartOptions } from 'chart.js';
import { CHART_COLORS, CHART_DIMENSIONS } from './constants';

/**
 * Get Chart.js options for simulation results.
 */
export function getChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          color: CHART_COLORS.text,
          font: {
            size: CHART_DIMENSIONS.fontSize.legend,
          },
        },
      },
      title: {
        display: true,
        text: 'Simulation Results',
        color: CHART_COLORS.text,
        font: {
          size: CHART_DIMENSIONS.fontSize.title,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            return `${label}: ${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: CHART_COLORS.text,
          font: {
            size: CHART_DIMENSIONS.fontSize.axisLabel,
            weight: 'bold',
          },
        },
        ticks: {
          color: CHART_COLORS.textSecondary,
          font: {
            size: CHART_DIMENSIONS.fontSize.tick,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Value',
          color: CHART_COLORS.text,
          font: {
            size: CHART_DIMENSIONS.fontSize.axisLabel,
            weight: 'bold',
          },
        },
        ticks: {
          color: CHART_COLORS.textSecondary,
          font: {
            size: CHART_DIMENSIONS.fontSize.tick,
          },
        },
        grid: {
          color: (context) => {
            // Highlight zero line with white color
            if (context.tick.value === 0) {
              return '#ffffff';
            }
            return CHART_COLORS.grid;
          },
          lineWidth: (context) => {
            // Make zero line thicker for better visibility
            if (context.tick.value === 0) {
              return 2;
            }
            return 1;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };
}

