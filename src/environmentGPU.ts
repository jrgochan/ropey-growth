// src/environmentGPU.ts

/**
 * environmentGPU.ts
 *
 * Manages the nutrient environment for the mycelial simulation.
 * - Initializes and updates the nutrient grid.
 * - Simulates nutrient diffusion.
 * - Handles resource consumption by hyphal tips.
 * - Creates nutrient pockets to simulate resource-rich areas.
 * - Renders the nutrient environment onto a canvas.
 */

import { GPU } from 'gpu.js';
import {
  ENV_GRID_CELL_SIZE,
  BASE_NUTRIENT,
  NUTRIENT_DIFFUSION,
  BACKGROUND_ALPHA,
  FADE_START_FACTOR,
  FADE_END_FACTOR,
  NUTRIENT_POCKET_RADIUS,
  NUTRIENT_POCKET_AMOUNT,
  NUTRIENT_POCKET_DECAY_RATE,
  REPLENISHMENT_INTERVAL,
  REPLENISHMENT_AMOUNT
} from './constants.js';

export class EnvironmentGPU {
  private gpu: GPU;
  private renderKernel: any;
  private diffusionKernel: any;
  private nutrientGrid: number[][];
  public cols: number;
  public rows: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Nutrient Pockets Tracking
  private nutrientPockets: { x: number; y: number; radius: number; amount: number }[] = [];

  // Replenishment Timer
  private lastReplenishmentTime: number = 0;

  constructor(width: number, height: number, canvas: HTMLCanvasElement) {
    this.gpu = new GPU();

    // Calculate grid dimensions based on cell size
    this.cols = Math.floor(width / ENV_GRID_CELL_SIZE);
    this.rows = Math.floor(height / ENV_GRID_CELL_SIZE);

    // Initialize nutrient grid with base nutrient levels
    this.nutrientGrid = [];
    for (let y = 0; y < this.rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(BASE_NUTRIENT);
      }
      this.nutrientGrid.push(row);
    }

    this.canvas = canvas;
    this.canvas.width = this.cols;
    this.canvas.height = this.rows;
    this.ctx = this.canvas.getContext('2d')!;

