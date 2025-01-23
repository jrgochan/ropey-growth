/***************************************************
 * main.ts
 *
 * Entry point. Sets up the canvas, GrowthManager,
 * and runs the animation loop.
 ***************************************************/

import { GrowthManager } from "./Growth.js";
import { Perlin } from "./Perlin.js";
import { GROWTH_RADIUS_FACTOR } from "./constants.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

// Basic resize logic
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  // If you want to re-init each time, do so:
  growthManager = createGrowthManager();
  growthManager.init(5); // or preserve old state?
});

let growthManager: GrowthManager;

// Helper to create a new GrowthManager with updated width/height
function createGrowthManager() {
  const perlin = new Perlin();
  const w = canvas.width;
  const h = canvas.height;
  const r = Math.min(w, h) * GROWTH_RADIUS_FACTOR;

  return new GrowthManager(ctx, w, h, r, perlin);
}

// Initialize
growthManager = createGrowthManager();
growthManager.init(5);

// Animation loop
function animate() {
  growthManager.updateAndDraw();
  requestAnimationFrame(animate);
}

animate();
