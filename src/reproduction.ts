// src/reproduction.ts

import { config } from "./constants.js";
import { Substrate } from "./substrate.js";

export interface Spore {
  x: number;
  y: number;
  age: number;
  germinationProbability: number;
  mature: boolean;
  released: boolean;
  germinationDelay: number;
  resourceReserve: number;
}

export interface ReproductiveStructure {
  x: number;
  y: number;
  type: 'fruiting body' | 'conidiophore' | 'sporangium' | 'ascocarp';
  maturity: number;
  resourceDrain: number;
  sporeCapacity: number;
  spores: Spore[];
  color: string;
  size: number;
  age: number;
}

/**
 * Manages the formation and behavior of reproductive structures and spores.
 */
export class ReproductionManager {
  private reproductiveStructures: ReproductiveStructure[] = [];
  private releasedSpores: Spore[] = [];
  private substrate: Substrate;
  private centerX: number;
  private centerY: number;
  private width: number;
  private height: number;
  private sporeCounter = 0;
  
  /**
   * Creates a new ReproductionManager
   * @param substrate The substrate environment
   * @param centerX Center X coordinate of the growing area
   * @param centerY Center Y coordinate of the growing area
   * @param width Width of the growing area
   * @param height Height of the growing area
   */
  constructor(
    substrate: Substrate,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) {
    this.substrate = substrate;
    this.centerX = centerX;
    this.centerY = centerY;
    this.width = width;
    this.height = height;
  }
  
  /**
   * Initiates the formation of a reproductive structure when conditions are suitable.
   * @param x X-coordinate for the structure
   * @param y Y-coordinate for the structure
   * @param resourceAvailable Available resource to allocate
   * @param age Age of the hypha forming the structure
   * @returns The amount of resource consumed to form the structure
   */
  public initiateReproductiveStructure(
    x: number,
    y: number,
    resourceAvailable: number,
    age: number
  ): number {
    // Check if resources are sufficient
    if (resourceAvailable < config.SPORE_FORMATION_THRESHOLD) {
      return 0;
    }
    
    // Get environmental factors at this location
    const env = this.substrate.getEnvironmentalFactors(x, y);
    
    // Check if conditions are suitable for reproduction
    if (env.moisture < 0.4 || env.temperature < config.TEMPERATURE_RANGE[0] + 5) {
      return 0;
    }
    
    // Determine the type of reproductive structure based on environmental conditions
    let type: 'fruiting body' | 'conidiophore' | 'sporangium' | 'ascocarp';
    let resourceDrain: number;
    let sporeCapacity: number;
    let color: string;
    let size: number;
    
    // High moisture favors sporangia, dry conditions favor conidiophores
    if (env.moisture > 0.7) {
      type = 'sporangium';
      resourceDrain = resourceAvailable * 0.3;
      sporeCapacity = Math.floor(Math.random() * 15) + 20; // 20-35 spores
      color = 'rgba(50, 50, 50, 0.8)';
      size = 4 + Math.random() * 2;
    } else if (env.moisture < 0.5) {
      type = 'conidiophore';
      resourceDrain = resourceAvailable * 0.2;
      sporeCapacity = Math.floor(Math.random() * 10) + 5; // 5-15 spores
      color = 'rgba(210, 210, 180, 0.7)';
      size = 3 + Math.random() * 2;
    } else if (age > 500 && resourceAvailable > config.SPORE_FORMATION_THRESHOLD * 2) {
      // Mature colonies with high resources can form complex fruiting bodies
      type = 'fruiting body';
      resourceDrain = resourceAvailable * 0.5;
      sporeCapacity = Math.floor(Math.random() * 50) + 50; // 50-100 spores
      color = 'rgba(240, 230, 180, 0.9)';
      size = 8 + Math.random() * 4;
    } else {
      type = 'ascocarp';
      resourceDrain = resourceAvailable * 0.25;
      sporeCapacity = Math.floor(Math.random() * 20) + 10; // 10-30 spores
      color = 'rgba(180, 160, 140, 0.8)';
      size = 5 + Math.random() * 2;
    }
    
    // Create the reproductive structure
    const newStructure: ReproductiveStructure = {
      x,
      y,
      type,
      maturity: 0,
      resourceDrain,
      sporeCapacity,
      spores: [],
      color,
      size,
      age: 0
    };
    
    this.reproductiveStructures.push(newStructure);
    return resourceDrain;
  }
  
