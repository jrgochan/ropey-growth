import { describe, it, expect } from 'vitest';
import { Perlin } from '../../src/Perlin';

describe('Perlin', () => {
  it('should initialize correctly', () => {
    const perlin = new Perlin();
    expect(perlin).toBeDefined();
  });

  it('should generate 2D noise within expected range [-1, 1]', () => {
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

  it('should return consistent values for the same coordinates', () => {
    const perlin = new Perlin();
    
    const x = 42.5;
    const y = 27.3;
    
    const noise1 = perlin.noise2D(x, y);
    const noise2 = perlin.noise2D(x, y);
    
    expect(noise1).toEqual(noise2);
  });

  it('should generate different values at different coordinates', () => {
    const perlin = new Perlin();
    
    const noise1 = perlin.noise2D(10, 10);
    const noise2 = perlin.noise2D(20, 20);
    
    // Different coordinates should generally produce different noise values
    expect(noise1).not.toEqual(noise2);
  });

  it('should generate similar values for nearby coordinates', () => {
    const perlin = new Perlin();
    
    const x = 42;
    const y = 27;
    
    const noise1 = perlin.noise2D(x, y);
    const noise2 = perlin.noise2D(x + 0.001, y + 0.001);
    
    // Noise should be continuous, so very close points should have similar values
    expect(Math.abs(noise1 - noise2)).toBeLessThan(0.01);
  });
});