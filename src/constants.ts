/**
 * constants.ts
 *
 * Tunable parameters for rhizomorphic mycelium growth.
 */

// The circle radius is a fraction of the smaller window dimension
export const GROWTH_RADIUS_FACTOR = 0.45;

// We store how many "main trunk" tips start at the center.
export const MAIN_TRUNK_COUNT = 12;

// Each main trunk can live long enough to reach the circle edge
export const MAIN_TRUNK_LIFE = 700;

// We'll allow secondary branching up to some depth
export const MAX_SECONDARY_DEPTH = 4;

// Probability that each step of a main trunk spawns a secondary
export const SECONDARY_BRANCH_CHANCE = 0.95;

// Step size for each iteration
export const STEP_SIZE = 2.0;

// Perlin noise parameters
export const PERLIN_SCALE = 0.01;
export const ANGLE_DRIFT_STRENGTH = 0.12;
export const WIGGLE_STRENGTH = 2.0;

// Density grid
export const CELL_SIZE = 15;
export const MAX_DENSITY = 9999; // let filaments overlap a lot

// No partial fade each frame => we keep all lines
export const BACKGROUND_ALPHA = 0.0; 

// Fade factor near the boundary of the dish
export const FADE_START_FACTOR = 0.9;
export const FADE_END_FACTOR = 1.0;

// Main trunk appearance (strong, bright)
export const MAIN_LINE_WIDTH = 2.0;
export const MAIN_ALPHA = 0.85;

// Secondary growth appearance (thinner, fainter)
export const SECONDARY_LINE_WIDTH = 1.0;
export const SECONDARY_ALPHA = 0.5;

// Base color in HSL
export const BASE_HUE = 50;
export const BASE_LIGHTNESS = 95;

// Shadow / glow
export const SHADOW_BLUR = 6;
export const SHADOW_COLOR = "rgba(255,255,255,0.5)";
