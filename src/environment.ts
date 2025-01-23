/***************************************************
 * environment.ts
 *
 * A simple 2D grid for resource (nutrient) values.
 ***************************************************/

import {
  ENV_GRID_CELL_SIZE,
  BASE_NUTRIENT,
  NUTRIENT_DIFFUSION,
  NUTRIENT_CONSUMPTION_RATE
} from "./constants.js";

export interface EnvCell {
  nutrient: number;
}

export class EnvironmentGrid {
  private cols: number;
  private rows: number;
  private grid: EnvCell[][];

  constructor(public width: number, public height: number) {
    this.cols = Math.ceil(width / ENV_GRID_CELL_SIZE);
    this.rows = Math.ceil(height / ENV_GRID_CELL_SIZE);
    this.grid = [];

    for (let r = 0; r < this.rows; r++) {
      const row: EnvCell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          nutrient: BASE_NUTRIENT
        });
      }
      this.grid.push(row);
    }
  }

  private getIndices(x: number, y: number): [number, number] | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    const c = Math.floor(x / ENV_GRID_CELL_SIZE);
    const r = Math.floor(y / ENV_GRID_CELL_SIZE);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return [r, c];
  }

  public getCell(x: number, y: number): EnvCell | null {
    const idx = this.getIndices(x, y);
    if (!idx) return null;
    return this.grid[idx[0]][idx[1]];
  }

  public updateEnvironment() {
    // Minimal approach: each cell gets a tiny increment
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].nutrient += NUTRIENT_DIFFUSION; 
      }
    }
  }

  public consumeResource(x: number, y: number, amount: number): number {
    const cell = this.getCell(x, y);
    if (!cell) return 0;
    const consumed = Math.min(cell.nutrient, amount);
    cell.nutrient -= consumed;
    return consumed;
  }
}
