/***************************************************
 * main.ts
 *
 * The root entry for our ropey growth app. 
 * Sets up the canvas, calls draw logic.
 ***************************************************/

import { Perlin } from "./Perlin.js";
import { drawFilament, clearDensityMap, FilamentContext } from "./Filament.js";
import {
  GROWTH_RADIUS_FACTOR,
  MAIN_BRANCH_COUNT,
  BASE_BRANCH_FACTOR,
  GRADIENT_INNER_OPACITY,
  GRADIENT_OUTER_OPACITY
} from "./constants.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Failed to obtain CanvasRenderingContext2D.");
}

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create Perlin instance
const perlin = new Perlin();

// We define the maximum radius for drawing
const maxDrawRadius = Math.min(canvas.width, canvas.height) * GROWTH_RADIUS_FACTOR;

// Build the FilamentContext
const filamentCtx: FilamentContext = {
  ctx,
  width: canvas.width,
  height: canvas.height,
  maxDrawRadius,
  perlin
};

// Main function to render
function drawOrganicMycelium() {
  // Clear density
  clearDensityMap();

  // Fill the background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Draw each main branch
  for (let i = 0; i < MAIN_BRANCH_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Enough length to exceed radius
    const initialLength = maxDrawRadius * 1.2;

    drawFilament(filamentCtx, centerX, centerY, angle, initialLength, BASE_BRANCH_FACTOR, 1, "main");
  }

  // Final radial gradient overlay
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    maxDrawRadius * 0.8,
    centerX,
    centerY,
    maxDrawRadius
  );
  gradient.addColorStop(0, `rgba(0, 0, 0, ${GRADIENT_INNER_OPACITY})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${GRADIENT_OUTER_OPACITY})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Handle window resizing
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Update our context
  filamentCtx.width = canvas.width;
  filamentCtx.height = canvas.height;
  filamentCtx.maxDrawRadius = Math.min(canvas.width, canvas.height) * GROWTH_RADIUS_FACTOR;

  drawOrganicMycelium();
});

// Initial draw
drawOrganicMycelium();
