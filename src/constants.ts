/**
 * constants.ts
 *
 * Tunable parameters for iterative fungal (mycelial) growth.
 */

// Canvas + growth area
export const GROWTH_RADIUS_FACTOR = 0.45; // fraction of min(windowWidth, windowHeight)

// Density + grid
export const CELL_SIZE = 15;
export const MAX_DENSITY = 120; // how many lines can pass a cell before it stops growth

// Hyphal growth parameters
export const STEP_SIZE = 2.0;     // how far each tip moves per iteration
export const BRANCH_CHANCE = 0.01; // chance each tip spawns a new branch each frame
export const BRANCH_DECAY = 0.8;   // fraction of parent's remaining life for new branch
export const MAX_LIFE = 800;       // max steps a tip can live

// Perlin noise
export const PERLIN_SCALE = 0.005; 
export const ANGLE_DRIFT_STRENGTH = 0.1; 
export const WIGGLE_STRENGTH = 1.2; 

// Fading near circle edge
export const EDGE_FADE_START = 0.9; // e.g. 0.9 => fade near 90% radius

// Appearance
export const BACKGROUND_ALPHA = 0.04;  // how quickly old lines fade each frame (0 to 1)
export const SHADOW_BLUR = 6;
export const SHADOW_COLOR = "rgba(255,255,255,0.5)";

// If you want subtle color variation
export const BASE_HUE = 50;
export const BASE_LIGHTNESS = 95;
export const BASE_ALPHA = 0.8;  // line alpha
