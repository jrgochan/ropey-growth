// src/main.ts

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { GrowthManager } from "./growth.js";
import { Perlin } from "./Perlin.js";
import {
  MAIN_BRANCH_COUNT,
  ENV_GRID_CELL_SIZE,
  NUTRIENT_POCKET_RADIUS,
  NUTRIENT_POCKET_AMOUNT
} from "./constants.js";

// Get references to canvases
const mainCanvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const envCanvas = document.getElementById("envCanvas") as HTMLCanvasElement;

// Get 2D rendering contexts
const mainCtx = mainCanvas.getContext("2d")!;
const envCtx = envCanvas.getContext("2d")!;

// Set canvas dimensions
const width = window.innerWidth;
const height = window.innerHeight;
mainCanvas.width = width;
mainCanvas.height = height;
envCanvas.width = width;
envCanvas.height = height;

// Initialize Perlin Noise Generator
const perlin = new Perlin();

// Initialize GPU Environment
const envGPU = new EnvironmentGPU(width, height, envCanvas);

// Initialize Mycelial Network
const network = new MycelialNetwork();

// Initialize Growth Manager with reference to EnvironmentGPU and MycelialNetwork
const centerX = width / 2;
const centerY = height / 2;
const growth = new GrowthManager(
  mainCtx,
  width,
  height,
  centerX,
  centerY,
  perlin,
  envGPU,
  network
);

// Initialize the growth simulation
growth.init();

// Variable to track the last nutrient pocket creation time
let lastPocketCreationTime = 0;

// Add event listener for mouse clicks to create nutrient pockets
mainCanvas.addEventListener('click', (event) => {
  const rect = mainCanvas.getBoundingClientRect();
  const pixelX = event.clientX - rect.left;
  const pixelY = event.clientY - rect.top;

  const gridX = Math.floor(pixelX / ENV_GRID_CELL_SIZE);
  const gridY = Math.floor(pixelY / ENV_GRID_CELL_SIZE);

  envGPU.createNutrientPocket(gridX, gridY, NUTRIENT_POCKET_RADIUS, NUTRIENT_POCKET_AMOUNT * 2);
  console.log(`User-created nutrient pocket at (${gridX}, ${gridY})`);
});

/**
 * The main animation loop.
 * @param currentTime - The current timestamp in milliseconds.
 */
function animate(currentTime: number) {
  // 1. Update the nutrient environment (diffusion and nutrient pockets)
  envGPU.updateEnvironment(currentTime);

  // 2. Render the nutrient environment onto its canvas
  envGPU.renderToCanvas();

  // 3. Draw nutrient environment onto mainCanvas with transparency
  envGPU.drawEnvOnTargetContext(mainCtx, mainCanvas.width, mainCanvas.height);

  // 4. Update and draw the mycelial growth lines on the main canvas
  growth.updateAndDraw(currentTime);

  // 5. Optionally, create new nutrient pockets at random intervals
  if (currentTime - lastPocketCreationTime > 5000) { // Every 5 seconds for testing
    const randomX = Math.floor(Math.random() * envGPU.cols);
    const randomY = Math.floor(Math.random() * envGPU.rows);
    envGPU.createNutrientPocket(randomX, randomY, NUTRIENT_POCKET_RADIUS, NUTRIENT_POCKET_AMOUNT * 2); // Increased amount
    console.log(`Created nutrient pocket at (${randomX}, ${randomY})`);
    lastPocketCreationTime = currentTime;
  }

  // 6. Continue the animation loop
  requestAnimationFrame(animate);
}

// Start the animation loop
requestAnimationFrame(animate);
