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
  // Biological parameters
  CHEMOTROPISM_STRENGTH: number; // How strongly hyphae grow toward nutrients
  NEGATIVE_AUTOTROPISM_STRENGTH: number; // How strongly hyphae avoid their own kind
  LINE_THICKENING_FACTOR: number; // Rate at which transport routes thicken with use
  GRADIENT_SAMPLING_RADIUS: number; // Radius to sample nutrient gradients
  HYPHAL_MATURATION_RATE: number; // Rate at which hyphae mature and harden
  TRANSPORT_EFFICIENCY_FACTOR: number; // Efficiency of resource transport in mature hyphae
  MOISTURE_FACTOR: number; // How much moisture influences growth
  // Advanced biological parameters
  ENZYME_SECRETION_RADIUS: number; // Radius in which hyphal tips secrete enzymes
  ENZYME_DIFFUSION_RATE: number; // Rate at which enzymes diffuse through substrate
  ENZYME_DIGESTION_RATE: number; // Rate at which enzymes break down substrate
  CARBON_NITROGEN_RATIO: number; // Ratio of carbon to nitrogen nutrients in substrate
  HYPHAL_RESPIRATION_RATE: number; // Rate at which hyphae consume resources for maintenance
  SPORE_FORMATION_THRESHOLD: number; // Resource threshold for spore formation
  APICAL_DOMINANCE_FACTOR: number; // Suppression of nearby branching by active tips
  SUBSTRATE_PENETRATION_RESISTANCE: number; // Resistance of substrate to hyphal growth
  SEASONAL_GROWTH_PATTERN: boolean; // Whether to simulate seasonal growth patterns
  CIRCADIAN_RHYTHM_AMPLITUDE: number; // Daily oscillation in growth activity
  GEOTROPISM_STRENGTH: number; // Tendency to grow against gravity
  PH_TOLERANCE_RANGE: [number, number]; // Range of pH values tolerated by hyphae
  TEMPERATURE_OPTIMUM: number; // Optimal temperature for growth
  TEMPERATURE_RANGE: [number, number]; // Range of temperatures tolerated by hyphae
  COMPETITOR_FUNGAL_PRESENCE: boolean; // Whether to simulate competing fungi
  BACTERIAL_INTERACTION_FACTOR: number; // Influence of bacterial interactions on growth
}

