/**
 * Types for simulation integration.
 * 
 * Clean separation between UI types and simulation types.
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
  series?: Record<string, number[]>; // nodeId/edgeId → values
  error?: string;
  errorPrimitiveId?: string;
  errorPrimitiveName?: string;
}

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

