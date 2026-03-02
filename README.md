# Pizza Dough Calculator

A small React single-page app for calculating pizza dough weights and showing process steps for Neapolitan and New York dough styles.

The app is driven by JSON configuration rather than hard-coded recipe branches. Style formulas, fermentation timelines, preferment options, oven adjustments, dough sizes, and instruction steps all live in one place and are loaded at app startup for instant calculations.

## What It Does

- Calculates ingredient weights in grams from dough ball size and pizza count
- Supports Neapolitan and New York formulas
- Supports room-temp and cold-ferment timelines
- Adjusts yeast for room-temperature ferments based on the selected ambient room temperature
- Adjusts hydration guidance based on oven temperature
- Supports optional poolish preferment with standard and express modes
- Splits the recipe into `Poolish` and `Main Mix` when preferment is enabled
- Renders typed instruction steps as a timeline
- Stores the current calculator state in the URL for sharing

## Tech Stack

- React 18
- Vite 5
- Plain CSS
- JSON-based recipe/config data

## Getting Started

### Requirements

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

### Production Build

```bash
npm run build
```

The production output is written to `dist/`.

### Preview the Production Build

```bash
npm run preview
```

## Deployment

This repo no longer includes GitHub Actions deployment.

If you want automatic deploys, connect the repository directly in Cloudflare and use the normal Vite build:

- Build command: `npm run build`
- Build output directory: `dist`

The repo still includes [wrangler.jsonc](/Users/andrewmaledy/Personal/pizza-calculator/wrangler.jsonc) for Cloudflare-compatible asset deployment if you want to deploy manually with Wrangler.

## Project Structure

```text
src/
  App.jsx                  Main UI and state management
  calculations.js          Dough math and environment adjustments
  calculator-config.json   Styles, timelines, sizes, oven rules, preferment options
  recipeData.js            Adapter that normalizes JSON into app-ready data
  styles.css               App styling
  main.jsx                 React entry point

recipe.md                  Human-readable recipe/process reference
wrangler.jsonc             Optional Cloudflare deployment config
index.html                 Vite HTML entry
```

## Data Model

The calculator is intentionally config-driven.

### `src/calculator-config.json`

This file contains:

- Global config such as waste factor and rounding precision
- Preferment defaults and preferment options
- Dough size presets
- Oven temperature adjustment bands
- Per-style ingredient ratios
- Per-fermentation yeast values
- Typed timeline steps for instructions

Each fermentation option includes a `timeline` array. Each phase contains typed `steps`, such as:

- `action`
- `wait`
- `ferment`
- `check`

That schema lets the UI render a process timeline without parsing free-form instruction text.

### `src/recipeData.js`

This file adapts the raw JSON into the shape the UI expects. It also infers some metadata such as fermentation environment and duration.

### `src/calculations.js`

This file contains the actual dough math:

- ball-weight handling
- hydration adjustments
- room-temperature yeast adjustment
- final ingredient-weight calculation

## Calculator Behavior

### Dough Weight

The app calculates from:

`pizza count × dough ball weight × waste factor`

The waste factor is internal and adds a small buffer for bowl loss and handling loss.

### Room Temperature Adjustment

Room temperature only affects fermentations marked as `Room temp`.

For those schedules:

- 70F is treated as the yeast baseline
- yeast is scaled up or down by room temperature
- water temperature guidance is derived from the selected room temperature

Cold-ferment schedules keep their baseline yeast values.

### Oven Temperature Adjustment

Oven temperature is selected from these presets:

- `450F`
- `500F`
- `700F`
- `900F`

Those values map to adjustment bands in the config and can affect:

- hydration
- sugar warnings
- oven guidance notes

### Preferment

When poolish is enabled:

- a fixed share of total flour is allocated to the preferment
- the preferment uses 100% hydration
- the main mix receives the remaining flour and water
- the timeline prepends a preferment phase

The UI currently supports:

- `Standard (Overnight)`
- `Express (Same Day)`

## Shareable URLs

The calculator writes the current state into the query string so a recipe can be shared or bookmarked.

Current parameters include:

- `style`
- `fermentation`
- `size`
- `customBallWeight`
- `count`
- `ovenTemp`
- `roomTemp`
- `preferment`
- `prefermentType`

## Editing Recipes

To change formula behavior, start in [src/calculator-config.json](/Users/andrewmaledy/Personal/pizza-calculator/src/calculator-config.json).

Typical edits:

- change hydration, salt, oil, or sugar percentages
- change baseline yeast for a fermentation schedule
- add or revise timeline steps
- change dough size presets
- change oven adjustment rules
- adjust preferment defaults

If you change the shape of the JSON, you will likely also need to update [src/recipeData.js](/Users/andrewmaledy/Personal/pizza-calculator/src/recipeData.js) and possibly [src/App.jsx](/Users/andrewmaledy/Personal/pizza-calculator/src/App.jsx).

## Notes

- The app assumes instant dry yeast
- Yeast is rounded more precisely than the other ingredients
- Longer low-yeast ferments may still require a fine-resolution scale
- `recipe.md` is the human-readable companion reference; `src/calculator-config.json` is the runtime source of truth
