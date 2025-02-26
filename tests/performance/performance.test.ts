import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrowthManager } from '../../src/growth';
import { Perlin } from '../../src/Perlin';
import { EnvironmentGPU } from '../../src/environmentGPU';
import { MycelialNetwork } from '../../src/mycelialNetwork';
import { config } from '../../src/constants';

// Mock console methods
console.log = vi.fn();
console.warn = vi.fn();

describe('Performance Tests', () => {
  let mockCtx: any;
  let perlin: Perlin;
  let envGPU: EnvironmentGPU;
  let network: MycelialNetwork;
  let growthManager: GrowthManager;
  
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Benchmark function to measure time taken for an operation
  const benchmark = (fn: () => void, iterations: number = 1): number => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    return performance.now() - start;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock canvas context
    mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowBlur: 0,
      shadowColor: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
    };
    
    // Initialize components
    perlin = new Perlin();
    envGPU = new EnvironmentGPU(width, height);
    network = new MycelialNetwork();
    
    growthManager = new GrowthManager(
      mockCtx,
      width,
      height,
      centerX,
      centerY,
      perlin,
      envGPU,
      network
    );
  });

  it('should initialize simulation within reasonable time', () => {
    const time = benchmark(() => {
      growthManager.init();
    });
    
    console.log(`Initialization took ${time}ms`);
    expect(time).toBeLessThan(500); // Initialization should be fast
  });

  it('should perform single simulation step within reasonable time', () => {
    growthManager.init();
    
    const time = benchmark(() => {
      growthManager.updateAndDraw(Date.now());
    });
    
    console.log(`Single update step took ${time}ms`);
    expect(time).toBeLessThan(1000); // Single update should be reasonably fast
  });

  it('should scale reasonably with increased branch count', () => {
    const originalBranchCount = config.MAIN_BRANCH_COUNT;
    
    try {
      // Test with low branch count
      config.MAIN_BRANCH_COUNT = 5;
      let lowBranchManager = new GrowthManager(
        mockCtx,
        width,
        height,
        centerX,
        centerY,
        perlin,
        envGPU,
        new MycelialNetwork()
      );
      
      lowBranchManager.init();
      const lowBranchTime = benchmark(() => {
        lowBranchManager.updateAndDraw(Date.now());
      }, 5);
      
      // Test with high branch count
      config.MAIN_BRANCH_COUNT = 20;
      let highBranchManager = new GrowthManager(
        mockCtx,
        width,
        height,
        centerX,
        centerY,
        perlin,
        envGPU,
        new MycelialNetwork()
      );
      
      highBranchManager.init();
      const highBranchTime = benchmark(() => {
        highBranchManager.updateAndDraw(Date.now());
      }, 5);
      
      console.log(`Low branch count (5) took ${lowBranchTime}ms for 5 updates`);
      console.log(`High branch count (20) took ${highBranchTime}ms for 5 updates`);
      
      // High branch count should take longer, but not catastrophically so
      expect(highBranchTime).toBeGreaterThan(lowBranchTime);
      expect(highBranchTime / lowBranchTime).toBeLessThan(10); // Should scale reasonably, not exponentially
    } finally {
      // Restore original config
      config.MAIN_BRANCH_COUNT = originalBranchCount;
    }
  });

  it('should scale reasonably with increased resource flow rate', () => {
    const originalFlowRate = config.RESOURCE_FLOW_RATE;
    
    try {
      // Test with low flow rate
      config.RESOURCE_FLOW_RATE = 0.5;
      growthManager.init();
      
      const lowFlowTime = benchmark(() => {
        network.flowResources();
      }, 100);
      
      // Test with high flow rate
      config.RESOURCE_FLOW_RATE = 2.0;
      
      const highFlowTime = benchmark(() => {
        network.flowResources();
      }, 100);
      
      console.log(`Low flow rate (0.5) took ${lowFlowTime}ms for 100 flows`);
      console.log(`High flow rate (2.0) took ${highFlowTime}ms for 100 flows`);
      
      // Flow rate should not significantly impact performance
      expect(highFlowTime / lowFlowTime).toBeLessThan(2);
    } finally {
      // Restore original config
      config.RESOURCE_FLOW_RATE = originalFlowRate;
    }
  });

  it('should profile perlin noise performance', () => {
    const perlinTime = benchmark(() => {
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          perlin.noise2D(x * 0.1, y * 0.1);
        }
      }
    });
    
    console.log(`Generating 10,000 Perlin noise values took ${perlinTime}ms`);
    expect(perlinTime).toBeLessThan(1000); // Should be reasonably fast
  });

  it('should profile environment nutrient diffusion', () => {
    const diffusionTime = benchmark(() => {
      envGPU.diffuseNutrients();
    }, 10);
    
    console.log(`10 nutrient diffusion steps took ${diffusionTime}ms`);
    expect(diffusionTime).toBeLessThan(1000); // Should be reasonably fast
  });

  it('should remain performant after many simulation steps', () => {
    growthManager.init();
    
    // First, run 10 updates to get the simulation going
    for (let i = 0; i < 10; i++) {
      growthManager.updateAndDraw(Date.now() + i * 100);
    }
    
    // Now measure performance of next 5 updates
    const time = benchmark(() => {
      for (let i = 0; i < 5; i++) {
        growthManager.updateAndDraw(Date.now() + (i + 10) * 100);
      }
    });
    
    console.log(`5 updates after 10 previous updates took ${time}ms`);
    expect(time).toBeLessThan(2000); // Should remain reasonably fast
  });
});