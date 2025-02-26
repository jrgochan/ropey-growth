import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrowthManager } from '../../src/growth';
import { Perlin } from '../../src/Perlin';
import { EnvironmentGPU } from '../../src/environmentGPU';
import { MycelialNetwork } from '../../src/mycelialNetwork';
import { config } from '../../src/constants';

// Mock console methods
console.log = vi.fn();
console.warn = vi.fn();

describe('GrowthManager', () => {
  let growthManager: GrowthManager;
  let mockCtx: any;
  let perlin: Perlin;
  let envGPU: EnvironmentGPU;
  let network: MycelialNetwork;
  
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock canvas context
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
    
    // Initialize dependencies
    perlin = new Perlin();
    envGPU = new EnvironmentGPU(width, height);
    network = new MycelialNetwork();
    
    // Create growth manager
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

  it('should initialize correctly', () => {
    expect(growthManager).toBeDefined();
  });

  it('should initialize tips on init()', () => {
    // Spy on network methods
    const createNodeSpy = vi.spyOn(network, 'createNode');
    
    growthManager.init();
    
    // Should create as many nodes as MAIN_BRANCH_COUNT
    expect(createNodeSpy).toHaveBeenCalledTimes(config.MAIN_BRANCH_COUNT);
    // Check if any of the console.log calls contain the expected string
    const logCalls = (console.log as any).mock.calls;
    const hasInitializedTipLog = logCalls.some(
      (call: any[]) => typeof call[0] === 'string' && call[0].match(/Initialized main tip \d+:/)
    );
    expect(hasInitializedTipLog).toBe(true);
  });

  it('should update and draw correctly', () => {
    growthManager.init();
    
    // We need to mock Network.flowResources because it will be called by updateAndDraw
    const flowResourcesSpy = vi.spyOn(network, 'flowResources');
    
    growthManager.updateAndDraw(Date.now());
    
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(flowResourcesSpy).toHaveBeenCalled();
  });

  it('should clear growth when clear() is called', () => {
    growthManager.init();
    growthManager.clear();
    
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, width, height);
    expect(console.log).toHaveBeenCalledWith('Simulation cleared.');
  });

  it('should handle multiple steps when updating', () => {
    // Backup the original TIME_LAPSE_FACTOR
    const originalTimeLapseFactor = config.TIME_LAPSE_FACTOR;
    
    try {
      // Set a higher TIME_LAPSE_FACTOR for testing
      config.TIME_LAPSE_FACTOR = 5;
      
      growthManager.init();
      
      // Spy on network.flowResources
      const flowResourcesSpy = vi.spyOn(network, 'flowResources');
      
      growthManager.updateAndDraw(Date.now());
      
      // Should call flowResources exactly once
      expect(flowResourcesSpy).toHaveBeenCalledTimes(1);
      
      // Check that fillRect was called at least once
      expect(mockCtx.fillRect).toHaveBeenCalled();
    } finally {
      // Restore the original value
      config.TIME_LAPSE_FACTOR = originalTimeLapseFactor;
    }
  });
});
