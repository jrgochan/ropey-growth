import { describe, it, expect, beforeEach, vi } from "vitest";
import { EnvironmentGPU } from "../../src/environmentGPU";
import { config } from "../../src/constants";

// Mock console methods
console.log = vi.fn();
console.warn = vi.fn();

// Store original config
const originalConfig = { ...config };

describe("EnvironmentGPU", () => {
  let env: EnvironmentGPU;
  const width = 800;
  const height = 600;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Reset config to original values
    Object.assign(config, originalConfig);

    // Create a new environment for each test
    env = new EnvironmentGPU(width, height);
  });

  it("should initialize correctly", () => {
    expect(env).toBeDefined();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("EnvironmentGPU initialized"),
    );
  });

  it("should initialize a 3D nutrient grid", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Create a new environment with 3D enabled
    const env3D = new EnvironmentGPU(width, height);
    
    // Get the nutrient grid
    const grid = env3D.getNutrientGrid();
    
    // Check that the grid is 3D
    expect(grid).toBeDefined();
    expect(Array.isArray(grid)).toBe(true);
    expect(Array.isArray(grid[0])).toBe(true);
    expect(Array.isArray(grid[0][0])).toBe(true);
  });

  it("should consume resources correctly in 2D (backward compatibility)", () => {
    const x = 100;
    const y = 100;
    const amount = 10;

    const consumed = env.consumeResource(x, y, amount);

    expect(consumed).toBeLessThanOrEqual(amount);
    expect(consumed).toBeGreaterThanOrEqual(0);
  });
  
  it("should consume resources correctly in 3D", () => {
    const x = 100;
    const y = 100;
    const z = 5;
    const amount = 10;

    const consumed = env.consumeResource(x, y, z, amount);

    expect(consumed).toBeLessThanOrEqual(amount);
    expect(consumed).toBeGreaterThanOrEqual(0);
  });

  it("should handle consuming resources outside grid boundaries in 3D", () => {
    const x = -10;
    const y = -10;
    const z = -10;
    const amount = 10;

    const consumed = env.consumeResource(x, y, z, amount);

    expect(consumed).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("out of nutrient grid bounds"),
    );
  });

  it("should add nutrients correctly in 2D (backward compatibility)", () => {
    const x = 100;
    const y = 100;
    const amount = 10;

    env.addNutrient(x, y, amount);

    // Consume the nutrient we just added to verify it was added
    const consumed = env.consumeResource(x, y, amount);

    expect(consumed).toBeGreaterThan(0);
  });
  
  it("should add nutrients correctly in 3D", () => {
    const x = 100;
    const y = 100;
    const z = 5;
    const amount = 10;

    env.addNutrient(x, y, z, amount);

    // Consume the nutrient we just added to verify it was added
    const consumed = env.consumeResource(x, y, z, amount);

    expect(consumed).toBeGreaterThan(0);
  });

  it("should handle adding nutrients outside grid boundaries in 3D", () => {
    const x = -10;
    const y = -10;
    const z = -10;
    const amount = 10;

    env.addNutrient(x, y, z, amount);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("out of nutrient grid bounds"),
    );
  });

  it("should diffuse nutrients across the 3D grid", () => {
    // Add a high concentration of nutrients at a specific point
    const x = 100;
    const y = 100;
    const z = 5;
    const amount = 100;

    env.addNutrient(x, y, z, amount);

    // Run diffusion
    env.diffuseNutrients();
    
    // Check that nutrients have diffused to neighboring cells
    const centerNutrient = env.getNutrientLevel(x, y, z);
    const neighborNutrient = env.getNutrientLevel(x + 2, y, z); // Check a cell 2 units away
    
    // The center should have more nutrients than the neighbor
    expect(centerNutrient).toBeGreaterThan(neighborNutrient);
    
    // But the neighbor should have some nutrients due to diffusion
    expect(neighborNutrient).toBeGreaterThan(0);
  });

  it("should replenish nutrients in 3D", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Create a new environment with 3D enabled
    const env3D = new EnvironmentGPU(width, height);
    
    // Get initial nutrient levels
    const initialGrid = env3D.getNutrientGrid();
    const initialSum = sumNutrients(initialGrid);
    
    // Replenish nutrients
    env3D.replenishNutrients();
    
    // Get updated nutrient levels
    const updatedGrid = env3D.getNutrientGrid();
    const updatedSum = sumNutrients(updatedGrid);
    
    // The total nutrients should have increased
    expect(updatedSum).toBeGreaterThan(initialSum);
  });
  
  it("should get nutrient level at a specific 3D position", () => {
    const x = 100;
    const y = 100;
    const z = 5;
    const amount = 50;
    
    // Add nutrients at a specific position
    env.addNutrient(x, y, z, amount);
    
    // Get the nutrient level at that position
    const level = env.getNutrientLevel(x, y, z);
    
    // The level should be greater than 0
    expect(level).toBeGreaterThan(0);
  });
});

// Helper function to sum all nutrients in a 3D grid
function sumNutrients(grid: number[][][]): number {
  let sum = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      for (let z = 0; z < grid[x][y].length; z++) {
        sum += grid[x][y][z];
      }
    }
  }
  return sum;
}
