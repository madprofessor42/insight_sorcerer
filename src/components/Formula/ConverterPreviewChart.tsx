/**
 * ConverterPreviewChart - Mini chart to preview converter data points
 */

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { DataPoint } from '../../utils/simulation/converter-data';
import { CHART_COLORS } from '../../utils/simulation';
import styles from './ConverterPreviewChart.module.css';

export interface ConverterPreviewChartProps {
  dataPoints: DataPoint[];
  interpolation?: 'Linear' | 'Discrete';
}

export function ConverterPreviewChart({ 
  dataPoints, 
  interpolation = 'Linear' 
}: ConverterPreviewChartProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    if (dataPoints.length === 0) {
      return null;
    }

    // Sort points by x value
    const sortedPoints = [...dataPoints].sort((a, b) => a.x - b.x);

    return {
      labels: sortedPoints.map(p => p.x),
      datasets: [{
        label: 'Converter Function',
        data: sortedPoints.map(p => p.y),
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_COLORS.accent,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        tension: 0, // 0 = straight lines
        stepped: interpolation === 'Discrete' ? ('before' as const) : false,
      }]
    };
  }, [dataPoints, interpolation]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: CHART_COLORS.background,
        borderColor: CHART_COLORS.border,
        borderWidth: 1,
        titleColor: CHART_COLORS.text,
        bodyColor: CHART_COLORS.textSecondary,
        callbacks: {
          title: (items: any[]) => `Input: ${items[0].label}`,
          label: (item: any) => `Output: ${item.parsed.y}`,
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Input',
          color: CHART_COLORS.text,
          font: { size: 11, weight: 500 }
        },
        ticks: {
          color: CHART_COLORS.textSecondary,
          font: { size: 10 }
        },
        grid: {
          color: CHART_COLORS.grid,
        }
      },
      y: {
        title: {
          display: true,
          text: 'Output',
          color: CHART_COLORS.text,
          font: { size: 11, weight: 500 }
        },
        ticks: {
          color: CHART_COLORS.textSecondary,
          font: { size: 10 }
        },
        grid: {
          color: (context: any) => {
            // Highlight the zero line
            if (context.tick.value === 0) {
              return 'rgba(241, 245, 249, 0.3)'; // Brighter white for zero line
            }
            return CHART_COLORS.grid;
          },
          lineWidth: (context: any) => {
            // Make zero line slightly thicker
            if (context.tick.value === 0) {
              return 1.5;
            }
            return 1;
          }
        }
      }
    }
  }), []);

  if (!chartData) {
    return (
      <div className={styles.emptyChart}>
        <p>No data points to display</p>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartWrapper}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className={styles.chartInfo}>
        <span className={styles.interpolationMode}>
          {interpolation === 'Linear' ? '📈 Linear' : '📊 Discrete'}
        </span>
        <span className={styles.pointCount}>
          {dataPoints.length} point{dataPoints.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

