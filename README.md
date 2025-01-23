Below is a **comprehensive** `README.md` describing your **iterative rhizomorphic mycelium** project in **excruciating detail**, from the **biology** behind hyphal growth, to the **code structure**, to **usage** instructions. Feel free to add or remove sections as you see fit.

---

# Rhizomorphic Mycelium Growth (Iterative Simulation)

A **TypeScript** project that simulates **mycelial filaments** (hyphae) growing radially outward in a *rhizomorphic* (root-like) pattern inside a **petri-dish-like circle**. The code uses an **iterative** step-by-step approach, with **Perlin noise** for smooth wiggles and branching rules to mimic real fungal growth—though simplified compared to true biological complexity.

## Table of Contents

1. [Overview](#overview)  
2. [Biological Background: How Real Mycelium Grows](#biological-background-how-real-mycelium-grows)  
   - [Mycelial Networks in Nature](#mycelial-networks-in-nature)  
   - [Hyphal Tip Growth](#hyphal-tip-growth)  
   - [Branching and Anastomosis](#branching-and-anastomosis)  
   - [Rhizomorphic vs. Cottony Growth](#rhizomorphic-vs-cottony-growth)
3. [Simulation Approach](#simulation-approach)  
   - [Main Trunks vs. Secondary Branches](#main-trunks-vs-secondary-branches)  
   - [Iterative Tip-Based Growth](#iterative-tip-based-growth)  
   - [Perlin Noise for Organic Curvature](#perlin-noise-for-organic-curvature)  
   - [Density Limiting (to Prevent Overcrowding)](#density-limiting-to-prevent-overcrowding)  
   - [Radial Fade & Visual Styling](#radial-fade--visual-styling)
4. [Project Structure](#project-structure)  
   - [Files & Folders](#files--folders)  
   - [Key Scripts](#key-scripts)
5. [Installation & Usage](#installation--usage)  
   - [1. Install Node & Dependencies](#1-install-node--dependencies)  
   - [2. Development Mode](#2-development-mode)  
   - [3. Build for Production](#3-build-for-production)  
6. [Parameters & Customization](#parameters--customization)  
   - [Filling the Dish More Thoroughly](#filling-the-dish-more-thoroughly)  
   - [Adjusting Visual Styles](#adjusting-visual-styles)  
   - [Performance Considerations](#performance-considerations)  
7. [Limitations & Future Extensions](#limitations--future-extensions)  
8. [License](#license)

---

## Overview

This project simulates **mycelium**—the vegetative part of a fungus—growing radially within a **circular boundary** (like a petri dish). It uses:

- **HTML Canvas** for rendering filaments.  
- **TypeScript** for safer, more organized code.  
- **Perlin Noise** to add wavy, organic motion to each hyphal tip.  
- **Iteration** via `requestAnimationFrame`: lines expand step-by-step, just like real hyphae grow outward over time.

**Rhizomorphic** mycelium typically appears **root-like**, with **thick, ropey main “trunks”** and **thinner side filaments** branching off to fill the substrate. This is particularly seen in species like **Psilocybe cubensis** or **Oyster mushrooms** when conditions favor strong, ropey growth.

---

## Biological Background: How Real Mycelium Grows

### Mycelial Networks in Nature
Fungi generally exist as **networks** of microscopic filamentous cells called **hyphae**. A collection of hyphae is called a **mycelium**. Mycelia:

- Extend outward to explore and digest nutrients.  
- Continuously branch, fusing and forming complex webs.

### Hyphal Tip Growth
A **hypha** primarily extends at its **tip**, which:

1. **Accumulates vesicles** (tiny compartments of building material).  
2. **Deposits** new cell wall at the apex, pushing outward.  
3. Can sense nutrients or environmental cues to steer growth direction.

### Branching and Anastomosis
- **Branching** occurs when a hypha spawns a new tip that grows off laterally.  
- **Anastomosis** is when two hyphae meet and fuse, sharing cytoplasm. This helps unify the network.

### Rhizomorphic vs. Cottony Growth
- **Rhizomorphic** growth is a term used in mycology to describe thick, rope-like strands, often more aggressive.  
- **Cottony** or “fluffy” mycelium is thinner, less ropey, and often less organized.  
- Rhizomorphs can transport water and nutrients more efficiently, forming visible cords or “mycelial highways.”

---

## Simulation Approach

Because real fungal growth is **extremely** complex (involving chemistry, branching rules, anastomosis, resource flow, etc.), we use a **simplified** model:

### Main Trunks vs. Secondary Branches
- We spawn **main trunk tips** from the dish center. They have:
  - **Higher opacity** (brighter, thicker lines).
  - **Longer lifespan**, ensuring they reach or approach the circular boundary.
- Whenever a main trunk **grows** (each frame), there’s a chance to spawn **secondary** tips:
  - Thinner, fainter lines.
  - Less overall life, so they fill the gaps but do not overshadow the main structures.

### Iterative Tip-Based Growth
- Each **hypha tip** has `(x, y, angle, life)`:
  - **`(x, y)`**: current position.
  - **`angle`**: current direction in radians.
  - **`life`**: how many steps remain before this tip “dies” or stops.
- On each animation frame:
  1. **Move** the tip forward a small distance (`STEP_SIZE`).  
  2. **Optionally branch** (only if it’s a main trunk within certain depth).  
  3. **Stop** if the tip leaves the dish or the area is overcrowded.  
  4. **Draw** a line segment from the old position to the new.

### Perlin Noise for Organic Curvature
Rather than moving in a straight line or purely random jitter, each tip’s angle is **perturbed** by **Perlin noise**:

1. A noise value at `(x * PERLIN_SCALE, y * PERLIN_SCALE)` modifies the current angle slightly.  
2. Another noise value adds a **perpendicular “wiggle”** to the motion.  
3. This results in a **smooth, meandering** path instead of jagged randomness.

### Density Limiting (to Prevent Overcrowding)
- A **densityMap** records how many lines have passed through each small cell in the canvas.  
- If a tip enters a cell at or above `MAX_DENSITY`, it stops (dies).  
- Real hyphae might instead anastomose or fan out, but we keep it simpler by halting tips in overused areas.

### Radial Fade & Visual Styling
- Lines approaching the dish edge **fade** in alpha.  
- A **radial gradient** can darken the edges, so filaments appear to vanish into darkness.  
- **Shadow/Glow**: each line can have a slight **shadow blur** to create a “glowing” effect.

---

## Project Structure

Your directory:

```
ropey-growth/
├── package.json
├── tsconfig.json
├── index.html
├── .gitignore
└── src
    ├── constants.ts
    ├── Perlin.ts
    ├── Growth.ts
    └── main.ts
```

**File Descriptions**:

1. **`package.json`**  
   - Lists dev dependencies (`typescript`, `lite-server`, `concurrently`) and scripts (`build`, `dev`, `start`).  
   - `"type": "module"` ensures Node uses ES modules.

2. **`tsconfig.json`**  
   - Tells TypeScript to look for `.ts` in `src/`, output `.js` to `dist/`, and compile using ES2020 features.

3. **`index.html`**  
   - A minimal HTML page referencing `dist/main.js`.  
   - `<canvas>` is created dynamically in code, so no `<canvas>` tag is needed here.

4. **`.gitignore`**  
   - Ignores `node_modules`, build artifacts (`dist`), and OS/editor temp files.

5. **`src/constants.ts`**  
   - Stores all **tunable parameters**: dish radius factor, stepping distance, line widths, colors, etc.  
   - Easier to tweak fill coverage, brightness, or density constraints in one place.

6. **`src/Perlin.ts`**  
   - The **Perlin noise** class, providing `noise2D(x, y)` → smooth, coherent noise in `[ -1 .. +1 ]`.

7. **`src/Growth.ts`**  
   - Houses the **GrowthManager** class, which:
     - Maintains the array of **hypha tips**.  
     - Manages the **densityMap** for collisions.  
     - Provides `updateAndDraw()` for each animation frame.  
     - Spawns main trunks vs. secondary branches with different thickness and alpha.

8. **`src/main.ts`**  
   - The **entry point**: sets up the canvas, re-sizes on window change, and calls `GrowthManager` to start/stop.  
   - Spawns an initial set of **main trunk** tips at the center, each angled randomly.  
   - Schedules an animation loop with `requestAnimationFrame`.

---

## Key Scripts

In `package.json`, we typically have:

- **`"build"`**: Runs the TypeScript compiler one time.
- **`"dev"`**: Runs both `tsc -w` (watch mode) and `lite-server`, auto-reloading the page on changes.
- **`"start"`**: Simply runs `lite-server`, serving `index.html` and `dist/` if you’ve already built.

---

## Installation & Usage

### 1. Install Node & Dependencies

- [Install Node.js](https://nodejs.org/en/) if you haven’t already (v14+ recommended).  
- Navigate to your project folder and run:

```bash
npm install
```

This installs TypeScript, lite-server, concurrently, etc.

### 2. Development Mode

```bash
npm run dev
```
- **`tsc -w`** watches `.ts` files in `src/`, automatically recompiling on change.  
- **`lite-server`** launches a local dev server (usually at http://localhost:3000).  
- **Hot Reload**: Every time you edit a `.ts` file, the site reloads.

### 3. Build for Production

```bash
npm run build
```
- Generates compiled `.js` in `dist/`.  
- You can then serve `index.html` + `dist/main.js` from any static server (e.g., Netlify, GitHub Pages, etc.).

---

## Parameters & Customization

Inside **`constants.ts`**, you can tune:

- **`MAIN_TRUNK_COUNT`**: How many thick spokes emanate from the center.  
- **`MAIN_TRUNK_LIFE`**: Lifespan of main trunks (longer => easily reach dish edge).  
- **`MAX_SECONDARY_DEPTH`**: How many times secondaries can further branch.  
- **`SECONDARY_BRANCH_CHANCE`**: Probability each trunk step spawns a secondary.  
- **`PERLIN_SCALE`**, **`ANGLE_DRIFT_STRENGTH`**, **`WIGGLE_STRENGTH`**: Control how wiggly or curved the lines get.  
- **`MAIN_LINE_WIDTH`** vs. **`SECONDARY_LINE_WIDTH`**: Thicker vs. thinner filaments.  
- **`MAIN_ALPHA`** vs. **`SECONDARY_ALPHA`**: More opaque vs. fainter branches.  
- **`BASE_HUE`**, **`BASE_LIGHTNESS`**: Shift the color from whitish to another hue.  
- **`BACKDROP_ALPHA`**: If you want an afterimage effect (fade older lines), set a small alpha. If you want lines to remain crisp permanently, set it to `0`.

### Filling the Dish More Thoroughly
- Increase **`MAIN_TRUNK_COUNT`** or **`SECONDARY_BRANCH_CHANCE`**.  
- Increase **`MAX_SECONDARY_DEPTH`** to allow deeper branching.  
- Decrease **`MAX_DENSITY`** if you don’t want indefinite overlap; or **increase** it to allow many lines in the same area.

### Adjusting Visual Styles
- **`BASE_HUE`** around `50` is a slight yellowish-white. Try `0` for red, `220` for bluish, etc.  
- **`FADE_START_FACTOR`**: If you want less fading near the edge, set it lower (like 0.95 → fade only in final 5% of radius).  
- **Shadow** and **Glow**: adjust **`SHADOW_BLUR`** and **`SHADOW_COLOR`**.

### Performance Considerations
- High branching can produce thousands of tips, slowing down the animation.  
- You may want to:
  - Cap the total number of tips.  
  - Lower `branchChance`.  
  - Shorten `maxLife`.  

---

## Limitations & Future Extensions

- **Real Hyphal Fusion**: Actual mycelium often undergoes **anastomosis** (hyphae fusing). We simply stop lines if they become too dense. A more advanced approach might fuse them into a single network node.  
- **Nutrient Gradients**: Real fungi grow toward nutrient sources, slow in barren areas. We do not model resource flow.  
- **3D Substrates**: Mycelium is inherently 3D. Our simulation is strictly 2D on the canvas.  
- **Environmental Factors**: Temperature, moisture, competition, etc., not included.  
- **Exact Rhizomorphic Shapes**: While we produce rope-like trunks, actual species have varied morphologies influenced by genetics and environment.

Despite these simplifications, the simulation captures a **visually compelling** approximation of **rhizomorphic** expansion, with **thick central cords** and **fainter** side filaments.

---

## License

Licensed under the **MIT License**—you’re free to use, modify, and distribute this code. For details, see the `LICENSE` file or [choosealicense.com](https://choosealicense.com/licenses/mit/).

---

**Enjoy experimenting** with these parameters to achieve the exact ropey, radial growth you envision. If you have further questions or improvements—like incorporating more realistic biological rules—feel free to open an issue or pull request. Happy mycelium-growing!