Below is a **comprehensive** `README.md` describing the **iterative rhizomorphic mycelium** project that incorporates **resource flow**, **anastomosis**, **nutrient consumption**, and **environment gradients**, aiming to be more **biologically informed** than simpler static line approaches.

---

# Advanced Rhizomorphic Mycelium Simulation

This project models **mycelial growth** with a more **biologically informed** approach than standard static line drawings. It includes:

- **Nutrient & Moisture Grid**: Each cell has resource levels that can be consumed.  
- **Mycelial Network Graph**: Each hyphal tip is a node; edges form hyphal segments, and resource flows along them.  
- **Anastomosis (Fusion)**: Tips that approach existing nodes merge networks instead of overlapping.  
- **Resource-Based Growth**: Tips require nutrient to continue living; if starved, they die off.  
- **Perlin Noise** for meandering, root-like filaments, creating a visually rhizomorphic pattern.

---

## Table of Contents

1. [Biological Background](#biological-background)  
2. [How This Simulation Works](#how-this-simulation-works)  
3. [Project Structure](#project-structure)  
4. [Installation & Running](#installation--running)  
5. [Key Tunable Parameters](#key-tunable-parameters)  
6. [Future Extensions](#future-extensions)

---

## Biological Background

### Fungal Mycelium
A **mycelium** is a network of **hyphae**—microscopic filaments growing from spores. Real mycelia:

- Extend outward searching for nutrients.  
- Fuse branches (anastomosis) to unify the network.  
- Transport resources to support active tips.  

### Nutrient & Moisture
Fungi rely on **external** absorption:
- Secrete enzymes, **digest** surroundings, **absorb** products.  
- Need adequate **moisture** and **nutrients**.  
- Grow vigorously in resource-rich spots; stall or die in depleted areas.

### Rhizomorphic Growth
**Rhizomorphic** mycelium forms *thick, ropey cords* sometimes spanning large distances.  
- More efficient transport, reminiscent of plant roots.  
- Often arises under conditions favoring fast colonization or when resources are patchy.

---

## How This Simulation Works

1. **Environment Grid**  
   - A 2D array of **cells**, each with `nutrient` and `moisture`.  
   - Minimal “diffusion” or replenishment each frame (very simplified).  
   - Hypha tips **consume** local nutrient at a small rate.

2. **Mycelial Network (Graph)**  
   - Each hyphal node has `(x,y)`, a resource store, and links to neighbors.  
   - **Edges** represent actual hypha segments.  
   - **Resource Flow** along edges tries to equalize node resources.  
   - If a node is starved (resource too low), growth from it halts.

3. **GrowthManager**  
   - Maintains an array of **active tips**.  
   - Each tip references a node ID in the MycelialNetwork, plus an **angle**, `life`, and `depth`.  
   - On each frame:
     1. **Flow resources** in the network.  
     2. **Update environment** (diffusion).  
     3. **Move** each tip a step.  
        - If it’s near an existing node, **fuse** (anastomosis).  
        - Else create a new node.  
        - Connect them with an edge.  
     4. **Consume** environment nutrient → add to node resource.  
     5. **Draw** a line segment.  
     6. Potentially **spawn** a new branch (secondary).

4. **Anastomosis**  
   - Before creating a new node, each tip checks if `(x, y)` is within a certain radius of an existing node.  
   - If yes, it merges (fuses) there, unifying the network.

5. **Rendering**  
   - **Main** vs. **Secondary** lines have different thickness & opacity.  
   - Slight color variation per segment for an organic look.  
   - Fade near the outer radius to mimic a petri-dish boundary.

---

## Project Structure

```
ropey-growth/
├── package.json
├── tsconfig.json
├── index.html
├── .gitignore
└── src
    ├── constants.ts         // All adjustable parameters
    ├── Perlin.ts            // Perlin noise class
    ├── environment.ts       // 2D grid of resource
    ├── mycelialNetwork.ts   // Graph structure of hypha nodes
    ├── growth.ts            // Iterative logic: anastomosis, resource consumption
    └── main.ts              // Entry point: sets up, runs animation
```

- **`environment.ts`**: Each cell has `nutrient`, updates slightly each tick; tips call `consumeResource()`.  
- **`mycelialNetwork.ts`**: Nodes + edges, plus `flowResources()` to share node resource.  
- **`growth.ts`**: The “brains” of iteration, bridging environment + network. Manages “tips,” merges them into the graph.  
- **`main.ts`**: Creates the environment, network, growth manager, runs animation with `requestAnimationFrame`.

---

## Installation & Running

1. **Clone or Download** the project folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Development Mode**:
   ```bash
   npm run dev
   ```
   - This runs `tsc -w` (watch mode) + `lite-server` for live reloading on http://localhost:3000.
4. **Build Only**:
   ```bash
   npm run build
   ```
   - Outputs compiled JavaScript to `dist/`.

---

## Key Tunable Parameters

Inside [`constants.ts`](./src/constants.ts), you’ll find variables controlling:

- **Dish Size**: `GROWTH_RADIUS_FACTOR` sets the circular boundary.  
- **Main / Secondary**: `MAIN_BRANCH_COUNT`, `BRANCH_CHANCE`, `MAX_BRANCH_DEPTH`.  
- **Environment**: `BASE_NUTRIENT`, `NUTRIENT_DIFFUSION`, `ENV_GRID_CELL_SIZE`.  
- **Anastomosis**: `ANASTOMOSIS_RADIUS` for fusing tips with existing nodes.  
- **Resource Flow**: `RESOURCE_FLOW_RATE`, controlling how quickly node resources equalize.  
- **Appearance**: `MAIN_LINE_WIDTH`, `MAIN_ALPHA` vs. `SECONDARY_LINE_WIDTH`, `SECONDARY_ALPHA`, hue shifts, etc.  
- **Perlin Noise**: `PERLIN_SCALE`, `ANGLE_DRIFT_STRENGTH`, `WIGGLE_STRENGTH`—influencing how wavy the hyphae become.

Experiment to see how more or less resource, bigger or smaller `ANASTOMOSIS_RADIUS`, or stronger Perlin `ANGLE_DRIFT_STRENGTH` changes the result.

---

## Future Extensions

- **3D Substrate**: Model real volumetric growth, requiring a 3D environment grid.  
- **More Complex Resource**: If you want a PDE-based approach for nutrient diffusion, you’d implement multi-step partial differential equations.  
- **Fusing Edges**: Currently, we anastomose at nodes only. Real hypha can also fuse along segments.  
- **Branching Heuristics**: Let tips sense resource gradients more accurately, branching more in high-nutrient zones.  
- **Hyphal Thickening**: If a certain edge gets a lot of resource flow, increase line width visually to mimic cord formation.

Despite these limitations, this project offers a **richer** approximation of actual fungal growth than a simple static filament drawing—illustrating **resource-based** growth, **anastomosis**, and **iterative** tip movement.

Enjoy experimenting with these parameters to achieve the exact ropey, radial growth you envision. If you have further questions or ideas for improvements—like more advanced resource diffusion or 3D expansions—feel free to open an issue or submit a pull request. Happy mycelium-growing!
