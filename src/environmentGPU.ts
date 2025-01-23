/***************************************************
 * environmentGPU.ts
 *
 * Manages the nutrient environment for the mycelial simulation.
 * - Initializes and updates the nutrient grid.
 * - Simulates nutrient diffusion.
 * - Handles resource consumption by hyphal tips.
 * - Renders the nutrient environment onto a canvas.
 ***************************************************/

import { GPU } from 'gpu.js';
import {
  ENV_GRID_CELL_SIZE,
  BASE_NUTRIENT,
  NUTRIENT_DIFFUSION,
  BACKGROUND_ALPHA,
  FADE_START_FACTOR,
  FADE_END_FACTOR
} from './constants.js';

export class EnvironmentGPU {
  private gpu: GPU;
  private renderKernel: any;
  private diffusionKernel: any;
  private nutrientGrid: number[][];
  private cols: number;
  private rows: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

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

      // Left
      if (x > 0) {
        sum += grid[y][x - 1];
        count++;
      }

      // Right
      if (x < this.constants.cols - 1) {
        sum += grid[y][x + 1];
        count++;
      }

      // Up
      if (y > 0) {
        sum += grid[y - 1][x];
        count++;
      }

      // Down
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

      // Map nutrient levels to grayscale colors (higher nutrients = darker)
      const colorValue = Math.floor((1.0 - nutrient / 100.0) * 255);

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

      this.color(colorValue / 255, colorValue / 255, colorValue / 255, alpha);
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
   * Updates the nutrient grid by performing diffusion.
   */
  public updateEnvironment() {
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
  }

  /**
   * Renders the nutrient environment onto its canvas.
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
   * Resets the nutrient grid to base nutrient levels.
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
  }
}
