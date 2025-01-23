/**
 * constants.ts
 *
 * Contains tunable parameters and constants
 * for a more advanced mycelium simulation.
 */

// Canvas & Growth
export const GROWTH_RADIUS_FACTOR = 0.45; // fraction of min(width, height) for dish
export const MAIN_BRANCH_COUNT = 12;       // how many main 'trunk' tips from center

// Environment Grid
export const ENV_GRID_CELL_SIZE = 10;         // finer grid for resource distribution
export const BASE_NUTRIENT = 50;              // baseline nutrient level in each cell
export const BASE_MOISTURE = 5.0;             // baseline moisture level
export const NUTRIENT_DIFFUSION = 0.05;       // how quickly nutrients replenish or diffuse
export const NUTRIENT_CONSUMPTION_RATE = 0.5; // how much a hypha tip consumes per step

// MycelialNetwork / Graph
export const INITIAL_RESOURCE_PER_TIP = 1.0; // how much resource a new tip starts with
export const RESOURCE_FLOW_RATE = 0.5;       // fraction of resource that flows each tick along edges

/**
 * TIME_LAPSE_FACTOR:
 * How many simulation sub-steps occur per animation frame.
 * 1 => real-time
 * 10 => each frame = 10 steps => ~10x faster "time-lapse"
 * 100 => extremely fast coverage
 */
export const TIME_LAPSE_FACTOR = 20;

/**
 * SECONDARY_FAN_COUNT:
 * When a tip branches, how many secondary tips do we spawn
 * at once? They are spaced slightly around the trunk angle.
 * e.g. 3 => spawn 3 secondaries at slightly different angles.
 */
export const SECONDARY_FAN_COUNT = 5;

/**
 * WIDER_SECONDARY_ANGLE:
 * If you want secondaries to fan out widely from the trunk,
 * you can set a bigger angle spread (in radians).
 * e.g. Math.PI / 3 => ±60° around trunk angle
 */
export const WIDER_SECONDARY_ANGLE = Math.PI / 2;

// Growth parameters
export const STEP_SIZE = 1.5;               // Step size for each iteration *before* multiplying by the growth factor
export const GROWTH_SPEED_MULTIPLIER = 3.5;   // e.g. 5 => ~5x faster
export const BASE_LIFE = 2000;              // base life for main tips
export const BRANCH_DECAY = 0.7;            // fraction of parent's life for branches
export const BRANCH_CHANCE = 0.3;           // chance each tip spawns new branch each step
export const MAX_BRANCH_DEPTH = 6;          // how many times we can nest branches
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
