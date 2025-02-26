// src/main.ts

import { config } from "./constants.js";
import { GrowthManager } from "./growth.js";
import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { Perlin } from "./Perlin.js";
import { Renderer3D } from "./renderer3D.js";
import * as dat from "dat.gui";

// Get the main canvas for 2D rendering
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  console.error("Failed to get 2D rendering context.");
  throw new Error("Canvas context is null.");
}

// Create a container for the 3D renderer
const container3D = document.createElement("div");
container3D.id = "renderer3d-container";
container3D.style.position = "absolute";
container3D.style.top = "0";
container3D.style.left = "0";
container3D.style.width = "100%";
container3D.style.height = "100%";
container3D.style.pointerEvents = "auto"; // Enable interaction with 3D scene
document.body.appendChild(container3D);

// Add navigation instructions
const instructions = document.createElement("div");
instructions.style.position = "absolute";
instructions.style.bottom = "10px";
instructions.style.left = "10px";
instructions.style.color = "white";
instructions.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
instructions.style.padding = "10px";
instructions.style.borderRadius = "5px";
instructions.style.fontFamily = "Arial, sans-serif";
instructions.style.zIndex = "1000";
instructions.innerHTML = `
  <h3>3D Navigation:</h3>
  <p>Left-click + drag: Rotate camera</p>
  <p>Right-click + drag: Pan camera</p>
  <p>Scroll wheel: Zoom in/out</p>
`;
document.body.appendChild(instructions);

// Initialize 3D renderer
let renderer3D: Renderer3D | null = null;
if (config.ENABLE_3D) {
  renderer3D = new Renderer3D(container3D, window.innerWidth, window.innerHeight);
}

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Resize 3D renderer if available
  if (renderer3D) {
    renderer3D.resize(window.innerWidth, window.innerHeight);
  }
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
  
  // Reset 3D renderer if enabled
  if (config.ENABLE_3D && renderer3D) {
    renderer3D.clear();
  }

  // Reset growth manager with updated configuration
  growth = new GrowthManager(
    ctx as CanvasRenderingContext2D,
    canvas.width,
    canvas.height,
    canvas.width / 2,
    canvas.height / 2,
    perlin,
    envGPU,
    network,
    renderer3D, // Pass the 3D renderer
  );
  growth.init();

  // Visualize the nutrient environment in 3D if enabled
  if (config.ENABLE_3D && renderer3D && config.SHOW_NUTRIENT_ENVIRONMENT) {
    renderer3D.visualizeNutrientEnvironment(
      envGPU.getNutrientGrid(),
      config.ENV_GRID_CELL_SIZE
    );
  }

  console.log("Simulation reset.");
}

// Global references
let growth: GrowthManager;
let envGPU: EnvironmentGPU;
let network: MycelialNetwork;
let perlin: Perlin;

/**
 * Initialize the simulation and all required components.
 */
const setup = () => {
  resizeCanvas();

  // Initialize Perlin noise
  perlin = new Perlin();

  // Initialize environment GPU
  envGPU = new EnvironmentGPU(canvas.width, canvas.height);

  // Initialize mycelial network
  network = new MycelialNetwork();

  // Initialize growth manager with 3D renderer if enabled
  growth = new GrowthManager(
    ctx as CanvasRenderingContext2D,
    canvas.width,
    canvas.height,
    canvas.width / 2,
    canvas.height / 2,
    perlin,
    envGPU,
    network,
    renderer3D, // Pass the 3D renderer
  );
  growth.init();
  
  // Visualize the nutrient environment in 3D if enabled
  if (config.ENABLE_3D && renderer3D && config.SHOW_NUTRIENT_ENVIRONMENT) {
    renderer3D.visualizeNutrientEnvironment(
      envGPU.getNutrientGrid(),
      config.ENV_GRID_CELL_SIZE
    );
  }

  console.log("Simulation initialized.");
};

/**
 * Animation loop to update and render the simulation.
 */
const animate = () => {
  growth.updateAndDraw(Date.now());
  requestAnimationFrame(animate);
};

