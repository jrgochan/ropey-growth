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
  NUTRIENT_HUE: number;
  LIGHTNESS_STEP: number;
  ANASTOMOSIS_RADIUS: number;
}

export const config = {
  // -----------------------------
  // Canvas & Growth Parameters
  // -----------------------------
  GROWTH_RADIUS_FACTOR: 0.25, // Fraction of min(width, height) for growth boundary
  MAIN_BRANCH_COUNT: 8, // Number of main branches (reduced from 10 for performance)

  // -----------------------------
  // Growth Mechanics
  // -----------------------------
  STEP_SIZE: 1.5, // Base step size for each iteration
  GROWTH_SPEED_MULTIPLIER: 0.5, // Multiplier to control overall growth speed
  BASE_LIFE: 300, // Base life for main tips
  BRANCH_DECAY: 0.85, // Fraction of parent's life for branches (reduced from 0.9)
  BRANCH_CHANCE: 0.4, // Probability of branching per step (reduced from 0.5)
  MAX_BRANCH_DEPTH: 40, // Maximum depth for nested branches (reduced from 50)
  ANGLE_DRIFT_STRENGTH: 0.05, // Strength of angle drift influenced by Perlin noise
  WIGGLE_STRENGTH: 0.2, // Strength of wiggle for additional randomness
  PERLIN_SCALE: 0.05, // Scale for Perlin noise

  // -----------------------------
  // Environmental Parameters
  // -----------------------------
  ENV_GRID_CELL_SIZE: 2, // Size of each grid cell for resource distribution (increased from 1)
  BASE_NUTRIENT: 100, // Baseline nutrient level in each cell
  NUTRIENT_DIFFUSION: 0.2, // Diffusion rate of nutrients (reduced from 0.25)
  NUTRIENT_CONSUMPTION_RATE: 1.0, // Amount of nutrient consumed by a hypha tip per step

  // -----------------------------
  // Nutrient Pockets Parameters
  // -----------------------------
  NUTRIENT_POCKET_RADIUS: 3, // Radius of nutrient pockets in grid cells
  NUTRIENT_POCKET_AMOUNT: 100, // Amount of nutrient added per pocket
  NUTRIENT_POCKET_DECAY_RATE: 0.5, // Decay rate of nutrient pockets per step

  // -----------------------------
  // Replenishment Parameters
  // -----------------------------
  REPLENISHMENT_INTERVAL: 60000, // Interval in milliseconds to replenish nutrients
  REPLENISHMENT_AMOUNT: 5, // Amount of nutrient added per cell during replenishment

  // -----------------------------
  // Mycelial Network Parameters
  // -----------------------------
  INITIAL_RESOURCE_PER_TIP: 2000.0, // Initial resource for each hypha tip
  RESOURCE_FLOW_RATE: 2.0, // Fraction of resource that flows each tick along edges (reduced from 2.5)

  // -----------------------------
  // Growth Simulation Parameters
  // -----------------------------
  TIME_LAPSE_FACTOR: 1, // Number of simulation steps per animation frame
  SECONDARY_FAN_COUNT: 1, // Number of secondary branches per main tip
  WIDER_SECONDARY_ANGLE: Math.PI / 6, // Additional angle spread for secondary branches

  // -----------------------------
  // Rendering Parameters
  // -----------------------------
  BACKGROUND_ALPHA: 0.0, // Transparency for nutrient environment rendering
  FADE_START_FACTOR: 0.8, // Radius factor to start fading
  FADE_END_FACTOR: 1.0, // Radius factor to end fading
  SHADOW_BLUR: 5, // Blur level for shadows (reduced from 10)
  SHADOW_COLOR: "rgba(96, 80, 80, 0.1)", // Shadow color and opacity

  // -----------------------------
  // Line Rendering Parameters
  // -----------------------------
  MAIN_LINE_WIDTH: 1.5, // Width of main hyphal lines (reduced from 2.0)
  SECONDARY_LINE_WIDTH: 0.75, // Width of secondary hyphal lines (reduced from 1.0)
  MAIN_ALPHA: 1, // Opacity of main hyphal lines
  SECONDARY_ALPHA: 0.7, // Opacity of secondary hyphal lines

  // -----------------------------
  // Color Parameters
  // -----------------------------
  BASE_HUE: 0, // Base hue for hyphal lines (0 = red, but with saturation 0 for white)
  BASE_LIGHTNESS: 80, // Base lightness for hyphal lines
  NUTRIENT_HUE: 120, // Hue for nutrient visualization (120 = green)

  // Lightness Increment
  LIGHTNESS_STEP: 3, // Lightness increase per branching depth

  // -----------------------------
  // Miscellaneous Parameters
  // -----------------------------
  ANASTOMOSIS_RADIUS: 0.25, // Radius within which tips fuse
};