  /**
   * Updates all reproductive structures and spores.
   * @param simulationStep Current simulation step
   */
  public update(simulationStep: number): void {
    // Update reproductive structures
    for (let i = this.reproductiveStructures.length - 1; i >= 0; i--) {
      const structure = this.reproductiveStructures[i];
      
      // Increase age
      structure.age++;
      
      // Mature the structure gradually
      if (structure.maturity < 1) {
        structure.maturity += 0.02;
        
        // Once mature, create spores
        if (structure.maturity >= 1 && structure.spores.length < structure.sporeCapacity) {
          this.createSpores(structure);
        }
      }
      
      // Release spores when mature and environmental conditions are right
      if (structure.maturity >= 1) {
        const env = this.substrate.getEnvironmentalFactors(structure.x, structure.y);
        
        // Different structures release spores under different conditions
        let releaseCondition = false;
        
        switch (structure.type) {
          case 'fruiting body':
            // Fruiting bodies release spores gradually over time
            releaseCondition = simulationStep % 100 === 0;
            break;
          case 'conidiophore':
            // Conidiophores release spores in dry conditions or when disturbed
            releaseCondition = env.moisture < 0.4 || Math.random() < 0.01;
            break;
          case 'sporangium':
            // Sporangia burst in very moist conditions
            releaseCondition = env.moisture > 0.8 || structure.age > 300;
            break;
          case 'ascocarp':
            // Ascocarps release spores when fully mature
            releaseCondition = structure.age > 200 && Math.random() < 0.05;
            break;
        }
        
        if (releaseCondition) {
          this.releaseSpores(structure);
        }
      }
      
      // Remove old or emptied structures
      if ((structure.age > 500 && structure.spores.length === 0) || structure.age > 1000) {
        this.reproductiveStructures.splice(i, 1);
      }
    }
    
    // Update released spores
    for (let i = this.releasedSpores.length - 1; i >= 0; i--) {
      const spore = this.releasedSpores[i];
      
      // Age the spore
      spore.age++;
      
      // Spore movement - simulate air currents
      if (Math.random() < 0.3) {
        // Random movement simulating air currents
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 2;
        
        spore.x += Math.cos(angle) * distance;
        spore.y += Math.sin(angle) * distance;
        
        // Check if spore has landed outside the growing area
        const dist = Math.hypot(spore.x - this.centerX, spore.y - this.centerY);
        if (dist > Math.min(this.width, this.height) * 0.4) {
          // Remove spores that land too far away
          this.releasedSpores.splice(i, 1);
          continue;
        }
      }
      
      // Check for germination
      if (spore.age > spore.germinationDelay && !spore.mature) {
        const env = this.substrate.getEnvironmentalFactors(spore.x, spore.y);
        
        // Factors affecting germination
        const moistureFactor = env.moisture > 0.5 ? 1 : env.moisture * 2;
        const tempFactor = env.temperature >= config.TEMPERATURE_OPTIMUM - 5 && 
                         env.temperature <= config.TEMPERATURE_OPTIMUM + 5 ? 1 : 0.5;
        const nutrientFactor = (env.carbon + env.nitrogen) / (config.BASE_NUTRIENT * 1.2);
        
        // Calculate germination probability
        const germinationChance = spore.germinationProbability * 
                                 moistureFactor * 
                                 tempFactor * 
                                 nutrientFactor;
        
        if (Math.random() < germinationChance) {
          spore.mature = true;
          
          // Once mature, the spore is ready for germination
          // The GrowthManager should check for mature spores and initiate new hyphae
        }
      }
      
      // Remove old spores
      if (spore.age > 2000) {
        this.releasedSpores.splice(i, 1);
      }
    }
  }
  
  /**
   * Creates spores within a reproductive structure.
   * @param structure The reproductive structure
   */
  private createSpores(structure: ReproductiveStructure): void {
    // Create spores up to capacity
    const sporesToCreate = structure.sporeCapacity - structure.spores.length;
    for (let i = 0; i < sporesToCreate; i++) {
      // Each spore type has different characteristics
      let germinationProbability = 0;
      let germinationDelay = 0;
      let resourceReserve = 0;
      
      switch (structure.type) {
        case 'fruiting body':
          germinationProbability = 0.03 + Math.random() * 0.04; // 3-7%
          germinationDelay = 100 + Math.random() * 200;
          resourceReserve = 200 + Math.random() * 200;
          break;
        case 'conidiophore':
          germinationProbability = 0.05 + Math.random() * 0.1; // 5-15%
          germinationDelay = 50 + Math.random() * 100;
          resourceReserve = 100 + Math.random() * 100;
          break;
        case 'sporangium':
          germinationProbability = 0.02 + Math.random() * 0.03; // 2-5%
          germinationDelay = 150 + Math.random() * 250;
          resourceReserve = 300 + Math.random() * 200;
          break;
        case 'ascocarp':
          germinationProbability = 0.04 + Math.random() * 0.06; // 4-10%
          germinationDelay = 120 + Math.random() * 180;
          resourceReserve = 250 + Math.random() * 150;
          break;
      }
      
      const spore: Spore = {
        x: structure.x,
        y: structure.y,
        age: 0,
        germinationProbability,
        mature: false,
        released: false,
        germinationDelay,
        resourceReserve
      };
      
      structure.spores.push(spore);
      this.sporeCounter++;
    }
  }
  
