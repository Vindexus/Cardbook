# Cardbook

A tool for quickly prototyping physical card game components. You define your cards as data, render them through templates, preview them in Storybook, and export images for printing or Tabletop Simulator.

It's an early-stage pnpm monorepo. The full design lives in [`plans/overview.md`](plans/overview.md), and the current next steps are in [`plans/mvp-data-and-templates.md`](plans/mvp-data-and-templates.md).

## Core concepts

| Concept | What it is |
|---|---|
| **Project** | A card game: its component types, templates, pieces, and global data. |
| **Component type** | Physical specs: size in pixels, plus bleed, trim, and safe-zone margins (e.g. a poker card at 750×1050). |
| **Template** | The visual layout for a category of pieces (e.g. "Hero", "Item"). |
| **Piece** | A single card, token, or tile. It has a component type, a template, its own `data`, and a `qty`. |
| **Global data** | Project-wide values that templates read through `_` (e.g. `_.healBig`). |
| **Trims** | The bleed, trim, and safe lines drawn over each card, set with top/right/bottom/left values. |

Resources are named with a scope convention: `item` is project-local, `@core/poker` is built-in, and `@scope/name` is a third-party pack.

The planned pipeline is **data → template engine → HTML → React renderer → exporter** (PNG, print-and-play PDF, or a TTS sheet).

## Structure

```
apps/
  react/      Storybook app that renders cards with trim/bleed overlays
  cli/        Scripts that generate stories from project data and screenshot them
packages/
  data/       Zod schemas and normalization for project data (component types, pieces, templates)
  helpers/    Shared utilities (string parsing, slugify, timeout)
  types/      Shared TypeScript types (PieceDef, Trim, PieceType)
project/      The current sample card data (data.ts) and JSX template (template.ts)
exports/      Screenshot output
plans/        Design docs
scripts/      Repo tooling (package scaffolding)
```

### How it works today

1. `project/data.ts` returns a list of pieces, and `project/template.ts` returns a JSX string.
2. `apps/cli/src/generate_stories.ts` turns those into `Card.tsx`, `CardList.tsx`, and stories under `apps/react/src/stories/`.
3. Storybook renders each card inside `Piece`, which applies the dimensions and the trim CSS variables and utility classes (e.g. `pt-bleed`, `w-bleed`).
4. `apps/cli/src/screenshotter.ts` opens the list story in Puppeteer and saves a PNG to `exports/`.

The `packages/data` schemas are the start of the new data model. They aren't wired into the CLI or the React app yet. The PUG/Handlebars-style template engine hasn't been built.

## Scripts

Run these from the repo root with `pnpm <script>`.

| Script | Purpose |
|---|---|
| `start` | Runs Storybook on port 6006. |
| `test` | Runs Vitest in watch mode across the workspace. |
| `cli:watch` | Watches `project/` and the CLI source, and regenerates the Storybook stories on every change. |
| `cli:screenshot` | Screenshots the card list story with Puppeteer and saves it to `exports/`. Storybook must already be running. |
| `cli:sum` | Runs `apps/cli/src/sum.ts`, which no longer exists. Likely leftover. |
| `add-package <name>` | Scaffolds `packages/<name>` with a `package.json`, `tsconfig.json`, `src/index.ts`, and `src/types.ts`. |

A typical loop is `pnpm start` in one terminal and `pnpm cli:watch` in another, then edit the files in `project/`.

## Tooling

pnpm workspaces, TypeScript (strict, ESM), React 19, Vite, Storybook, Tailwind, Vitest, Biome (tabs, double quotes), and Puppeteer.
