import { describe, it, expect, beforeEach, vi } from "vitest";
import { GrowthManager } from "../../src/growth";
import { Perlin } from "../../src/Perlin";
import { EnvironmentGPU } from "../../src/environmentGPU";
import { MycelialNetwork } from "../../src/mycelialNetwork";
import { config } from "../../src/constants";

// Mock console methods
console.log = vi.fn();
console.warn = vi.fn();

// Store original config
const originalConfig = { ...config };

describe("Mycelial Simulation Integration", () => {
  let mockCtx: any;
  let mockRenderer3D: any;
  let perlin: Perlin;
  let envGPU: EnvironmentGPU;
  let network: MycelialNetwork;
  let growthManager: GrowthManager;

  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Create a simple benchmark test function to measure operation time
  const benchmark = (fn: () => void, iterations: number = 1): number => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    return performance.now() - start;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset config to original values
    Object.assign(config, originalConfig);

    // Mock for canvas context
    mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      shadowBlur: 0,
      shadowColor: "",
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
    };
    
    // Mock for 3D renderer
    mockRenderer3D = {
      clear: vi.fn(),
      render: vi.fn(),
      addHyphalSegment: vi.fn(),
      visualizeNutrientEnvironment: vi.fn(),
    };

    // Initialize all components
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
      network,
    );
  });

  it("should run a complete simulation cycle", () => {
    // Initialize the simulation
    growthManager.init();

    // Spy on key methods to ensure they are called during the update
    const consumeResourceSpy = vi.spyOn(envGPU, "consumeResource");
    const flowResourcesSpy = vi.spyOn(network, "flowResources");

    // Run a simulation update
    growthManager.updateAndDraw(Date.now());

    // Verify that the expected methods were called
    expect(consumeResourceSpy).toHaveBeenCalled();
    expect(flowResourcesSpy).toHaveBeenCalled();
  });

  it("should create a network of interconnected nodes in 2D (backward compatibility)", () => {
    // Create a small test network manually
    const node1 = network.createNode(100, 100, 500);
    const node2 = network.createNode(150, 150, 300);
    const node3 = network.createNode(200, 200, 200);

    network.connectNodes(node1, node2);
    network.connectNodes(node2, node3);

    // Store the original flow rate
    const originalFlowRate = config.RESOURCE_FLOW_RATE;

    try {
      // Increase flow rate to ensure resources flow properly in test
      config.RESOURCE_FLOW_RATE = 0.3;

      // Flow resources more times to ensure proper distribution
      for (let i = 0; i < 10; i++) {
        network.flowResources();
      }

      // Resource should flow from node1 (highest) to node3 (lowest) through node2
      expect(network.getResource(node1)).toBeLessThan(500);
      expect(network.getResource(node3)).toBeGreaterThan(200);
    } finally {
      // Restore original flow rate
      config.RESOURCE_FLOW_RATE = originalFlowRate;
    }
  });
  
  it("should create a network of interconnected nodes in 3D", () => {
    // Create a small test network manually with z-coordinates
    const node1 = network.createNode(100, 100, 10, 500);
    const node2 = network.createNode(150, 150, 20, 300);
    const node3 = network.createNode(200, 200, 30, 200);

    network.connectNodes(node1, node2);
    network.connectNodes(node2, node3);

    // Store the original flow rate
    const originalFlowRate = config.RESOURCE_FLOW_RATE;

    try {
      // Increase flow rate to ensure resources flow properly in test
      config.RESOURCE_FLOW_RATE = 0.3;

      // Flow resources more times to ensure proper distribution
      for (let i = 0; i < 10; i++) {
        network.flowResources();
      }

      // Resource should flow from node1 (highest) to node3 (lowest) through node2
      expect(network.getResource(node1)).toBeLessThan(500);
      expect(network.getResource(node3)).toBeGreaterThan(200);
    } finally {
      // Restore original flow rate
      config.RESOURCE_FLOW_RATE = originalFlowRate;
    }
  });

  it("should handle resource consumption and flow in the overall system", () => {
    // Initialize with default settings
    growthManager.init();

    // Track initial resource distribution
    const initialResources = new Map<number, number>();
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      initialResources.set(i, network.getResource(i));
    }

    // Run multiple update cycles
    for (let i = 0; i < 5; i++) {
      growthManager.updateAndDraw(Date.now() + i * 100);
    }

    // Check that resources have been consumed
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      const currentResource = network.getResource(i);
      const initialResource = initialResources.get(i) || 0;

      // Resources should generally decrease over time due to consumption
      expect(currentResource).toBeLessThanOrEqual(initialResource);
    }
  });
  
  it("should handle resource consumption and flow in 3D", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Create growth manager with 3D renderer
    const growth3D = new GrowthManager(
      mockCtx,
      width,
      height,
      centerX,
      centerY,
      perlin,
      envGPU,
      network,
      mockRenderer3D,
    );
    
    // Initialize with 3D settings
    growth3D.init();

    // Track initial resource distribution
    const initialResources = new Map<number, number>();
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      initialResources.set(i, network.getResource(i));
    }

    // Run multiple update cycles
    for (let i = 0; i < 5; i++) {
      growth3D.updateAndDraw(Date.now() + i * 100);
    }

    // Check that resources have been consumed
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      const currentResource = network.getResource(i);
      const initialResource = initialResources.get(i) || 0;

      // Resources should generally decrease over time due to consumption
      expect(currentResource).toBeLessThanOrEqual(initialResource);
    }
    
    // Verify 3D renderer was used
    expect(mockRenderer3D.render).toHaveBeenCalled();
  });

  it("should perform reasonably under stress test", () => {
    // Temporarily reduce parameters to make the test run faster
    const originalMainBranchCount = config.MAIN_BRANCH_COUNT;
    const originalTimeLapseFactor = config.TIME_LAPSE_FACTOR;

    try {
      config.MAIN_BRANCH_COUNT = 3;
      config.TIME_LAPSE_FACTOR = 1;

      growthManager.init();

      // Benchmark 10 update cycles
      const time = benchmark(() => {
        for (let i = 0; i < 10; i++) {
          growthManager.updateAndDraw(Date.now() + i * 100);
        }
      });

      console.log(`Stress test completed in ${time}ms`);

      // Test should complete within a reasonable time frame
      expect(time).toBeLessThan(5000); // 5 seconds max for test environment
    } finally {
      // Restore original values
      config.MAIN_BRANCH_COUNT = originalMainBranchCount;
      config.TIME_LAPSE_FACTOR = originalTimeLapseFactor;
    }
  });

  it("should properly handle anastomosis (fusion of tips) in 3D", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Set parameters to encourage anastomosis
    const originalAnastomosisRadius = config.ANASTOMOSIS_RADIUS;
    const originalBranchChance = config.BRANCH_CHANCE;

    try {
      config.ANASTOMOSIS_RADIUS = 5; // Larger radius to increase chance of fusion
      config.BRANCH_CHANCE = 0.9; // Higher branch chance

      // Create growth manager with 3D renderer
      const growth3D = new GrowthManager(
        mockCtx,
        width,
        height,
        centerX,
        centerY,
        perlin,
        envGPU,
        network,
        mockRenderer3D,
      );
      
      growth3D.init();

      // Run several update cycles to allow tips to grow and potentially fuse
      for (let i = 0; i < 10; i++) {
        growth3D.updateAndDraw(Date.now() + i * 100);
      }

      // Verify 3D renderer was used
      expect(mockRenderer3D.render).toHaveBeenCalled();
      expect(mockRenderer3D.addHyphalSegment).toHaveBeenCalled();
    } finally {
      // Restore original values
      config.ANASTOMOSIS_RADIUS = originalAnastomosisRadius;
      config.BRANCH_CHANCE = originalBranchChance;
    }
  });
  
  it("should visualize the nutrient environment in 3D", () => {
    // Enable 3D and nutrient visualization
    config.ENABLE_3D = true;
    config.SHOW_NUTRIENT_ENVIRONMENT = true;
    
    // Create growth manager with 3D renderer
    const growth3D = new GrowthManager(
      mockCtx,
      width,
      height,
      centerX,
      centerY,
      perlin,
      envGPU,
      network,
      mockRenderer3D,
    );
    
    growth3D.init();
    
    // Verify that the nutrient environment was visualized
    expect(mockRenderer3D.visualizeNutrientEnvironment).toHaveBeenCalled();
  });
});
