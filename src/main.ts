// src/main.ts

import { config } from "./constants.js";
import { GrowthManager } from "./growth.js";
import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { Perlin } from "./Perlin.js";
import * as dat from "dat.gui";

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas?.getContext("2d");
if (!ctx) {
  console.error("Failed to get 2D rendering context.");
  throw new Error("Canvas context is null.");
}

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function resetSimulation() {
  // Clear existing growth and environment
  if (growth) {
    growth.clear();
  }

  // Reinitialize components
  perlin = new Perlin();
  envGPU = new EnvironmentGPU(canvas.width, canvas.height);
  network = new MycelialNetwork();

  // Reset growth manager with updated configuration
  growth = new GrowthManager(
    ctx,
    canvas.width,
    canvas.height,
    canvas.width / 2,
    canvas.height / 2,
    perlin,
    envGPU,
    network,
  );
  growth.init();

  console.log("Simulation reset.");
}

// Global references
let growth: GrowthManager;
let envGPU: EnvironmentGPU;
let network: MycelialNetwork;
let perlin: Perlin;

/**
 * Initialize parameter defaults for new parameters if not defined
 */
const initializeDefaultParameters = () => {
  // Set defaults for biological parameters if not already set
  if (config.CHEMOTROPISM_STRENGTH === undefined) config.CHEMOTROPISM_STRENGTH = 0.3;
  if (config.NEGATIVE_AUTOTROPISM_STRENGTH === undefined) config.NEGATIVE_AUTOTROPISM_STRENGTH = 0.15;
  if (config.LINE_THICKENING_FACTOR === undefined) config.LINE_THICKENING_FACTOR = 0.01;
  if (config.GRADIENT_SAMPLING_RADIUS === undefined) config.GRADIENT_SAMPLING_RADIUS = 3;
  if (config.HYPHAL_MATURATION_RATE === undefined) config.HYPHAL_MATURATION_RATE = 0.01;
  if (config.TRANSPORT_EFFICIENCY_FACTOR === undefined) config.TRANSPORT_EFFICIENCY_FACTOR = 1.2;
  if (config.MOISTURE_FACTOR === undefined) config.MOISTURE_FACTOR = 0.5;
  
  // Set defaults for advanced parameters if not already set
  if (config.HYPHAL_RESPIRATION_RATE === undefined) config.HYPHAL_RESPIRATION_RATE = 0.005;
  if (config.CARBON_NITROGEN_RATIO === undefined) config.CARBON_NITROGEN_RATIO = 25;
  if (config.ENZYME_SECRETION_RADIUS === undefined) config.ENZYME_SECRETION_RADIUS = 2;
  if (config.ENZYME_DIFFUSION_RATE === undefined) config.ENZYME_DIFFUSION_RATE = 0.1;
  if (config.ENZYME_DIGESTION_RATE === undefined) config.ENZYME_DIGESTION_RATE = 0.05;
  if (config.APICAL_DOMINANCE_FACTOR === undefined) config.APICAL_DOMINANCE_FACTOR = 0.3;
  if (config.SUBSTRATE_PENETRATION_RESISTANCE === undefined) config.SUBSTRATE_PENETRATION_RESISTANCE = 0.1;
  if (config.GEOTROPISM_STRENGTH === undefined) config.GEOTROPISM_STRENGTH = 0.1;
  if (config.TEMPERATURE_OPTIMUM === undefined) config.TEMPERATURE_OPTIMUM = 25;
  if (config.TEMPERATURE_RANGE === undefined) config.TEMPERATURE_RANGE = [5, 35];
  if (config.SPORE_FORMATION_THRESHOLD === undefined) config.SPORE_FORMATION_THRESHOLD = 5000;
  if (config.SEASONAL_GROWTH_PATTERN === undefined) config.SEASONAL_GROWTH_PATTERN = false;
  if (config.CIRCADIAN_RHYTHM_AMPLITUDE === undefined) config.CIRCADIAN_RHYTHM_AMPLITUDE = 0.0;
  if (config.PH_TOLERANCE_RANGE === undefined) config.PH_TOLERANCE_RANGE = [4.5, 7.0];
  if (config.BACTERIAL_INTERACTION_FACTOR === undefined) config.BACTERIAL_INTERACTION_FACTOR = 0;
};

/**
 * Initialize the simulation and all required components.
 */
