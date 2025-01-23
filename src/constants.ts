/**
 * constants.ts
 * 
 * Minimal parameters for a guaranteed visible mycelium-like draw.
 */

// Petri-dish factor
export const GROWTH_RADIUS_FACTOR = 0.45;
export const MAIN_TRUNK_COUNT = 10;  // 10 lines from center

// Each trunk has enough "life" to reach near the boundary
export const BASE_LIFE = 1000;  

// Step size
export const STEP_SIZE = 2.0; 

// Wiggle & drift
export const PERLIN_SCALE = 0.01;
export const ANGLE_DRIFT_STRENGTH = 0.1;
export const WIGGLE_STRENGTH = 1.0;

// Time-lapse
export const TIME_LAPSE_FACTOR = 2;

// Lines
export const MAIN_LINE_WIDTH = 1.8;
export const MAIN_ALPHA = 0.9;
export const BASE_HUE = 50;       // near-white/yellow
export const BASE_LIGHTNESS = 95; // bright

// Petri dish fade near boundary
export const FADE_START_FACTOR = 0.9;
export const FADE_END_FACTOR = 1.0;
