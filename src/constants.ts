/**
 * constants.ts
 *
 * A single place to hold all tunable parameters and constants
 * for the ropey growth visualization. 
 */

export const GROWTH_RADIUS_FACTOR = 0.45; // fraction of min(width, height)
export const MAX_DENSITY = 9999;
export const CELL_SIZE = 15;

// Branching
export const MAIN_BRANCH_COUNT = 20;
export const BASE_SECONDARY_CHANCE = 0.9;
export const BASE_BRANCH_FACTOR = 6; 
export const SECONDARY_ANGLE_VARIANCE = Math.PI / 2;
export const SECONDARY_DECAY = 0.8;
export const MAIN_BRANCH_STEPS = 60;
export const SECONDARY_BRANCH_STEPS = 30;

// Fade near edge
export const FADE_START_FACTOR = 0.9;
export const FADE_END_FACTOR = 1.0;

// Perlin noise
export const PERLIN_SCALE = 0.02;
export const ANGLE_DRIFT_STRENGTH = 0.15;
export const WIGGLE_STRENGTH = 3;

// Appearance
export const SHADOW_BLUR = 6;
export const SHADOW_COLOR = "rgba(255, 255, 255, 0.5)";

// Final radial gradient overlay
export const GRADIENT_INNER_OPACITY = 0.2;
export const GRADIENT_OUTER_OPACITY = 0.8;

// "secondaryFillFactor" controls how full the space between main branches gets.
// 0 -> no secondaries; 1 -> maximum secondaries
export let secondaryFillFactor = 0.8;
