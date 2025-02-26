// src/environmentGPU.ts

import { config } from "./constants.js"; // Import the config object

/**
 * EnvironmentGPU class manages the environmental resources
 * such as nutrients that hypha tips consume in a 3D environment.
 */
export class EnvironmentGPU {
  private width: number;
  private height: number;
  private depth: number;
  private nutrientGrid: number[][][] = [];
  // For optimization, we'll track which grid cells need diffusion
  private activeCells: Set<string> = new Set();

  /**
   * Constructor initializes the nutrient grid based on canvas dimensions.
   * @param width - Width of the canvas.
   * @param height - Height of the canvas.
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    // Calculate depth based on the growth height factor
    const radius = Math.min(width, height) * config.GROWTH_RADIUS_FACTOR;
    this.depth = Math.ceil(radius * config.GROWTH_HEIGHT_FACTOR * 2);
    
    this.initializeNutrientGrid();
    console.log(`EnvironmentGPU initialized with dimensions ${width}x${height}x${this.depth}`);
  }

  /**
   * Initializes the 3D nutrient grid with base nutrient levels.
   * Implements vertical stratification with nutrient gradients.
   */
  private initializeNutrientGrid() {
    const cols = Math.ceil(this.width / config.ENV_GRID_CELL_SIZE);
    const rows = Math.ceil(this.height / config.ENV_GRID_CELL_SIZE);
    const layers = Math.ceil(this.depth / config.ENV_GRID_CELL_SIZE);
    
    // Create 3D grid
    this.nutrientGrid = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () =>
        Array.from({ length: layers }, (_, z) => {
          // Apply nutrient gradient based on depth
          // Surface layer has most nutrients, decreasing with depth
          const depthFactor = 1 - (z / layers) * config.NUTRIENT_GRADIENT_STRENGTH;
          return config.BASE_NUTRIENT * Math.max(0.1, depthFactor);
        })
      )
    );
    
    // Instead of tracking all cells, we'll only track cells at the boundaries
    // and add more cells as needed during simulation
    
    // Add boundary cells to active cells (edges of the grid)
    // This is much more efficient than adding all cells
    for (let x = 0; x < cols; x += Math.max(1, Math.floor(cols / 10))) {
      for (let y = 0; y < rows; y += Math.max(1, Math.floor(rows / 10))) {
        for (let z = 0; z < layers; z += Math.max(1, Math.floor(layers / 10))) {
          if (this.nutrientGrid[x][y][z] > 0) {
            this.activeCells.add(`${x},${y},${z}`);
          }
        }
      }
    }
    
    // Create nutrient pockets in 3D space
    this.createNutrientPockets();
  }
  
  /**
   * Creates nutrient-rich pockets throughout the 3D environment
   */
  private createNutrientPockets() {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    const layers = this.nutrientGrid[0][0].length;
    
    // Create more nutrient pockets to ensure proper growth
    const pocketCount = 20;
    
    for (let i = 0; i < pocketCount; i++) {
      // Random position for pocket center
      const centerX = Math.floor(Math.random() * cols);
      const centerY = Math.floor(Math.random() * rows);
      
      // Bias towards upper layers based on surface growth bias
      const layerBias = Math.random() < config.SURFACE_GROWTH_BIAS ? 
                        Math.floor(layers * 0.3) : // Upper 30% of layers
                        Math.floor(Math.random() * layers);
      const centerZ = layerBias;
      
      // Add nutrients in a sphere around the center
      const radius = config.NUTRIENT_POCKET_RADIUS;
      
      // Only add boundary cells to activeCells
      const boundaryPoints = new Set<string>();
      
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dz = -radius; dz <= radius; dz++) {
            // Calculate 3D distance from center
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance <= radius) {
              const x = centerX + dx;
              const y = centerY + dy;
              const z = centerZ + dz;
              
              // Check bounds
              if (x >= 0 && x < cols && y >= 0 && y < rows && z >= 0 && z < layers) {
                // Add nutrients with falloff based on distance from center
                const falloff = 1 - (distance / radius);
                const nutrientAmount = config.NUTRIENT_POCKET_AMOUNT * falloff;
                
                this.nutrientGrid[x][y][z] += nutrientAmount;
                
                // Only add boundary cells or cells with high nutrient concentration
                // to the active cells set to reduce memory usage
                if (distance > radius - 1 || // Boundary cells
                    falloff > 0.8) {         // High concentration cells
                  boundaryPoints.add(`${x},${y},${z}`);
                }
              }
            }
          }
        }
      }
      
      // Add more boundary points to active cells to ensure proper diffusion
      let pointsToAdd = Math.min(boundaryPoints.size, 50); // Increased from 20 to 50 points per pocket
      const boundaryArray = Array.from(boundaryPoints);
      
      for (let j = 0; j < pointsToAdd; j++) {
        const index = Math.floor(Math.random() * boundaryArray.length);
        this.activeCells.add(boundaryArray[index]);
      }
    }
  }

  /**
   * Consumes nutrients from the 3D grid based on the hypha tip's position.
   * @param x - X-coordinate of the hypha tip.
   * @param y - Y-coordinate of the hypha tip.
   * @param z - Z-coordinate of the hypha tip.
   * @param amount - Amount of nutrient to consume.
   * @returns The actual amount of nutrient consumed.
   */
  public consumeResource(x: number, y: number, z: number = 0, amount: number = config.NUTRIENT_CONSUMPTION_RATE): number {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    const gridZ = Math.floor(z / config.ENV_GRID_CELL_SIZE);
    
    // Support for backward compatibility with 2D calls
    if (arguments.length === 3) {
      amount = z;
      z = 0;
    }

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length &&
      gridZ >= 0 &&
      gridZ < this.nutrientGrid[0][0].length
    ) {
      const available = this.nutrientGrid[gridX][gridY][gridZ];
      const consumed = Math.min(amount, available);
      this.nutrientGrid[gridX][gridY][gridZ] -= consumed;
      
      // Mark this cell as active for diffusion
      if (this.nutrientGrid[gridX][gridY][gridZ] > 0) {
        this.activeCells.add(`${gridX},${gridY},${gridZ}`);
      }
      
      return consumed;
    } else {
      console.warn(`Attempted to consume nutrients out of nutrient grid bounds at (${x}, ${y}, ${z})`);
      return 0;
    }
  }

  /**
   * Adds nutrients to a specific 3D location, e.g., during replenishment.
   * @param x - X-coordinate where nutrients are added.
   * @param y - Y-coordinate where nutrients are added.
   * @param z - Z-coordinate where nutrients are added.
   * @param amount - Amount of nutrient to add.
   */
  public addNutrient(x: number, y: number, z: number = 0, amount: number = config.REPLENISHMENT_AMOUNT) {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    const gridZ = Math.floor(z / config.ENV_GRID_CELL_SIZE);
    
    // Support for backward compatibility with 2D calls
    if (arguments.length === 3) {
      amount = z;
      z = 0;
    }

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length &&
      gridZ >= 0 &&
      gridZ < this.nutrientGrid[0][0].length
    ) {
      this.nutrientGrid[gridX][gridY][gridZ] += amount;
      
      // Mark this cell as active for diffusion
      this.activeCells.add(`${gridX},${gridY},${gridZ}`);
    } else {
      console.warn(`Attempted to add nutrients out of nutrient grid bounds at (${x}, ${y}, ${z})`);
    }
  }

  // Cache for 3D neighbor calculations
  private neighborCache: Map<string, [number, number, number][]> = new Map();
  
  /**
   * Gets cached neighbors for a 3D grid cell
   * @param x - X coordinate in grid
   * @param y - Y coordinate in grid
   * @param z - Z coordinate in grid
   * @param cols - Total columns in grid
   * @param rows - Total rows in grid
   * @param layers - Total layers in grid
   * @returns Array of valid neighbor coordinates
   */
  private getCachedNeighbors(
    x: number, 
    y: number, 
    z: number, 
    cols: number, 
    rows: number, 
    layers: number
  ): [number, number, number][] {
    const key = `${x},${y},${z}`;
    
    if (!this.neighborCache.has(key)) {
      const neighbors: [number, number, number][] = [];
      
      // 6-connected neighborhood (face neighbors)
      const potentialNeighbors = [
        [x - 1, y, z],
        [x + 1, y, z],
        [x, y - 1, z],
        [x, y + 1, z],
        [x, y, z - 1],
        [x, y, z + 1],
      ];
      
      for (const [nx, ny, nz] of potentialNeighbors) {
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && nz >= 0 && nz < layers) {
          neighbors.push([nx, ny, nz]);
        }
      }
      
      this.neighborCache.set(key, neighbors);
      
      // Keep cache size reasonable
      if (this.neighborCache.size > 10000) {
        // Clear half the cache when it gets too large
        const keys = Array.from(this.neighborCache.keys());
        for (let i = 0; i < 5000; i++) {
          this.neighborCache.delete(keys[i]);
        }
      }
    }
    
    return this.neighborCache.get(key)!;
  }

  /**
   * Handles nutrient diffusion across the 3D grid.
   * This method should be called periodically to simulate nutrient spread.
   * Highly optimized to only process cells that have nutrients or are near cells with nutrients.
   */
  public diffuseNutrients() {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    const layers = this.nutrientGrid[0][0].length;
    
    // If no active cells, skip diffusion
    if (this.activeCells.size === 0) {
      return;
    }
    
    // Use a sparse update approach instead of creating a full new grid
    const updates = new Map<string, number>();
    
    // Process only active cells and their neighbors
    const cellsToProcess = new Set(this.activeCells);
    const nextActiveCells = new Set<string>();
    
    // Increase the limit for active cells to ensure proper growth
    const maxActiveCells = 20000;
    
    for (const cellKey of cellsToProcess) {
      const [x, y, z] = cellKey.split(',').map(Number);
      
      if (x < 0 || x >= cols || y < 0 || y >= rows || z < 0 || z >= layers) continue;
      
      const currentValue = this.nutrientGrid[x][y][z];
      
      // Skip cells with negligible nutrients
      if (currentValue < 0.1) continue;
      
      // Get cached neighbors
      const neighbors = this.getCachedNeighbors(x, y, z, cols, rows, layers);
      
      let total = currentValue;
      let count = 1;
      
      // Calculate diffusion with neighbors
      for (const [nx, ny, nz] of neighbors) {
        // Apply different diffusion rates for horizontal vs vertical diffusion
        const diffusionRate = (nz === z) ? 
                             config.NUTRIENT_DIFFUSION : // Horizontal diffusion
                             config.NUTRIENT_VERTICAL_DIFFUSION; // Vertical diffusion
        
        // Weight the contribution based on diffusion rate
        total += this.nutrientGrid[nx][ny][nz] * diffusionRate;
        count += diffusionRate;
      }
      
      // Calculate new value with diffusion
      const avgValue = total / count;
      const diffusionAmount = config.NUTRIENT_DIFFUSION * (avgValue - currentValue);
      const newValue = currentValue + diffusionAmount;
      
      // Only update if the change is significant
      if (Math.abs(diffusionAmount) > 0.01) {
        updates.set(cellKey, newValue);
        
        // Mark this cell and some neighbors as active for next frame if it has nutrients
        if (newValue > 0.1) {
          // Add this cell to next active cells
          if (nextActiveCells.size < maxActiveCells) {
            nextActiveCells.add(cellKey);
          }
          
          // Only add a subset of neighbors to prevent Set from growing too large
          // Prioritize neighbors with higher nutrient values
          const neighborValues: [string, number][] = [];
          
          for (const [nx, ny, nz] of neighbors) {
            const neighborKey = `${nx},${ny},${nz}`;
            const neighborValue = this.nutrientGrid[nx][ny][nz];
            
            if (neighborValue > 0.5) { // Lowered threshold from 1.0 to 0.5 to include more cells in diffusion
              neighborValues.push([neighborKey, neighborValue]);
            }
          }
          
          // Sort neighbors by nutrient value (descending)
          neighborValues.sort((a, b) => b[1] - a[1]);
          
          // Add more neighbors to next active cells to ensure proper diffusion
          const neighborsToAdd = Math.min(4, neighborValues.length); // Increased from 2 to 4 neighbors per cell
          
          for (let i = 0; i < neighborsToAdd; i++) {
            if (nextActiveCells.size < maxActiveCells) {
              nextActiveCells.add(neighborValues[i][0]);
            } else {
              break; // Stop adding if we've reached the limit
            }
          }
        }
      } else if (currentValue > 1.0) { // Higher threshold for keeping cells active
        // Keep cells with significant nutrients in the active set even if they didn't change much
        if (nextActiveCells.size < maxActiveCells) {
          nextActiveCells.add(cellKey);
        }
      }
    }
    
    // Apply updates to the grid
    for (const [key, value] of updates) {
      const [x, y, z] = key.split(',').map(Number);
      this.nutrientGrid[x][y][z] = value;
    }
    
    // If we have too few active cells, add some random cells with nutrients
    if (nextActiveCells.size < 100) {
      // Sample random cells from the grid
      for (let i = 0; i < 100 && nextActiveCells.size < maxActiveCells; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        const z = Math.floor(Math.random() * layers);
        
        if (this.nutrientGrid[x][y][z] > 1.0) {
          nextActiveCells.add(`${x},${y},${z}`);
        }
      }
    }
    
    // Update active cells for next frame
    this.activeCells = nextActiveCells;
  }

  /**
   * Handles periodic replenishment of nutrients.
   * This method should be scheduled to run at intervals defined in config.
   */
  public replenishNutrients() {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    const layers = this.nutrientGrid[0][0].length;
    
    // Example: Replenish nutrients in random locations
    for (let i = 0; i < 10; i++) {
      // Number of replenishment pockets
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      
      // Bias towards upper layers for replenishment
      const z = Math.random() < config.SURFACE_GROWTH_BIAS ? 
                Math.random() * (this.depth * 0.3) : // Upper 30% of depth
                Math.random() * this.depth;
                
      this.addNutrient(x, y, z, config.REPLENISHMENT_AMOUNT);
    }
  }

  /**
   * Gets the nutrient level at a specific 3D position.
   * @param x - X-coordinate.
   * @param y - Y-coordinate.
   * @param z - Z-coordinate.
   * @returns The nutrient level at the specified position.
   */
  public getNutrientLevel(x: number, y: number, z: number = 0): number {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    const gridZ = Math.floor(z / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length &&
      gridZ >= 0 &&
      gridZ < this.nutrientGrid[0][0].length
    ) {
      return this.nutrientGrid[gridX][gridY][gridZ];
    }
    return 0;
  }

  /**
   * Gets the entire 3D nutrient grid for visualization.
   * @returns The 3D nutrient grid.
   */
  public getNutrientGrid(): number[][][] {
    return this.nutrientGrid;
  }

  /**
   * Draws the nutrient grid onto the canvas for visualization.
   * This is optional and can be used for debugging purposes.
   * @param ctx - Canvas rendering context.
   */
  public drawNutrientGrid(ctx: CanvasRenderingContext2D) {
    // For 2D visualization, we'll show a top-down view (z=0 layer)
    for (let x = 0; x < this.nutrientGrid.length; x++) {
      for (let y = 0; y < this.nutrientGrid[0].length; y++) {
        // Average nutrient levels across all z layers for visualization
        let totalNutrient = 0;
        for (let z = 0; z < this.nutrientGrid[0][0].length; z++) {
          totalNutrient += this.nutrientGrid[x][y][z];
        }
        const avgNutrient = totalNutrient / this.nutrientGrid[0][0].length;
        
        if (avgNutrient > 0) {
          ctx.fillStyle = `rgba(0, 255, 0, ${avgNutrient / config.BASE_NUTRIENT})`; // Green with alpha based on nutrient level
          ctx.fillRect(
            x * config.ENV_GRID_CELL_SIZE,
            y * config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE,
          );
        }
      }
    }
  }

  /**
   * Renders the nutrient grid as a visualization.
   * @param ctx - The 2D rendering context of the main canvas.
   */
  public renderNutrientPackets(ctx: CanvasRenderingContext2D) {
    // This method is kept for compatibility with existing code
    // but no longer renders apples. The nutrient visualization
    // is now handled by making the hyphae trunks glow green.
  }
}
