// src/constants.ts

/**
 * constants.ts
 *
 * Contains tunable parameters and constants
 * for the mycelial simulation.
 */

export interface Config {
    // Define all properties with their types
    GROWTH_RADIUS_FACTOR: number;
    MAIN_BRANCH_COUNT: number;
    STEP_SIZE: number;
    GROWTH_SPEED_MULTIPLIER: number;
    BASE_LIFE: number;
    BRANCH_DECAY: number;
    BRANCH_CHANCE: number;
    MAX_BRANCH_DEPTH: number;
    ANGLE_DRIFT_STRENGTH: number;
    WIGGLE_STRENGTH: number;
    PERLIN_SCALE: number;
    ENV_GRID_CELL_SIZE: number;
    BASE_NUTRIENT: number;
    NUTRIENT_DIFFUSION: number;
    NUTRIENT_CONSUMPTION_RATE: number;
    NUTRIENT_POCKET_RADIUS: number;
    NUTRIENT_POCKET_AMOUNT: number;
    NUTRIENT_POCKET_DECAY_RATE: number;
    REPLENISHMENT_INTERVAL: number;
    REPLENISHMENT_AMOUNT: number;
    INITIAL_RESOURCE_PER_TIP: number;
    RESOURCE_FLOW_RATE: number;
    TIME_LAPSE_FACTOR: number;
    SECONDARY_FAN_COUNT: number;
    WIDER_SECONDARY_ANGLE: number;
    BACKGROUND_ALPHA: number;
    FADE_START_FACTOR: number;
    FADE_END_FACTOR: number;
    SHADOW_BLUR: number;
    SHADOW_COLOR: string;
    MAIN_LINE_WIDTH: number;
    SECONDARY_LINE_WIDTH: number;
    MAIN_ALPHA: number;
    SECONDARY_ALPHA: number;
    BASE_HUE: number;
    BASE_LIGHTNESS: number;
    LIGHTNESS_STEP: number;
    ANASTOMOSIS_RADIUS: number;
  }

// Explicitly typed config constant
export const config: Config = {
    // -----------------------------
    // Canvas & Growth Parameters
    // -----------------------------
    GROWTH_RADIUS_FACTOR: 0.25,     // Fraction of min(width, height) for growth boundary
    MAIN_BRANCH_COUNT: 10,          // Number of main branches
  
    // -----------------------------
    // Growth Mechanics
    // -----------------------------
    STEP_SIZE: 1.5,                 // Base step size for each iteration
    GROWTH_SPEED_MULTIPLIER: 0.5,   // Multiplier to control overall growth speed
    BASE_LIFE: 300,                // Base life for main tips
    BRANCH_DECAY: 0.9,              // Fraction of parent's life for branches
    BRANCH_CHANCE: 0.5,             // Probability of branching per step
    MAX_BRANCH_DEPTH: 50,          // Maximum depth for nested branches
    ANGLE_DRIFT_STRENGTH: 0.05,     // Strength of angle drift influenced by Perlin noise
    WIGGLE_STRENGTH: 0.2,           // Strength of wiggle for additional randomness
    PERLIN_SCALE: 0.05,             // Scale for Perlin noise
  
    // -----------------------------
    // Environmental Parameters
    // -----------------------------
    ENV_GRID_CELL_SIZE: 1,          // Size of each grid cell for resource distribution
    BASE_NUTRIENT: 100,             // Baseline nutrient level in each cell
    NUTRIENT_DIFFUSION: 0.1,        // Diffusion rate of nutrients
    NUTRIENT_CONSUMPTION_RATE: 1.0, // Amount of nutrient consumed by a hypha tip per step
  
    // -----------------------------
    // Nutrient Pockets Parameters
    // -----------------------------
    NUTRIENT_POCKET_RADIUS: 3,        // Radius of nutrient pockets in grid cells
    NUTRIENT_POCKET_AMOUNT: 100,      // Amount of nutrient added per pocket
    NUTRIENT_POCKET_DECAY_RATE: 0.5,  // Decay rate of nutrient pockets per step
  
    // -----------------------------
    // Replenishment Parameters
    // -----------------------------
    REPLENISHMENT_INTERVAL: 60000,   // Interval in milliseconds to replenish nutrients
    REPLENISHMENT_AMOUNT: 5,         // Amount of nutrient added per cell during replenishment
  
    // -----------------------------
    // Mycelial Network Parameters
    // -----------------------------
    INITIAL_RESOURCE_PER_TIP: 2000.0, // Initial resource for each hypha tip
    RESOURCE_FLOW_RATE: 1.2,          // Fraction of resource that flows each tick along edges
  
    // -----------------------------
    // Growth Simulation Parameters
    // -----------------------------
    TIME_LAPSE_FACTOR: 1,               // Number of simulation steps per animation frame
    SECONDARY_FAN_COUNT: 1,             // Number of secondary branches per main tip
    WIDER_SECONDARY_ANGLE: Math.PI / 6, // Additional angle spread for secondary branches
  
    // -----------------------------
    // Rendering Parameters
    // -----------------------------
    BACKGROUND_ALPHA: 0.00,                  // Transparency for nutrient environment rendering
    FADE_START_FACTOR: 0.8,                  // Radius factor to start fading
    FADE_END_FACTOR: 1.0,                    // Radius factor to end fading
    SHADOW_BLUR: 10,                         // Blur level for shadows
    SHADOW_COLOR: "rgba(96, 80, 80, 0.1)", // Shadow color and opacity
  
    // -----------------------------
    // Line Rendering Parameters
    // -----------------------------
    MAIN_LINE_WIDTH: 2.0,           // Width of main hyphal lines
    SECONDARY_LINE_WIDTH: 1.0,      // Width of secondary hyphal lines
    MAIN_ALPHA: 1,                  // Opacity of main hyphal lines
    SECONDARY_ALPHA: 0.7,           // Opacity of secondary hyphal lines
  
    // -----------------------------
    // Color Parameters
    // -----------------------------
    BASE_HUE: 0,                    // Base hue for hyphal lines (0 = red, but with saturation 0 for white)
    BASE_LIGHTNESS: 80,             // Base lightness for hyphal lines
  
    // Lightness Increment
    LIGHTNESS_STEP: 3,              // Lightness increase per branching depth
  
    // -----------------------------
    // Miscellaneous Parameters
    // -----------------------------
    ANASTOMOSIS_RADIUS: 0.05,       // Radius within which tips fuse
  };
  