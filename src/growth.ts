// src/growth.ts

import { Perlin } from "./Perlin.js";
import { config } from "./constants.js"; // Import the config object

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";

export type GrowthType = "main" | "secondary" | "aerial" | "rhizomorph" | "reproductive";

export interface HyphaTip {
  x: number;
  y: number;
  angle: number;
  life: number;
  depth: number;
  growthType: GrowthType;
  resource: number; // Tracks the resource available to the tip
  age: number; // Age of the tip in simulation steps
  maturity: number; // 0-1 value representing maturity level
  enzymeActivity: number; // Amount of enzyme this tip is secreting
  carbonNutrient: number; // Carbon resources (sugars, cellulose)
  nitrogenNutrient: number; // Nitrogen resources (proteins, amino acids)
  temperatureSensitivity: number; // 0-1 sensitivity to temperature
  phSensitivity: number; // 0-1 sensitivity to pH
  basalRespirationRate: number; // Base rate of resource consumption for maintenance
  lastBranchingTime: number; // Simulation step when this tip last branched
  specialization: number; // 0-1 value indicating specialization level (higher = more specialized)
  apicalDominanceStrength: number; // How strongly this tip suppresses nearby branching
}

/**
 * GrowthManager class handles the simulation of hyphal growth.
 */
export class GrowthManager {
  private tips: HyphaTip[] = [];
  private growthRadius: number;