// GUI for dynamic configuration
const initGUI = () => {
  const gui = new dat.GUI();

  // const growthFolder = gui.addFolder("Growth Parameters");
  // growthFolder.add(config, "STEP_SIZE", 0.1, 10, 0.1).name("Step Size");
  // growthFolder
  //   .add(config, "GROWTH_SPEED_MULTIPLIER", 0.01, 5, 0.01)
  //   .name("Growth Speed");
  // growthFolder.add(config, "MAIN_BRANCH_COUNT", 1, 500, 1).name("Main Branch Count");
  // growthFolder.add(config, "BRANCH_CHANCE", 0, 1, 0.01).name("Branch Chance");
  // growthFolder.add(config, "MAX_BRANCH_DEPTH", 1, 1000, 1).name("Max Branch Depth");

  // const renderingFolder = gui.addFolder("Rendering");
  // renderingFolder
  //   .add(config, "MAIN_LINE_WIDTH", 0.1, 10, 0.1)
  //   .name("Main Line Width");
  // renderingFolder
  //   .add(config, "SECONDARY_LINE_WIDTH", 0.1, 5, 0.1)
  //   .name("Secondary Line Width");
  // renderingFolder
  //   .add(config, "MAIN_ALPHA", 0, 1, 0.01)
  //   .name("Main Line Opacity");
  // renderingFolder
  //   .add(config, "SECONDARY_ALPHA", 0, 1, 0.01)
  //   .name("Secondary Line Opacity");

  // const environmentFolder = gui.addFolder("Environment");
  // environmentFolder
  //   .add(config, "NUTRIENT_CONSUMPTION_RATE", 0.01, 5, 0.01)
  //   .name("Nutrient Consumption");
  // environmentFolder
  //   .add(config, "NUTRIENT_DIFFUSION", 0.01, 1, 0.01)
  //   .name("Nutrient Diffusion");

  // Create GUI folders and controllers

  // Canvas & Growth Parameters
  const growthFolder = gui.addFolder("Growth Parameters");
  growthFolder
    .add(config, "GROWTH_RADIUS_FACTOR", 0.0, 1.0)
    .step(0.01)
    .name("Growth Radius Factor")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "MAIN_BRANCH_COUNT", 1, 100)
    .step(1)
    .name("Main Branch Count")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "STEP_SIZE", 0, 5)
    .step(0.1)
    .name("Step Size")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "GROWTH_SPEED_MULTIPLIER", 0.0, 1.0)
    .step(0.1)
    .name("Growth Speed")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "BASE_LIFE", 0, 5000)
    .step(100)
    .name("Base Life")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "BRANCH_DECAY", 0.0, 1.0)
    .step(0.05)
    .name("Branch Decay")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "BRANCH_CHANCE", 0.0, 1.0)
    .step(0.01)
    .name("Branch Chance")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "MAX_BRANCH_DEPTH", 0, 1000)
    .step(1)
    .name("Max Branch Depth")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "ANGLE_DRIFT_STRENGTH", 0.0, 0.2)
    .step(0.01)
    .name("Angle Drift")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "WIGGLE_STRENGTH", 0.0, 1.0)
    .step(0.05)
    .name("Wiggle Strength")
    .onChange(resetSimulation);
  growthFolder
    .add(config, "PERLIN_SCALE", 0.01, 0.2)
    .step(0.01)
    .name("Perlin Scale")
    .onChange(resetSimulation);
  growthFolder.open();
  
  // 3D Growth Parameters
  const growth3DFolder = gui.addFolder("3D Growth Parameters");
  growth3DFolder
    .add(config, "ENABLE_3D")
    .name("Enable 3D Growth")
    .onChange(resetSimulation);
  growth3DFolder
    .add(config, "GROWTH_HEIGHT_FACTOR", 0.1, 2.0)
    .step(0.1)
    .name("Growth Height Factor")
    .onChange(resetSimulation);
  growth3DFolder
    .add(config, "VERTICAL_ANGLE_DRIFT_STRENGTH", 0.0, 0.2)
    .step(0.01)
    .name("Vertical Angle Drift")
    .onChange(resetSimulation);
  growth3DFolder
    .add(config, "VERTICAL_WIGGLE_STRENGTH", 0.0, 1.0)
    .step(0.05)
    .name("Vertical Wiggle")
    .onChange(resetSimulation);
  growth3DFolder
    .add(config, "GRAVITY_INFLUENCE", 0.0, 1.0)
    .step(0.05)
    .name("Gravity Influence")
    .onChange(resetSimulation);
  growth3DFolder
    .add(config, "SURFACE_GROWTH_BIAS", 0.0, 1.0)
    .step(0.05)
    .name("Surface Growth Bias")
    .onChange(resetSimulation);
  growth3DFolder.open();

  // Environmental Parameters
  const envFolder = gui.addFolder("Environmental Parameters");
  envFolder
    .add(config, "ENV_GRID_CELL_SIZE", 0.5, 5)
    .step(0.5)
    .name("Grid Cell Size")
    .onChange(resetSimulation);
  envFolder
    .add(config, "BASE_NUTRIENT", 50, 200)
    .step(10)
    .name("Base Nutrient")
    .onChange(resetSimulation);
  envFolder
    .add(config, "NUTRIENT_DIFFUSION", 0.0, 1.0)
    .step(0.05)
    .name("Nutrient Diffusion")
    .onChange(resetSimulation);
  envFolder
    .add(config, "NUTRIENT_CONSUMPTION_RATE", 0.1, 5.0)
    .step(0.1)
    .name("Nutrient Consumption")
    .onChange(resetSimulation);
  envFolder.open();

  // Nutrient Pockets Parameters
  const pocketFolder = gui.addFolder("Nutrient Pockets");
  pocketFolder
    .add(config, "NUTRIENT_POCKET_RADIUS", 1, 5)
    .step(1)
    .name("Pocket Radius")
    .onChange(resetSimulation);
  pocketFolder
    .add(config, "NUTRIENT_POCKET_AMOUNT", 50, 200)
    .step(10)
    .name("Pocket Amount")
    .onChange(resetSimulation);
  pocketFolder
    .add(config, "NUTRIENT_POCKET_DECAY_RATE", 0.1, 1.0)
    .step(0.1)
    .name("Pocket Decay Rate")
    .onChange(resetSimulation);
  pocketFolder.open();

  // Mycelial Network Parameters
  const networkFolder = gui.addFolder("Mycelial Network");
  networkFolder
    .add(config, "INITIAL_RESOURCE_PER_TIP", 1000, 5000)
    .step(100)
    .name("Initial Resource per Tip")
    .onChange(resetSimulation);
  networkFolder
    .add(config, "RESOURCE_FLOW_RATE", 0.5, 5.0)
    .step(0.1)
    .name("Resource Flow Rate")
    .onChange(resetSimulation);
  networkFolder.open();

  // Growth Simulation Parameters
  const simFolder = gui.addFolder("Simulation Parameters");
  simFolder
    .add(config, "TIME_LAPSE_FACTOR", 1, 10)
    .step(1)
    .name("Time Lapse Factor")
    .onChange(resetSimulation);
  simFolder
    .add(config, "SECONDARY_FAN_COUNT", 0.0, 3)
    .step(0.01)
    .name("Secondary Fan Count")
    .onChange(resetSimulation);
  simFolder
    .add(config, "WIDER_SECONDARY_ANGLE", 0, Math.PI / 2)
    .step(0.1)
    .name("Secondary Angle")
    .onChange(resetSimulation);
  simFolder.open();

  // Rendering Parameters
  const renderFolder = gui.addFolder("Rendering Parameters");
  renderFolder
    .add(config, "BACKGROUND_ALPHA", 0.0, 0.1)
    .step(0.01)
    .name("Background Alpha")
    .onChange(resetSimulation);
  renderFolder
    .add(config, "FADE_START_FACTOR", 0.5, 1.0)
    .step(0.05)
    .name("Fade Start Factor")
    .onChange(resetSimulation);
  renderFolder
    .add(config, "FADE_END_FACTOR", 0.8, 1.2)
    .step(0.05)
    .name("Fade End Factor")
    .onChange(resetSimulation);
  renderFolder
    .add(config, "SHADOW_BLUR", 0, 20)
    .step(1)
    .name("Shadow Blur")
    .onChange(resetSimulation);
  renderFolder
    .addColor(config, "SHADOW_COLOR")
    .name("Shadow Color")
    .onChange(resetSimulation);
  renderFolder.open();

  // Line Rendering Parameters
  const lineFolder = gui.addFolder("Line Rendering");
  lineFolder
    .add(config, "MAIN_LINE_WIDTH", 1, 5)
    .step(0.5)
    .name("Main Line Width")
    .onChange(resetSimulation);
  lineFolder
    .add(config, "SECONDARY_LINE_WIDTH", 0.5, 3)
    .step(0.5)
    .name("Secondary Line Width")
    .onChange(resetSimulation);
  lineFolder
    .add(config, "MAIN_ALPHA", 0.5, 1.0)
    .step(0.05)
    .name("Main Alpha")
    .onChange(resetSimulation);
  lineFolder
    .add(config, "SECONDARY_ALPHA", 0.3, 1.0)
    .step(0.05)
    .name("Secondary Alpha")
    .onChange(resetSimulation);
  lineFolder.open();

  // Color Parameters
  const colorFolder = gui.addFolder("Color Parameters");
  colorFolder
    .add(config, "BASE_HUE", 0, 360)
    .step(1)
    .name("Base Hue")
    .onChange(resetSimulation);
  colorFolder
    .add(config, "BASE_LIGHTNESS", 50, 100)
    .step(1)
    .name("Base Lightness")
    .onChange(resetSimulation);
  colorFolder
    .add(config, "NUTRIENT_HUE", 0, 360)
    .step(1)
    .name("Nutrient Color")
    .onChange(resetSimulation);
  colorFolder
    .add(config, "LIGHTNESS_STEP", 1, 10)
    .step(1)
    .name("Lightness Step")
    .onChange(resetSimulation);
  colorFolder.open();

  // Miscellaneous Parameters
  const miscFolder = gui.addFolder("Miscellaneous");
  miscFolder
    .add(config, "ANASTOMOSIS_RADIUS", 0.01, 1)
    .step(0.01)
    .name("Anastomosis Radius")
    .onChange(resetSimulation);
  miscFolder.open();
  
  // 3D Rendering Parameters
  const render3DFolder = gui.addFolder("3D Rendering");
  render3DFolder
    .add(config, "SHOW_NODES_3D")
    .name("Show Nodes")
    .onChange(resetSimulation);
  render3DFolder
    .add(config, "NODE_OPACITY", 0.0, 1.0)
    .step(0.05)
    .name("Node Opacity")
    .onChange(resetSimulation);
  render3DFolder
    .add(config, "SHOW_NUTRIENT_ENVIRONMENT")
    .name("Show Nutrients")
    .onChange(resetSimulation);
  render3DFolder
    .add(config, "NUTRIENT_POINT_SIZE", 0.5, 5.0)
    .step(0.1)
    .name("Nutrient Point Size")
    .onChange(resetSimulation);
  render3DFolder
    .add(config, "NUTRIENT_POINT_OPACITY", 0.0, 1.0)
    .step(0.05)
    .name("Nutrient Opacity")
    .onChange(resetSimulation);
  render3DFolder
    .add(config, "CAMERA_DISTANCE", 50, 200)
    .step(10)
    .name("Camera Distance")
    .onChange(() => {
      if (renderer3D) {
        renderer3D.setCameraDistance(config.CAMERA_DISTANCE);
      }
    });
  render3DFolder
    .add(config, "CAMERA_FOV", 30, 100)
    .step(5)
    .name("Camera FOV")
    .onChange(() => {
      if (renderer3D) {
        renderer3D.setCameraFOV(config.CAMERA_FOV);
      }
    });
  render3DFolder.open();

  // Add a button to reset the simulation manually
  gui.add({ restart: () => setup() }, "restart").name("Restart Simulation");

  gui.close();
};

setup();
initGUI();
animate();