const setup = () => {
  resizeCanvas();
  
  // Make sure all new parameters have default values
  initializeDefaultParameters();

  // Initialize Perlin noise
  perlin = new Perlin();

  // Initialize environment GPU
  envGPU = new EnvironmentGPU(canvas.width, canvas.height);

  // Initialize mycelial network
  network = new MycelialNetwork();

  // Initialize growth manager
  growth = new GrowthManager(
    ctx,
    canvas.width,
    canvas.height,
    canvas.width / 2,
    canvas.height / 2,
    perlin,
    envGPU,
    network,
  );
  growth.init();

  console.log("Simulation initialized.");
};

/**
 * Animation loop to update and render the simulation.
 */
const animate = () => {
  growth.updateAndDraw();
  requestAnimationFrame(animate);
};

// GUI for dynamic configuration
const initGUI = () => {
  // Create main GUI
  const gui = new dat.GUI({ width: 300 });
  
  // Create tab-like structure with main categories
  const mainTabs = {
    currentTab: "Visual",
    options: ["Visual", "Biology", "Growth", "Environment", "Advanced"]
  };
  
  // Add controllers for each tab category
  gui.add(mainTabs, 'currentTab', mainTabs.options).name('Select Category').onChange((value) => {
    // Hide all folders
    Object.values(folders).forEach(folder => {
      folder.hide();
      folder.close();
    });
    
    // Show only the folders for the selected tab
    switch(value) {
      case "Visual":
        folders.renderFolder.show();
        folders.lineFolder.show();
        folders.colorFolder.show();
        break;
      case "Biology":
        folders.bioFolder.show();
        folders.networkFolder.show();
        folders.miscFolder.show();
        break;
      case "Growth":
        folders.growthFolder.show();
        folders.simFolder.show();
        break;
      case "Environment":
        folders.envFolder.show();
        folders.pocketFolder.show();
        break;
      case "Advanced":
        folders.advancedFolder.show();
        break;
    }
  });
  
  // Add preset manager
  const presets = {
    current: "Default",
    options: ["Default", "Dense Growth", "Minimal", "Colorful", "Realistic"],
    save: () => {
      // Get current configuration and save it
      const currentPreset = JSON.stringify(config);
      localStorage.setItem("mycelium-custom-preset", currentPreset);
      alert("Custom preset saved!");
    },
    load: () => {
      // Load saved configuration
      const savedPreset = localStorage.getItem("mycelium-custom-preset");
      if (savedPreset) {
        const presetConfig = JSON.parse(savedPreset);
        Object.assign(config, presetConfig);
        resetSimulation();
        alert("Custom preset loaded!");
      } else {
        alert("No custom preset found!");
      }
    }
  };
  
  // Add preset selection
  gui.add(presets, 'current', presets.options).name('Preset').onChange((value) => {
    applyPreset(value);
  });
  
  // Add preset save/load buttons
  const presetFolder = gui.addFolder('Preset Management');
  presetFolder.add(presets, 'save').name('Save Current Setup');
  presetFolder.add(presets, 'load').name('Load Custom Setup');
  
  // Create all folders (but initially hide them)
  const folders = {};
  
  // Restart button (always visible)
  gui.add({ restart: () => setup() }, "restart").name("Restart Simulation");
  
  // VISUAL TAB FOLDERS
  // Rendering Parameters
  folders.renderFolder = gui.addFolder("Display Settings");
  folders.renderFolder
    .add(config, "BACKGROUND_ALPHA", 0.0, 0.1)
    .step(0.01)
    .name("Background Alpha")
    .onChange(resetSimulation);
  folders.renderFolder
    .add(config, "FADE_START_FACTOR", 0.5, 1.0)
    .step(0.05)
    .name("Fade Start Factor")
    .onChange(resetSimulation);
  folders.renderFolder
    .add(config, "FADE_END_FACTOR", 0.8, 1.2)
    .step(0.05)
    .name("Fade End Factor")
    .onChange(resetSimulation);
  folders.renderFolder
    .add(config, "SHADOW_BLUR", 0, 20)
    .step(1)
    .name("Shadow Blur")
    .onChange(resetSimulation);
  folders.renderFolder
    .addColor(config, "SHADOW_COLOR")
    .name("Shadow Color")
    .onChange(resetSimulation);

  // Line Rendering Parameters
  folders.lineFolder = gui.addFolder("Line Appearance");
  folders.lineFolder
    .add(config, "MAIN_LINE_WIDTH", 1, 5)
    .step(0.5)
    .name("Main Line Width")
    .onChange(resetSimulation);
  folders.lineFolder
    .add(config, "SECONDARY_LINE_WIDTH", 0.5, 3)
    .step(0.5)
    .name("Secondary Line Width")
    .onChange(resetSimulation);
  folders.lineFolder
    .add(config, "MAIN_ALPHA", 0.5, 1.0)
    .step(0.05)
    .name("Main Alpha")
    .onChange(resetSimulation);
  folders.lineFolder
    .add(config, "SECONDARY_ALPHA", 0.3, 1.0)
    .step(0.05)
    .name("Secondary Alpha")
    .onChange(resetSimulation);

  // Color Parameters
  folders.colorFolder = gui.addFolder("Color Settings");
  folders.colorFolder
    .add(config, "BASE_HUE", 0, 360)
    .step(1)
    .name("Base Hue")
    .onChange(resetSimulation);
  folders.colorFolder
    .add(config, "BASE_LIGHTNESS", 50, 100)
    .step(1)
    .name("Base Lightness")
    .onChange(resetSimulation);
  folders.colorFolder
    .add(config, "LIGHTNESS_STEP", 1, 10)
    .step(1)
    .name("Lightness Step")
    .onChange(resetSimulation);

  // BIOLOGY TAB FOLDERS
  // Biological Parameters folder
  folders.bioFolder = gui.addFolder("Biological Properties");
  if (config.CHEMOTROPISM_STRENGTH !== undefined) {
    folders.bioFolder
      .add(config, "CHEMOTROPISM_STRENGTH", 0.0, 1.0)
      .step(0.05)
      .name("Chemotropism")
      .onChange(resetSimulation);
  }
  
  if (config.NEGATIVE_AUTOTROPISM_STRENGTH !== undefined) {
    folders.bioFolder
      .add(config, "NEGATIVE_AUTOTROPISM_STRENGTH", 0.0, 1.0)
      .step(0.05)
      .name("Neg. Autotropism")
      .onChange(resetSimulation);
  }
  
  if (config.LINE_THICKENING_FACTOR !== undefined) {
    folders.bioFolder
      .add(config, "LINE_THICKENING_FACTOR", 0.0, 0.1)
      .step(0.005)
      .name("Line Thickening")
      .onChange(resetSimulation);
  }
  
  if (config.GRADIENT_SAMPLING_RADIUS !== undefined) {
    folders.bioFolder
      .add(config, "GRADIENT_SAMPLING_RADIUS", 1, 10)
      .step(1)
      .name("Gradient Sampling")
      .onChange(resetSimulation);
  }
  
  if (config.HYPHAL_MATURATION_RATE !== undefined) {
    folders.bioFolder
      .add(config, "HYPHAL_MATURATION_RATE", 0.01, 0.2)
      .step(0.01)
      .name("Maturation Rate")
      .onChange(resetSimulation);
  }
  
  if (config.MOISTURE_FACTOR !== undefined) {
    folders.bioFolder
      .add(config, "MOISTURE_FACTOR", 0.0, 1.0)
      .step(0.05)
      .name("Moisture Effect")
      .onChange(resetSimulation);
  }
  
  // Mycelial Network Parameters
  folders.networkFolder = gui.addFolder("Network Properties");
  folders.networkFolder
    .add(config, "TRANSPORT_EFFICIENCY_FACTOR", 1.0, 3.0)
    .step(0.1)
    .name("Transport Efficiency")
    .onChange(resetSimulation);
  folders.networkFolder
    .add(config, "INITIAL_RESOURCE_PER_TIP", 1000, 5000)
    .step(100)
    .name("Initial Resources")
    .onChange(resetSimulation);
  folders.networkFolder
    .add(config, "RESOURCE_FLOW_RATE", 0.5, 2.0)
    .step(0.1)
    .name("Resource Flow Rate")
    .onChange(resetSimulation);
  
  // Miscellaneous Parameters
  folders.miscFolder = gui.addFolder("Connection Properties");
  folders.miscFolder
    .add(config, "ANASTOMOSIS_RADIUS", 0.01, 1)
    .step(0.01)
    .name("Anastomosis Radius")
    .onChange(resetSimulation);

  // GROWTH TAB FOLDERS
  // Canvas & Growth Parameters
  folders.growthFolder = gui.addFolder("Growth Parameters");
  folders.growthFolder
    .add(config, "GROWTH_RADIUS_FACTOR", 0.0, 1.0)
    .step(0.01)
    .name("Growth Radius")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "MAIN_BRANCH_COUNT", 1, 100)
    .step(1)
    .name("Main Branch Count")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "STEP_SIZE", 0, 5)
    .step(0.1)
    .name("Step Size")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "GROWTH_SPEED_MULTIPLIER", 0.0, 1.0)
    .step(0.1)
    .name("Growth Speed")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "BASE_LIFE", 0, 5000)
    .step(100)
    .name("Base Life")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "BRANCH_DECAY", 0.0, 1.0)
    .step(0.05)
    .name("Branch Decay")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "BRANCH_CHANCE", 0.0, 1.0)
    .step(0.01)
    .name("Branch Chance")
    .onChange(resetSimulation);
  folders.growthFolder
    .add(config, "MAX_BRANCH_DEPTH", 0, 1000)
    .step(1)
    .name("Max Branch Depth")
    .onChange(resetSimulation);

  // Growth Simulation Parameters
  folders.simFolder = gui.addFolder("Growth Pattern");
  folders.simFolder
    .add(config, "ANGLE_DRIFT_STRENGTH", 0.0, 0.2)
    .step(0.01)
    .name("Angle Drift")
    .onChange(resetSimulation);
  folders.simFolder
    .add(config, "WIGGLE_STRENGTH", 0.0, 1.0)
    .step(0.05)
    .name("Wiggle Strength")
    .onChange(resetSimulation);
  folders.simFolder
    .add(config, "PERLIN_SCALE", 0.01, 0.2)
    .step(0.01)
    .name("Perlin Scale")
    .onChange(resetSimulation);
  folders.simFolder
    .add(config, "TIME_LAPSE_FACTOR", 1, 10)
    .step(1)
    .name("Time Lapse Factor")
    .onChange(resetSimulation);
  folders.simFolder
    .add(config, "SECONDARY_FAN_COUNT", 0.0, 3)
    .step(0.01)
    .name("Secondary Fan Count")
    .onChange(resetSimulation);
  folders.simFolder
    .add(config, "WIDER_SECONDARY_ANGLE", 0, Math.PI / 2)
    .step(0.1)
    .name("Secondary Angle")
    .onChange(resetSimulation);

  // ENVIRONMENT TAB FOLDERS
  // Environmental Parameters
  folders.envFolder = gui.addFolder("Environmental Settings");
  folders.envFolder
    .add(config, "ENV_GRID_CELL_SIZE", 0.5, 5)
    .step(0.5)
    .name("Grid Cell Size")
    .onChange(resetSimulation);
  folders.envFolder
    .add(config, "BASE_NUTRIENT", 50, 200)
    .step(10)
    .name("Base Nutrient")
    .onChange(resetSimulation);
  folders.envFolder
    .add(config, "NUTRIENT_DIFFUSION", 0.0, 0.5)
    .step(0.05)
    .name("Nutrient Diffusion")
    .onChange(resetSimulation);
  folders.envFolder
    .add(config, "NUTRIENT_CONSUMPTION_RATE", 0.1, 5.0)
    .step(0.1)
    .name("Nutrient Consumption")
    .onChange(resetSimulation);

  // Nutrient Pockets Parameters
  folders.pocketFolder = gui.addFolder("Nutrient Distribution");
  folders.pocketFolder
    .add(config, "NUTRIENT_POCKET_RADIUS", 1, 5)
    .step(1)
    .name("Pocket Radius")
    .onChange(resetSimulation);
  folders.pocketFolder
    .add(config, "NUTRIENT_POCKET_AMOUNT", 50, 200)
    .step(10)
    .name("Pocket Amount")
    .onChange(resetSimulation);
  folders.pocketFolder
    .add(config, "NUTRIENT_POCKET_DECAY_RATE", 0.1, 1.0)
    .step(0.1)
    .name("Pocket Decay Rate")
    .onChange(resetSimulation);

  // ADVANCED TAB FOLDERS
  // Advanced Parameters folder
  folders.advancedFolder = gui.addFolder("Advanced Settings");
  
  if (config.HYPHAL_RESPIRATION_RATE !== undefined) {
    folders.advancedFolder
      .add(config, "HYPHAL_RESPIRATION_RATE", 0.001, 0.05)
      .step(0.001)
      .name("Respiration Rate")
      .onChange(resetSimulation);
  }
  
  if (config.CARBON_NITROGEN_RATIO !== undefined) {
    folders.advancedFolder
      .add(config, "CARBON_NITROGEN_RATIO", 5, 50)
      .step(1)
      .name("C:N Ratio")
      .onChange(resetSimulation);
  }
  
  if (config.ENZYME_SECRETION_RADIUS !== undefined) {
    folders.advancedFolder
      .add(config, "ENZYME_SECRETION_RADIUS", 1, 10)
      .step(0.5)
      .name("Enzyme Radius")
      .onChange(resetSimulation);
  }
  
  if (config.ENZYME_DIGESTION_RATE !== undefined) {
    folders.advancedFolder
      .add(config, "ENZYME_DIGESTION_RATE", 0.01, 0.2)
      .step(0.01)
      .name("Enzyme Digestion")
      .onChange(resetSimulation);
  }
  
  if (config.APICAL_DOMINANCE_FACTOR !== undefined) {
    folders.advancedFolder
      .add(config, "APICAL_DOMINANCE_FACTOR", 0.0, 1.0)
      .step(0.05)
      .name("Apical Dominance")
      .onChange(resetSimulation);
  }
  
  if (config.SUBSTRATE_PENETRATION_RESISTANCE !== undefined) {
    folders.advancedFolder
      .add(config, "SUBSTRATE_PENETRATION_RESISTANCE", 0.0, 0.8)
      .step(0.05)
      .name("Substrate Resistance")
      .onChange(resetSimulation);
  }
  
  if (config.GEOTROPISM_STRENGTH !== undefined) {
    folders.advancedFolder
      .add(config, "GEOTROPISM_STRENGTH", 0.0, 0.5)
      .step(0.05)
      .name("Geotropism")
      .onChange(resetSimulation);
  }
  
  if (config.TEMPERATURE_OPTIMUM !== undefined) {
    folders.advancedFolder
      .add(config, "TEMPERATURE_OPTIMUM", 10, 35)
      .step(1)
      .name("Optimal Temperature")
      .onChange(resetSimulation);
  }
  
  if (config.SPORE_FORMATION_THRESHOLD !== undefined) {
    folders.advancedFolder
      .add(config, "SPORE_FORMATION_THRESHOLD", 1000, 10000)
      .step(500)
      .name("Spore Threshold")
      .onChange(resetSimulation);
  }
  
  if (config.SEASONAL_GROWTH_PATTERN !== undefined) {
    folders.advancedFolder
      .add(config, "SEASONAL_GROWTH_PATTERN")
      .name("Seasonal Growth")
      .onChange(resetSimulation);
  }
  
  if (config.CIRCADIAN_RHYTHM_AMPLITUDE !== undefined) {
    folders.advancedFolder
      .add(config, "CIRCADIAN_RHYTHM_AMPLITUDE", 0.0, 0.5)
      .step(0.05)
      .name("Circadian Rhythm")
      .onChange(resetSimulation);
  }
  
  // Initially hide all folders except Visual
  Object.values(folders).forEach(folder => {
    folder.hide();
  });
  
  // Show only visual folders by default
  folders.renderFolder.show();
  folders.lineFolder.show();
  folders.colorFolder.show();
  
  // Function to apply presets
  function applyPreset(presetName) {
    switch(presetName) {
      case "Dense Growth":
        config.MAIN_BRANCH_COUNT = 50;
        config.BRANCH_CHANCE = 0.6;
        config.GROWTH_SPEED_MULTIPLIER = 0.8;
        config.MAX_BRANCH_DEPTH = 200;
        break;
      case "Minimal":
        config.MAIN_BRANCH_COUNT = 8;
        config.BRANCH_CHANCE = 0.2;
        config.MAX_BRANCH_DEPTH = 30;
        config.MAIN_LINE_WIDTH = 2.0;
        config.SECONDARY_LINE_WIDTH = 1.0;
        break;
      case "Colorful":
        config.BASE_HUE = 280; // Purple
        config.LIGHTNESS_STEP = 8;
        config.SHADOW_COLOR = "rgba(120, 0, 180, 0.2)";
        config.BASE_LIGHTNESS = 70;
        break;
      case "Realistic":
        config.CHEMOTROPISM_STRENGTH = 0.8;
        config.NEGATIVE_AUTOTROPISM_STRENGTH = 0.6;
        config.MOISTURE_FACTOR = 0.8;
        config.BASE_HUE = 40; // More brownish
        config.WIGGLE_STRENGTH = 0.4;
        config.ANGLE_DRIFT_STRENGTH = 0.18;
        break;
      case "Default":
        // Reset to default values in constants.ts
        setup();
        break;
    }
    resetSimulation();
  }
};

setup();
initGUI();
animate();
