import { describe, it, expect, beforeEach, vi } from "vitest";
import { GrowthManager } from "../../src/growth";
import { Perlin } from "../../src/Perlin";
import { EnvironmentGPU } from "../../src/environmentGPU";
import { MycelialNetwork } from "../../src/mycelialNetwork";
import { config } from "../../src/constants";

// Mock console methods
console.log = vi.fn();
console.warn = vi.fn();

describe("Mycelial Simulation Integration", () => {
  let mockCtx: any;
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

  it("should create a network of interconnected nodes", () => {
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

  it("should properly handle anastomosis (fusion of tips)", () => {
    // Set parameters to encourage anastomosis
    const originalAnastomosisRadius = config.ANASTOMOSIS_RADIUS;
    const originalBranchChance = config.BRANCH_CHANCE;

    try {
      config.ANASTOMOSIS_RADIUS = 5; // Larger radius to increase chance of fusion
      config.BRANCH_CHANCE = 0.9; // Higher branch chance

      growthManager.init();

      // Run several update cycles to allow tips to grow and potentially fuse
      for (let i = 0; i < 10; i++) {
        growthManager.updateAndDraw(Date.now() + i * 100);
      }

      // Check logs for fusion events (indirect test)
      const fusionLogs = (console.log as any).mock.calls.filter((call: any[]) =>
        call[0].includes("fused due to proximity"),
      );

      // With our settings, we should expect at least some fusions to occur
      // Note: This is a probabilistic test and might occasionally fail
      expect(fusionLogs.length).toBeGreaterThan(0);
    } finally {
      // Restore original values
      config.ANASTOMOSIS_RADIUS = originalAnastomosisRadius;
      config.BRANCH_CHANCE = originalBranchChance;
    }
  });
});
