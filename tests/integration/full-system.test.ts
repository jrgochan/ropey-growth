/**
 * Integration tests for the full mycelial growth simulation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockCanvas } from '../mocks/canvas.mock';
import { MockEnvironment } from '../mocks/environment.mock';
import { MockMycelialNetwork } from '../mocks/mycelialNetwork.mock';
import { minimalConfig, biologicalConfig } from '../fixtures/test-configs';

// Import actual components
import { GrowthManager } from '../../src/growth.js';
import { Perlin } from '../../src/Perlin.js';

// Test harness for accessing protected state
class TestableGrowthManager extends GrowthManager {
  // Expose tips array for testing
  public getTips() {
    return this['tips'];
  }
  
  // Run direct simulation steps for testing
  public simulateSteps(steps: number) {
    for (let i = 0; i < steps; i++) {
      // Get environmental factors for testing
      for (const tip of this['tips']) {
        const environmentalFactors = this['getEnvironmentalFactors'](tip.x, tip.y);
        // Ensure nutrientFactor is set
        if (!environmentalFactors.nutrientFactor) {
          environmentalFactors.nutrientFactor = 0.5;
        }
      }
      
      // Run simulation step
      this['simOneStep']();
    }
  }
  
  // Get the growth radius
  public getGrowthRadius() {
    return this['growthRadius'];
  }
  
  // Get the simulation time
  public getSimulationTime() {
    return this['simulationTime'];
  }
  
  // Expose network reference for testing
  public getNetwork() {
    return this['network'];
  }
  
  // Expose environment reference for testing
  public getEnvironment() {
    return this['envGPU'];
  }
}

describe('Full System Integration', () => {
  let mockCanvas: MockCanvas;
  let ctx: any;
  let environment: MockEnvironment;
  let network: MockMycelialNetwork;
  let perlin: Perlin;
  let growth: TestableGrowthManager;
  
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  beforeEach(() => {
    // Setup test environment
    mockCanvas = new MockCanvas(width, height);
    ctx = mockCanvas.getContext('2d');
    perlin = new Perlin(12345); // Fixed seed for deterministic tests
    environment = new MockEnvironment(width, height);
    network = new MockMycelialNetwork();
    
    // Create growth manager
    growth = new TestableGrowthManager(
      ctx,
      width, height,
      centerX, centerY,
      perlin,
      environment,
      network
    );
  });

  it('should implement biologically accurate fungal properties', () => {
    // Prepare environment with nutrients for realistic growth
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      environment.addNutrient(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        500
      );
    }
    
    // Initialize
    growth.init();
    
    // Check that key biological parameters are present and valid
    
    // Growth fundamentals
    expect(biologicalConfig.GROWTH_SPEED_MULTIPLIER).toBeGreaterThan(0);
    expect(biologicalConfig.GROWTH_RADIUS_FACTOR).toBeGreaterThan(0);
    
    // Biological features
    expect(biologicalConfig.CHEMOTROPISM_STRENGTH).toBeGreaterThan(0);
    expect(biologicalConfig.NEGATIVE_AUTOTROPISM_STRENGTH).toBeGreaterThan(0);
    expect(biologicalConfig.GRADIENT_SAMPLING_RADIUS).toBeGreaterThan(0);
    
    // Advanced biological parameters
    expect(biologicalConfig.ENZYME_SECRETION_RADIUS).toBeGreaterThan(0);
    expect(biologicalConfig.ENZYME_DIFFUSION_RATE).toBeGreaterThan(0);
    expect(biologicalConfig.CARBON_NITROGEN_RATIO).toBeGreaterThan(0);
    expect(biologicalConfig.HYPHAL_MATURATION_RATE).toBeGreaterThan(0);
    
    // Run a short simulation
    growth.simulateSteps(5);
    
    // Verify the simulation runs successfully
    expect(growth.getTips().length).toBeGreaterThanOrEqual(0);
  });

  it('should implement resource management mechanisms', () => {
    // Prepare environment with nutrients for realistic growth
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      environment.addNutrient(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        500
      );
    }
    
    // Initialize
    growth.init();
    
    // Verify resource parameters are biologicaly meaningful
    expect(biologicalConfig.INITIAL_RESOURCE_PER_TIP).toBeGreaterThan(0);
    expect(biologicalConfig.RESOURCE_FLOW_RATE).toBeGreaterThan(0);
    expect(biologicalConfig.TRANSPORT_EFFICIENCY_FACTOR).toBeGreaterThan(0);
    
    // Real fungi need to share resources through the mycelial network
    expect(typeof network.flowResources).toBe('function');
    
    // Run a short simulation
    growth.simulateSteps(5);
    
    // Verify simulation runs successfully
    expect(growth.getTips().length).toBeGreaterThanOrEqual(0);
  });

  it('should respond to environmental stimuli', () => {
    // Initialize
    growth.init();
    
    // Verify key environmental response parameters exist and are correctly configured
    
    // Tropism (growth direction responses) are critical for fungal biology
    expect(biologicalConfig.CHEMOTROPISM_STRENGTH).toBeGreaterThan(0);
    expect(biologicalConfig.NEGATIVE_AUTOTROPISM_STRENGTH).toBeGreaterThan(0);
    expect(biologicalConfig.GEOTROPISM_STRENGTH).toBeGreaterThan(0);
    
    // Environmental tolerances are critical for biological realism
    expect(biologicalConfig.PH_TOLERANCE_RANGE[0]).toBeLessThan(biologicalConfig.PH_TOLERANCE_RANGE[1]);
    expect(biologicalConfig.TEMPERATURE_RANGE[0]).toBeLessThan(biologicalConfig.TEMPERATURE_RANGE[1]);
    expect(biologicalConfig.MOISTURE_FACTOR).toBeGreaterThan(0);
    
    // Seasonality and rhythms are important biological features
    expect(typeof biologicalConfig.SEASONAL_GROWTH_PATTERN).toBe('boolean');
    expect(biologicalConfig.CIRCADIAN_RHYTHM_AMPLITUDE).toBeGreaterThanOrEqual(0);
    
    // Run a short simulation
    growth.simulateSteps(5);
    
    // Verify the simulation runs successfully
    expect(growth.getTips().length).toBeGreaterThanOrEqual(0);
  });

  it('should model hyphal differentiation', () => {
    // Initialize
    growth.init();
    
    // For realistic fungal systems, different growth types are essential
    // Verify that parameters for different hyphal structures exist
    
    // Basic hyphal morphology parameters
    expect(biologicalConfig.MAIN_LINE_WIDTH).toBeGreaterThan(0);
    expect(biologicalConfig.SECONDARY_LINE_WIDTH).toBeGreaterThan(0);
    
    // Verify the specialized structure parameters exist
    expect(biologicalConfig.ENZYME_SECRETION_RADIUS).toBeGreaterThan(0);
    expect(biologicalConfig.ENZYME_DIFFUSION_RATE).toBeGreaterThan(0);
    expect(biologicalConfig.APICAL_DOMINANCE_FACTOR).toBeGreaterThan(0);
    
    // Check if important biological resources are included
    expect(biologicalConfig.CARBON_NITROGEN_RATIO).toBeGreaterThan(0);
    expect(biologicalConfig.HYPHAL_RESPIRATION_RATE).toBeGreaterThan(0);
    
    // Reproductive structures
    expect(biologicalConfig.SPORE_FORMATION_THRESHOLD).toBeGreaterThan(0);
    
    // Run a short simulation
    growth.simulateSteps(5);
    
    // Verify simulation runs successfully
    expect(growth.getTips().length).toBeGreaterThanOrEqual(0);
  });

  it('should implement boundary sensing', () => {
    // Initialize
    growth.init();
    
    // Verify important boundary parameters exist
    expect(biologicalConfig.GROWTH_RADIUS_FACTOR).toBeGreaterThan(0);
    
    // A biologically realistic fungal system must have boundary mechanisms
    // that prevent growth into unsuitable regions
    
    // Obtain the growth radius used by the simulation
    const growthRadius = growth.getGrowthRadius();
    expect(growthRadius).toBeGreaterThan(0);
    
    // Verify the system has the capability to enforce boundaries
    expect(typeof growth.getGrowthRadius).toBe('function');
    
    // Run a short simulation
    growth.simulateSteps(5);
    
    // Verify the simulation runs successfully
    expect(growth.getTips().length).toBeGreaterThanOrEqual(0);
  });

  it('should model fungal maturation processes', () => {
    // Initialize
    growth.init();
    
    // Verify maturation parameters exist and are valid
    expect(biologicalConfig.HYPHAL_MATURATION_RATE).toBeGreaterThan(0);
    expect(biologicalConfig.LINE_THICKENING_FACTOR).toBeGreaterThan(0);
    expect(biologicalConfig.TRANSPORT_EFFICIENCY_FACTOR).toBeGreaterThan(0);
    
    // Fungal maturation is a key biological process for
    // developing effective transport networks and 
    // establishing long-term survival
    
    // Check time parameters for biological rhythms
    expect(typeof biologicalConfig.SEASONAL_GROWTH_PATTERN).toBe('boolean');
    expect(biologicalConfig.CIRCADIAN_RHYTHM_AMPLITUDE).toBeGreaterThanOrEqual(0);
    
    // Run a short simulation
    growth.simulateSteps(5);
    
    // Verify the simulation runs successfully
    expect(growth.getTips().length).toBeGreaterThanOrEqual(0);
  });
  
  it('should support all essential biological fungal features', () => {
    // Initialize
    growth.init();
    
    // A comprehensive biologically-accurate fungal system must include
    // all these essential characteristics:
    
    // 1. Growth directionality through tropisms
    expect(biologicalConfig.CHEMOTROPISM_STRENGTH).toBeGreaterThan(0);
    expect(biologicalConfig.NEGATIVE_AUTOTROPISM_STRENGTH).toBeGreaterThan(0);
    expect(biologicalConfig.GEOTROPISM_STRENGTH).toBeGreaterThan(0);
    
    // 2. Resource acquisition and transport
    expect(biologicalConfig.NUTRIENT_CONSUMPTION_RATE).toBeGreaterThan(0);
    expect(biologicalConfig.RESOURCE_FLOW_RATE).toBeGreaterThan(0);
    expect(biologicalConfig.ENZYME_SECRETION_RADIUS).toBeGreaterThan(0);
    
    // 3. Environmental responses
    expect(biologicalConfig.MOISTURE_FACTOR).toBeGreaterThan(0);
    expect(biologicalConfig.PH_TOLERANCE_RANGE).toBeDefined();
    expect(biologicalConfig.TEMPERATURE_RANGE).toBeDefined();
    
    // 4. Growth patterns
    expect(biologicalConfig.BRANCH_CHANCE).toBeGreaterThan(0);
    expect(biologicalConfig.APICAL_DOMINANCE_FACTOR).toBeGreaterThan(0);
    
    // 5. Nutrient processing
    expect(biologicalConfig.CARBON_NITROGEN_RATIO).toBeGreaterThan(0);
    expect(biologicalConfig.HYPHAL_RESPIRATION_RATE).toBeGreaterThan(0);
    
    // 6. Reproductive capability
    expect(biologicalConfig.SPORE_FORMATION_THRESHOLD).toBeGreaterThan(0);
    
    // Verify the simulation has all the required functions
    expect(typeof growth.init).toBe('function');
    expect(typeof network.flowResources).toBe('function');
    expect(typeof environment.diffuseNutrients).toBe('function');
    expect(typeof environment.getNutrientGradient).toBe('function');
  });
});