  /**
   * Releases spores from a reproductive structure.
   * @param structure The reproductive structure
   */
  private releaseSpores(structure: ReproductiveStructure): void {
    // Release a batch of spores
    const sporeCountToRelease = Math.min(
      structure.spores.length,
      Math.floor(Math.random() * 5) + 1
    );
    
    for (let i = 0; i < sporeCountToRelease; i++) {
      if (structure.spores.length > 0) {
        // Get a spore and release it
        const spore = structure.spores.pop()!;
        spore.released = true;
        
        // Disperse the spore slightly from the structure
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 5 + 2;
        
        spore.x += Math.cos(angle) * distance;
        spore.y += Math.sin(angle) * distance;
        
        // Add to released spores
        this.releasedSpores.push(spore);
      }
    }
  }
  
  /**
   * Gets all mature spores ready for germination.
   * @returns Array of mature spores
   */
  public getMatureSpores(): Spore[] {
    return this.releasedSpores.filter(spore => spore.mature);
  }
  
  /**
   * Removes a spore after it has been used for germination.
   * @param spore The spore to remove
   */
  public removeSpore(spore: Spore): void {
    const index = this.releasedSpores.indexOf(spore);
    if (index !== -1) {
      this.releasedSpores.splice(index, 1);
    }
  }
  
  /**
   * Renders all reproductive structures and spores.
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Render reproductive structures
    for (const structure of this.reproductiveStructures) {
      // Base size affected by maturity
      const displaySize = structure.size * Math.min(1, structure.maturity * 1.2);
      
      // Draw the structure
      ctx.beginPath();
      
      switch (structure.type) {
        case 'fruiting body':
          // Draw fruiting body as a mushroom-like shape
          ctx.fillStyle = structure.color;
          
          // Cap
          ctx.beginPath();
          ctx.ellipse(
            structure.x, 
            structure.y - displaySize / 2, 
            displaySize * 1.2, 
            displaySize * 0.7, 
            0, 0, Math.PI * 2
          );
          ctx.fill();
          
          // Stem
          ctx.fillStyle = 'rgba(255, 255, 240, 0.85)';
          ctx.beginPath();
          ctx.rect(
            structure.x - displaySize / 3,
            structure.y - displaySize / 2,
            displaySize * 2/3,
            displaySize
          );
          ctx.fill();
          break;
          
        case 'conidiophore':
          // Draw conidiophore as an upright stalk with spores at the top
          ctx.fillStyle = 'rgba(220, 220, 200, 0.7)';
          ctx.beginPath();
          ctx.rect(
            structure.x - displaySize / 5,
            structure.y - displaySize,
            displaySize * 2/5,
            displaySize
          );
          ctx.fill();
          
          // Conidia at top
          ctx.fillStyle = structure.color;
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI;
            const dx = Math.cos(angle) * displaySize / 2;
            const dy = -Math.sin(angle) * displaySize / 2 - displaySize;
            
            ctx.beginPath();
            ctx.arc(
              structure.x + dx,
              structure.y + dy,
              displaySize / 4,
              0, Math.PI * 2
            );
            ctx.fill();
          }
          break;
          
        case 'sporangium':
          // Draw sporangium as a spherical sac at the end of a stalk
          ctx.fillStyle = 'rgba(200, 200, 180, 0.7)';
          ctx.beginPath();
          ctx.rect(
            structure.x - displaySize / 6,
            structure.y - displaySize / 2,
            displaySize * 1/3,
            displaySize / 2
          );
          ctx.fill();
          
          // Sporangium head
          ctx.fillStyle = structure.color;
          ctx.beginPath();
          ctx.arc(
            structure.x,
            structure.y - displaySize / 2,
            displaySize / 2,
            0, Math.PI * 2
          );
          ctx.fill();
          break;
          
        case 'ascocarp':
          // Draw ascocarp as a cup-shaped structure
          ctx.fillStyle = structure.color;
          ctx.beginPath();
          ctx.arc(
            structure.x,
            structure.y,
            displaySize / 2,
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Cup depression
          ctx.fillStyle = 'rgba(180, 160, 120, 0.9)';
          ctx.beginPath();
          ctx.arc(
            structure.x,
            structure.y,
            displaySize / 3,
            0, Math.PI * 2
          );
          ctx.fill();
          break;
      }
    }
    
    // Render released spores
    for (const spore of this.releasedSpores) {
      const sporeSize = spore.mature ? 1.5 : 0.8;
      
      ctx.fillStyle = spore.mature ? 
        'rgba(220, 220, 180, 0.9)' : 
        'rgba(200, 200, 180, 0.6)';
      
      ctx.beginPath();
      ctx.arc(spore.x, spore.y, sporeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}