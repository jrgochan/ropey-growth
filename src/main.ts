/***************************************************
 * main.ts
 *
 * Entry point. Creates environment, growth manager,
 * and runs the animation.
 ***************************************************/

import { EnvironmentGrid } from "./environment.js";
import { GrowthManager } from "./growth.js";
import { Perlin } from "./perlin.js";

import {
  GROWTH_RADIUS_FACTOR,
  MAIN_BRANCH_COUNT
} from "./constants.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  setup(); // re-init on resize
});

let env: EnvironmentGrid;
let growth: GrowthManager;
let perlin: Perlin;

function setup() {
  // environment
  env = new EnvironmentGrid(width, height);

  // perlin
  perlin = new Perlin();

  const centerX = width / 2;
  const centerY = height / 2;
  const r = Math.min(width, height) * GROWTH_RADIUS_FACTOR;

  growth = new GrowthManager(ctx, width, height, centerX, centerY, r, env, perlin);
  growth.init(MAIN_BRANCH_COUNT);
}

function animate() {
  growth.updateAndDraw();
  requestAnimationFrame(animate);
}

setup();
animate();
