/**
 * constants.ts
 *
 * Tunable parameters for a stable, iterative mycelium simulation.
 */

// Petri dish size
export const GROWTH_RADIUS_FACTOR = 0.45; 
export const MAIN_BRANCH_COUNT = 8;       // how many trunk filaments from center

// Hyphal life
export const BASE_LIFE = 1500;  // enough to reach boundary (big enough dish)
export const BRANCH_DECAY = 0.6; // fraction of parent's life for secondaries
export const MAX_BRANCH_DEPTH = 5; 
export const BRANCH_CHANCE = 0.12; // moderate chance

// Step size
export const STEP_SIZE = 2.0;  
export const ANASTOMOSIS_RADIUS = 4; // if near existing node, fuse

// Limit total tips to prevent runaway
export const MAX_TIPS = 2000;

// Perlin noise
export const PERLIN_SCALE = 0.01;
export const ANGLE_DRIFT_STRENGTH = 0.1;
export const WIGGLE_STRENGTH = 1.2;

// Resource / environment
export const ENV_GRID_CELL_SIZE = 15; 
export const BASE_NUTRIENT = 30;      // fairly high => won't starve quickly
export const NUTRIENT_DIFFUSION = 0.02; // mild replenish
export const NUTRIENT_CONSUMPTION_RATE = 0.03; // modest consumption

// Mycelial network resource flow
export const RESOURCE_FLOW_RATE = 0.2;

// Rendering
export const BACKGROUND_ALPHA = 0.05; // faint fade each frame
export const MAIN_LINE_WIDTH = 2.0;
export const SECONDARY_LINE_WIDTH = 1.0;
export const MAIN_ALPHA = 0.85;
export const SECONDARY_ALPHA = 0.5;
export const BASE_HUE = 50;
export const BASE_LIGHTNESS = 95;

// Fade near boundary
export const FADE_START_FACTOR = 0.9;
export const FADE_END_FACTOR = 1.0;

// Simple time-lapse factor => not too large so we don't freeze
export const TIME_LAPSE_FACTOR = 3;

// Secondary branching fans out a bit
export const SECONDARY_FAN_COUNT = 2;
export const WIDER_SECONDARY_ANGLE = Math.PI / 3; // ~±60°

export const SHADOW_BLUR = 6;
export const SHADOW_COLOR = "rgba(255,255,255,0.5)";
