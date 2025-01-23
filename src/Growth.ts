/***************************************************
 * growth.ts
 *
 * Main iterative logic bridging environment + network:
 * - Manages an array of 'tips' (active hyphal ends)
 * - Each tip references a node in MycelialNetwork
 * - Moves step-by-step, consumes nutrients, 
 *   can fuse with existing nodes (anastomosis), 
 *   and draws lines for each new segment.
 *
 * Updated to include GROWTH_SPEED_MULTIPLIER so
 * you can dramatically speed up the outward spread.
 ***************************************************/

import { EnvironmentGrid } from "./environment.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { Perlin } from "./perlin.js";

import {
  // Growth rate & life
  STEP_SIZE,
  GROWTH_SPEED_MULTIPLIER,  // NEW parameter to speed up growth

  BASE_LIFE,
  BRANCH_DECAY,
  BRANCH_CHANCE,
  MAX_BRANCH_DEPTH,
  ANASTOMOSIS_RADIUS,

  // Perlin
  PERLIN_SCALE,
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,

  // Rendering & environment
  BACKGROUND_ALPHA,
  SHADOW_BLUR,
  SHADOW_COLOR,
  MAIN_LINE_WIDTH,
  SECONDARY_LINE_WIDTH,
  MAIN_ALPHA,
  SECONDARY_ALPHA,
  BASE_HUE,
  BASE_LIGHTNESS,
  FADE_START_FACTOR,
  FADE_END_FACTOR,
  NUTRIENT_CONSUMPTION_RATE

} from "./constants.js";

// We distinguish "main" vs. "secondary" tips for coloring, thickness, etc.
export type GrowthType = "main" | "secondary";

/**
 * HyphaTip:
 * - nodeId: which node in MycelialNetwork it corresponds to
 * - angle: current direction (radians)
 * - life: how many steps remain
 * - depth: how many times we branched from the original trunk
 * - growthType: "main" or "secondary"
 */
export interface HyphaTip {
  nodeId: number;
  angle: number;
  life: number;
  depth: number;
  growthType: GrowthType;
}

/**
 * GrowthManager:
 * - Holds an array of HyphaTip
 * - Each frame, does:
 *   1) Flow resources in the MycelialNetwork
 *   2) Update environment (diffuse nutrients)
 *   3) For each tip: move forward (with Perlin-based drift), 
 *      anastomose or create node, consume resources
 *   4) Draw the line segment
 *   5) Possibly spawn new branches
 */
