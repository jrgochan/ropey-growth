// src/substrate.ts

import { config } from "./constants.js";

/**
 * Substrate represents the material in which fungi grow, with various properties
 * that influence hyphal growth.
 */
export class Substrate {
  private width: number;
  private height: number;
  private carbonGrid: number[][]; // Carbon-based nutrients (sugars, cellulose)
  private nitrogenGrid: number[][]; // Nitrogen-based nutrients (proteins)
  private enzymeGrid: number[][]; // Extracellular enzymes secreted by fungi
  private pHGrid: number[][]; // pH levels in the substrate
  private temperatureGrid: number[][]; // Temperature variations
  private hardnessGrid: number[][]; // Physical resistance to penetration
  private bacteriaGrid: number[][]; // Density of bacteria
  private moistureGrid: number[][]; // Moisture levels
  private timeOfDay: number = 0; // 0-24 hour cycle
  private seasonalFactor: number = 1.0; // Seasonal growth multiplier
  private currentDay: number = 0; // Day counter for seasonal cycles

  /**
   * Initializes the substrate with all environmental properties.
   * @param width Width of the substrate grid.
   * @param height Height of the substrate grid.
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    const cols = Math.ceil(width / config.ENV_GRID_CELL_SIZE);
    const rows = Math.ceil(height / config.ENV_GRID_CELL_SIZE);
    
    // Initialize all environment grids
    this.carbonGrid = this.createGrid(cols, rows, config.BASE_NUTRIENT);
    this.nitrogenGrid = this.createGrid(cols, rows, config.BASE_NUTRIENT / config.CARBON_NITROGEN_RATIO);
    this.enzymeGrid = this.createGrid(cols, rows, 0);
    this.pHGrid = this.createGridWithValue(cols, rows, 
      (config.PH_TOLERANCE_RANGE[0] + config.PH_TOLERANCE_RANGE[1]) / 2);
    this.temperatureGrid = this.createGridWithValue(cols, rows, config.TEMPERATURE_OPTIMUM);
    this.hardnessGrid = this.createGridWithRandomization(cols, rows, 
      config.SUBSTRATE_PENETRATION_RESISTANCE, 0.2);
    this.bacteriaGrid = this.createGridWithRandomization(cols, rows, 0.1, 0.1);
    this.moistureGrid = this.createGridWithRandomization(cols, rows, 0.7, 0.3);
    
    // Create heterogeneity in the substrate
    this.generateHeterogeneousSubstrate();
  }
  
  /**
   * Creates a grid with a uniform value.
   */
  private createGrid(cols: number, rows: number, value: number): number[][] {
    return Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => value)
    );
  }
  
  /**
   * Creates a grid with a specific value.
   */
  private createGridWithValue(cols: number, rows: number, value: number): number[][] {
    return Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => value)
    );
  }
  
  /**
   * Creates a grid with a base value plus random variation.
   */
  private createGridWithRandomization(
    cols: number, 
    rows: number, 
    baseValue: number, 
    variationRange: number
  ): number[][] {
    return Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => 
        baseValue + (Math.random() * 2 - 1) * variationRange
      )
    );
  }
  
  /**
   * Generates heterogeneity in the substrate with patches of different properties.
   */
  private generateHeterogeneousSubstrate(): void {
    const cols = this.carbonGrid.length;
    const rows = this.carbonGrid[0].length;
    
    // Create patches with different properties
    const numPatches = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < numPatches; i++) {
      // Random center point
      const centerX = Math.floor(Math.random() * cols);
      const centerY = Math.floor(Math.random() * rows);
      
      // Random radius
      const radius = Math.floor(Math.random() * 10) + 5;
      
      // Random property variations
      const carbonMod = (Math.random() * 0.8 + 0.6) * config.BASE_NUTRIENT;
      const nitrogenMod = carbonMod / (config.CARBON_NITROGEN_RATIO * (Math.random() * 0.5 + 0.75));
      const pHMod = config.PH_TOLERANCE_RANGE[0] + Math.random() * 
        (config.PH_TOLERANCE_RANGE[1] - config.PH_TOLERANCE_RANGE[0]);
      const tempMod = config.TEMPERATURE_RANGE[0] + Math.random() * 
        (config.TEMPERATURE_RANGE[1] - config.TEMPERATURE_RANGE[0]);
      const hardnessMod = Math.random() * config.SUBSTRATE_PENETRATION_RESISTANCE * 2;
      const moistureMod = Math.random() * 0.8 + 0.2;
      
      // Apply modifications in a radius around center
      for (let x = Math.max(0, centerX - radius); x < Math.min(cols, centerX + radius); x++) {
        for (let y = Math.max(0, centerY - radius); y < Math.min(rows, centerY + radius); y++) {
          // Calculate distance from center
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          
          // Apply changes with a falloff from center
          if (distance <= radius) {
            const factor = 1 - (distance / radius);
            
            // Blend existing values with new ones based on distance factor
            this.carbonGrid[x][y] = this.carbonGrid[x][y] * (1 - factor) + carbonMod * factor;
            this.nitrogenGrid[x][y] = this.nitrogenGrid[x][y] * (1 - factor) + nitrogenMod * factor;
            this.pHGrid[x][y] = this.pHGrid[x][y] * (1 - factor) + pHMod * factor;
            this.temperatureGrid[x][y] = this.temperatureGrid[x][y] * (1 - factor) + tempMod * factor;
            this.hardnessGrid[x][y] = this.hardnessGrid[x][y] * (1 - factor) + hardnessMod * factor;
            this.moistureGrid[x][y] = this.moistureGrid[x][y] * (1 - factor) + moistureMod * factor;
          }
        }
      }
    }
    
    // Create random patches of bacterial colonies
    if (config.BACTERIAL_INTERACTION_FACTOR !== 0) {
      const bacterialPatches = Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < bacterialPatches; i++) {
        const centerX = Math.floor(Math.random() * cols);
        const centerY = Math.floor(Math.random() * rows);
        const radius = Math.floor(Math.random() * 7) + 3;
        const bacteriaDensity = Math.random() * 0.8 + 0.2;
        
        for (let x = Math.max(0, centerX - radius); x < Math.min(cols, centerX + radius); x++) {
          for (let y = Math.max(0, centerY - radius); y < Math.min(rows, centerY + radius); y++) {
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (distance <= radius) {
              const factor = 1 - (distance / radius);
              this.bacteriaGrid[x][y] = bacteriaDensity * factor;
            }
          }
        }
      }
    }
  }
  
  /**
   * Add enzyme secretion at a specific location from a hyphal tip.
   * @param x X-coordinate in the substrate.
   * @param y Y-coordinate in the substrate.
   * @param amount Amount of enzyme to secrete.
   */
  public secreteEnzyme(x: number, y: number, amount: number): void {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    if (this.isValidGridPosition(gridX, gridY)) {
      // Secrete enzymes in a radius around the tip
      const radius = config.ENZYME_SECRETION_RADIUS;
      
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const targetX = gridX + dx;
          const targetY = gridY + dy;
          
          if (this.isValidGridPosition(targetX, targetY)) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
              // Enzyme concentration decreases with distance from the tip
              const factor = 1 - (distance / radius);
              this.enzymeGrid[targetX][targetY] += amount * factor;
            }
          }
        }
      }
    }
  }
  
  /**
   * Updates enzyme diffusion and substrate digestion.
   */
  public updateEnzymeActivity(): void {
    const cols = this.carbonGrid.length;
    const rows = this.carbonGrid[0].length;
    const newEnzymeGrid = this.createGrid(cols, rows, 0);
    
    // Diffuse enzymes and digest substrate
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (this.enzymeGrid[x][y] > 0) {
          // Enzyme diffusion
          let totalEnzyme = this.enzymeGrid[x][y];
          let count = 1;
          
          // Diffuse to neighboring cells
          const neighbors = [
            [x - 1, y], [x + 1, y], 
            [x, y - 1], [x, y + 1]
          ];
          
          for (const [nx, ny] of neighbors) {
            if (this.isValidGridPosition(nx, ny)) {
              totalEnzyme += this.enzymeGrid[nx][ny];
              count++;
            }
          }
          
          // Calculate average and apply diffusion rate
          const avgEnzyme = totalEnzyme / count;
          newEnzymeGrid[x][y] = this.enzymeGrid[x][y] + 
            config.ENZYME_DIFFUSION_RATE * (avgEnzyme - this.enzymeGrid[x][y]);
          
          // Enzyme digestion of substrate - convert substrate to available nutrients
          const digestionAmount = this.enzymeGrid[x][y] * config.ENZYME_DIGESTION_RATE;
          
          // Digestion effectiveness is influenced by pH and temperature
          const pHFactor = this.getPHFactor(this.pHGrid[x][y]);
          const temperatureFactor = this.getTemperatureFactor(this.temperatureGrid[x][y]);
          const adjustedDigestion = digestionAmount * pHFactor * temperatureFactor;
          
          // Release carbon nutrients from substrate
          const carbonReleased = Math.min(adjustedDigestion, this.hardnessGrid[x][y] * 10);
          this.carbonGrid[x][y] += carbonReleased;
          
          // Release nitrogen nutrients (at lower ratio based on C:N ratio)
          const nitrogenReleased = carbonReleased / config.CARBON_NITROGEN_RATIO;
          this.nitrogenGrid[x][y] += nitrogenReleased;
          
          // Reduce substrate hardness as it's digested
          this.hardnessGrid[x][y] = Math.max(0, this.hardnessGrid[x][y] - 
            (adjustedDigestion * 0.01));
        }
      }
    }
    
    // Update enzyme grid with diffused values
    this.enzymeGrid = newEnzymeGrid;
    
    // Enzymes degrade over time
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // Enzymes degrade faster in higher temperatures and extreme pH
        const degradationFactor = 0.05 * 
          (1 + Math.abs(this.pHGrid[x][y] - 7) * 0.05) * 
          (1 + Math.max(0, this.temperatureGrid[x][y] - 25) * 0.01);
        
        this.enzymeGrid[x][y] *= (1 - degradationFactor);
      }
    }
  }
  
  /**
   * Updates circadian rhythms and seasonal cycles.
   */
  public updateEnvironmentalCycles(): void {
    // Update time of day (24-hour cycle)
    this.timeOfDay = (this.timeOfDay + 0.1) % 24;
    
    // Circadian rhythm influence
    const timePhase = Math.sin((this.timeOfDay / 24) * 2 * Math.PI);
    const circadianFactor = 1 + timePhase * config.CIRCADIAN_RHYTHM_AMPLITUDE;
    
    // Update day counter and seasonal cycles
    if (this.timeOfDay < 0.1) {
      this.currentDay++;
      
      // Seasonal changes (365-day cycle)
      if (config.SEASONAL_GROWTH_PATTERN) {
        // Simple seasonal model: spring (0-90), summer (91-180), fall (181-270), winter (271-364)
        const dayOfYear = this.currentDay % 365;
        
        if (dayOfYear < 90) { // Spring
          this.seasonalFactor = 0.8 + (dayOfYear / 90) * 0.4; // Increasing growth
        } else if (dayOfYear < 180) { // Summer
          this.seasonalFactor = 1.2;
        } else if (dayOfYear < 270) { // Fall
          this.seasonalFactor = 1.2 - ((dayOfYear - 180) / 90) * 0.5; // Decreasing growth
        } else { // Winter
          this.seasonalFactor = 0.7;
        }
        
        // Apply seasonal temperature changes
        const seasonalTemp = config.TEMPERATURE_OPTIMUM + 
          Math.sin(((dayOfYear / 365) * 2 * Math.PI) - (Math.PI / 2)) * 10;
        
        // Update temperature grid with seasonal influences
        for (let x = 0; x < this.temperatureGrid.length; x++) {
          for (let y = 0; y < this.temperatureGrid[0].length; y++) {
            // Blend current temperature with seasonal temperature
            this.temperatureGrid[x][y] = this.temperatureGrid[x][y] * 0.95 + seasonalTemp * 0.05;
          }
        }
      }
    }
  }
  
  /**
   * Consume carbon and nitrogen nutrients at a specific location.
   * @param x X-coordinate in the substrate.
   * @param y Y-coordinate in the substrate.
   * @param carbonAmount Amount of carbon to consume.
   * @param nitrogenAmount Amount of nitrogen to consume.
   * @returns [consumedCarbon, consumedNitrogen] - Actual amounts consumed.
   */
  public consumeNutrients(
    x: number, 
    y: number, 
    carbonAmount: number, 
    nitrogenAmount: number
  ): [number, number] {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    if (this.isValidGridPosition(gridX, gridY)) {
      // Get environmental factors
      const moistureFactor = this.moistureGrid[gridX][gridY];
      const pHFactor = this.getPHFactor(this.pHGrid[gridX][gridY]);
      const tempFactor = this.getTemperatureFactor(this.temperatureGrid[gridX][gridY]);
      const hardnessFactor = 1 - this.hardnessGrid[gridX][gridY] * 0.5;
      
      // Adjust consumption rates based on environmental factors
      const adjustedCarbonAmount = carbonAmount * moistureFactor * pHFactor * 
        tempFactor * hardnessFactor * this.seasonalFactor;
      const adjustedNitrogenAmount = nitrogenAmount * moistureFactor * pHFactor * 
        tempFactor * hardnessFactor * this.seasonalFactor;
      
      // Actual consumption is limited by available nutrients
      const consumedCarbon = Math.min(adjustedCarbonAmount, this.carbonGrid[gridX][gridY]);
      const consumedNitrogen = Math.min(adjustedNitrogenAmount, this.nitrogenGrid[gridX][gridY]);
      
      // Update grid values
      this.carbonGrid[gridX][gridY] -= consumedCarbon;
      this.nitrogenGrid[gridX][gridY] -= consumedNitrogen;
      
      // Bacterial interactions can affect nutrient availability
      if (config.COMPETITOR_FUNGAL_PRESENCE || this.bacteriaGrid[gridX][gridY] > 0.2) {
        // Competition for nutrients from bacteria or other fungi
        const competitionFactor = this.bacteriaGrid[gridX][gridY] * 
          config.BACTERIAL_INTERACTION_FACTOR;
        
        // Reduce both consumed nutrients due to competition
        return [
          consumedCarbon * (1 - competitionFactor),
          consumedNitrogen * (1 - competitionFactor)
        ];
      }
      
      return [consumedCarbon, consumedNitrogen];
    }
    
    return [0, 0];
  }
  
  /**
   * Checks if a hyphal tip is affected by gravity (geotropism).
   * @param x X-coordinate in the substrate.
   * @param y Y-coordinate in the substrate.
   * @param angle Current growth angle.
   * @returns Adjusted angle based on geotropism.
   */
  public applyGeotropism(x: number, y: number, angle: number): number {
    if (config.GEOTROPISM_STRENGTH > 0) {
      // In 2D, "up" is negative Y direction
      const upAngle = -Math.PI / 2; // -90 degrees
      const angleDiff = this.normalizeAngle(upAngle - angle);
      
      // Apply geotropic influence (adjust angle toward "up")
      return angle + angleDiff * config.GEOTROPISM_STRENGTH;
    }
    
    return angle;
  }
  
  /**
   * Check if another tip has apical dominance over a location.
   * @param x X-coordinate in the substrate.
   * @param y Y-coordinate in the substrate.
   * @param existingTips Array of existing hyphal tips.
   * @returns Suppression factor (0-1) from nearby dominant tips.
   */
  public getApicalDominanceFactor(
    x: number, 
    y: number, 
    existingTips: any[]
  ): number {
    if (config.APICAL_DOMINANCE_FACTOR === 0) {
      return 0;
    }
    
    let maxDominance = 0;
    
    // Check all tips for apical dominance
    for (const tip of existingTips) {
      if (tip.apicalDominanceStrength > 0) {
        const distance = Math.sqrt(
          Math.pow(x - tip.x, 2) + 
          Math.pow(y - tip.y, 2)
        );
        
        // Dominance decreases with distance
        if (distance < 10) {
          const dominanceFactor = tip.apicalDominanceStrength * (1 - distance / 10);
          
          // Take the maximum dominance factor from all tips
          maxDominance = Math.max(maxDominance, dominanceFactor);
        }
      }
    }
    
    return maxDominance * config.APICAL_DOMINANCE_FACTOR;
  }
  
  /**
   * Get all environmental factors at a specific location.
   * @param x X-coordinate in the substrate.
   * @param y Y-coordinate in the substrate.
   * @returns Environmental factors object.
   */
  public getEnvironmentalFactors(x: number, y: number): {
    carbon: number;
    nitrogen: number;
    moisture: number;
    pH: number;
    temperature: number;
    hardness: number;
    bacteria: number;
    circadianFactor: number;
    seasonalFactor: number;
  } {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    if (this.isValidGridPosition(gridX, gridY)) {
      return {
        carbon: this.carbonGrid[gridX][gridY],
        nitrogen: this.nitrogenGrid[gridX][gridY],
        moisture: this.moistureGrid[gridX][gridY],
        pH: this.pHGrid[gridX][gridY],
        temperature: this.temperatureGrid[gridX][gridY],
        hardness: this.hardnessGrid[gridX][gridY],
        bacteria: this.bacteriaGrid[gridX][gridY],
        circadianFactor: 1 + Math.sin((this.timeOfDay / 24) * 2 * Math.PI) * 
          config.CIRCADIAN_RHYTHM_AMPLITUDE,
        seasonalFactor: this.seasonalFactor
      };
    }
    
    // Default values if position is invalid
    return {
      carbon: 0,
      nitrogen: 0,
      moisture: 0.5,
      pH: 7,
      temperature: config.TEMPERATURE_OPTIMUM,
      hardness: 0.5,
      bacteria: 0,
      circadianFactor: 1,
      seasonalFactor: 1
    };
  }
  
  /**
   * Get the pH influence factor (0-1) based on pH value.
   * @param pH Current pH value.
   * @returns Factor representing how optimal the pH is.
   */
  private getPHFactor(pH: number): number {
    const [minPH, maxPH] = config.PH_TOLERANCE_RANGE;
    
    if (pH < minPH || pH > maxPH) {
      return 0.2; // Minimal growth outside tolerance range
    }
    
    // Optimum pH is between 5.5 and 6.5 for most fungi
    const optimalMin = 5.5;
    const optimalMax = 6.5;
    
    if (pH >= optimalMin && pH <= optimalMax) {
      return 1.0; // Optimal pH range
    }
    
    // Linear falloff to tolerance boundaries
    if (pH < optimalMin) {
      return 0.2 + 0.8 * ((pH - minPH) / (optimalMin - minPH));
    } else {
      return 0.2 + 0.8 * ((maxPH - pH) / (maxPH - optimalMax));
    }
  }
  
  /**
   * Get the temperature influence factor (0-1) based on temperature.
   * @param temperature Current temperature.
   * @returns Factor representing how optimal the temperature is.
   */
  private getTemperatureFactor(temperature: number): number {
    const [minTemp, maxTemp] = config.TEMPERATURE_RANGE;
    const optimalTemp = config.TEMPERATURE_OPTIMUM;
    
    if (temperature < minTemp || temperature > maxTemp) {
      return 0.1; // Minimal growth outside tolerance range
    }
    
    // Gaussian-like curve centered at optimal temperature
    const tempDiff = Math.abs(temperature - optimalTemp);
    const rangeFactor = Math.min(tempDiff / 10, 1);
    
    return 1.0 - 0.9 * rangeFactor * rangeFactor;
  }
  
  /**
   * Checks if grid coordinates are valid.
   * @param x X-coordinate in the grid.
   * @param y Y-coordinate in the grid.
   * @returns True if the position is within the grid.
   */
  private isValidGridPosition(x: number, y: number): boolean {
    return x >= 0 && 
           x < this.carbonGrid.length && 
           y >= 0 && 
           y < this.carbonGrid[0].length;
  }
  
  /**
   * Normalizes an angle to the range [-π, π].
   * @param angle Angle in radians.
   * @returns Normalized angle.
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
  
  /**
   * Diffuses all substrate components (nutrients, moisture, etc.).
   */
  public diffuseSubstrate(): void {
    this.diffuseGrid(this.carbonGrid, config.NUTRIENT_DIFFUSION * 0.8);
    this.diffuseGrid(this.nitrogenGrid, config.NUTRIENT_DIFFUSION);
    this.diffuseGrid(this.moistureGrid, config.NUTRIENT_DIFFUSION * 1.5);
    this.diffuseGrid(this.temperatureGrid, config.NUTRIENT_DIFFUSION * 2.0);
    
    // pH diffuses very slowly
    this.diffuseGrid(this.pHGrid, config.NUTRIENT_DIFFUSION * 0.2);
    
    // Update bacterial activity
    this.updateBacterialActivity();
  }
  
  /**
   * Generic method to diffuse any grid.
   * @param grid The grid to diffuse.
   * @param diffusionRate Rate of diffusion.
   */
  private diffuseGrid(grid: number[][], diffusionRate: number): void {
    const cols = grid.length;
    const rows = grid[0].length;
    const newGrid = this.createGrid(cols, rows, 0);
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let total = grid[x][y];
        let count = 1;
        
        // Check neighboring cells
        const neighbors = [
          [x - 1, y], [x + 1, y], 
          [x, y - 1], [x, y + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
          if (this.isValidGridPosition(nx, ny)) {
            total += grid[nx][ny];
            count++;
          }
        }
        
        // Calculate average and apply diffusion rate
        newGrid[x][y] = grid[x][y] + diffusionRate * (total / count - grid[x][y]);
      }
    }
    
    // Update the grid
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        grid[x][y] = newGrid[x][y];
      }
    }
  }
  
  /**
   * Updates bacterial activity in the substrate.
   */
  private updateBacterialActivity(): void {
    if (config.BACTERIAL_INTERACTION_FACTOR === 0) {
      return;
    }
    
    const cols = this.bacteriaGrid.length;
    const rows = this.bacteriaGrid[0].length;
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (this.bacteriaGrid[x][y] > 0) {
          // Bacteria consume nutrients
          const bacterialConsumption = this.bacteriaGrid[x][y] * 0.01;
          this.carbonGrid[x][y] = Math.max(0, this.carbonGrid[x][y] - bacterialConsumption);
          this.nitrogenGrid[x][y] = Math.max(0, this.nitrogenGrid[x][y] - bacterialConsumption);
          
          // Bacteria growth or decline based on nutrients and conditions
          const growth = bacterialConsumption * 0.5 * 
            this.moistureGrid[x][y] * 
            this.getTemperatureFactor(this.temperatureGrid[x][y]);
          
          this.bacteriaGrid[x][y] += growth;
          
          // Bacterial population limit
          this.bacteriaGrid[x][y] = Math.min(1, this.bacteriaGrid[x][y]);
          
          // Bacteria may produce useful metabolites or compete with fungi
          if (config.BACTERIAL_INTERACTION_FACTOR > 0) {
            // Beneficial bacteria (increase available nitrogen)
            this.nitrogenGrid[x][y] += bacterialConsumption * 
              config.BACTERIAL_INTERACTION_FACTOR * 0.5;
          }
        }
      }
    }
  }
  
  /**
   * Renders the substrate for visualization.
   * @param ctx Canvas rendering context.
   * @param mode Visualization mode (nutrients, moisture, pH, temperature, etc.).
   */
  public renderSubstrate(
    ctx: CanvasRenderingContext2D, 
    mode: 'nutrients' | 'moisture' | 'pH' | 'temperature' | 'bacteria' = 'nutrients'
  ): void {
    const cols = this.carbonGrid.length;
    const rows = this.carbonGrid[0].length;
    const cellWidth = this.width / cols;
    const cellHeight = this.height / rows;
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let r = 0, g = 0, b = 0, a = 0.3;
        
        switch(mode) {
          case 'nutrients':
            // Carbon (green) and nitrogen (blue) blend
            g = Math.min(255, Math.floor((this.carbonGrid[x][y] / config.BASE_NUTRIENT) * 255));
            b = Math.min(255, Math.floor((this.nitrogenGrid[x][y] / 
              (config.BASE_NUTRIENT / config.CARBON_NITROGEN_RATIO)) * 255));
            a = Math.min(0.5, (this.carbonGrid[x][y] + this.nitrogenGrid[x][y]) / 
              (config.BASE_NUTRIENT * 2));
            break;
            
          case 'moisture':
            // Blue for moisture
            b = Math.min(255, Math.floor(this.moistureGrid[x][y] * 255));
            a = this.moistureGrid[x][y] * 0.5;
            break;
            
          case 'pH':
            // Red (acidic) to green (neutral) to blue (alkaline)
            if (this.pHGrid[x][y] < 7) {
              // Acidic (red to yellow)
              r = 255;
              g = Math.min(255, Math.floor((this.pHGrid[x][y] / 7) * 255));
            } else {
              // Alkaline (green to blue)
              g = Math.min(255, Math.floor((14 - this.pHGrid[x][y]) / 7 * 255));
              b = Math.min(255, Math.floor((this.pHGrid[x][y] - 7) / 7 * 255));
            }
            a = 0.4;
            break;
            
          case 'temperature':
            // Blue (cold) to red (hot)
            const tempRange = config.TEMPERATURE_RANGE[1] - config.TEMPERATURE_RANGE[0];
            const normalizedTemp = (this.temperatureGrid[x][y] - config.TEMPERATURE_RANGE[0]) / 
              tempRange;
            
            r = Math.min(255, Math.floor(normalizedTemp * 255));
            b = Math.min(255, Math.floor((1 - normalizedTemp) * 255));
            a = 0.4;
            break;
            
          case 'bacteria':
            // Purple for bacteria
            r = Math.min(255, Math.floor(this.bacteriaGrid[x][y] * 200));
            b = Math.min(255, Math.floor(this.bacteriaGrid[x][y] * 255));
            a = this.bacteriaGrid[x][y] * 0.6;
            break;
        }
        
        if (a > 0.05) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fillRect(
            x * cellWidth,
            y * cellHeight,
            cellWidth,
            cellHeight
          );
        }
        
        // Render enzymes as slightly yellow overlay
        if (this.enzymeGrid[x][y] > 0.1) {
          const enzymeIntensity = Math.min(0.5, this.enzymeGrid[x][y] * 0.2);
          ctx.fillStyle = `rgba(255, 255, 200, ${enzymeIntensity})`;
          ctx.fillRect(
            x * cellWidth,
            y * cellHeight,
            cellWidth,
            cellHeight
          );
        }
      }
    }
  }
}