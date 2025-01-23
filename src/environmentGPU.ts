/***************************************************
 * environmentGPU.ts
 *
 * Manages the 2D nutrient environment using GPU.js:
 * - Handles nutrient diffusion
 * - Renders the nutrient state onto a canvas
 * - Allows resource consumption by hyphal tips
 ***************************************************/

import { GPU, IKernelFunctionThis } from "gpu.js";
import {
  ENV_GRID_CELL_SIZE,
  BASE_NUTRIENT,
  NUTRIENT_DIFFUSION,
} from "./constants.js";

/**
 * Interface to extend GPU.js's kernel "this" for TypeScript.
 */
interface KernelThis2D extends IKernelFunctionThis {
  thread: { x: number; y: number; z: number };
  output: { x: number; y: number; z: number };
}

/**
 * EnvironmentGPU:
 * - Maintains a 2D array of nutrients in CPU memory.
 * - Uses GPU.js to handle diffusion and rendering.
 */
export class EnvironmentGPU {
  public cols: number;
  public rows: number;
  private gpu: GPU;

  // Nutrient data stored in a 1D Float32Array for CPU access
  private nutrientCPU: Float32Array;

  // GPU Kernels
  private diffusionKernel: (data: number[][]) => number[][];
  private renderKernel: (data: number[][]) => void;

  // The HTMLCanvasElement used for rendering nutrients
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | WebGLRenderingContext;

    /**
   * Constructor initializes the EnvironmentGPU.
   * @param width - Width of the main canvas.
   * @param height - Height of the main canvas.
   * @param canvas - The canvas element dedicated to environment rendering.
   */
    constructor(width: number, height: number, canvas: HTMLCanvasElement) {
      // Calculate grid dimensions based on cell size
      this.cols = Math.ceil(width / ENV_GRID_CELL_SIZE);
      this.rows = Math.ceil(height / ENV_GRID_CELL_SIZE);
  
      // Initialize CPU nutrient array with BASE_NUTRIENT
      this.nutrientCPU = new Float32Array(this.rows * this.cols);
      this.nutrientCPU.fill(BASE_NUTRIENT);
  
      // Initialize GPU.js
      this.gpu = new GPU();
  
      // Use the provided canvas
      this.canvas = canvas;
      this.canvas.width = this.cols;
      this.canvas.height = this.rows;
  
      // Obtain WebGL2 or WebGL1 context
      this.gl =
        this.canvas.getContext("webgl2") ||
        this.canvas.getContext("webgl");
      if (!this.gl) {
        console.error("Failed to obtain WebGL context.");
        throw new Error("WebGL not supported on this device/browser");
      }
  
      // Initialize GPU Kernels
      this.initializeKernels();
  
      // Initial render
      this.renderToCanvas();
    }

  /**
   * Initializes the diffusion and render kernels.
   */
  private initializeKernels() {
    // Diffusion Kernel: Updates nutrient levels based on neighboring cells
    this.diffusionKernel = this.gpu
      .createKernel(function (data: number[][]) {
        const y = this.thread.y;
        const x = this.thread.x;
        const centerVal = data[y][x];

        let accum = centerVal;
        let count = 1;

        // Check and accumulate neighboring cells
        if (y > 0) {
          accum += data[y - 1][x];
          count++;
        }
        if (y < this.output.y - 1) {
          accum += data[y + 1][x];
          count++;
        }
        if (x > 0) {
          accum += data[y][x - 1];
          count++;
        }
        if (x < this.output.x - 1) {
          accum += data[y][x + 1];
          count++;
        }

        const avg = accum / count;
        // Update nutrient level with diffusion factor
        return centerVal + (avg - centerVal) * this.constants.NUTRIENT_DIFFUSION;
      })
      .setOutput([this.cols, this.rows])
      .setConstants({ NUTRIENT_DIFFUSION });

    // Render Kernel: Renders the nutrient levels as grayscale colors
    this.renderKernel = this.gpu
    .createKernel(function (data: number[][]) {
      const y = this.thread.y;
      const x = this.thread.x;
  
      const val = data[y][x];
      // Scale and clamp the nutrient value for better visibility
      const c = Math.min(Math.max(val / 5.0, 0), 1.0); // Adjusted scaling
      this.color(c, c, c, 1.0); // RGBA
    })
    .setOutput([this.cols, this.rows])
    .setGraphical(true)
    .setCanvas(this.canvas)
    .setContext(this.gl);
  }

  /**
   * Updates the nutrient environment by performing diffusion.
   */
  public updateEnvironment() {
    // Convert the 1D nutrient array to a 2D array for the kernel
    const data2D: number[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.nutrientCPU[r * this.cols + c]);
      }
      data2D.push(row);
    }

    // Perform diffusion using the GPU kernel
    const output = this.diffusionKernel(data2D);

    // Update the CPU nutrient array with the diffused values
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.nutrientCPU[r * this.cols + c] = output[r][c];
      }
    }
  }

  /**
   * Renders the current nutrient state onto the environment canvas.
   */
  public renderToCanvas() {
    // Convert the 1D nutrient array to a 2D array for the render kernel
    const data2D: number[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.nutrientCPU[r * this.cols + c]);
      }
      data2D.push(row);
    }

    // Perform rendering using the GPU kernel
    this.renderKernel(data2D);
  }

  /**
   * Draws the environment canvas onto the main canvas context.
   * @param mainCtx - The 2D rendering context of the main canvas.
   * @param w - Width of the main canvas.
   * @param h - Height of the main canvas.
   */
  public drawEnvOnMainContext(mainCtx: CanvasRenderingContext2D, w: number, h: number) {
    // Draw the environment canvas onto the main canvas, scaling it appropriately
    mainCtx.drawImage(this.canvas, 0, 0, this.cols, this.rows, 0, 0, w, h);
  }

  /**
   * Consumes nutrient from a specific (x, y) location.
   * @param x - X-coordinate in pixels.
   * @param y - Y-coordinate in pixels.
   * @param amt - Amount of nutrient to consume.
   * @returns The actual amount consumed.
   */
  public consumeResource(x: number, y: number, amt: number): number {
    // Map pixel coordinates to grid cells
    const c = Math.floor(x / ENV_GRID_CELL_SIZE);
    const r = Math.floor(y / ENV_GRID_CELL_SIZE);

    // Boundary check
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return 0;

    const idx = r * this.cols + c;
    const available = this.nutrientCPU[idx];
    const consumed = Math.min(available, amt);
    this.nutrientCPU[idx] = available - consumed;

    return consumed;
  }

  /**
   * Getter for the environment canvas (optional).
   * Useful for debugging or layered canvas setups.
   * @returns The environment HTMLCanvasElement.
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