export class GrowthManager {
  private tips: HyphaTip[] = [];

  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private centerX: number,
    private centerY: number,
    private growthRadius: number,
    private environment: EnvironmentGrid,
    private network: MycelialNetwork,
    private perlin: Perlin
  ) {}

  /**
   * init():
   * Clears old data, spawns main trunk tips at the center.
   * mainBranchCount => how many main trunks.
   */
  public init(mainBranchCount: number) {
    this.tips = [];

    // Fill background
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Create main trunk tips + corresponding node in the network
    for (let i = 0; i < mainBranchCount; i++) {
      const angle = Math.random() * Math.PI * 2;

      // Create a node in the center for each trunk
      const nodeId = this.network.createNode(this.centerX, this.centerY);
      this.tips.push({
        nodeId,
        angle,
        life: BASE_LIFE,
        depth: 0,
        growthType: "main"
      });
    }
  }

  /**
   * updateAndDraw():
   * Called each animation frame:
   * 1) Flow resources in the network
   * 2) Update environment
   * 3) Slight fade of old lines
   * 4) Move each tip, check collisions/anastomosis, consume resource
   * 5) Possibly spawn branches
   * 6) Prune dead tips
   */
  public updateAndDraw() {
    // 1) Flow resources in the MycelialNetwork
    this.network.flowResources();

    // 2) Update environment (nutrient diffusion)
    this.environment.updateEnvironment();

    // 3) Slightly fade previous frame => ghost effect
    this.ctx.fillStyle = `rgba(0,0,0,${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Setup glow / shadow
    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    const newTips: HyphaTip[] = [];

    // 4) Move each tip
    for (let i = 0; i < this.tips.length; i++) {
      const tip = this.tips[i];
      if (tip.life <= 0) continue;

      // Get the node from the MycelialNetwork
      const node = this.network.getNode(tip.nodeId);
      if (!node) continue;

      const oldX = node.x;
      const oldY = node.y;

      // Perlin-based angle drift
      const noiseVal = this.perlin.noise2D(node.x * PERLIN_SCALE, node.y * PERLIN_SCALE);
      tip.angle += noiseVal * ANGLE_DRIFT_STRENGTH;

      // Perlin-based perpendicular wiggle
      const noiseVal2 = this.perlin.noise2D(
        (node.x + 1000) * PERLIN_SCALE,
        (node.y + 1000) * PERLIN_SCALE
      );
      const wiggle = noiseVal2 * WIGGLE_STRENGTH;

      // ***** Enhanced Growth Factor *****
      // Multiply the movement by GROWTH_SPEED_MULTIPLIER to speed up expansion
      const movement = STEP_SIZE * GROWTH_SPEED_MULTIPLIER;

      // Move forward
      const stepX = node.x
        + Math.cos(tip.angle) * movement
        + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2 * GROWTH_SPEED_MULTIPLIER;

      const stepY = node.y
        + Math.sin(tip.angle) * movement
        + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2 * GROWTH_SPEED_MULTIPLIER;

      // Check boundary (petri-dish radius)
      const dist = Math.hypot(stepX - this.centerX, stepY - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // Attempt anastomosis: see if there's an existing node near (stepX, stepY)
      const nearNodeId = this.findNodeCloseTo(stepX, stepY, ANASTOMOSIS_RADIUS);
      let newNodeId: number;
      if (nearNodeId >= 0) {
        // fuse with that node
        newNodeId = nearNodeId;
      } else {
        // create a new node in the network at (stepX, stepY)
        newNodeId = this.network.createNode(stepX, stepY);
      }

      // connect old node to new node
      this.network.connectNodes(tip.nodeId, newNodeId);

      // update tip's node reference
      tip.nodeId = newNodeId;

      // reduce life
      tip.life--;

      // consume environment resource (nutrient)
      const consumed = this.environment.consumeResource(stepX, stepY, NUTRIENT_CONSUMPTION_RATE);
      // add to the node's resource
      const cNode = this.network.getNode(newNodeId);
      if (cNode) {
        cNode.resource += consumed;
        // if resource is too low => starve
        if (cNode.resource < 0.1) {
          tip.life = 0;
        }
      }

      // Draw the line segment
      this.drawSegment(oldX, oldY, stepX, stepY, tip, dist);

      // Possibly spawn a new branch
      if (
        tip.growthType === "main" &&
        tip.depth < MAX_BRANCH_DEPTH &&
        Math.random() < BRANCH_CHANCE
      ) {
        // new angle offset
        const branchAngle = tip.angle + (Math.random() - 0.5) * Math.PI;
        newTips.push({
          nodeId: newNodeId,
          angle: branchAngle,
          life: tip.life * BRANCH_DECAY,
          depth: tip.depth + 1,
          growthType: "secondary"
        });
      }
    }

    // Add newly spawned tips
    this.tips.push(...newTips);

    // remove dead tips
    this.tips = this.tips.filter(t => t.life > 0);
  }

  /**
   * Look for an existing node in MycelialNetwork within `radius` of (x,y).
   * If found, return nodeId; else return -1.
   */
  private findNodeCloseTo(x: number, y: number, radius: number): number {
    const allNodes = this.network.getAllNodes();
    for (const n of allNodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < radius) {
        return n.id;
      }
    }
    return -1;
  }

  /**
   * Draw the line segment from old to new point, 
   * with styling based on main/secondary growth.
   */
  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    tip: HyphaTip,
    distFromCenter: number
  ) {
    let lineWidth = 1;
    let alpha = 0.5;

    if (tip.growthType === "main") {
      lineWidth = MAIN_LINE_WIDTH;
      alpha = MAIN_ALPHA;
    } else {
      lineWidth = SECONDARY_LINE_WIDTH;
      alpha = SECONDARY_ALPHA;
    }

    // fade near the dish edge
    let fadeFactor = 1;
    const fadeStart = this.growthRadius * FADE_START_FACTOR;
    const fadeEnd   = this.growthRadius * FADE_END_FACTOR;
    if (distFromCenter > fadeStart) {
      fadeFactor = 1 - (distFromCenter - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }
    alpha *= fadeFactor;

    // Slight random hue shift
    const hueShift = Math.floor(Math.random() * 30) - 15;
    const hue = BASE_HUE + hueShift;

    this.ctx.strokeStyle = `hsla(${hue}, 20%, ${BASE_LIGHTNESS}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();
  }
}