    // Initialize GPU kernels
    this.initializeKernels();
  }

  /**
   * Initializes the GPU kernels for rendering and diffusion.
   */
  private initializeKernels() {
    // Diffusion Kernel: Simulates nutrient diffusion across the grid
    this.diffusionKernel = this.gpu.createKernel(function (grid: number[][], diffusionRate: number) {
      const x = this.thread.x;
      const y = this.thread.y;

      let sum = 0;
      let count = 0;

      // Left Neighbor
      if (x > 0) {
        sum += grid[y][x - 1];
        count++;
      }

      // Right Neighbor
      if (x < this.constants.cols - 1) {
        sum += grid[y][x + 1];
        count++;
      }

      // Up Neighbor
      if (y > 0) {
        sum += grid[y - 1][x];
        count++;
      }

      // Down Neighbor
      if (y < this.constants.rows - 1) {
        sum += grid[y + 1][x];
        count++;
      }

      // Calculate average of neighboring cells
      const average = count > 0 ? sum / count : 0;

      // Update nutrient level based on diffusion rate
      let newVal = grid[y][x] + diffusionRate * (average - grid[y][x]);

      // Ensure nutrient levels stay within bounds (0 to 100)
      if (newVal > 100) newVal = 100;
      if (newVal < 0) newVal = 0;

      return newVal;
    })
    .setOutput([this.cols, this.rows])
    .setConstants({ cols: this.cols, rows: this.rows })
    .setImmutable(true); // Inputs won't change during kernel execution

    // Render Kernel: Converts nutrient grid to RGBA pixels
    this.renderKernel = this.gpu.createKernel(function (grid: number[][]) {
      const y = this.thread.y;
      const x = this.thread.x;

      const nutrient = grid[y][x];

      // Map nutrient levels to dark greens (mimicking natural nutrient-rich soil)
      const greenValue = Math.floor((nutrient / 100.0) * 255);

      // Calculate radial distance from the center
      const dx = x - this.constants.centerX;
      const dy = y - this.constants.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = distance / this.constants.maxRadius;

      let alpha = 1.0;
      if (radius > this.constants.fadeStart) {
        alpha = 1.0 - (radius - this.constants.fadeStart) / (this.constants.fadeEnd - this.constants.fadeStart);
      }

      // Clamp alpha between 0 and 1
      if (alpha < 0) alpha = 0;
      if (alpha > 1) alpha = 1;

      this.color(0, greenValue / 255, 0, alpha); // Dark green based on nutrient level
    })
    .setOutput([this.cols, this.rows])
    .setGraphical(true) // Outputs to a GPU.js canvas
    .setConstants({
      centerX: this.cols / 2,
      centerY: this.rows / 2,
      maxRadius: Math.min(this.cols, this.rows) / 2,
      fadeStart: FADE_START_FACTOR,
      fadeEnd: FADE_END_FACTOR
    })
    .setImmutable(true); // Inputs won't change during kernel execution
  }

  /**
   * Updates the nutrient grid by performing diffusion and managing nutrient pockets.
   * Call this method once per simulation step.
   * @param currentTime - The current timestamp in milliseconds.
   */
  public updateEnvironment(currentTime: number) {
    // Perform diffusion step
    const newGrid = this.diffusionKernel(this.nutrientGrid, NUTRIENT_DIFFUSION);

    // Convert GPU.js output to a regular 2D array
    const updatedGrid: number[][] = [];
    for (let y = 0; y < this.rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(newGrid[y][x]);
      }
      updatedGrid.push(row);
    }

    this.nutrientGrid = updatedGrid;

    // Handle Nutrient Pockets Decay
    this.decayNutrientPockets();

    // Handle Nutrient Replenishment
    if (currentTime - this.lastReplenishmentTime > REPLENISHMENT_INTERVAL) {
      this.replenishNutrients(REPLENISHMENT_AMOUNT);
      this.lastReplenishmentTime = currentTime;
    }
  }

  /**
   * Renders the nutrient environment onto its canvas.
   * Call this method after updating the environment.
   */
  public renderToCanvas() {
    this.renderKernel(this.nutrientGrid);
    this.ctx.drawImage(this.renderKernel.canvas, 0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draws the nutrient environment onto a target context (e.g., main canvas).
   * @param targetCtx - The rendering context to draw onto.
   * @param targetWidth - The width of the target context.
   * @param targetHeight - The height of the target context.
   */
  public drawEnvOnTargetContext(targetCtx: CanvasRenderingContext2D, targetWidth: number, targetHeight: number) {
    targetCtx.globalAlpha = BACKGROUND_ALPHA; // Apply transparency based on constants
    targetCtx.drawImage(this.canvas, 0, 0, targetWidth, targetHeight);
    targetCtx.globalAlpha = 1.0; // Reset alpha
  }

  /**
   * Consumes resources (nutrients) from the environment at a specific (x, y) position.
   * @param x - X-coordinate in pixels.
   * @param y - Y-coordinate in pixels.
   * @param amount - Amount of nutrients to consume.
   * @returns The actual amount consumed (may be less if not enough nutrients).
   */
  public consumeResource(x: number, y: number, amount: number): number {
    // Convert pixel coordinates to grid indices
    const gridX = Math.floor(x / ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / ENV_GRID_CELL_SIZE);

    // Boundary check
    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      return 0;
    }

    const available = this.nutrientGrid[gridY][gridX];
    const consumed = Math.min(amount, available);
    this.nutrientGrid[gridY][gridX] -= consumed;

    return consumed;
  }

  /**
   * Creates a nutrient-rich circular pocket at the specified grid coordinates.
   * @param x - X-coordinate in grid cells.
   * @param y - Y-coordinate in grid cells.
   * @param radius - Radius of the pocket in grid cells.
   * @param amount - Amount of nutrient to add to each cell within the pocket.
   */
  public createNutrientPocket(x: number, y: number, radius: number, amount: number) {
    for (let j = y - radius; j <= y + radius; j++) {
      for (let i = x - radius; i <= x + radius; i++) {
        if (i >= 0 && i < this.cols && j >= 0 && j < this.rows) {
          const distance = Math.hypot(i - x, j - y);
          if (distance <= radius) {
            this.nutrientGrid[j][i] = Math.min(this.nutrientGrid[j][i] + amount, 100); // Clamp to max nutrient level
            // Track the nutrient pocket for decay
            this.nutrientPockets.push({ x: i, y: j, radius, amount });
          }
        }
      }
    }
  }

  /**
   * Decays nutrient pockets over time to simulate natural depletion.
   */
  private decayNutrientPockets() {
    for (let i = this.nutrientPockets.length - 1; i >= 0; i--) {
      const pocket = this.nutrientPockets[i];
      // Decay the nutrient amount
      pocket.amount -= NUTRIENT_POCKET_DECAY_RATE;
      if (pocket.amount <= 0) {
        // Remove the pocket from tracking
        this.nutrientPockets.splice(i, 1);
        continue;
      }
      // Apply decay to the nutrient grid
      if (this.nutrientGrid[pocket.y][pocket.x] > BASE_NUTRIENT) {
        this.nutrientGrid[pocket.y][pocket.x] = Math.max(this.nutrientGrid[pocket.y][pocket.x] - NUTRIENT_POCKET_DECAY_RATE, BASE_NUTRIENT);
      }
    }
  }

  /**
   * Replenishes nutrients uniformly across the grid.
   * @param amount - Amount of nutrient to add to each cell.
   */
  public replenishNutrients(amount: number) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.nutrientGrid[y][x] = Math.min(this.nutrientGrid[y][x] + amount, 100); // Clamp to max nutrient level
      }
    }
  }

  /**
   * Retrieves nutrient level at a specific (x, y) position.
   * @param x - X-coordinate in pixels.
   * @param y - Y-coordinate in pixels.
   * @returns Nutrient level (0 to 100).
   */
  public getNutrientAt(x: number, y: number): number {
    const gridX = Math.floor(x / ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / ENV_GRID_CELL_SIZE);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      return 0;
    }

    return this.nutrientGrid[gridY][gridX];
  }

  /**
   * Resets the nutrient grid to base nutrient levels and clears all nutrient pockets.
   */
  public resetEnvironment() {
    this.nutrientGrid = [];
    for (let y = 0; y < this.rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(BASE_NUTRIENT);
      }
      this.nutrientGrid.push(row);
    }
    this.nutrientPockets = [];
    this.lastReplenishmentTime = 0;
  }
}