  /**
   * Constructor initializes the GrowthManager.
   * @param ctx - The 2D rendering context of the main canvas.
   * @param width - Width of the canvas.
   * @param height - Height of the canvas.
   * @param centerX - X-coordinate of the center.
   * @param centerY - Y-coordinate of the center.
   * @param perlin - Instance of Perlin noise generator.
   * @param envGPU - Instance of EnvironmentGPU for resource management.
   * @param network - Instance of MycelialNetwork for resource flow management.
   */
  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private centerX: number,
    private centerY: number,
    private perlin: Perlin,
    private envGPU: EnvironmentGPU,
    private network: MycelialNetwork, // Injecting the network for resource flow
  ) {
    this.growthRadius = Math.min(width, height) * config.GROWTH_RADIUS_FACTOR;
    console.log(
      `GrowthManager initialized with growthRadius: ${this.growthRadius}`,
    );
  }

  /**
   * Initializes the growth simulation by creating main trunks.
   */
  public init() {
    this.tips = [];
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
    this.ctx.clearRect(0, 0, this.width, this.height); // Clear the canvas
    this.simulationTime = 0; // Reset simulation time

    // Give the network a reference to the environment for path usage tracking
    if ('setEnvironment' in this.network) {
      this.network.setEnvironment(this.envGPU);
    }

    // Create main trunks from the center
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      // Calculate a more uniform distribution of angles
      const angle = (i / config.MAIN_BRANCH_COUNT) * Math.PI * 2;
      // Add a small random variation to each angle
      const angleVariation = (Math.random() - 0.5) * (Math.PI / config.MAIN_BRANCH_COUNT);
      
      // Create a more biologically realistic hyphal tip
      const newTip: HyphaTip = {
        x: this.centerX,
        y: this.centerY,
        angle: angle + angleVariation,
        life: config.BASE_LIFE,
        depth: 0,
        growthType: "main",
        resource: config.INITIAL_RESOURCE_PER_TIP,
        // Initialize new biological properties with default values if not available in config
        age: 0,
        maturity: 0,
        enzymeActivity: 0.5 + Math.random() * 0.5, // Initial enzyme activity varies
        carbonNutrient: config.INITIAL_RESOURCE_PER_TIP * 0.7, // 70% carbon
        nitrogenNutrient: config.INITIAL_RESOURCE_PER_TIP * 0.3, // 30% nitrogen
        temperatureSensitivity: Math.random() * 0.3 + 0.3, // Random sensitivity
        phSensitivity: Math.random() * 0.3 + 0.3, // Random sensitivity
        basalRespirationRate: (config.HYPHAL_RESPIRATION_RATE || 0.02) * (0.8 + Math.random() * 0.4), // Default if not set
        lastBranchingTime: 0,
        specialization: 0, // Starts unspecialized
        apicalDominanceStrength: i < config.MAIN_BRANCH_COUNT / 3 ? 0.8 : 0.3 // Main branches have stronger apical dominance
      };
      
      this.tips.push(newTip);
    }

    // Create network nodes for each main branch
    this.tips.forEach((tip) => {
      const nodeId = this.network.createNode(tip.x, tip.y, tip.resource);
    });
    
    // Create heterogeneous substrate environment
    if (this.envGPU.createHeterogeneousEnvironment) {
      // If the advanced substrate model is available, use it
      this.envGPU.createHeterogeneousEnvironment();
    } else {
      // Otherwise use simple nutrient pockets
      for (let i = 0; i < 50; i++) {
        // Create pockets in a ring around the center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.growthRadius * 0.85; // Within 85% of growth radius
        
        const pocketX = this.centerX + Math.cos(angle) * distance;
        const pocketY = this.centerY + Math.sin(angle) * distance;
        
        // Add high-nutrient pocket
        this.envGPU.addNutrient(
          pocketX, 
          pocketY, 
          config.NUTRIENT_POCKET_AMOUNT * (1 + Math.random())
        );
      }
    }
    
    // Initialize enzyme distribution in substrate
    if (this.tips.length > 0) {
      // Secrete initial enzymes around the starting point
      if (this.envGPU.secreteEnzyme) {
        this.envGPU.secreteEnzyme(
          this.centerX,
          this.centerY,
          5.0 // Initial enzyme secretion
        );
      }
    }
    
    // Initialize reproduction manager if available
    if (this.reproductionManager && this.reproductionManager.init) {
      this.reproductionManager.init();
    }
    
    // Ensure the environment is diffused before beginning
    if (this.envGPU.diffuseSubstrate) {
      // Use advanced diffusion if available
      this.envGPU.diffuseSubstrate();
    } else if (this.envGPU.diffuseNutrients) {
      // Fall back to simple diffusion
      this.envGPU.diffuseNutrients();
    }
  }

  // Track simulation time
  private simulationTime: number = 0;
  private substrate: any = null; // Advanced substrate model
  private reproductionManager: any = null; // Reproduction manager

  /**
   * Sets an advanced substrate model
   * @param substrate The substrate model to use
   */
  public setSubstrate(substrate: any): void {
    this.substrate = substrate;
  }

  /**
   * Sets a reproduction manager
   * @param reproManager The reproduction manager to use
   */
  public setReproductionManager(reproManager: any): void {
    this.reproductionManager = reproManager;
  }

  /**
   * Updates the simulation and renders the growth lines.
   * @param currentTime - The current timestamp in milliseconds.
   */
  public updateAndDraw(currentTime: number = 0) {
    // Increment simulation time
    this.simulationTime++;
    
    // Apply a mild fade to create a trailing effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${config.BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw growth circle boundary for debugging
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.growthRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(255, 100, 100, 0.2)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Update environmental cycles if using advanced substrate
    if (this.substrate) {
      // Update substrate processes
      this.substrate.updateEnvironmentalCycles();
      
      // Update enzyme activity and diffusion
      this.substrate.updateEnzymeActivity();
      
      // Diffuse substrate components
      this.substrate.diffuseSubstrate();
      
      // Render substrate (optional - for visualization)
      if (config.BACKGROUND_ALPHA > 0) {
        this.substrate.renderSubstrate(this.ctx, 'nutrients');
      }
    } else {
      // Use simpler environment model
      // Periodically diffuse nutrients in the environment (every 5 frames)
      if (this.simulationTime % 5 === 0) {
        this.envGPU.diffuseNutrients();
      }
      
      // Periodically add new nutrient pockets (every 200 frames)
      if (this.simulationTime % 200 === 0) {
        // Add a random nutrient pocket somewhere in the growth radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.growthRadius * 0.9;
        
        const pocketX = this.centerX + Math.cos(angle) * distance;
        const pocketY = this.centerY + Math.sin(angle) * distance;
        
        this.envGPU.addNutrient(
          pocketX, 
          pocketY, 
          config.NUTRIENT_POCKET_AMOUNT * 0.5 * (1 + Math.random())
        );
      }
    }

    // Update reproduction processes if using reproduction manager
    if (this.reproductionManager) {
      this.reproductionManager.update(this.simulationTime);
      
      // Check for mature spores to germinate
      if (this.simulationTime % 100 === 0) {
        const matureSpores = this.reproductionManager.getMatureSpores();
        
        // Germinate mature spores as new hyphal tips
        for (const spore of matureSpores) {
          this.germinateSpore(spore);
          this.reproductionManager.removeSpore(spore);
        }
      }
      
      // Render reproductive structures
      this.reproductionManager.render(this.ctx);
    }

    // Perform multiple simulation steps per frame based on TIME_LAPSE_FACTOR
    const totalSteps = config.TIME_LAPSE_FACTOR;
    for (let i = 0; i < totalSteps; i++) {
      this.simOneStep();
    }

    // Handle resource flow within the network
    this.network.flowResources();
  }
  
  /**
   * Germinates a spore into a new hyphal tip
   * @param spore The spore to germinate
   */
  private germinateSpore(spore: any): void {
    // Create a new hyphal tip from the spore
    const newTip: HyphaTip = {
      x: spore.x,
      y: spore.y,
      angle: Math.random() * Math.PI * 2, // Random initial direction
      life: config.BASE_LIFE * 0.7, // Slightly reduced life compared to main tips
      depth: 0, // New primary hypha
      growthType: "main", // New colony starts as main type
      resource: spore.resourceReserve, // Use the spore's resource reserve
      age: 0,
      maturity: 0,
      enzymeActivity: 0.3 + Math.random() * 0.7, // Variable enzyme activity
      carbonNutrient: spore.resourceReserve * 0.7,
      nitrogenNutrient: spore.resourceReserve * 0.3,
      temperatureSensitivity: Math.random() * 0.3 + 0.3,
      phSensitivity: Math.random() * 0.3 + 0.3,
      basalRespirationRate: config.HYPHAL_RESPIRATION_RATE * (0.8 + Math.random() * 0.4),
      lastBranchingTime: 0,
      specialization: 0,
      apicalDominanceStrength: 0.6 + Math.random() * 0.3 // Strong apical dominance for new colony
    };
    
    // Add the new tip to the simulation
    this.tips.push(newTip);
    
    // Create a network node for the new colony
    const nodeId = this.network.createNode(newTip.x, newTip.y, newTip.resource);
    
    // Secrete initial enzymes at germination site
    if (this.substrate && this.substrate.secreteEnzyme) {
      this.substrate.secreteEnzyme(newTip.x, newTip.y, 2.0);
    }
  }

  /**
   * Simulates a single step of hyphal growth.
   */
  private simOneStep() {
    const newTips: HyphaTip[] = [];
    const activeNodeIds: Map<HyphaTip, number> = new Map(); // Track active node IDs for each tip

    // Debug tip count
    if (this.simulationTime % 100 === 0) {
      console.log(`Active tips: ${this.tips.length}, Simulation time: ${this.simulationTime}`);
    }

    for (const tip of this.tips) {
      // Skip dead tips
      if (tip.life <= 0) continue;
      
      // Increment age
      tip.age++;
      
      // Handle different types of substrate models
      const environmentalFactors = this.getEnvironmentalFactors(tip.x, tip.y);
      
      // BASAL METABOLISM - Consume resources for maintenance
      // Real fungi have a maintenance cost even when not growing
      // Use much lower respiration rate for now to prevent tips from dying too quickly
      const baseRespirationRate = tip.basalRespirationRate * 0.1; // Reduced by 90% for better simulation
      tip.carbonNutrient -= baseRespirationRate * (environmentalFactors.temperatureFactor || 1);
      tip.nitrogenNutrient -= baseRespirationRate * 0.1 * (environmentalFactors.temperatureFactor || 1);
      
      // Apply daily and seasonal cycles if supported and enabled
      if (environmentalFactors.circadianFactor && 
          environmentalFactors.seasonalFactor && 
          config.CIRCADIAN_RHYTHM_AMPLITUDE > 0) {
        // Adjust resource consumption by circadian rhythm
        const circadianInfluence = environmentalFactors.circadianFactor;
        
        // Adjust growth by seasonal patterns
        const seasonalInfluence = environmentalFactors.seasonalFactor;
        
        // Combined factor affects resource consumption
        const cycleFactor = circadianInfluence * seasonalInfluence;
        
        // Additional consumption during active periods (very slight effect)
        if (cycleFactor > 1.0) {
          tip.carbonNutrient -= baseRespirationRate * 0.1 * (cycleFactor - 1.0);
        }
      }
      
      // Update total resource
      tip.resource = tip.carbonNutrient + tip.nitrogenNutrient;
      
      // If resources are depleted, the tip dies
      if (tip.resource <= 0 || tip.carbonNutrient <= 0 || tip.nitrogenNutrient <= 0) {
        tip.life = 0;
        continue;
      }
      
      // ENZYME SECRETION - Secrete enzymes to break down substrate
      if (tip.enzymeActivity > 0 && this.substrate && this.substrate.secreteEnzyme) {
        // Reduce enzyme activity to prevent resource drain
        const adjustedEnzymeActivity = tip.enzymeActivity * 0.2 * 
          (tip.resource / config.INITIAL_RESOURCE_PER_TIP) * 
          (environmentalFactors.moistureFactor || 0.5);
        
        this.substrate.secreteEnzyme(tip.x, tip.y, adjustedEnzymeActivity);
        
        // Enzyme production consumes minimal resources
        tip.carbonNutrient -= adjustedEnzymeActivity * 0.01;
        tip.nitrogenNutrient -= adjustedEnzymeActivity * 0.005;
      }
      
      // NUTRIENT ACQUISITION - Consume nutrients from environment
      if (this.substrate && this.substrate.consumeNutrients) {
        // Advanced substrate model
        const [consumedCarbon, consumedNitrogen] = this.substrate.consumeNutrients(
          tip.x,
          tip.y,
          config.NUTRIENT_CONSUMPTION_RATE * (tip.enzymeActivity * 0.5 + 0.5),
          config.NUTRIENT_CONSUMPTION_RATE / config.CARBON_NITROGEN_RATIO * 
            (tip.enzymeActivity * 0.5 + 0.5)
        );
        
        // Add consumed nutrients to tip's reserves
        tip.carbonNutrient += consumedCarbon;
        tip.nitrogenNutrient += consumedNitrogen;
        tip.resource = tip.carbonNutrient + tip.nitrogenNutrient;
      } else {
        // Simple environment model
        const consumed = this.envGPU.consumeResource(
          tip.x,
          tip.y,
          config.NUTRIENT_CONSUMPTION_RATE
        );
        
        // Distribute consumed nutrients (70% carbon, 30% nitrogen)
        tip.carbonNutrient += consumed * 0.7;
        tip.nitrogenNutrient += consumed * 0.3;
        tip.resource = tip.carbonNutrient + tip.nitrogenNutrient;
      }
      
      // Store previous position
      const oldX = tip.x;
      const oldY = tip.y;
      
      // GROWTH DIRECTION DETERMINATION - Combine multiple influences
      // 1. Get nutrient gradient direction (Chemotropism)
      let gradientX = 0, gradientY = 0;
      if (this.substrate && this.substrate.getNutrientGradient) {
        [gradientX, gradientY] = this.substrate.getNutrientGradient(tip.x, tip.y);
      } else if (this.envGPU.getNutrientGradient) {
        [gradientX, gradientY] = this.envGPU.getNutrientGradient(tip.x, tip.y);
      }
      
      // 2. Get avoidance direction (Negative Autotropism)
      let avoidX = 0, avoidY = 0;
      if (this.substrate && this.substrate.getAvoidanceFactor) {
        [avoidX, avoidY] = this.substrate.getAvoidanceFactor(
          tip.x, tip.y, this.tips
        );
      } else if (this.envGPU.getAvoidanceFactor) {
        [avoidX, avoidY] = this.envGPU.getAvoidanceFactor(
          tip.x, tip.y, config.ANASTOMOSIS_RADIUS * 2
        );
      }
      
      // 3. Apply Perlin noise for natural meandering
      const nVal = this.perlin.noise2D(
        tip.x * config.PERLIN_SCALE,
        tip.y * config.PERLIN_SCALE
      );
      const perlinAdjustment = nVal * config.ANGLE_DRIFT_STRENGTH;
      
      // 4. Apply random wiggle
      const nVal2 = this.perlin.noise2D(
        (tip.x + 1234) * config.PERLIN_SCALE,
        (tip.y + 1234) * config.PERLIN_SCALE
      );
      const wiggle = nVal2 * config.WIGGLE_STRENGTH;
      
      // 5. Apply geotropism (growth against gravity)
      let geotropicAngle = tip.angle;
      if (this.substrate && this.substrate.applyGeotropism) {
        geotropicAngle = this.substrate.applyGeotropism(tip.x, tip.y, tip.angle);
      } else if (config.GEOTROPISM_STRENGTH > 0) {
        // Simple geotropism implementation if no substrate model
        const upAngle = -Math.PI / 2; // Negative Y is up
        const angleDiff = this.normalizeAngle(upAngle - tip.angle);
        geotropicAngle = tip.angle + angleDiff * config.GEOTROPISM_STRENGTH;
      }
      
      // 6. COMBINE DIRECTIONAL INFLUENCES
      // Start with current direction
      let dirX = Math.cos(tip.angle);
      let dirY = Math.sin(tip.angle);
      
      // Apply chemotropism - stronger in low-nutrient conditions
      const nutrientLevel = environmentalFactors.nutrientFactor || 0.5;
      const inverseNutrientFactor = 1 - Math.min(0.8, nutrientLevel);
      dirX += gradientX * config.CHEMOTROPISM_STRENGTH * (1 + inverseNutrientFactor);
      dirY += gradientY * config.CHEMOTROPISM_STRENGTH * (1 + inverseNutrientFactor);
      
      // Apply negative autotropism - avoid other hyphae
      dirX += avoidX * config.NEGATIVE_AUTOTROPISM_STRENGTH;
      dirY += avoidY * config.NEGATIVE_AUTOTROPISM_STRENGTH;
      
      // Apply Perlin noise influence
      dirX += Math.cos(geotropicAngle + perlinAdjustment) * 0.5;
      dirY += Math.sin(geotropicAngle + perlinAdjustment) * 0.5;
      
      // Apply wiggle
      dirX += Math.cos(tip.angle + Math.PI/2) * wiggle * 0.2;
      dirY += Math.sin(tip.angle + Math.PI/2) * wiggle * 0.2;
      
      // Normalize the direction vector
      const dirMagnitude = Math.sqrt(dirX * dirX + dirY * dirY);
      if (dirMagnitude > 0) {
        dirX /= dirMagnitude;
        dirY /= dirMagnitude;
      }
      
      // Update the tip's angle based on the new direction
      tip.angle = Math.atan2(dirY, dirX);
      
      // 7. GROWTH RATE DETERMINATION - Influenced by many factors
      
      // Carbon/Nitrogen balance factor (too much or too little of either is bad)
      const cnRatio = tip.carbonNutrient / Math.max(0.001, tip.nitrogenNutrient);
      const optimalCNRatio = config.CARBON_NITROGEN_RATIO;
      const cnBalanceFactor = Math.max(0.5, 1 - Math.abs(cnRatio - optimalCNRatio) / optimalCNRatio);
      
      // Resource factor
      const resourceFactor = Math.min(1, tip.resource / config.INITIAL_RESOURCE_PER_TIP);
      
      // Environmental factors
      const tempFactor = environmentalFactors.temperatureFactor || 1;
      const moistureFactor = environmentalFactors.moistureFactor || 1;
      const pHFactor = environmentalFactors.pHFactor || 1;
      
      // Growth type specific factors
      let growthTypeFactor = 1.0;
      switch (tip.growthType) {
        case "main":
          growthTypeFactor = 1.0;
          break;
        case "secondary":
          growthTypeFactor = 0.85;
          break;
        case "rhizomorph":
          growthTypeFactor = 1.2; // Faster-growing transport structure
          break;
        case "aerial":
          growthTypeFactor = 0.7; // Slower growth for aerial hyphae
          break;
        case "reproductive":
          growthTypeFactor = 0.5; // Slow growth for reproductive structures
          break;
      }
      
      // Age factor - growth slows with age
      const ageFactor = Math.max(0.7, 1 - (tip.age / 1000) * 0.3);
      
      // Substrate resistance
      const resistanceFactor = Math.max(0.5, 1 - (environmentalFactors.hardnessFactor || 0));
      
      // Calculate final step size
      const growthMultiplier = resourceFactor * cnBalanceFactor * tempFactor * 
                            moistureFactor * pHFactor * growthTypeFactor * 
                            ageFactor * resistanceFactor;
      
      const actualStepSize = config.STEP_SIZE * growthMultiplier;
      
      // 8. MOVE THE TIP
      tip.x += dirX * actualStepSize * config.GROWTH_SPEED_MULTIPLIER;
      tip.y += dirY * actualStepSize * config.GROWTH_SPEED_MULTIPLIER;
      
      // Draw the growth segment from old to new position
      this.drawSegment(
        oldX, oldY,
        tip.x, tip.y,
        tip.growthType,
        tip.depth,
        tip.maturity,
        environmentalFactors.temperatureFactor,
        environmentalFactors.pHFactor,
        environmentalFactors.nutrientFactor,
        environmentalFactors.moistureFactor
      );
      
      // Draw tip for debugging
      this.drawHyphaTip(tip);

      // Check if tip has gone outside the growth radius
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // Decrement life - faster in hostile conditions
      const lifeDecrement = 1 / (environmentalFactors.tempFactor * 
                              environmentalFactors.moistureFactor * 
                              environmentalFactors.pHFactor);
      tip.life -= lifeDecrement;
      
      // 9. HYPHAL MATURATION PROCESS
      // Increase maturity based on age
      if (tip.maturity < 1.0) {
        tip.maturity += config.HYPHAL_MATURATION_RATE;
      }
      
      // 10. SPECIALIZATION - Tips may specialize based on environmental conditions
      if (tip.specialization < 0.8) {
        // Determine if this tip should specialize
        if (tip.age > 100 && Math.random() < 0.01) {
          // Environmental factors influence specialization type
          const moistureLevel = environmentalFactors.moistureFactor || 0.5;
          const nutrientAbundance = environmentalFactors.nutrientFactor || 0.5;
          
          // Specialized structures only form under certain conditions
          if (tip.resource > config.INITIAL_RESOURCE_PER_TIP * 1.5) {
            // Determine potential specialization
            if (nutrientAbundance < 0.3 && moistureLevel > 0.7) {
              // Low nutrients but high moisture - form reproductive structure
              if (Math.random() < 0.3 && this.reproductionManager) {
                // Initiate reproductive structure formation
                const resourceSpent = this.reproductionManager.initiateReproductiveStructure(
                  tip.x, tip.y, tip.resource, tip.age
                );
                tip.resource -= resourceSpent;
                tip.carbonNutrient -= resourceSpent * 0.7;
                tip.nitrogenNutrient -= resourceSpent * 0.3;
                
                // Specialized tip becomes reproductive
                tip.growthType = "reproductive";
                tip.specialization = 0.9;
              }
            } else if (nutrientAbundance < 0.2 && tip.depth < 2) {
              // Low nutrients and a main branch - form aerial hypha
              tip.growthType = "aerial";
              tip.specialization = 0.8;
              // Aerial hyphae are less influenced by chemotropism, more by geotropism
              tip.enzymeActivity *= 0.5; // Reduced enzyme activity
            } else if (nutrientAbundance > 0.7 && tip.resource > config.INITIAL_RESOURCE_PER_TIP * 2) {
              // High nutrients with significant resources - form rhizomorph
              tip.growthType = "rhizomorph";
              tip.specialization = 0.8;
              // Rhizomorphs have higher resource transport capacity
              tip.enzymeActivity *= 1.5; // Increased enzyme activity
            }
          }
        }
      }
      
      // 11. CREATE OR UPDATE NETWORK NODE FOR THIS TIP
      let currentNodeId: number;
      let previousNodeId: number | undefined;
      
      // Check if we already have a node for this tip from last frame
      if (activeNodeIds.has(tip)) {
        previousNodeId = activeNodeIds.get(tip);
        
        // Create a new node at the new position
        currentNodeId = this.network.createNode(tip.x, tip.y, tip.resource);
        
        // Connect it to the previous node
        if (previousNodeId !== undefined) {
          this.network.connectNodes(previousNodeId, currentNodeId);
        }
      } else {
        // If this is a first step for this tip, just create a node
        currentNodeId = this.network.createNode(tip.x, tip.y, tip.resource);
      }
      
      // Update the mapping
      activeNodeIds.set(tip, currentNodeId);
      
      // 12. RENDER THE SEGMENT - Different visualization based on type and maturity
      let lineThickness = this.getLineThicknessForTip(tip);
      
      if (previousNodeId !== undefined && this.network.getEdgeMaturity) {
        // Get the maturity of this hyphal segment
        const edgeMaturity = this.network.getEdgeMaturity(previousNodeId, currentNodeId);
        
        // Thicken line based on maturity
        if (edgeMaturity > 0) {
          lineThickness *= (1 + edgeMaturity * 0.8);
        }
      }
      
      // Draw the segment
      this.drawSegment(
        oldX, 
        oldY, 
        tip.x, 
        tip.y, 
        tip.growthType, 
        tip.depth, 
        lineThickness,
        tip.maturity
      );

      // 13. BRANCHING PROCESS - Complex biological branching
      // Skip if this tip has recently branched (to prevent branch clustering)
      if (this.simulationTime - tip.lastBranchingTime < 10) {
        continue;
      }
      
      // Check for apical dominance from nearby tips
      let apicalSuppressionFactor = 0;
      if (this.substrate && this.substrate.getApicalDominanceFactor) {
        apicalSuppressionFactor = this.substrate.getApicalDominanceFactor(
          tip.x, tip.y, this.tips
        );
      }
      
      // Calculate branching probability
      const nutrientRichness = environmentalFactors.nutrientFactor || 
        (tip.resource / config.INITIAL_RESOURCE_PER_TIP);
      
      // Branching is affected by many factors
      const baseBranchChance = config.BRANCH_CHANCE * (tip.age > 10 ? 1 : 0.2);
      
      // Calculate adjusted branch chance
      let adjustedBranchChance = baseBranchChance * 
        (resourceFactor * 0.7 + 0.3) *               // Resources (70% influence)
        (nutrientRichness * 0.5 + 0.5) *             // Local nutrients (50% influence)
        Math.min(1, moistureFactor * 1.2) *          // Moisture (can boost by 20%)
        (1 - tip.specialization * 0.5) *             // Specialization reduces branching
        (1 - apicalSuppressionFactor);               // Apical dominance suppresses branching
        
      // Age affects branching - young tips rarely branch, old tips branch less
      if (tip.age < 20) {
        adjustedBranchChance *= 0.2;
      } else if (tip.age > 200) {
        adjustedBranchChance *= 0.7;
      }
      
      // Different growth types have different branching behavior
      switch (tip.growthType) {
        case "main":
          // Main hyphae branch normally
          break;
        case "secondary":
          // Secondary hyphae branch less frequently
          adjustedBranchChance *= 0.7;
          break;
        case "rhizomorph":
          // Rhizomorphs branch very rarely
          adjustedBranchChance *= 0.3;
          break;
        case "aerial":
          // Aerial hyphae branch frequently to form conidiophores
          adjustedBranchChance *= 1.3;
          break;
        case "reproductive":
          // Reproductive structures rarely branch
          adjustedBranchChance *= 0.1;
          break;
      }
      
      // Check if branching occurs
      if (
        tip.depth < config.MAX_BRANCH_DEPTH &&
        Math.random() < adjustedBranchChance
      ) {
        // Record branching time
        tip.lastBranchingTime = this.simulationTime;
        
        // Number of branches varies with environmental conditions
        const branchCount = Math.max(1, Math.ceil(
          config.SECONDARY_FAN_COUNT * nutrientRichness
        ));
        
        // Branching consumes resources
        const branchResourceCost = tip.resource * 0.1 * branchCount;
        tip.resource -= branchResourceCost;
        tip.carbonNutrient -= branchResourceCost * 0.7;
        tip.nitrogenNutrient -= branchResourceCost * 0.3;
        
        // Create branches
        for (let i = 0; i < branchCount; i++) {
          // Calculate branch angle
          // Base angle offset with randomization
          const baseAngleOffset = (Math.random() - 0.5) * config.WIDER_SECONDARY_ANGLE;
          
          // Branch angles are influenced by nutrient gradients
          let angleOffset = baseAngleOffset;
          if (gradientX !== 0 || gradientY !== 0) {
            const gradientAngle = Math.atan2(gradientY, gradientX);
            const angleDiff = this.normalizeAngle(gradientAngle - tip.angle);
            // Pull the angle offset toward nutrient gradient
            angleOffset = baseAngleOffset + angleDiff * 0.2;
          }
          
          // Calculate new branch angle
          const newAngle = tip.angle + angleOffset;
          
          // Calculate spawn position slightly ahead
          const spawnDistance = config.STEP_SIZE * config.GROWTH_SPEED_MULTIPLIER;
          const spawnX = tip.x + Math.cos(newAngle) * spawnDistance;
          const spawnY = tip.y + Math.sin(newAngle) * spawnDistance;
          
          // Determine branch growth type
          let branchType: GrowthType = "secondary";
          
          // Special branch types can form under certain conditions
          if (tip.growthType === "aerial" && Math.random() < 0.2) {
            branchType = "reproductive"; // Aerial hyphae can form reproductive structures
          } else if (tip.growthType === "main" && nutrientRichness > 0.8 && Math.random() < 0.1) {
            branchType = "rhizomorph"; // Main hyphae can form rhizomorphs in rich conditions
          } else if (tip.depth < 2 && moistureFactor < 0.3 && Math.random() < 0.2) {
            branchType = "aerial"; // Dry conditions can trigger aerial hyphae formation
          }
          
          // Create the new tip with shared characteristics from parent
          const newTip: HyphaTip = {
            x: spawnX,
            y: spawnY,
            angle: newAngle,
            life: Math.max(
              tip.life * config.BRANCH_DECAY,
              config.BASE_LIFE * 0.5,
            ),
            depth: tip.depth + 1,
            growthType: branchType,
            resource: tip.resource * 0.4, // Transfer resources to branch
            age: 0,
            maturity: 0,
            // Inherit some characteristics from parent with variation
            enzymeActivity: tip.enzymeActivity * (0.7 + Math.random() * 0.6),
            carbonNutrient: tip.resource * 0.4 * 0.7, // 70% carbon
            nitrogenNutrient: tip.resource * 0.4 * 0.3, // 30% nitrogen
            temperatureSensitivity: tip.temperatureSensitivity * (0.8 + Math.random() * 0.4),
            phSensitivity: tip.phSensitivity * (0.8 + Math.random() * 0.4),
            basalRespirationRate: tip.basalRespirationRate * (0.9 + Math.random() * 0.2),
            lastBranchingTime: 0,
            specialization: 0,
            apicalDominanceStrength: tip.apicalDominanceStrength * 0.7 // Branches have lower dominance
          };
          
          // Add to new tips
          newTips.push(newTip);
        }
      }
    }

    // 14. ANASTOMOSIS PROCESS - Complex biological fusion
    for (const newTip of newTips) {
      let fusionOccurred = false;
      
      // Check for nearby tips for anastomosis
      for (const existingTip of this.tips) {
        if (existingTip.life <= 0) continue;
        
        const distance = Math.hypot(newTip.x - existingTip.x, newTip.y - existingTip.y);
        
        // Increased likelihood of anastomosis between different growth types
        const differentGrowthType = existingTip.growthType !== newTip.growthType;
        
        // Specialized types have different anastomosis behavior
        let anastomosisModifier = 1.0;
        if (existingTip.growthType === "rhizomorph" || newTip.growthType === "rhizomorph") {
          // Rhizomorphs anastomose less frequently (more directional growth)
          anastomosisModifier = 0.7;
        } else if (existingTip.growthType === "aerial" || newTip.growthType === "aerial") {
          // Aerial hyphae rarely anastomose
          anastomosisModifier = 0.3;
        } else if (existingTip.growthType === "reproductive" || newTip.growthType === "reproductive") {
          // Reproductive structures don't anastomose
          anastomosisModifier = 0;
        }
        
        // Different growth types fuse at full radius, same type at reduced radius
        const effectiveRadius = (differentGrowthType ? 
          config.ANASTOMOSIS_RADIUS : 
          config.ANASTOMOSIS_RADIUS * 0.6) * anastomosisModifier;
        
        // Check if fusion occurs
        if (distance < effectiveRadius) {
          fusionOccurred = true;
          
          // If anastomosis occurs, connect the network nodes
          if (activeNodeIds.has(existingTip)) {
            const existingNodeId = activeNodeIds.get(existingTip);
            
            // Create a node for the new tip at the fusion point
            const fusionNodeId = this.network.createNode(
              existingTip.x, 
              existingTip.y, 
              (existingTip.resource + newTip.resource) * 0.5  // Average resources
            );
            
            // Connect these nodes to create a network loop
            if (existingNodeId !== undefined) {
              this.network.connectNodes(existingNodeId, fusionNodeId);
            }
          }
          
          break; // Found fusion partner, stop checking
        }
      }
      
      // If no fusion occurred, add the new tip
      if (!fusionOccurred) {
        this.tips.push(newTip);
      }
    }

    // 15. ADVANCED LIFECYCLE EVENTS
    // Check for reproduction opportunities
    if (this.reproductionManager && Math.random() < 0.001) {
      for (const tip of this.tips) {
        // Only mature tips with sufficient resources can form reproductive structures
        if (tip.age > 300 && tip.resource > config.SPORE_FORMATION_THRESHOLD) {
          // Initiate reproductive structure
          const resourceSpent = this.reproductionManager.initiateReproductiveStructure(
            tip.x, tip.y, tip.resource, tip.age
          );
          
          // Deduct resources spent
          if (resourceSpent > 0) {
            tip.resource -= resourceSpent;
            tip.carbonNutrient -= resourceSpent * 0.7;
            tip.nitrogenNutrient -= resourceSpent * 0.3;
          }
        }
      }
    }

    // Remove dead tips
    this.tips = this.tips.filter((t) => t.life > 0);

    // Tip Culling to Control Performance
    const MAX_ACTIVE_TIPS = 3000;
    if (this.tips.length > MAX_ACTIVE_TIPS) {
      this.tips.splice(0, this.tips.length - MAX_ACTIVE_TIPS);
    }
  }
  
  /**
   * Gets environmental factors at a specific location
   */
  private getEnvironmentalFactors(x: number, y: number): {
    moistureFactor: number;
    temperatureFactor: number;
    pHFactor: number;
    nutrientFactor: number;
    hardnessFactor: number;
    circadianFactor?: number;
    seasonalFactor?: number;
  } {
    if (this.substrate && this.substrate.getEnvironmentalFactors) {
      // Use advanced substrate model
      const factors = this.substrate.getEnvironmentalFactors(x, y);
      return {
        moistureFactor: factors.moisture / config.BASE_NUTRIENT,
        temperatureFactor: this.getTemperatureFactor(factors.temperature),
        pHFactor: this.getPHFactor(factors.pH),
        nutrientFactor: (factors.carbon + factors.nitrogen) / 
          (config.BASE_NUTRIENT * (1 + 1/config.CARBON_NITROGEN_RATIO)),
        hardnessFactor: factors.hardness,
        circadianFactor: factors.circadianFactor,
        seasonalFactor: factors.seasonalFactor
      };
    } else {
      // Use simple environment model
      const moisture = this.envGPU.getMoisture ? 
        this.envGPU.getMoisture(x, y) / config.BASE_NUTRIENT : 0.7;
      
      const nutrient = this.envGPU.getNutrientLevel ? 
        this.envGPU.getNutrientLevel(x, y) / config.BASE_NUTRIENT : 0.5;
      
      return {
        moistureFactor: moisture,
        temperatureFactor: 1,  // Default optimal temperature
        pHFactor: 1,  // Default optimal pH
        nutrientFactor: nutrient,
        hardnessFactor: config.SUBSTRATE_PENETRATION_RESISTANCE
      };
    }
  }
  
  /**
   * Gets temperature influence factor (0-1)
   */
  private getTemperatureFactor(temperature: number): number {
    const optimalTemp = config.TEMPERATURE_OPTIMUM;
    const [minTemp, maxTemp] = config.TEMPERATURE_RANGE;
    
    if (temperature < minTemp || temperature > maxTemp) {
      return 0.1; // Minimal growth
    }
    
    // Bell curve with maximum at optimal temperature
    const tempDiff = Math.abs(temperature - optimalTemp);
    const tempRange = (maxTemp - minTemp) / 2;
    return Math.max(0.1, 1 - Math.pow(tempDiff / tempRange, 2));
  }
  
  /**
   * Gets pH influence factor (0-1)
   */
  private getPHFactor(pH: number): number {
    const [minPH, maxPH] = config.PH_TOLERANCE_RANGE;
    
    if (pH < minPH || pH > maxPH) {
      return 0.1; // Minimal growth
    }
    
    // Most fungi prefer slightly acidic conditions
    const optimalPH = (minPH + maxPH) / 2;
    const pHDiff = Math.abs(pH - optimalPH);
    const pHRange = (maxPH - minPH) / 2;
    
    return Math.max(0.1, 1 - Math.pow(pHDiff / pHRange, 2));
  }
  
  /**
   * Gets line thickness based on hyphal type
   */
  private getLineThicknessForTip(tip: HyphaTip): number {
    switch (tip.growthType) {
      case "main":
        return config.MAIN_LINE_WIDTH;
      case "secondary":
        return config.SECONDARY_LINE_WIDTH;
      case "rhizomorph":
        return config.MAIN_LINE_WIDTH * 1.5; // Thicker transport structures
      case "aerial":
        return config.SECONDARY_LINE_WIDTH * 0.8; // Thinner aerial hyphae
      case "reproductive":
        return config.MAIN_LINE_WIDTH * 0.7; // Reproductive structures
      default:
        return config.SECONDARY_LINE_WIDTH;
    }
  }
  
  /**
   * Normalizes an angle to the range [-π, π]
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * Draws a line segment between two points with styling based on growth type, depth, maturity, and environment.
   * @param oldX - Starting X-coordinate.
   * @param oldY - Starting Y-coordinate.
   * @param newX - Ending X-coordinate.
   * @param newY - Ending Y-coordinate.
   * @param type - Type of growth ("main", "secondary", "aerial", "rhizomorph", or "reproductive").
   * @param depth - Depth of the current tip for lightness calculation.
   * @param customThickness - Optional custom line thickness for mature hyphae.
   * @param maturity - Optional maturity value (0-1) affecting the color.
   */
  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    type: GrowthType,
    depth: number,
    customThickness?: number,
    maturity: number = 0,
  ) {
    // Calculate lightness based on depth
    let calculatedLightness =
      config.BASE_LIGHTNESS + depth * config.LIGHTNESS_STEP;
    if (calculatedLightness > 100) calculatedLightness = 100; // Cap lightness at 100%

    // Get environmental factors at the midpoint
    const midX = (oldX + newX) / 2;
    const midY = (oldY + newY) / 2;
    
    // Environmental factors from the substrate or simple environment
    let nutrientFactor = 0.5; // Default to moderate value
    let moistureFactor = 0.5; // Default to moderate value
    let temperatureFactor = 1;
    let pHFactor = 1;
    
    if (this.substrate && this.substrate.getEnvironmentalFactors) {
      // Advanced substrate model
      const factors = this.substrate.getEnvironmentalFactors(midX, midY);
      nutrientFactor = (factors.carbon + factors.nitrogen) / 
        (config.BASE_NUTRIENT * (1 + 1/(config.CARBON_NITROGEN_RATIO || 25)));
      moistureFactor = factors.moisture / config.BASE_NUTRIENT;
      temperatureFactor = this.getTemperatureFactor(factors.temperature);
      pHFactor = this.getPHFactor(factors.pH);
    } else {
      // Simple environment model
      if (this.envGPU.getNutrientLevel) {
        const nutrientLevel = this.envGPU.getNutrientLevel(midX, midY);
        nutrientFactor = Math.min(1, nutrientLevel / config.BASE_NUTRIENT);
      }
      
      if (this.envGPU.getMoisture) {
        const moistureLevel = this.envGPU.getMoisture(midX, midY);
        moistureFactor = Math.min(1, moistureLevel / config.BASE_NUTRIENT);
      }
    }

    // Base line style parameters
    let lineWidth: number;
    let alpha: number;
    let saturation: number;
    let lightness: number;
    let hue: number;

    // Determine line style based on growth type
    switch (type) {
      case "main":
        lineWidth = customThickness ?? config.MAIN_LINE_WIDTH;
        alpha = config.MAIN_ALPHA;
        hue = config.BASE_HUE; 
        saturation = 5 + nutrientFactor * 15; // More saturation in nutrient-rich areas
        lightness = calculatedLightness;
        break;
        
      case "secondary":
        lineWidth = customThickness ?? config.SECONDARY_LINE_WIDTH;
        alpha = config.SECONDARY_ALPHA;
        hue = config.BASE_HUE + (moistureFactor * 20); // Slight blue shift in moist areas
        saturation = nutrientFactor * 10;
        lightness = calculatedLightness + 5; // Slightly lighter
        break;
        
      case "rhizomorph":
        // Rhizomorphs are thicker, darker, more defined transport structures
        lineWidth = customThickness ?? (config.MAIN_LINE_WIDTH * 1.5);
        alpha = config.MAIN_ALPHA + 0.1;
        hue = config.BASE_HUE - 5; // Slightly warmer
        saturation = 10 + nutrientFactor * 10;
        lightness = calculatedLightness - 10; // Darker
        break;
        
      case "aerial":
        // Aerial hyphae are thinner, lighter, more translucent
        lineWidth = customThickness ?? (config.SECONDARY_LINE_WIDTH * 0.8);
        alpha = config.SECONDARY_ALPHA - 0.1;
        hue = config.BASE_HUE + 15; // Slightly cooler
        saturation = 5;
        lightness = calculatedLightness + 10; // Lighter
        break;
        
      case "reproductive":
        // Reproductive structures are distinctive
        lineWidth = customThickness ?? (config.MAIN_LINE_WIDTH * 0.7);
        alpha = config.MAIN_ALPHA;
        hue = 45; // Yellowish-brown
        saturation = 30;
        lightness = calculatedLightness - 5;
        break;
        
      default:
        // Fall back to reasonable defaults
        lineWidth = customThickness ?? config.SECONDARY_LINE_WIDTH;
        alpha = config.SECONDARY_ALPHA;
        hue = config.BASE_HUE;
        saturation = nutrientFactor * 5;
        lightness = calculatedLightness;
    }
    
    // Modify appearance based on maturity
    if (maturity > 0) {
      // More mature hyphae become darker and more defined
      lightness = Math.max(calculatedLightness - 15 * maturity, 40);
      saturation += maturity * 10;
      alpha = Math.min(1, alpha + maturity * 0.2);
    }
    
    // Environmental influences on appearance - with safety checks
    
    // Temperature affects color - higher temp = warmer tones
    if (typeof temperatureFactor === 'number') {
      const tempInfluence = temperatureFactor - 0.5; // -0.4 to 0.5 range
      hue += tempInfluence * 15; // Shift hue slightly based on temperature
    }
    
    // pH affects color - acidic = yellowish, alkaline = bluish
    if (typeof pHFactor === 'number') {
      const pHInfluence = pHFactor - 0.5; // -0.4 to 0.5 range
      hue += pHInfluence * 10;
    }
    
    // Ensure hue is within valid range
    hue = ((hue % 360) + 360) % 360;
    
    // Nutrient level affects saturation
    saturation = Math.max(0, Math.min(100, saturation + (nutrientFactor || 0.5) * 15));
    
    // Moisture affects color intensity
    alpha = Math.max(0.3, Math.min(1, alpha * (0.7 + (moistureFactor || 0.5) * 0.5)));
    
    // Validate parameters to prevent invalid values
    saturation = Math.max(0, Math.min(100, saturation));
    lightness = Math.max(0, Math.min(100, lightness));
    alpha = Math.max(0, Math.min(1, alpha));
    
    // Final color and line properties
    this.ctx.strokeStyle = `hsla(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%, ${alpha.toFixed(2)})`;
    this.ctx.lineWidth = lineWidth || 1; // Default to 1 if undefined
    
    // Check if the stroke color and width are valid before drawing
    if (!isNaN(hue) && !isNaN(saturation) && !isNaN(lightness) && !isNaN(alpha) && !isNaN(lineWidth)) {
      // Enhanced shadows for depth perception
      const shadowIntensity = (config.SHADOW_BLUR || 0) * 
        (lineWidth / (config.MAIN_LINE_WIDTH || 1));
      this.ctx.shadowBlur = shadowIntensity;
      this.ctx.shadowColor = config.SHADOW_COLOR || "rgba(0,0,0,0.1)";

      // Draw the line segment
      this.ctx.beginPath();
      this.ctx.moveTo(oldX, oldY);
      this.ctx.lineTo(newX, newY);
      this.ctx.stroke();

      // Reset shadow
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = "transparent";
    }
  }

  /**
   * Draws a small circle at the hyphal tip position for debugging.
   * @param tip - The hyphal tip to draw.
   */
  private drawHyphaTip(tip: HyphaTip) {
    const radius = 3;
    this.ctx.beginPath();
    this.ctx.arc(tip.x, tip.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(255, 255, 100, 0.8)"; // Bright yellow for visibility
    this.ctx.fill();
  }

  /**
   * Clears the simulation.
   * Useful for resetting the simulation.
   */
  public clear() {
    this.tips = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
    console.log("Simulation cleared.");
  }
}