export const config = {
  // -----------------------------
  // Canvas & Growth Parameters
  // -----------------------------
  GROWTH_RADIUS_FACTOR: 0.8, // Fraction of min(width, height) for growth boundary
  MAIN_BRANCH_COUNT: 15, // Number of main branches

  // -----------------------------
  // Growth Mechanics
  // -----------------------------
  STEP_SIZE: 3.0, // Base step size for each iteration
  GROWTH_SPEED_MULTIPLIER: 4.0, // Multiplier to control overall growth speed
  BASE_LIFE: 600, // Base life for main tips
  BRANCH_DECAY: 0.85, // Fraction of parent's life for branches
  BRANCH_CHANCE: 0.7, // Probability of branching per step
  MAX_BRANCH_DEPTH: 100, // Maximum depth for nested branches
  ANGLE_DRIFT_STRENGTH: 0.15, // Strength of angle drift influenced by Perlin noise (increased for more realistic meandering)
  WIGGLE_STRENGTH: 0.2, // Strength of wiggle for additional randomness
  PERLIN_SCALE: 0.05, // Scale for Perlin noise

  // -----------------------------
  // Environmental Parameters
  // -----------------------------
  ENV_GRID_CELL_SIZE: 1, // Size of each grid cell for resource distribution
  BASE_NUTRIENT: 100, // Baseline nutrient level in each cell
  NUTRIENT_DIFFUSION: 0.1, // Diffusion rate of nutrients
  NUTRIENT_CONSUMPTION_RATE: 1.0, // Amount of nutrient consumed by a hypha tip per step

  // -----------------------------
  // Nutrient Pockets Parameters
  // -----------------------------
  NUTRIENT_POCKET_RADIUS: 5, // Radius of nutrient pockets in grid cells
  NUTRIENT_POCKET_AMOUNT: 200, // Amount of nutrient added per pocket
  NUTRIENT_POCKET_DECAY_RATE: 0.2, // Decay rate of nutrient pockets per step

  // -----------------------------
  // Replenishment Parameters
  // -----------------------------
  REPLENISHMENT_INTERVAL: 60000, // Interval in milliseconds to replenish nutrients
  REPLENISHMENT_AMOUNT: 5, // Amount of nutrient added per cell during replenishment

  // -----------------------------
  // Mycelial Network Parameters
  // -----------------------------
  INITIAL_RESOURCE_PER_TIP: 2000.0, // Initial resource for each hypha tip
  RESOURCE_FLOW_RATE: 1.2, // Fraction of resource that flows each tick along edges

  // -----------------------------
  // Growth Simulation Parameters
  // -----------------------------
  TIME_LAPSE_FACTOR: 10, // Number of simulation steps per animation frame
  SECONDARY_FAN_COUNT: 1, // Number of secondary branches per main tip
  WIDER_SECONDARY_ANGLE: Math.PI / 6, // Additional angle spread for secondary branches

  // -----------------------------
  // Rendering Parameters
  // -----------------------------
  BACKGROUND_ALPHA: 0.03, // Transparency for nutrient environment rendering
  FADE_START_FACTOR: 0.8, // Radius factor to start fading
  FADE_END_FACTOR: 1.0, // Radius factor to end fading
  SHADOW_BLUR: 10, // Blur level for shadows
  SHADOW_COLOR: "rgba(96, 80, 80, 0.1)", // Shadow color and opacity

  // -----------------------------
  // Line Rendering Parameters
  // -----------------------------
  MAIN_LINE_WIDTH: 3.0, // Width of main hyphal lines
  SECONDARY_LINE_WIDTH: 2.0, // Width of secondary hyphal lines
  MAIN_ALPHA: 1, // Opacity of main hyphal lines
  SECONDARY_ALPHA: 0.9, // Opacity of secondary hyphal lines

  // -----------------------------
  // Color Parameters
  // -----------------------------
  BASE_HUE: 40, // Base hue for hyphal lines (40 = orange-yellow for better visibility)
  BASE_LIGHTNESS: 60, // Base lightness for hyphal lines

  // Lightness Increment
  LIGHTNESS_STEP: 3, // Lightness increase per branching depth

  // -----------------------------
  // Miscellaneous Parameters
  // -----------------------------
  ANASTOMOSIS_RADIUS: 0.75, // Radius within which tips fuse (increased for more realistic anastomosis)
  
  // -----------------------------
  // Biologically Realistic Parameters
  // -----------------------------
  CHEMOTROPISM_STRENGTH: 0.6, // How strongly hyphae grow toward nutrients (0-1)
  NEGATIVE_AUTOTROPISM_STRENGTH: 0.3, // How strongly hyphae avoid their own kind (0-1)
  LINE_THICKENING_FACTOR: 0.02, // Rate at which transport routes thicken with use
  GRADIENT_SAMPLING_RADIUS: 5, // Radius to sample nutrient gradients (in grid cells)
  HYPHAL_MATURATION_RATE: 0.05, // Rate at which hyphae mature and harden per step
  TRANSPORT_EFFICIENCY_FACTOR: 1.5, // Efficiency multiplier for resource transport in mature hyphae
  MOISTURE_FACTOR: 0.7, // How much moisture influences growth (0-1)

  // -----------------------------
  // Advanced Biological Parameters
  // -----------------------------
  ENZYME_SECRETION_RADIUS: 3.5, // Radius in which hyphal tips secrete enzymes (grid cells)
  ENZYME_DIFFUSION_RATE: 0.15, // Rate at which enzymes diffuse through substrate
  ENZYME_DIGESTION_RATE: 0.08, // Rate at which enzymes break down substrate into nutrients
  CARBON_NITROGEN_RATIO: 25, // Ratio of carbon to nitrogen nutrients (C:N) in substrate (realistic for wood)
  HYPHAL_RESPIRATION_RATE: 0.02, // Rate at which hyphae consume resources for maintenance
  SPORE_FORMATION_THRESHOLD: 5000, // Resource threshold for spore formation
  APICAL_DOMINANCE_FACTOR: 0.6, // Suppression of nearby branching by active tips (0-1)
  SUBSTRATE_PENETRATION_RESISTANCE: 0.3, // Resistance of substrate to hyphal growth (0-1)
  SEASONAL_GROWTH_PATTERN: true, // Whether to simulate seasonal growth patterns
  CIRCADIAN_RHYTHM_AMPLITUDE: 0.2, // Daily oscillation in growth activity (0-1)
  GEOTROPISM_STRENGTH: 0.15, // Tendency to grow against gravity (0-1)
  PH_TOLERANCE_RANGE: [4.5, 7.0], // Range of pH values tolerated by hyphae (acidic to neutral)
  TEMPERATURE_OPTIMUM: 25, // Optimal temperature for growth (°C)
  TEMPERATURE_RANGE: [5, 35], // Range of temperatures tolerated by hyphae (°C)
  COMPETITOR_FUNGAL_PRESENCE: false, // Whether to simulate competing fungi
  BACTERIAL_INTERACTION_FACTOR: 0.1, // Influence of bacterial interactions on growth (-1 to 1)
};
