// src/constants.ts

/**
 * constants.ts
 *
 * Contains tunable parameters and constants
 * for the mycelial simulation.
 */

// -----------------------------
// Canvas & Growth Parameters
// -----------------------------

export const GROWTH_RADIUS_FACTOR = 0.90;     // Fraction of min(width, height) for growth boundary
export const MAIN_BRANCH_COUNT = 50;          // Number of main branches (reduced from 100 to balance density)

// -----------------------------
// Growth Mechanics
// -----------------------------

export const STEP_SIZE = 1;                    // Base step size for each iteration (reduced from 10 for smoother growth)
export const GROWTH_SPEED_MULTIPLIER = 0.5;    // Multiplier to control overall growth speed (increased from 0.01)
export const BASE_LIFE = 3000;                 // Base life for main tips
export const BRANCH_DECAY = 0.9;               // Fraction of parent's life for branches
export const BRANCH_CHANCE = 0.05;             // Probability of branching per step (reduced from 0.9 to control branching rate)
export const MAX_BRANCH_DEPTH = 50;            // Maximum depth for nested branches (reduced from 1000 to limit recursion)
export const ANGLE_DRIFT_STRENGTH = 0.2;        // Strength of angle drift influenced by Perlin noise (maintained)
export const WIGGLE_STRENGTH = 0.5;             // Strength of wiggle for additional randomness (maintained)
export const PERLIN_SCALE = 0.05;               // Scale for Perlin noise (reduced from 0.5 for smoother drift)

// -----------------------------
// Environmental Parameters
// -----------------------------

export const ENV_GRID_CELL_SIZE = 1;           // Size of each grid cell for resource distribution
export const BASE_NUTRIENT = 100;              // Baseline nutrient level in each cell
export const NUTRIENT_DIFFUSION = 0.1;         // Diffusion rate of nutrients
export const NUTRIENT_CONSUMPTION_RATE = 1.0;  // Amount of nutrient consumed by a hypha tip per step

// -----------------------------
// Nutrient Pockets Parameters
// -----------------------------

export const NUTRIENT_POCKET_RADIUS = 3;       // Radius of nutrient pockets in grid cells
export const NUTRIENT_POCKET_AMOUNT = 100;     // Amount of nutrient added per pocket
export const NUTRIENT_POCKET_DECAY_RATE = 0.5; // Decay rate of nutrient pockets per step

// -----------------------------
// Replenishment Parameters
// -----------------------------

export const REPLENISHMENT_INTERVAL = 60000;  // Interval in milliseconds to replenish nutrients
export const REPLENISHMENT_AMOUNT = 5;        // Amount of nutrient added per cell during replenishment

// -----------------------------
// Mycelial Network Parameters
// -----------------------------

export const INITIAL_RESOURCE_PER_TIP = 2000.0; // Initial resource for each hypha tip
export const RESOURCE_FLOW_RATE = 1.2;           // Fraction of resource that flows each tick along edges

// -----------------------------
// Growth Simulation Parameters
// -----------------------------

export const TIME_LAPSE_FACTOR = 1;               // Number of simulation steps per animation frame
export const SECONDARY_FAN_COUNT = 3;             // Number of secondary branches per main tip
export const WIDER_SECONDARY_ANGLE = Math.PI / 4; // Additional angle spread for secondary branches

// -----------------------------
// Rendering Parameters
// -----------------------------

export const BACKGROUND_ALPHA = 0.00;             // Transparency for nutrient environment rendering (changed from 0 to 0.05)
export const FADE_START_FACTOR = 0.8;             // Radius factor to start fading
export const FADE_END_FACTOR = 1.0;               // Radius factor to end fading
export const SHADOW_BLUR = 10;                    // Blur level for shadows
export const SHADOW_COLOR = "rgba(255,255,255,0.1)"; // Shadow color and opacity (adjusted for better visibility)

// -----------------------------
// Line Rendering Parameters
// -----------------------------

export const MAIN_LINE_WIDTH = 2.0;               // Width of main hyphal lines
export const SECONDARY_LINE_WIDTH = 1.0;          // Width of secondary hyphal lines
export const MAIN_ALPHA = 1;                       // Opacity of main hyphal lines
export const SECONDARY_ALPHA = 0.7;                // Opacity of secondary hyphal lines

// -----------------------------
// Color Parameters
// -----------------------------

export const BASE_HUE = 0;                         // Base hue for hyphal lines (0 = red, but with saturation 0 for white)
export const BASE_LIGHTNESS = 80;                  // Base lightness for hyphal lines (80% for main branches)

// New Constant for Lightness Increment
export const LIGHTNESS_STEP = 5;                   // Lightness increase per branching depth

// -----------------------------
// Miscellaneous Parameters
// -----------------------------

export const ANASTOMOSIS_RADIUS = 10;             // Radius within which tips fuse
