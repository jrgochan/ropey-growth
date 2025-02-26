import { describe, it, expect } from "vitest";
import { Perlin } from "../../src/Perlin";

describe("Perlin", () => {
  it("should initialize correctly", () => {
    const perlin = new Perlin();
    expect(perlin).toBeDefined();
  });

  describe("2D Noise", () => {
    it("should generate 2D noise within expected range [-1, 1]", () => {
      const perlin = new Perlin();
  
      // Test multiple points
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const noise = perlin.noise2D(x, y);
  
        // Perlin noise should generally be in the range [-1, 1]
        expect(noise).toBeGreaterThanOrEqual(-1);
        expect(noise).toBeLessThanOrEqual(1);
      }
    });
  
    it("should return consistent values for the same coordinates", () => {
      const perlin = new Perlin();
  
      const x = 42.5;
      const y = 27.3;
  
      const noise1 = perlin.noise2D(x, y);
      const noise2 = perlin.noise2D(x, y);
  
      expect(noise1).toEqual(noise2);
    });
  
    it("should generate different values at different coordinates", () => {
      const perlin = new Perlin();
  
      // Use coordinates that are far apart to ensure different values
      const noise1 = perlin.noise2D(10.5, 10.5);
      const noise2 = perlin.noise2D(50.5, 50.5);
  
      // Different coordinates should generally produce different noise values
      expect(noise1).not.toEqual(noise2);
    });
  
    it("should generate similar values for nearby coordinates", () => {
      const perlin = new Perlin();
  
      const x = 42;
      const y = 27;
  
      const noise1 = perlin.noise2D(x, y);
      const noise2 = perlin.noise2D(x + 0.001, y + 0.001);
  
      // Noise should be continuous, so very close points should have similar values
      expect(Math.abs(noise1 - noise2)).toBeLessThan(0.01);
    });
  });

  describe("3D Noise", () => {
    it("should generate 3D noise within expected range [-1, 1]", () => {
      const perlin = new Perlin();
  
      // Test multiple points
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const z = Math.random() * 100;
        const noise = perlin.noise3D(x, y, z);
  
        // Perlin noise should generally be in the range [-1, 1]
        expect(noise).toBeGreaterThanOrEqual(-1);
        expect(noise).toBeLessThanOrEqual(1);
      }
    });
  
    it("should return consistent values for the same 3D coordinates", () => {
      const perlin = new Perlin();
  
      const x = 42.5;
      const y = 27.3;
      const z = 15.7;
  
      const noise1 = perlin.noise3D(x, y, z);
      const noise2 = perlin.noise3D(x, y, z);
  
      expect(noise1).toEqual(noise2);
    });
  
    it("should generate different values at different 3D coordinates", () => {
      const perlin = new Perlin();
  
      // Use coordinates that are far apart to ensure different values
      const noise1 = perlin.noise3D(10.5, 10.5, 10.5);
      const noise2 = perlin.noise3D(50.5, 50.5, 50.5);
  
      // Different coordinates should generally produce different noise values
      expect(noise1).not.toEqual(noise2);
    });
  
    it("should generate similar values for nearby 3D coordinates", () => {
      const perlin = new Perlin();
  
      const x = 42;
      const y = 27;
      const z = 15;
  
      const noise1 = perlin.noise3D(x, y, z);
      const noise2 = perlin.noise3D(x + 0.001, y + 0.001, z + 0.001);
  
      // Noise should be continuous, so very close points should have similar values
      expect(Math.abs(noise1 - noise2)).toBeLessThan(0.01);
    });
    
    it("should generate different patterns in different dimensions", () => {
      const perlin = new Perlin();
      
      // Generate noise at the same x,y but different z values
      const samples: number[] = [];
      const x = 42;
      const y = 27;
      
      for (let z = 0; z < 10; z++) {
        samples.push(perlin.noise3D(x, y, z));
      }
      
      // Check that we have variation in the z dimension
      const uniqueValues = new Set(samples.map(v => v.toFixed(6)));
      expect(uniqueValues.size).toBeGreaterThan(5); // Should have at least 5 unique values out of 10
    });
  });
});
