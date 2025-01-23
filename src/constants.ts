/**
 * constants.ts
 *
 * Ultra-simple parameters to ensure a calm, radial growth
 * from the center without fractal chaos.
 */

export const GROWTH_RADIUS_FACTOR = 0.8; // radius is 80% of min dimension
export const MAIN_BRANCH_COUNT = 10;     // moderate # of main trunks
export const BASE_LIFE = 500;            // each trunk's lifespan
export const BRANCH_CHANCE = 0.1;        // 10% chance of branching
export const MAX_BRANCH_DEPTH = 5;       // secondaries won't nest too deep
export const STEP_SIZE = 1.0;            // how far each step
export const TIME_LAPSE_FACTOR = 1;      // no time-lapse

// Minimal wiggle
export const PERLIN_SCALE = 0.01;
export const ANGLE_DRIFT_STRENGTH = 0.01;
export const WIGGLE_STRENGTH = 0.2;

// No environment resource or anastomosis => skip
// Rendering
export const BACKGROUND_ALPHA = 0.02;
export const FADE_START_FACTOR = 0.9;
export const FADE_END_FACTOR = 1.0;

// Lines
export const MAIN_LINE_WIDTH = 3;
export const MAIN_ALPHA = 0.8;
export const SECONDARY_LINE_WIDTH = 1;
export const SECONDARY_ALPHA = 0.5;
export const BASE_HUE = 50;
export const BASE_LIGHTNESS = 95;
