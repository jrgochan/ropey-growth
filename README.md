# Ropey Growth

A **TypeScript** + **HTML Canvas** visualization simulating **organic, mycelium-like growth** patterns, enhanced with **Perlin noise**. The code draws a network of filaments branching and curving outward, creating a dense, glowing web.

This project is ideal if you’re learning about procedural art, organic algorithms, or just want a fascinating, hypnotic background.

---

## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Project Structure](#project-structure)  
4. [Installation](#installation)  
5. [Scripts](#scripts)  
6. [How It Works](#how-it-works)  
   - [Core Concepts](#core-concepts)  
   - [Perlin Noise Integration](#perlin-noise-integration)  
   - [Organic Filament Drawing](#organic-filament-drawing)  
7. [Customization](#customization)  
8. [FAQ & Troubleshooting](#faq--troubleshooting)  
9. [License](#license)  

---

## Overview

**Ropey Growth** generates an **organic fungal or root-like** structure using a combination of:

- **HTML Canvas** for drawing.  
- **TypeScript** for type-safe code.  
- **Perlin Noise** for smoothly varying angles and wiggles, resulting in a more natural growth.  
- **A radial fade and subtle glow** to emphasize the branching filaments.  

It spawns **multiple main branches** from the center of the canvas, which in turn spawn **secondary branches** (and optionally, additional “filler” filaments), leading to a dense, interconnected network reminiscent of *rhizomorphic mycelium* or *tree roots*.

---

## Features

1. **Modular & Readable Code**  
   - Written in TypeScript with clear, typed classes and functions.

2. **High-Density Fill**  
   - The mycelium circle is highly filled, with minimal empty/black space in the interior.

3. **Perlin Noise Curvature**  
   - Branches gently curve and wiggle in a continuous, natural manner instead of purely random jitter.

4. **Branching**  
   - Main filaments randomly spawn secondary filaments. This mimics hyphal/mycelial growth.

5. **Density Control**  
   - A map tracks how many times each “cell” in the canvas has been drawn on, preventing extreme over-saturation in localized areas.

6. **Adjustable Parameters**  
   - You can easily tweak the number of branches, branch lengths, angles, colors, opacity, and more in the **TypeScript** code.

7. **Live Server & Watch Mode**  
   - Develop quickly with `lite-server` and `tsc -w` (watch mode), using `npm run dev`.

---

## Project Structure

A typical layout might look like this:

```
ropey-growth/
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── index.html
├── index.ts
└── (any additional .ts files, if desired)
```

### Key Files

- **`index.html`**  
  Simple HTML file including the compiled JavaScript or referencing the TypeScript output. This is what the browser loads.

- **`index.ts`**  
  The main TypeScript file containing the **Perlin noise** class, **canvas setup**, **filament drawing logic**, and **growth parameters**.

- **`package.json`**  
  Lists scripts and dependencies. Notable dev dependencies are:
  - `typescript` (for compiling TS to JS)
  - `lite-server` (lightweight dev server)
  - `concurrently` (to run `lite-server` + TS watch mode together)

- **`tsconfig.json`**  
  Contains TypeScript compiler options (e.g., target ES version, outDir, etc.).

- **`.gitignore`**  
  Specifies files/folders to ignore in version control (e.g. `node_modules/`, build artifacts, `.log` files).

---

## Installation

1. **Clone or Download**  
   - `git clone https://github.com/YourUsername/ropey-growth.git`  
   - Or download the zip and unzip into a local folder.

2. **Install Node.js** (if you haven’t already)  
   - You need at least Node 14+ (or ideally the current LTS).

3. **Install Dependencies**  
   Inside the project folder, run:
   ```bash
   npm install
   ```
   This installs TypeScript, lite-server, concurrently, etc.

---

## Scripts

In the `package.json`, we have multiple script commands:

- **`npm run build`**  
  Compiles the TypeScript source (`index.ts`) into JavaScript *one time*.  
  Uses the `tsc` (TypeScript compiler) under the hood.

- **`npm start`**  
  Launches `lite-server`, which serves the files in the current directory and automatically reloads if files change (HTML/CSS/JS).  
  This does **not** watch TypeScript changes by itself unless you’re re-compiling them.

- **`npm run dev`**  
  Runs **two processes** simultaneously using `concurrently`:
  1. `tsc -w` → Watch mode for TypeScript (auto recompile on .ts changes).  
  2. `lite-server` → Lightweight server with auto-reload for front-end files.  

  This is **the recommended** workflow for development. Just keep this running, edit `.ts` files, and your browser will reload the changes automatically.

- **`npm run serve`**  
  An optional script to serve your compiled `index.js` via Node’s `index.js` file (if you have one). In some setups, you might skip or remove this.

---

## How It Works

### Core Concepts

1. **Canvas Setup**  
   - A `<canvas>` element is created dynamically, filling the entire browser window.  
   - On **window resize**, the canvas is resized and the drawing is refreshed.

2. **Density Map**  
   - Each time a filament draws a pixel segment, we record it in a 2D grid (cell-based).  
   - If a cell becomes **too dense**, further drawing in that cell is stopped to avoid a white blob.

3. **Growth Radius**  
   - Everything is drawn inside a circle of radius `growthRadius`.  
   - Any filament stepping outside the circle stops immediately.

4. **Fade-Out Edge**  
   - A radial gradient is applied at the end, so the outer edges fade to black.  
   - Filaments also individually fade as they approach the boundary, creating a subtle transition.

### Perlin Noise Integration

- The **Perlin** class provides a `noise2D(x, y)` function returning a value in ~`[-1..1]`.
- Each step of a filament is influenced by **angle drift** and **wiggle** derived from these noise values. This ensures **smooth** curves rather than random “zig-zags.”

### Organic Filament Drawing

1. **Main Branches**  
   - Start from the canvas center.  
   - Typically have greater thickness and opacity.  
   - High chance to spawn secondary branches.

2. **Secondary Branches**  
   - Spawn from random points along a main branch.  
   - Usually thinner and slightly shorter.

3. **Filler Filaments**  
   - (If included in your code) Many short, faint lines placed throughout the circle to fill empty space.

The combination of branches and filler lines results in a **dense, overlapping** mesh.

---

## Customization

Here are some key variables in `index.ts` you might modify to personalize your growth pattern:

1. **`growthRadius`**  
   - Determines how large the growth area is (defaults to ~45% of the smaller browser dimension).

2. **Branching Parameters**  
   - `mainBranchCount`: Number of main trunks.  
   - `secondaryBranchChance`: Probability each main step spawns a secondary.  
   - `secondaryBranchAngleVariance`: Variation in angles for secondaries.  
   - `secondaryBranchDecay`: How the length of secondaries scales from main.  
   - `secondaryBranchSteps`: How many segments each secondary has.

3. **Filler Filaments**  
   - `fillerFilamentCount`: If you want fewer or more faint lines.  
   - `baseLineWidth` and `baseAlpha` in the `"filler"` branch of the code.

4. **Perlin Noise Settings**  
   - `PERLIN_SCALE`: Larger → slower changes, smaller → more rapid noise variation.  
   - `ANGLE_DRIFT_STRENGTH` & `WIGGLE_STRENGTH`: Increase for more wavy lines.

5. **Color**  
   - Currently using HSL near white (`hue=50±15`, `lightness=95`).  
   - Adjust hue, saturation, or alpha to get different filament colors.  
   - Or use a random color palette for a multi-colored look!

6. **Fading**  
   - `fadeStartRadiusFactor` & `fadeEndRadiusFactor`: Control how soon near the edge the filaments fade out.

7. **Shadow / Glow**  
   - `shadowBlurAmount` and `shadowColor`: Increase or decrease for more or less glowing effect.

---

## FAQ & Troubleshooting

1. **Why do I see no lines or an empty canvas?**  
   - Make sure you’re actually compiling TypeScript into JavaScript. Run `npm run dev` to watch changes.  
   - Confirm your browser’s dev console for any errors (F12).

2. **Where does the final JavaScript go?**  
   - By default, TypeScript will compile to `.js` in the same folder or in a `dist/` folder, depending on your `tsconfig.json`. Make sure `index.html` references the correct output script.

3. **The lines stop abruptly or I see partial filaments.**  
   - The density cap might be reached (`maxDensity` in a cell). Increase `maxDensity` if you want more overlapping lines.  
   - Or the branch might have gone beyond the `growthRadius` boundary.

4. **How to deploy this?**  
   - This is a front-end app. You can host it easily on GitHub Pages, Netlify, Vercel, or any static server. Just be sure to provide the compiled `.js` and the `index.html`.

5. **Can I remove Perlin noise and just do random?**  
   - Sure! Remove references to `noise2D` in `drawFilament` and use random angles. But you’ll lose the smooth, organic effect.

---

## License

This project is under the **MIT License**—you’re free to use, modify, and distribute it as you like. See the [`LICENSE`](LICENSE) file for details (or update the license field in `package.json` if needed).

---

**Enjoy exploring and customizing your own ropey, organic growth visualization!** If you have any questions or improvements, feel free to open an issue or pull request. Happy coding!