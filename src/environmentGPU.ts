/***************************************************
 * environmentGPU.ts
 *
 * Manages a 2D nutrient array with GPU.js for diffusion,
 * ensuring correct TypeScript types and no "this.dimensions" usage.
 ***************************************************/

import { GPU, IKernelFunctionThis } from "gpu.js";
import {
  ENV_GRID_CELL_SIZE,
  BASE_NUTRIENT,
  NUTRIENT_DIFFUSION,
  NUTRIENT_CONSUMPTION_RATE
} from "./constants.js";

/**
 * For clarity, define an interface for the GPU kernel's 'this':
 * GPU.js provides `IKernelFunctionThis`, but we also want
 * to ensure `thread` and `output` are typed with x/y.
 */
interface KernelThis extends IKernelFunctionThis {
  thread: { x: number; y: number; z: number };
  output: { x: number; y: number; z: number };
}

/**
 * EnvironmentGPU:
 * - Stores a Float32Array of nutrient data
 * - Each update: pass data to GPU kernel -> do diffusion -> read back
 */
export class EnvironmentGPU {
  public width: number;
  public height: number;
  public cols: number;
  public rows: number;

  private nutrientData: Float32Array;
  private gpu: GPU;
  private diffusionKernel: (
    input: number[][],
    diffRate: number
  ) => number[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / ENV_GRID_CELL_SIZE);
    this.rows = Math.ceil(height / ENV_GRID_CELL_SIZE);

    // Initialize array with base nutrient
    this.nutrientData = new Float32Array(this.rows * this.cols);
    for (let i = 0; i < this.nutrientData.length; i++) {
      this.nutrientData[i] = BASE_NUTRIENT;
    }

    // Setup GPU.js
    this.gpu = new GPU();

    /**
     * Build a naive diffusion kernel. We replace any usage of
     * `this.dimensions.y` with `this.output.y`. Then define explicit
     * parameter types: (this: KernelThis, input: number[][], diffRate: number).
     */
    this.diffusionKernel = this.gpu
      .createKernel(
        function (
          this: KernelThis,
          input: number[][],
          diffRate: number
        ): number {
          const y = this.thread.y;
          const x = this.thread.x;

          // read center
          const centerVal = input[y][x];

          let accum = centerVal;
          let count = 1;

          // up
          if (y > 0) {
            accum += input[y - 1][x];
            count++;
          }
          // down
          if (y < this.output.y - 1) {
            accum += input[y + 1][x];
            count++;
          }
          // left
          if (x > 0) {
            accum += input[y][x - 1];
            count++;
          }
          // right
          if (x < this.output.x - 1) {
            accum += input[y][x + 1];
            count++;
          }

          const avg = accum / count;
          return centerVal + (avg - centerVal) * diffRate;
        },
        { output: [this.cols, this.rows] }
      ) as (
        input: number[][],
        diffRate: number
      ) => number[][]; // cast the function type
  }

  /**
   * updateEnvironment():
   *  - convert 1D nutrientData to 2D array
   *  - run diffusionKernel
   *  - read back into nutrientData
   */
  public updateEnvironment(): void {
    const input2D: number[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.nutrientData[r * this.cols + c]);
      }
      input2D.push(row);
    }

    // GPU diffusion
    const output: number[][] = this.diffusionKernel(
      input2D,
      NUTRIENT_DIFFUSION
    );

    // copy back
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.nutrientData[r * this.cols + c] = output[r][c];
      }
    }
  }

  /**
   * consumeResource():
   *  - subtract from local cell
   */
  public consumeResource(x: number, y: number, amount: number): number {
    const c = Math.floor(x / ENV_GRID_CELL_SIZE);
    const r = Math.floor(y / ENV_GRID_CELL_SIZE);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return 0;

    const idx = r * this.cols + c;
    const available = this.nutrientData[idx];
    const consumed = Math.min(available, amount);
    this.nutrientData[idx] = available - consumed;
    return consumed;
  }
}
