/**
 * constants.ts
 *
 * Contains tunable parameters and constants
 * for a more advanced mycelium simulation.
 */

// Canvas & Growth
export const GROWTH_RADIUS_FACTOR = 0.90;     // Fraction of min(width, height) for dish
export const MAIN_BRANCH_COUNT = 20;          // Reduced from 100 to 20 for testing

// Growth parameters
export const STEP_SIZE = 0.2;                 // Step size for each iteration before multiplying by the growth factor
export const GROWTH_SPEED_MULTIPLIER = 1.0;   // Reduced from 1.5 to 1.0 for controlled growth
export const BASE_LIFE = 3000;                // Base life for main tips
export const BRANCH_DECAY = 0.9;              // Fraction of parent's life for branches
export const BRANCH_CHANCE = 0.02;            // Corrected from 9 to 0.02
export const MAX_BRANCH_DEPTH = 10;           // Maximum depth for nested branches
export const ANASTOMOSIS_RADIUS = 10;         // Radius within which tips fuse

// Environment Grid
export const ENV_GRID_CELL_SIZE = 5;          // Size of each grid cell for resource distribution
export const BASE_NUTRIENT = 100;             // Baseline nutrient level in each cell
export const BASE_MOISTURE = 50;              // Baseline moisture level
export const NUTRIENT_DIFFUSION = 0.1;        // Diffusion rate of nutrients
export const NUTRIENT_CONSUMPTION_RATE = 1.0; // Amount of nutrient consumed by a hypha tip per step

// MycelialNetwork / Graph
export const INITIAL_RESOURCE_PER_TIP = 1000.0; // Increased for longer life
export const RESOURCE_FLOW_RATE = 1.2;         // Fraction of resource that flows each tick along edges

/**
 * TIME_LAPSE_FACTOR:
 * Number of simulation sub-steps per animation frame.
 * 1 => real-time
 * 10 => each frame = 10 steps => ~10x faster "time-lapse"
 */
export const TIME_LAPSE_FACTOR = 1;

/**
 * SECONDARY_FAN_COUNT:
 * Number of secondary tips spawned per branch.
 */
export const SECONDARY_FAN_COUNT = 1; // Reduced for testing

/**
 * WIDER_SECONDARY_ANGLE:
 * Angle spread (in radians) for secondary tips branching out.
 */
export const WIDER_SECONDARY_ANGLE = Math.PI / 3;

// Perlin Noise
export const PERLIN_SCALE = 0.005;
export const ANGLE_DRIFT_STRENGTH = 0.05;
export const WIGGLE_STRENGTH = 1.5;

// Rendering
export const BACKGROUND_ALPHA = 0.0; // Disable fading for testing
export const FADE_START_FACTOR = 0.9;      // Radius fraction where fade begins
export const FADE_END_FACTOR = 1.0;

export const SHADOW_BLUR = 4;              // Reduced blur
export const SHADOW_COLOR = "rgba(255,255,255,0.3)"; // Reduced opacity

export const MAIN_LINE_WIDTH = 6.0;        // Increased from 5.0
export const SECONDARY_LINE_WIDTH = 3.0;   // Increased from 2.0
export const MAIN_ALPHA = 1;
export const SECONDARY_ALPHA = 0.7;

// Colors
export const BASE_HUE = 180;         // Bright cyan
export const BASE_LIGHTNESS = 50;    // Adjusted for better visibility
