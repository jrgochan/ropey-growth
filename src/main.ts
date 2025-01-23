/***************************************************
 * main.ts
 *
 * Ties everything together:
 *  - Creates environment GPU
 *  - Creates MycelialNetwork
 *  - Creates GrowthManager
 *  - Runs an animation loop
 ***************************************************/

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { GrowthManager } from "./growth.js";
import { Perlin } from "./Perlin.js";
import { MAIN_BRANCH_COUNT } from "./constants.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  setup(); // re-init
});

// Global references
let envGPU: EnvironmentGPU;
let net: MycelialNetwork;
let growth: GrowthManager;
let perlin: Perlin;

function setup() {
  const w = canvas.width;
  const h = canvas.height;

  // GPU environment
  envGPU = new EnvironmentGPU(w, h);

  // Mycelial network
  net = new MycelialNetwork();

  // Perlin
  perlin = new Perlin();

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h);

  // Growth manager
  growth = new GrowthManager(
    ctx,
    canvas.width,
    canvas.height,
    cx,
    cy,
    perlin
  );

  // If GrowthManager's init() expects no arguments, call it with none:
  growth.init();
}

function animate() {
  growth.updateAndDraw();
  requestAnimationFrame(animate);
}

setup();
animate();
