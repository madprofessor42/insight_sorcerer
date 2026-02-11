/**
 * Constants for simulation integration.
 * 
 * Single source of truth for configuration values.
 */

import type { SimulationConfig } from './types';

/** Available time units for simulation */
export const TIME_UNITS = ['Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years'] as const;

/** Default simulation configuration */
export const DEFAULT_SIMULATION_CONFIG: Required<SimulationConfig> = {
  timeStart: 0,
  timeLength: 100,
  timeStep: 1,
  timeUnits: 'Years',
  algorithm: 'Euler',
};

/** 
 * Chart colors - matches variables.css design tokens
 * Uses same colors as --color-* CSS variables for consistency
 */
export const CHART_COLORS = {
  text: '#f1f5f9',           // --color-text-primary
  textSecondary: '#94a3b8',  // --color-text-secondary
  textLight: '#64748b',      // --color-text-placeholder
  grid: 'rgba(148, 163, 184, 0.2)',
  background: '#0f172a',     // --color-background
  border: '#475569',         // --color-border
} as const;

/** Color generation using golden angle for optimal distribution */
const GOLDEN_ANGLE = 137.5;

/**
 * Generate a distinct color using golden angle distribution.
 * 
 * @param index - Series index
 * @returns HSL color string
 */
export function generateChartColor(index: number): string {
  const hue = (index * GOLDEN_ANGLE) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/** Chart dimensions */
export const CHART_DIMENSIONS = {
  minHeight: 500,
  fontSize: {
    title: 16,
    legend: 13,
    axisLabel: 12,
    tick: 11,
    stat: 20,
    statLabel: 11,
  },
} as const;

