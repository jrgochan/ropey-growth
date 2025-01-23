/***************************************************
 * environment.ts
 *
 * A grid of nutrient/moisture values. Hypha can
 * sense and consume them, diffusing over time 
 * for a minimal dynamic environment.
 ***************************************************/

import {
    ENV_GRID_CELL_SIZE,
    BASE_NUTRIENT,
    BASE_MOISTURE,
    NUTRIENT_DIFFUSION,
    NUTRIENT_CONSUMPTION_RATE
  } from "./constants.js";
  
  export interface EnvCell {
    nutrient: number;
    moisture: number;
  }
  
  export class EnvironmentGrid {
    private cols: number;
    private rows: number;
    private grid: EnvCell[][];
  
    constructor(public width: number, public height: number) {
      this.cols = Math.ceil(width / ENV_GRID_CELL_SIZE);
      this.rows = Math.ceil(height / ENV_GRID_CELL_SIZE);
      this.grid = [];
  
      // Initialize
      for (let r = 0; r < this.rows; r++) {
        const row: EnvCell[] = [];
        for (let c = 0; c < this.cols; c++) {
          row.push({
            nutrient: BASE_NUTRIENT,
            moisture: BASE_MOISTURE
          });
        }
        this.grid.push(row);
      }
    }
  
    // Convert (x,y) to environment cell indices
    private getCellIndices(x: number, y: number): [number, number] | null {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
      const c = Math.floor(x / ENV_GRID_CELL_SIZE);
      const r = Math.floor(y / ENV_GRID_CELL_SIZE);
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
      return [r, c];
    }
  
    public getCell(x: number, y: number): EnvCell | null {
      const idx = this.getCellIndices(x, y);
      if (!idx) return null;
      return this.grid[idx[0]][idx[1]];
    }
  
    /**
     * Called each frame to slightly diffuse or replenish.
     * Very simplistic approach: each cell moves a fraction 
     * of its resource to neighbors, etc.
     */
    public updateEnvironment() {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          // Minimal "replenish" approach:
          this.grid[r][c].nutrient += NUTRIENT_DIFFUSION;
          // Could clamp to some max if desired
        }
      }
      // Real diffusion might need a 2-pass blur, but we keep it simple
    }
  
    /**
     * The hypha tip can call this to consume some resource in the cell.
     */
    public consumeResource(x: number, y: number, amount: number) {
      const cell = this.getCell(x, y);
      if (!cell) return 0;
      const consumed = Math.min(cell.nutrient, amount);
      cell.nutrient -= consumed;
      return consumed;
    }
  
    /**
     * Returns a "local nutrient value" for guiding growth direction.
     * E.g., hypha might grow toward higher nutrient if it wants.
     */
    public senseNutrient(x: number, y: number): number {
      const cell = this.getCell(x, y);
      return cell ? cell.nutrient : 0;
    }
  }
  