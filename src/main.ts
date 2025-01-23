/***************************************************
 * main.ts
 *
 * Entry point for minimal lines example.
 ***************************************************/

import { GrowthManager } from "./growth.js";
import { Perlin } from "./perlin.js";

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
  setup();
});

let growth: GrowthManager;
let perlin: Perlin;

function setup() {
  perlin = new Perlin();
  growth = new GrowthManager(ctx, width, height, width/2, height/2, perlin);
  growth.init();
}

function animate() {
  growth.updateAndDraw();
  requestAnimationFrame(animate);
}

setup();
animate();
