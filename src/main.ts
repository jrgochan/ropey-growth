/***************************************************
 * main.ts
 *
 * Integrates EnvironmentGPU, MycelialNetwork, and GrowthManager.
 * - Initializes all components
 * - Manages the animation loop
 ***************************************************/

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { GrowthManager } from "./growth.js";
import { Perlin } from "./Perlin.js";
import { MAIN_BRANCH_COUNT } from "./constants.js";

// Create the main canvas and append it to the document body
const mainCanvas = document.createElement("canvas");
const mainCtx = mainCanvas.getContext("2d")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(mainCanvas);

// Create Environment Canvas
const envCanvas = document.createElement("canvas");
envCanvas.width = window.innerWidth;
envCanvas.height = window.innerHeight;
envCanvas.style.position = "absolute";
envCanvas.style.top = "0";
envCanvas.style.left = "0";
envCanvas.style.zIndex = "0"; // Behind the main canvas
envCanvas.style.pointerEvents = "none"; // Allow interactions on main canvas
document.body.appendChild(envCanvas);

// Initialize EnvironmentGPU with its own canvas
let envGPU: EnvironmentGPU;
let net: MycelialNetwork;
let growth: GrowthManager;
let perlin: Perlin;

function resizeCanvases() {
  mainCanvas.width = window.innerWidth;
  mainCanvas.height = window.innerHeight;
  envCanvas.width = window.innerWidth;
  envCanvas.height = window.innerHeight;
}
resizeCanvases();
window.addEventListener("resize", () => {
  resizeCanvases();
  setup(); // Re-initialize components on resize
});

/**
 * Initializes all simulation components.
 */
function setup() {
  const w = mainCanvas.width;
  const h = mainCanvas.height;

  // Initialize GPU Environment
  envGPU = new EnvironmentGPU(w, h, envCanvas);

  // Initialize Mycelial Network
  net = new MycelialNetwork();

  // Initialize Perlin Noise Generator
  perlin = new Perlin();

  // Calculate center coordinates
  const cx = w / 2;
  const cy = h / 2;

  // Initialize Growth Manager with reference to EnvironmentGPU
  growth = new GrowthManager(
    mainCtx,
    w,
    h,
    cx,
    cy,
    perlin,
    envGPU // Pass EnvironmentGPU instance
  );

  // Initialize the growth simulation
  growth.init();
}

/**
 * The main animation loop.
 */
function animate() {
  // 1. Update the nutrient environment (diffusion)
  envGPU.updateEnvironment();

  // 2. Render the nutrient environment onto its canvas
  envGPU.renderToCanvas();

  // 3. (Optional) Environment canvas is already rendered separately

  // 4. Update and draw the mycelial growth lines on the main canvas
  growth.updateAndDraw();

  // Continue the animation loop
  requestAnimationFrame(animate);
}

// Initial setup and start animation
setup();
animate();
