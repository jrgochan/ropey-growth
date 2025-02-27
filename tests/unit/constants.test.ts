/**
 * Unit tests for configuration constants
 */

import { describe, it, expect } from 'vitest';
import { config } from '../../src/constants.js';

// Creating a simplified version of the test file to avoid import and dependency issues
const runUnitTests = true;

describe('Constants', () => {
  it('should have essential growth parameters defined', () => {
    expect(config).toBeDefined();
    expect(config.GROWTH_RADIUS_FACTOR).toBeDefined();
    expect(config.MAIN_BRANCH_COUNT).toBeDefined();
    expect(config.STEP_SIZE).toBeDefined();
    expect(config.GROWTH_SPEED_MULTIPLIER).toBeDefined();
    expect(config.BASE_LIFE).toBeDefined();
  });

  it('should have valid growth parameter values', () => {
    // Growth radius should be a fraction (0-1)
    expect(config.GROWTH_RADIUS_FACTOR).toBeGreaterThan(0);
    expect(config.GROWTH_RADIUS_FACTOR).toBeLessThanOrEqual(1);
    
    // Main branch count should be positive
    expect(config.MAIN_BRANCH_COUNT).toBeGreaterThan(0);
    
    // Step size should be positive
    expect(config.STEP_SIZE).toBeGreaterThan(0);
    
    // Growth speed multiplier should be positive
    expect(config.GROWTH_SPEED_MULTIPLIER).toBeGreaterThan(0);
    
    // Base life should be positive
    expect(config.BASE_LIFE).toBeGreaterThan(0);
  });

  it('should have valid branching parameters', () => {
    // Branch decay should be between 0 and 1
    expect(config.BRANCH_DECAY).toBeGreaterThan(0);
    expect(config.BRANCH_DECAY).toBeLessThanOrEqual(1);
    
    // Branch chance should be between 0 and 1
    expect(config.BRANCH_CHANCE).toBeGreaterThan(0);
    expect(config.BRANCH_CHANCE).toBeLessThanOrEqual(1);
    
    // Max branch depth should be positive
    expect(config.MAX_BRANCH_DEPTH).toBeGreaterThan(0);
  });

  it('should have valid environmental parameters', () => {
    // Grid cell size should be positive
    expect(config.ENV_GRID_CELL_SIZE).toBeGreaterThan(0);
    
    // Base nutrient should be positive
    expect(config.BASE_NUTRIENT).toBeGreaterThan(0);
    
    // Nutrient diffusion should be between 0 and 1
    expect(config.NUTRIENT_DIFFUSION).toBeGreaterThan(0);
    expect(config.NUTRIENT_DIFFUSION).toBeLessThanOrEqual(1);
    
    // Nutrient consumption rate should be positive
    expect(config.NUTRIENT_CONSUMPTION_RATE).toBeGreaterThan(0);
  });

  it('should have valid rendering parameters', () => {
    // Background alpha should be between 0 and 1
    expect(config.BACKGROUND_ALPHA).toBeGreaterThanOrEqual(0);
    expect(config.BACKGROUND_ALPHA).toBeLessThanOrEqual(1);
    
    // Fade factors should be between 0 and 1
    expect(config.FADE_START_FACTOR).toBeGreaterThanOrEqual(0);
    expect(config.FADE_START_FACTOR).toBeLessThanOrEqual(1);
    expect(config.FADE_END_FACTOR).toBeGreaterThanOrEqual(0);
    expect(config.FADE_END_FACTOR).toBeLessThanOrEqual(1);
    
    // Line width should be positive
    expect(config.MAIN_LINE_WIDTH).toBeGreaterThan(0);
    expect(config.SECONDARY_LINE_WIDTH).toBeGreaterThan(0);
    
    // Alphas should be between 0 and 1
    expect(config.MAIN_ALPHA).toBeGreaterThan(0);
    expect(config.MAIN_ALPHA).toBeLessThanOrEqual(1);
    expect(config.SECONDARY_ALPHA).toBeGreaterThan(0);
    expect(config.SECONDARY_ALPHA).toBeLessThanOrEqual(1);
  });

  it('should have valid biological parameters', () => {
    // Chemotropism strength should be between 0 and 1
    expect(config.CHEMOTROPISM_STRENGTH).toBeGreaterThanOrEqual(0);
    expect(config.CHEMOTROPISM_STRENGTH).toBeLessThanOrEqual(1);
    
    // Negative autotropism strength should be between 0 and 1
    expect(config.NEGATIVE_AUTOTROPISM_STRENGTH).toBeGreaterThanOrEqual(0);
    expect(config.NEGATIVE_AUTOTROPISM_STRENGTH).toBeLessThanOrEqual(1);
    
    // Hyphal maturation rate should be between 0 and 1
    expect(config.HYPHAL_MATURATION_RATE).toBeGreaterThan(0);
    expect(config.HYPHAL_MATURATION_RATE).toBeLessThanOrEqual(1);
    
    // Transport efficiency factor should be positive
    expect(config.TRANSPORT_EFFICIENCY_FACTOR).toBeGreaterThan(0);
    
    // Moisture factor should be between 0 and 1
    expect(config.MOISTURE_FACTOR).toBeGreaterThanOrEqual(0);
    expect(config.MOISTURE_FACTOR).toBeLessThanOrEqual(1);
  });

  it('should have consistent related parameters', () => {
    // Fade end factor should be greater than or equal to fade start factor
    expect(config.FADE_END_FACTOR).toBeGreaterThanOrEqual(config.FADE_START_FACTOR);
    
    // Main line width should be greater than or equal to secondary line width
    expect(config.MAIN_LINE_WIDTH).toBeGreaterThanOrEqual(config.SECONDARY_LINE_WIDTH);
    
    // Temperature optimum should be within temperature range
    expect(config.TEMPERATURE_OPTIMUM).toBeGreaterThanOrEqual(config.TEMPERATURE_RANGE[0]);
    expect(config.TEMPERATURE_OPTIMUM).toBeLessThanOrEqual(config.TEMPERATURE_RANGE[1]);
    
    // pH tolerance range should be valid
    expect(config.PH_TOLERANCE_RANGE[1]).toBeGreaterThan(config.PH_TOLERANCE_RANGE[0]);
  });

  it('should have valid time-related parameters', () => {
    // Time lapse factor should be positive
    expect(config.TIME_LAPSE_FACTOR).toBeGreaterThan(0);
    
    // Replenishment interval should be positive
    expect(config.REPLENISHMENT_INTERVAL).toBeGreaterThan(0);
  });
});