/**
 * constants.ts
 *
 * Contains tunable parameters and constants
 * for a more advanced mycelium simulation.
 */

// Canvas & Growth
export const GROWTH_RADIUS_FACTOR = 0.45; // fraction of min(width, height) for dish
export const MAIN_BRANCH_COUNT = 8;       // how many main 'trunk' tips from center

// Environment Grid
export const ENV_GRID_CELL_SIZE = 10;     // finer grid for resource distribution
export const BASE_NUTRIENT = 5.0;         // baseline nutrient level in each cell
export const BASE_MOISTURE = 5.0;         // baseline moisture level
export const NUTRIENT_DIFFUSION = 0.01;   // how quickly nutrients replenish or diffuse
export const NUTRIENT_CONSUMPTION_RATE = 0.1; // how much a hypha tip consumes per step

// MycelialNetwork / Graph
export const INITIAL_RESOURCE_PER_TIP = 1.0; // how much resource a new tip starts with
export const RESOURCE_FLOW_RATE = 0.2;       // fraction of resource that flows each tick along edges

// Growth parameters
export const STEP_SIZE = 1.5;               // Step size for each iteration *before* multiplying by the growth factor
export const GROWTH_SPEED_MULTIPLIER = 3.5;   // e.g. 5 => ~5x faster
export const BASE_LIFE = 500;               // base life for main tips
export const BRANCH_DECAY = 0.7;            // fraction of parent's life for branches
export const BRANCH_CHANCE = 0.02;          // chance each tip spawns new branch each step
export const MAX_BRANCH_DEPTH = 4;          // how many times we can nest branches
export const ANASTOMOSIS_RADIUS = 5;        // if near an existing node within this dist, fuse

// Perlin Noise
export const PERLIN_SCALE = 0.01;
export const ANGLE_DRIFT_STRENGTH = 0.1;
export const WIGGLE_STRENGTH = 1.5;

// Rendering
export const BACKGROUND_ALPHA = 0.02;      // slight fade each frame
export const FADE_START_FACTOR = 0.9;      // radius fraction where fade begins
export const FADE_END_FACTOR = 1.0;

export const SHADOW_BLUR = 6;
export const SHADOW_COLOR = "rgba(255,255,255,0.5)";

export const MAIN_LINE_WIDTH = 2.0;
export const SECONDARY_LINE_WIDTH = 1.0;
export const MAIN_ALPHA = 0.85;
export const SECONDARY_ALPHA = 0.5;

// Colors
export const BASE_HUE = 50;         // near whitish-yellow
export const BASE_LIGHTNESS = 95;   // quite bright
