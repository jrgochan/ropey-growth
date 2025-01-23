/***************************************************
 * main.ts
 *
 * Integrates EnvironmentGPU, MycelialNetwork, and GrowthManager.
 * - Initializes all components
 * - Manages the animation loop
 * - Adds a toggle for nutrient canvas rendering modes
 ***************************************************/

import { EnvironmentGPU } from "./environmentGPU.js"; // Correct named import
import { MycelialNetwork } from "./mycelialNetwork.js"; // Ensure this is implemented
import { GrowthManager } from "./growth.js";
import { Perlin } from "./Perlin.js";
import {
  MAIN_BRANCH_COUNT,
  ENV_GRID_CELL_SIZE,
} from "./constants.js";

// Create the main canvas for mycelial growth and append it to the document body
const mainCanvas = document.createElement("canvas");
const mainCtx = mainCanvas.getContext("2d")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(mainCanvas);

// Create Environment Canvas (Off-Screen)
const envCanvas = document.createElement("canvas"); // Off-screen canvas
// Do not append envCanvas to document.body
envCanvas.width = window.innerWidth;
envCanvas.height = window.innerHeight;

// Create Picture-in-Picture (PiP) Canvas (Overlay Mode)
const pipCanvas = document.createElement("canvas");
pipCanvas.width = 200; // Fixed size for PiP
pipCanvas.height = 200;
pipCanvas.style.position = "absolute";
pipCanvas.style.top = "10px"; // Positioning for PiP
pipCanvas.style.right = "10px";
pipCanvas.style.width = "200px"; // Fixed size for PiP
pipCanvas.style.height = "200px";
pipCanvas.style.zIndex = "3"; // Above mainCanvas
pipCanvas.style.border = "2px solid white"; // Optional styling
pipCanvas.style.boxSizing = "border-box"; // Ensure border is included in size
pipCanvas.style.display = "none"; // Initially hidden
document.body.appendChild(pipCanvas);

// Initialize canvas sizes
function resizeCanvases() {
  mainCanvas.width = window.innerWidth;
  mainCanvas.height = window.innerHeight;
  envCanvas.width = window.innerWidth;
  envCanvas.height = window.innerHeight;
  pipCanvas.width = 200; // Fixed size for PiP
  pipCanvas.height = 200;
}
resizeCanvases();
window.addEventListener("resize", () => {
  resizeCanvases();
  setup(); // Re-initialize components on resize
});

// Create Toggle UI Element
const toggleContainer = document.createElement("div");
toggleContainer.style.position = "absolute";
toggleContainer.style.top = "10px";
toggleContainer.style.left = "10px";
toggleContainer.style.zIndex = "4"; // Above pipCanvas
toggleContainer.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
toggleContainer.style.padding = "10px";
toggleContainer.style.borderRadius = "5px";
toggleContainer.style.fontFamily = "Arial, sans-serif";
toggleContainer.style.fontSize = "14px";
toggleContainer.style.color = "#000";
toggleContainer.style.userSelect = "none"; // Prevent text selection

const toggleLabel = document.createElement("label");
toggleLabel.innerText = "Enable Picture-in-Picture Mode: ";
toggleLabel.style.cursor = "pointer";

const toggleCheckbox = document.createElement("input");
toggleCheckbox.type = "checkbox";
toggleCheckbox.style.marginRight = "5px";

toggleLabel.prepend(toggleCheckbox);
toggleContainer.appendChild(toggleLabel);
document.body.appendChild(toggleContainer);

// Initialize EnvironmentGPU, MycelialNetwork, and GrowthManager
let envGPU: EnvironmentGPU;
let network: MycelialNetwork;
let growth: GrowthManager;
let perlin: Perlin;

// Toggle State
let isPiPMode: boolean = false; // Default to Overlay Mode

/**
 * Initializes all simulation components.
 */
function setup() {
  const w = mainCanvas.width;
  const h = mainCanvas.height;

  // Initialize Perlin Noise Generator
  perlin = new Perlin();

  // Initialize GPU Environment
  envGPU = new EnvironmentGPU(w, h, envCanvas);

  // Initialize Mycelial Network
  network = new MycelialNetwork();

  // Initialize Growth Manager with reference to EnvironmentGPU and MycelialNetwork
  const cx = w / 2;
  const cy = h / 2;
  growth = new GrowthManager(
    mainCtx,
    w,
    h,
    cx,
    cy,
    perlin,
    envGPU,   // Pass EnvironmentGPU instance
    network   // Pass MycelialNetwork instance
  );

  // Initialize the growth simulation
  growth.init();
}

/**
 * Handles the toggle between Overlay and Picture-in-Picture modes.
 */
function handleToggle() {
  isPiPMode = toggleCheckbox.checked;

  if (isPiPMode) {
    // PiP Mode: Show Environment in PiP Canvas
    pipCanvas.style.display = "block";
    drawPiP();
  } else {
    // Overlay Mode: Hide PiP Canvas and draw environment on mainCanvas
    pipCanvas.style.display = "none";
    envGPU.drawEnvOnTargetContext(mainCtx, mainCanvas.width, mainCanvas.height);
  }
}

/**
 * Draws the Environment in PiP Canvas.
 */
function drawPiP() {
  const pipCtx = pipCanvas.getContext("2d")!;
  if (!pipCtx) return;

  // Clear PiP Canvas
  pipCtx.clearRect(0, 0, pipCanvas.width, pipCanvas.height);

  // Draw the environment onto PiP Canvas
  envGPU.drawEnvOnTargetContext(pipCtx, pipCanvas.width, pipCanvas.height);
}

/**
 * The main animation loop.
 */
function animate() {
  // 1. Update the nutrient environment (diffusion)
  envGPU.updateEnvironment();

  // 2. Render the nutrient environment onto its canvas
  envGPU.renderToCanvas();

  if (isPiPMode) {
    // 3a. PiP Mode: Draw environment onto pipCanvas
    drawPiP();
  } else {
    // 3b. Overlay Mode: Draw environment onto mainCanvas
    envGPU.drawEnvOnTargetContext(mainCtx, mainCanvas.width, mainCanvas.height);
  }

  // 4. Update and draw the mycelial growth lines on the main canvas
  growth.updateAndDraw();

  // 5. Continue the animation loop
  requestAnimationFrame(animate);
}

// Event Listener for Toggle
toggleCheckbox.addEventListener("change", handleToggle);

// Initial setup and start animation
setup();
animate();
