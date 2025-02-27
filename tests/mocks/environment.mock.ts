/**
 * Mock implementation of EnvironmentGPU for testing purposes
 * Provides simplified environment functionality without GPU dependencies
 */

export class MockEnvironment {
  private nutrientGrid: number[][];
  private moistureGrid: number[][];
  private flowPathUsage: number[][];
  private width: number;
  private height: number;
  private cellSize: number;

  constructor(width: number, height: number, cellSize: number = 1) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    
    // Initialize grids with base values
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    
    // Nutrient grid with base level
    this.nutrientGrid = Array(gridHeight).fill(0).map(() => 
      Array(gridWidth).fill(100) // Default nutrient level
    );
    
    // Moisture grid with base level
    this.moistureGrid = Array(gridHeight).fill(0).map(() => 
      Array(gridWidth).fill(100) // Default moisture level
    );
    
    // Flow path usage grid (empty)
    this.flowPathUsage = Array(gridHeight).fill(0).map(() => 
      Array(gridWidth).fill(0)
    );
  }

  // Convert canvas coordinates to grid coordinates
  private canvasToGrid(x: number, y: number): [number, number] {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    // Ensure coordinates are within bounds
    const boundedX = Math.max(0, Math.min(gridX, this.nutrientGrid[0].length - 1));
    const boundedY = Math.max(0, Math.min(gridY, this.nutrientGrid.length - 1));
    
    return [boundedX, boundedY];
  }

  // Add nutrient to a specific location
  public addNutrient(x: number, y: number, amount: number, radius: number = 3): void {
    const [centerGridX, centerGridY] = this.canvasToGrid(x, y);
    
    // Add nutrients in a radius around the point
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const gridX = centerGridX + dx;
          const gridY = centerGridY + dy;
          
          // Check bounds
          if (gridY >= 0 && gridY < this.nutrientGrid.length && 
              gridX >= 0 && gridX < this.nutrientGrid[0].length) {
            // Fall-off based on distance from center
            const falloff = 1 - (distance / radius);
            this.nutrientGrid[gridY][gridX] += amount * falloff;
            
            // Also add some moisture when adding nutrients
            this.moistureGrid[gridY][gridX] += amount * falloff * 0.5;
          }
        }
      }
    }
  }

  // Consume resource at a specific location
  public consumeResource(x: number, y: number, amount: number): number {
    const [gridX, gridY] = this.canvasToGrid(x, y);
    
    // Adjust consumption based on moisture
    const moistureFactor = Math.min(1, this.moistureGrid[gridY][gridX] / 100);
    const adjustedAmount = amount * moistureFactor;
    
    // Calculate how much can be consumed
    const availableAmount = Math.min(adjustedAmount, this.nutrientGrid[gridY][gridX]);
    
    // Consume the resource
    this.nutrientGrid[gridY][gridX] -= availableAmount;
    
    // Also reduce moisture slightly
    this.moistureGrid[gridY][gridX] = Math.max(0, this.moistureGrid[gridY][gridX] - availableAmount * 0.1);
    
    return availableAmount;
  }

  // Get nutrient level at a specific location
  public getNutrientLevel(x: number, y: number): number {
    const [gridX, gridY] = this.canvasToGrid(x, y);
    return this.nutrientGrid[gridY][gridX];
  }
  
  // Get moisture level at a specific location
  public getMoisture(x: number, y: number): number {
    const [gridX, gridY] = this.canvasToGrid(x, y);
    return this.moistureGrid[gridY][gridX];
  }

  // Calculate nutrient gradient at a specific location
  public getNutrientGradient(x: number, y: number, radius: number = 5): [number, number] {
    const [centerGridX, centerGridY] = this.canvasToGrid(x, y);
    
    let dx = 0;
    let dy = 0;
    let samples = 0;
    
    // Sample in a square around the current position
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const sampleX = centerGridX + i;
        const sampleY = centerGridY + j;
        
        if (
          sampleX >= 0 && 
          sampleX < this.nutrientGrid[0].length &&
          sampleY >= 0 && 
          sampleY < this.nutrientGrid.length
        ) {
          // Weight by distance (closer samples matter more)
          const distance = Math.sqrt(i*i + j*j);
          if (distance > 0 && distance <= radius) {
            const weight = 1 / distance;
            
            // Get nutrient value, weight it by distance
            const nutrientValue = this.nutrientGrid[sampleY][sampleX] * weight;
            
            // Accumulate weighted vector components
            dx += i * nutrientValue;
            dy += j * nutrientValue;
            samples++;
          }
        }
      }
    }
    
    // Normalize the gradient vector
    if (samples > 0 && (dx !== 0 || dy !== 0)) {
      const magnitude = Math.sqrt(dx*dx + dy*dy);
      if (magnitude > 0) {
        dx /= magnitude;
        dy /= magnitude;
      }
    }
    
    return [dx, dy];
  }

  // Get avoidance factor based on nearby hyphae
  public getAvoidanceFactor(x: number, y: number, radius: number): [number, number] {
    const [gridX, gridY] = this.canvasToGrid(x, y);
    
    // In a more complete implementation, this would check for nearby hyphae
    // For the mock, we'll create a deterministic but biologically plausible avoidance vector
    
    // Check our flow path usage grid for existing hyphae
    let dx = 0;
    let dy = 0;
    let detected = false;
    
    const searchRadius = Math.ceil(radius / this.cellSize);
    
    for (let i = -searchRadius; i <= searchRadius; i++) {
      for (let j = -searchRadius; j <= searchRadius; j++) {
        const checkX = gridX + i;
        const checkY = gridY + j;
        
        if (
          checkX >= 0 &&
          checkX < this.flowPathUsage[0].length &&
          checkY >= 0 &&
          checkY < this.flowPathUsage.length
        ) {
          if (this.flowPathUsage[checkY][checkX] > 0) {
            // Calculate distance
            const distance = Math.sqrt(i*i + j*j);
            if (distance > 0 && distance <= searchRadius) {
              // Vector pointing away from this hypha
              const weight = this.flowPathUsage[checkY][checkX] / distance;
              dx -= i * weight;
              dy -= j * weight;
              detected = true;
            }
          }
        }
      }
    }
    
    // If no existing hyphae detected, return a small random vector
    if (!detected) {
      // Use a deterministic but random-looking pattern based on coords
      const seed = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2 - 1;
      return [
        Math.sin(seed) * 0.2,
        Math.cos(seed) * 0.2
      ];
    }
    
    // Normalize the avoidance vector
    const magnitude = Math.sqrt(dx*dx + dy*dy);
    if (magnitude > 0) {
      dx /= magnitude;
      dy /= magnitude;
    }
    
    return [dx, dy];
  }

  // Diffuse nutrients across the grid (simple averaging)
  public diffuseNutrients(diffusionRate: number = 0.1): void {
    const cols = this.nutrientGrid[0].length;
    const rows = this.nutrientGrid.length;
    
    // Create copies of the current grids
    const newNutrientGrid = Array.from({ length: rows }, (_, y) => 
      Array.from({ length: cols }, (_, x) => this.nutrientGrid[y][x])
    );
    
    const newMoistureGrid = Array.from({ length: rows }, (_, y) => 
      Array.from({ length: cols }, (_, x) => this.moistureGrid[y][x])
    );
    
    // Apply diffusion using simple averaging with neighbors
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Nutrient diffusion
        let nutrientTotal = this.nutrientGrid[y][x];
        let moistureTotal = this.moistureGrid[y][x];
        let count = 1;
        
        // Check each neighbor
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            nutrientTotal += this.nutrientGrid[ny][nx];
            moistureTotal += this.moistureGrid[ny][nx];
            count++;
          }
        }
        
        // Calculate new values based on diffusion rate
        newNutrientGrid[y][x] = this.nutrientGrid[y][x] +
          diffusionRate * (nutrientTotal / count - this.nutrientGrid[y][x]);
          
        // Moisture diffuses faster than nutrients
        newMoistureGrid[y][x] = this.moistureGrid[y][x] +
          (diffusionRate * 1.5) * (moistureTotal / count - this.moistureGrid[y][x]);
      }
    }
    
    // Update the grids
    this.nutrientGrid = newNutrientGrid;
    this.moistureGrid = newMoistureGrid;
  }

  // Path usage tracking
  public recordPathUsage(x: number, y: number, amount: number): void {
    const [gridX, gridY] = this.canvasToGrid(x, y);
    
    if (
      gridX >= 0 &&
      gridX < this.flowPathUsage[0].length &&
      gridY >= 0 &&
      gridY < this.flowPathUsage.length
    ) {
      this.flowPathUsage[gridY][gridX] += amount * 0.02;
    }
  }
  
  // Method overload for compatibility with actual implementation
  public recordPathUsage(x1: number, y1: number, x2: number, y2: number, amount: number): void {
    // Record usage at both endpoints (without recursively calling self)
    const [gridX1, gridY1] = this.canvasToGrid(x1, y1);
    const [gridX2, gridY2] = this.canvasToGrid(x2, y2);
    
    // Add usage at both points
    if (
      gridX1 >= 0 && gridX1 < this.flowPathUsage[0].length &&
      gridY1 >= 0 && gridY1 < this.flowPathUsage.length
    ) {
      this.flowPathUsage[gridY1][gridX1] += amount * 0.01;
    }
    
    if (
      gridX2 >= 0 && gridX2 < this.flowPathUsage[0].length &&
      gridY2 >= 0 && gridY2 < this.flowPathUsage.length
    ) {
      this.flowPathUsage[gridY2][gridX2] += amount * 0.01;
    }
  }
  
  // Get path usage factor for a given location
  public getPathUsageFactor(x: number, y: number): number {
    const [gridX, gridY] = this.canvasToGrid(x, y);
    
    if (
      gridX >= 0 &&
      gridX < this.flowPathUsage[0].length &&
      gridY >= 0 &&
      gridY < this.flowPathUsage.length
    ) {
      // Normalize to 0-1 range with a cap at 10
      return Math.min(1, this.flowPathUsage[gridY][gridX] / 10);
    }
    return 0;
  }
}