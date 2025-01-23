/***************************************************
 * main.ts
 *
 * Entry point for rhizomorphic mycelium growth.
 ***************************************************/

import { GrowthManager, HyphaTip } from "./Growth.js";
import { Perlin } from "./Perlin.js";
import {
  GROWTH_RADIUS_FACTOR,
  MAIN_TRUNK_COUNT,
  MAIN_TRUNK_LIFE
} from "./constants.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

// Resize
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  setup();
});

let growthManager: GrowthManager;

// Set up the growth from scratch
function setup() {
  const w = canvas.width;
  const h = canvas.height;
  const r = Math.min(w, h) * GROWTH_RADIUS_FACTOR;

  const perlin = new Perlin();
  growthManager = new GrowthManager(ctx, w, h, r, perlin);

  // Create main trunk tips from center
  // Each trunk has large 'life' so it can reach edge
  // We space them around in a circle or random angles
  const centerX = w / 2;
  const centerY = h / 2;

  const mainTips: HyphaTip[] = [];
  for (let i = 0; i < MAIN_TRUNK_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    mainTips.push({
      x: centerX,
      y: centerY,
      angle,
      life: MAIN_TRUNK_LIFE,
      growthType: "main",
      depth: 0
    });
  }

  // Initialize
  growthManager.init(mainTips);
}

// Animation loop
function animate() {
  growthManager.updateAndDraw();
  requestAnimationFrame(animate);
}

setup();
animate();
