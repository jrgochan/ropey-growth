/***************************************************
 * main.ts
 *
 * The entry point: sets up the environment grid, 
 * mycelial network, growth manager, & animation.
 ***************************************************/

import { EnvironmentGrid } from "./environment.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { GrowthManager } from "./growth.js";
import { Perlin } from "./Perlin.js";
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
  setup();  // re-init on resize
});

let env: EnvironmentGrid;
let net: MycelialNetwork;
let growth: GrowthManager;
let perlin: Perlin;

function setup() {
  // Create environment
  env = new EnvironmentGrid(width, height);

  // Create MycelialNetwork
  net = new MycelialNetwork();

  // Create Perlin
  perlin = new Perlin();

  const centerX = width / 2;
  const centerY = height / 2;
  const r = Math.min(width, height) * GROWTH_RADIUS_FACTOR;

  // Create GrowthManager
  growth = new GrowthManager(
    ctx,
    width,
    height,
    centerX,
    centerY,
    r,
    env,
    net,
    perlin
  );

  // Initialize with main branches at center
  growth.init(MAIN_BRANCH_COUNT);
}

function animate() {
  growth.updateAndDraw();
  requestAnimationFrame(animate);
}

setup();
animate();
