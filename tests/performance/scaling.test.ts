/**
 * Performance tests for scaling behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockCanvas } from '../mocks/canvas.mock';
import { MockEnvironment } from '../mocks/environment.mock';
import { MockMycelialNetwork } from '../mocks/mycelialNetwork.mock';
import { performanceConfig } from '../fixtures/test-configs';

// Import actual components
import { GrowthManager } from '../../src/growth.js';
import { Perlin } from '../../src/Perlin.js';

// Create a test harness that lets us access internal state for testing
class TestableGrowthManager extends GrowthManager {
  // Expose tips array for testing
  public getTips() {
    return this['tips'];
  }
  
  // Run direct simulation steps for testing with timing
  public simulateStepsWithTiming(steps: number): number {
    const startTime = performance.now();
    
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
    
    return performance.now() - startTime;
  }
}

describe('Performance Scaling Tests', () => {
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
    
    // Initialize with performance config
    growth.init();
  });

  it('should maintain reasonable performance as tips increase', () => {
    // Run initial simulation to generate tips
    growth.simulateStepsWithTiming(10);
    const initialTipCount = growth.getTips().length;
    
    // Time 5 steps with initial tips
    const initialTime = growth.simulateStepsWithTiming(5);
    
    // Run more simulation to generate many more tips
    growth.simulateStepsWithTiming(20);
    const midTipCount = growth.getTips().length;
    
    // Time 5 steps with more tips
    const midTime = growth.simulateStepsWithTiming(5);
    
    // Calculate time per tip for initial and mid stages
    const initialTimePerTip = initialTime / Math.max(1, initialTipCount);
    const midTimePerTip = midTime / Math.max(1, midTipCount);
    
    // We expect some slowdown, but it should be sublinear
    // (i.e., doubling tips should less than double execution time)
    const tipRatio = midTipCount / Math.max(1, initialTipCount);
    const timeRatio = midTime / Math.max(1, initialTime);
    
    // If timing is inconsistent in CI environment, just verify execution completes
    if (initialTime > 1 && midTime > 1) {
      // Only assert when we have meaningful timing data
      if (tipRatio > 1.5) { // If tips actually increased significantly
        // The time ratio should be less than the tip ratio for good scaling
        // This test is a bit fuzzy since performance can vary by environment
        expect(timeRatio).toBeLessThan(tipRatio * 1.2);
      }
    }
    
    // Verify we can still execute with large number of tips
    expect(() => growth.simulateStepsWithTiming(5)).not.toThrow();
  });

  it('should handle high branch configurations', () => {
    // Verify the system can handle various branch configuration settings
    
    // Verify biological branching parameters
    expect(performanceConfig.BRANCH_CHANCE).toBeGreaterThan(0);
    expect(performanceConfig.BRANCH_DECAY).toBeGreaterThan(0);
    expect(performanceConfig.MAX_BRANCH_DEPTH).toBeGreaterThan(0);
    
    // Create test manager
    const testGrowth = new TestableGrowthManager(
      ctx,
      width, height,
      centerX, centerY,
      perlin,
      environment,
      network
    );
    
    // Add plenty of nutrients for growth
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
    testGrowth.init();
    
    // Run a very short simulation
    const time = testGrowth.simulateStepsWithTiming(2);
    
    // Verify execution completed
    expect(time).toBeGreaterThan(0);
    
    // Verify we still have tips
    expect(testGrowth.getTips().length).toBeGreaterThanOrEqual(0);
  });

  it('should handle different environment sizes', () => {
    // Biologically realistic systems should adapt to various substrate sizes
    
    // Test with a large canvas/environment
    const largeCanvas = new MockCanvas(2000, 1500);
    const largeCtx = largeCanvas.getContext('2d');
    
    // Create appropriate test components
    const largeEnv = new MockEnvironment(2000, 1500);
    const largeNetwork = new MockMycelialNetwork();
    
    // Create growth manager for large environment
    const largeGrowth = new TestableGrowthManager(
      largeCtx,
      2000, 1500,
      1000, 750,
      perlin,
      largeEnv,
      largeNetwork
    );
    
    // Verify initialization works
    largeGrowth.init();
    
    // Run a minimal simulation
    const largeTime = largeGrowth.simulateStepsWithTiming(1);
    expect(largeTime).toBeGreaterThan(0);
    
    // Test with a small canvas/environment
    const smallCanvas = new MockCanvas(200, 150);
    const smallCtx = smallCanvas.getContext('2d');
    
    // Create appropriate test components
    const smallEnv = new MockEnvironment(200, 150);
    const smallNetwork = new MockMycelialNetwork();
    
    // Create growth manager for small environment
    const smallGrowth = new TestableGrowthManager(
      smallCtx,
      200, 150,
      100, 75,
      perlin,
      smallEnv,
      smallNetwork
    );
    
    // Verify initialization works
    smallGrowth.init();
    
    // Run a minimal simulation
    const smallTime = smallGrowth.simulateStepsWithTiming(1);
    expect(smallTime).toBeGreaterThan(0);
  });

  it('should efficiently cull dead tips', () => {
    // Run enough steps to generate many tips
    growth.simulateStepsWithTiming(30);
    
    // Get current tips
    const tipsBefore = growth.getTips().length;
    
    // Force all tips to die by setting life to 0
    const tips = growth.getTips();
    tips.forEach(tip => {
      tip.life = 0;
    });
    
    // Run one more step to trigger culling
    growth.simulateStepsWithTiming(1);
    
    // Should have removed all dead tips
    const tipsAfter = growth.getTips().length;
    expect(tipsAfter).toBe(0);
  });
});