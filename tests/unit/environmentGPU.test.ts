import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentGPU } from '../../src/environmentGPU';
import { config } from '../../src/constants';

// Mock console methods
console.log = vi.fn();
console.warn = vi.fn();

describe('EnvironmentGPU', () => {
  let env: EnvironmentGPU;
  const width = 800;
  const height = 600;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Create a new environment for each test
    env = new EnvironmentGPU(width, height);
  });

  it('should initialize correctly', () => {
    expect(env).toBeDefined();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('EnvironmentGPU initialized'));
  });

  it('should consume resources correctly', () => {
    const x = 100;
    const y = 100;
    const amount = 10;
    
    const consumed = env.consumeResource(x, y, amount);
    
    expect(consumed).toBeLessThanOrEqual(amount);
    expect(consumed).toBeGreaterThanOrEqual(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Consumed'));
  });

  it('should handle consuming resources outside grid boundaries', () => {
    const x = -10;
    const y = -10;
    const amount = 10;
    
    const consumed = env.consumeResource(x, y, amount);
    
    expect(consumed).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('out of nutrient grid bounds'));
  });

  it('should add nutrients correctly', () => {
    const x = 100;
    const y = 100;
    const amount = 10;
    
    env.addNutrient(x, y, amount);
    
    // Consume the nutrient we just added to verify it was added
    const consumed = env.consumeResource(x, y, amount);
    
    expect(consumed).toBeGreaterThan(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Added'));
  });

  it('should handle adding nutrients outside grid boundaries', () => {
    const x = -10;
    const y = -10;
    const amount = 10;
    
    env.addNutrient(x, y, amount);
    
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('out of nutrient grid bounds'));
  });

  it('should diffuse nutrients across the grid', () => {
    // Add a high concentration of nutrients at a specific point
    const x = 100;
    const y = 100;
    const amount = 100;
    
    env.addNutrient(x, y, amount);
    
    // Run diffusion
    env.diffuseNutrients();
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Nutrients diffused'));
  });

  it('should replenish nutrients', () => {
    env.replenishNutrients();
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Nutrients replenished'));
  });
});