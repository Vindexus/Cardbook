# Cardbook System Overview

## Goal

A modular system for rapidly prototyping physical card game components. Create new prototypes with minimal effort, update multiple cards at once, and export for different targets (print-n-play PDFs, Tabletop Simulator images, etc).

## Terminology & Data Model

### Hierarchy

```
Project
├── ComponentType (defines physical specs)
│   e.g. "Poker Card" (750x1050px), "Euro Card" (600x900px)
│
├── Template (defines visual layout, tied to a ComponentType)
│   e.g. "Hero", "Enemy", "Item" (all Poker Card templates)
│
└── Piece (an individual game component)
    e.g. "Health Potion" — uses template "Item", has data + qty
```

### Project

A project is a card game (or any collection of physical game components). It contains component types, templates, pieces, and global data.

### ComponentType

Defines the **physical specifications** shared by a group of components:
- Dimensions in pixels (e.g. 750x1050 for poker, 600x900 for euro)
- Bleed, trim, and safe zone measurements
- A project can have multiple component types (poker cards, euro cards, tokens, boards, etc.)

### Template

Defines the **visual layout** for a category of pieces. Written in the PUG+Handlebars hybrid syntax. Templates are **not tied to a specific ComponentType** — a template could theoretically be used with different component types, though in practice most templates are designed for one size.

Templates can reference partials and helpers, and access global data via `_`. Data values themselves can contain template expressions (e.g. `"Restore {{_.healBig}} health"`) which get resolved during rendering.

Examples for a fantasy game:
- **Hero** — portrait, name, health, abilities
- **Enemy** — name, threat level, attack pattern
- **Item** — name, types, rarity, description

### Piece

An individual game component — one specific card/token/tile. A piece has:
- **componentType** — which physical spec to use (e.g. "poker", "@core/poker")
- **template** — which template to render with (e.g. "item", "@core/fantasy")
- **data** — the values for this specific piece (name, stats, description, etc.)
- **qty** — how many copies exist in the game (default 1)

Example:
```json
{
  "componentType": "@core/poker",
  "template": "item",
  "data": {
    "name": "Health Potion",
    "types": ["potion", "consumable"],
    "rarity": "common",
    "description": "Restore {{_.healBig}} health"
  },
  "qty": 4
}
```

The `qty` affects **export only** — when browsing, you see the Health Potion once (with "x4" displayed). When exporting for print or TTS, 4 copies are included.

### Global Data

Project-wide values accessible in any template via the `_` prefix. Things like:
- Icon URLs (`_.victory`, `_.sword`)
- Balance constants (`_.healBig`, `_.healSmall`)
- Shared text snippets

This lets you change a value in one place and have it propagate across all cards that reference it.

### Resource Resolution (`@scope/name` convention)

Many things in the system are **named resources** that can come from different sources: templates, partials, component types, helpers, and potentially plugins/icon packs. They all follow the same naming convention:

| Prefix | Source | Example |
|---|---|---|
| _(none)_ | Project-local | `"item"`, `"hero"` |
| `@core/` | Built-in to Cardbook | `"@core/poker"`, `"@core/fantasy"` |
| `@scope/` | Third-party pack | `"@somedesigner/card-starter"` |

This applies uniformly across resource types:
- **Templates:** `"template": "item"` (project) vs `"template": "@core/fantasy"` (built-in)
- **Component types:** `"componentType": "@core/poker"` (built-in) vs `"componentType": "my-hexagon"` (project)
- **Partials:** `{{> @core/icon-row}}` vs `{{> flavor-text}}`
- **Helpers, icon packs, etc.** — same pattern

The resolution strategy is intentionally left flexible for now, but the general idea:
- **Project-local** resources live in project directories (e.g. `templates/`, `partials/`)
- **`@core/`** resources ship with Cardbook
- **`@scope/`** resources are installed packages (future: npm-like distribution)

This enables a layered ecosystem:
1. **Core** — stable, common defaults that ship with the app
2. **Project** — game-specific customizations
3. **Community** (future) — third-party packs people can install and reference

---

## Data Pipeline

The two main things a user does are **browse** and **export**. Both consume the same project data but process it differently. This section traces the data shapes through the system.

### Stage 1: Project Input Data

This is everything the user has authored. It's the raw material — stored as files, localStorage, or fetched from a remote source.

```ts
ProjectData {
  globalData: Record<string, any>           // values accessible as `_` in templates
  componentTypes: Record<string, ComponentType>  // keyed by name (e.g. "poker", "euro")
  templates: Record<string, string>         // keyed by name → template source strings
  partials: Record<string, string>          // keyed by name → partial template strings
  helpers: Record<string, HelperFunction>   // keyed by name → template helper functions
  pieces: PieceInput[]                      // the cards/tokens/tiles
  styles: Record<string, string>            // keyed by name → CSS strings (TBD)
}

ComponentType {
  widthPX: number
  heightPX: number
  trims: Trim[]                             // bleed/trim/safe zone specs
}

PieceInput {
  id?: string                               // optional, auto-generated if missing
  componentType: string                     // reference (e.g. "poker", "@core/poker")
  template: string                          // reference (e.g. "item", "@core/fantasy")
  data: Record<string, any>                 // piece-specific values
  qty: number                               // default 1, used during export
}
```

This is the shape that a DataSource provides. Everything here is **unresolved** — template references are just strings, `@scope/` names haven't been looked up, template expressions in data values haven't been evaluated.

### Stage 2: Browse Page Input

The browse page receives the full ProjectData and needs to decide what to display. It may apply filters, sorting, or grouping, but the key transformation is: **resolve each piece into something renderable**.

```ts
BrowsePageInput {
  project: ProjectData
  filters?: BrowseFilters                   // TBD: filter by template, componentType, search, etc.
  sort?: BrowseSort                         // TBD: sort by name, template, etc.
}
```

The browse page iterates over `project.pieces` and for each piece:
1. Looks up the `componentType` → gets physical dimensions and trims
2. Looks up the `template` → gets the template source string
3. Passes piece `data` + `project.globalData` through the templater → gets HTML (or error)

### Stage 3: Resolved Piece (Render-Ready)

This is the output of resolution — what actually gets handed to a React component for rendering. One `ResolvedPiece` per piece in the browse list.

```ts
ResolvedPiece {
  id: string                                // unique identifier
  componentType: ComponentType              // resolved physical specs (not a string ref)
  html: string                              // rendered HTML from template engine
  qty: number                               // for display ("x4") — not expanded
  source: PieceInput                        // original input, for debugging/editing
}

// OR if the piece failed to render:

ResolvedPieceError {
  id: string
  componentType: ComponentType | null       // might also fail to resolve
  error: TemplateError                      // what went wrong
  qty: number
  source: PieceInput
}

type BrowseItem = ResolvedPiece | ResolvedPieceError
```

The browse page renders a list of `BrowseItem`s. Each one is either a card with rendered HTML inside a trim frame, or an error card showing what went wrong.

### Stage 4: Export Configuration

Exporting is a multi-step process with several user choices. The user selects what to export, how to lay it out, what format to produce, and rendering settings.

```ts
ExportConfig {
  // WHAT to export
  selection: PieceSelection                 // which pieces to include
  includeBacks: boolean                     // export card backs as well?

  // HOW to arrange
  layout: ExportLayout                      // how pieces are arranged spatially

  // WHAT format to produce
  format: ExportFormat                      // output file type

  // RENDERING settings
  rendering: RenderingOptions               // crop, color adjustments, etc.
}
```

#### Selection: What pieces?

```ts
type PieceSelection =
  | { type: "all" }
  | { type: "byTemplate", templates: string[] }      // e.g. ["item", "hero"]
  | { type: "byComponentType", componentTypes: string[] }  // e.g. ["poker"]
  | { type: "byId", ids: string[] }                   // specific pieces
  // ... other filters as needed
```

When `includeBacks` is true, pieces that have a back template/design get exported alongside their fronts. How backs pair with fronts depends on the layout.

#### Layout: How are pieces arranged?

The layout determines how resolved pieces are spatially organized before rendering to the output format.

```ts
type ExportLayout =
  | { type: "individual" }                             // one piece per output unit
  | { type: "grid", cols: number, rows: number }       // e.g. 3x3 for print-n-play
  | { type: "tts", cols: number, rows: number }        // TTS deck sheet (specific positioning rules)
  // ... other layouts as needed
```

| Layout | Description | Typical use |
|---|---|---|
| `individual` | Each piece is a separate unit | Individual card images |
| `grid` | Pieces tiled in rows x cols per page | Print-n-play (3x3 poker cards per letter page) |
| `tts` | TTS deck sheet format (last slot = card back) | Tabletop Simulator import |

Layouts are grouped by ComponentType — you can't mix poker and euro cards in the same grid. If the selection spans multiple component types, each gets its own set of layout pages/sheets.

#### Format: What file type?

```ts
type ExportFormat =
  | { type: "png" }                // one PNG per layout page/sheet
  | { type: "pdf" }               // all layout pages combined into one PDF
  | { type: "zip" }               // everything bundled (future)
  // ... other formats as needed
```

| Layout + Format | Result |
|---|---|
| `individual` + `png` | One PNG file per piece |
| `grid(3,3)` + `png` | Multiple PNGs, each a 3x3 page of cards |
| `grid(3,3)` + `pdf` | One PDF with multiple 3x3 pages |
| `tts(10,7)` + `png` | One large PNG per deck (TTS deck sheet) |

#### Rendering Options: How should pieces look?

```ts
RenderingOptions {
  crop: "none" | "bleed" | "trim"          // where to crop each piece
  colorMode?: "color" | "grayscale"        // color conversion (future)
  scale?: number                           // resolution multiplier (future)
  // ... other post-processing as needed
}
```

| Crop setting | What it does |
|---|---|
| `none` | Full card including all bleed area |
| `bleed` | Crop to bleed line (removes outer bleed margin) |
| `trim` | Crop to trim line (final cut size, no bleed) |

### Stage 5: Export Execution

The export pipeline takes the config and produces output:

```
ExportConfig + ResolvedPiece[]
         │
         │  1. Filter pieces by selection
         │  2. Expand qty (4 Health Potions → 4 entries)
         │  3. Optionally pair with backs
         │  4. Group by componentType
         ▼
    ExpandedPiece[]
         │
         │  5. Arrange into layout (grid pages, TTS sheets, etc.)
         ▼
    LayoutPage[]
         │
         │  6. Render each page (screenshot / canvas capture)
         │  7. Apply rendering options (crop, color)
         ▼
    RenderedPage[]
         │
         │  8. Package into format (PNGs, PDF, zip)
         ▼
    ExportResult (files to download or save)
```

### Summary: Data Shape at Each Stage

```
┌──────────────────┐
│  ProjectData     │  Raw authored content
│  (unresolved)    │  Strings, references, unexpanded templates
└────────┬─────────┘
         │
         │  resolve componentType + template + data
         │  via Templater
         ▼
┌──────────────────┐
│  BrowseItem[]    │  Per-piece resolved output
│  (resolved)      │  HTML or error, actual ComponentType, qty shown not expanded
└────────┬─────────┘
         │
         ├──── Browse: render as-is with error handling
         │
         └──── Export:
               │
               ▼
         ┌──────────────────┐
         │  ExportConfig    │  User choices: selection, layout, format, rendering
         └────────┬─────────┘
                  │
                  │  filter, expand qty, pair backs, group by componentType
                  ▼
         ┌──────────────────┐
         │  ExpandedPiece[] │  Qty materialized, backs paired
         └────────┬─────────┘
                  │
                  │  arrange into layout pages/sheets
                  ▼
         ┌──────────────────┐
         │  LayoutPage[]    │  Spatial arrangement of pieces
         └────────┬─────────┘
                  │
                  │  render, crop, post-process, package
                  ▼
         ┌──────────────────┐
         │  ExportResult    │  Final files (PNG/PDF/zip)
         └──────────────────┘
```

---

## Architecture Principles

- **Modular & swappable** — Each subsystem (data source, template engine, renderer, exporter) is behind a shared interface so implementations can be swapped independently.
- **Two deployment targets** — The same core logic powers both a hosted web demo and a local Electron app. The difference is which implementations of each interface are plugged in.
- **Reactive pipeline** — Data or template changes trigger re-renders automatically, regardless of whether the change came from a textarea or a file on disk.

---

## Subsystems

### 1. Data Source

Provides the game component data (card names, stats, costs, etc) as structured JSON.

| | Web Demo | Local App |
|---|---|---|
| **Source** | Remote URL or localStorage | Local JSON file or remote URL |
| **Editing** | Textarea in the app, saved to localStorage | Edit files on disk with any editor |
| **Change detection** | State update / storage event | File watcher (chokidar / fs.watch) |

**Interface:** A data source provides a way to fetch the current data and to subscribe to changes.

```
DataSource {
  getData(): GameData
  onChange(callback): unsubscribe
}
```

### 2. Template Engine

A stateful engine that converts template strings + data into HTML. It holds project-wide configuration: global data, partial templates, and helpers. Individual cards are rendered by name against this shared context.

**Template syntax** is a hybrid of:
- **PUG-style** structure for HTML elements and attributes
- **Handlebars-style** expressions for inserting data values and calling helpers

Example — card data: `{ points: 5, name: "Longest Road" }`
```
.title= name
.points
  {{icon _.victory}}
  .num= points
```

Where:
- `= name` inserts the card's `name` field as text content
- `{{icon _.victory}}` calls the `icon` helper with a global data value (`_` prefix = globals)
- Partials and helpers can come from the project or from plugins

Compiles to something like:
```html
<div class="title">Longest Road</div>
<div class="points">
  <img src="/icons/victory.png" class="icon" />
  <div class="num">5</div>
</div>
```

| | Web Demo | Local App |
|---|---|---|
| **Template source** | Textarea (localStorage) | `.txt` files on disk |
| **Change detection** | State update | File watcher |

**Interface:** The template engine is stateful — it holds global data, partials, and helpers. It can be reconfigured as the project evolves.

```
createTemplater(config: TemplaterConfig): Templater

Templater {
  getHTML(templateName, cardData): string | TemplateError
  addPartial(name, templateString): void
  removePartial(name): void
  addHelper(name, fn): void
  setGlobalData(data): void
  updateGlobalData(patch): void
  // ... other methods as needs emerge
}

TemplaterConfig {
  templates: Record<string, string>     // named template strings
  globalData?: Record<string, any>      // data available as `_` in templates
  partials?: Record<string, string>     // reusable template fragments
  helpers?: Record<string, Function>    // template helper functions (e.g. `icon`)
}
```

The interface is intentionally loose — we expect to discover new needs as the system grows. The key constraint is that `getHTML` returns either HTML or a structured error, never throws.

**The templater is a standalone package** (`@vinforge/templater` or similar) with no React or browser dependencies. It's pure TypeScript that takes strings and data and returns HTML strings. It could be used in any context: a React app, an Express server doing SSR, a CLI tool, a Node script, etc.

**React integration** is a separate concern. The React app creates a templater instance and makes it available (likely via context). Components call `getHTML` per-card during render. If a card's data or template is broken, `getHTML` returns a `TemplateError` and the component renders an error state instead of crashing the whole list. This means rendering 100 cards where the 75th has bad data shows 74 good cards + 1 error card + 25 more good cards.

### 3. Renderer

Takes the HTML output from the template engine and displays it as a visual card component with trim, bleed, and edge specifications.

This is the React layer. It wraps the generated HTML inside a card frame that shows:
- Card dimensions (e.g. 2.5" x 3.5" poker size)
- Trim lines, bleed area, safe zone
- The rendered template content

The renderer is always React — what changes between deployments is how it receives its data and templates (props driven by the data source and template engine). The renderer is also responsible for per-card error boundaries so that a single broken card doesn't take down the whole view.

### 4. Exporter

Takes rendered cards and produces output files for a specific target.

| Target | Format | Method |
|---|---|---|
| **Print-n-Play** | PDF of 3x3 grids (poker-size cards) | Arrange cards in grid, export PDF |
| **Tabletop Simulator** | Single large PNG (specific dimensions) | Composite cards into TTS deck sheet |
| **Individual PNGs** | One PNG per card | Screenshot each card |

| | Web Demo | Local App |
|---|---|---|
| **Screenshot method** | html2canvas / dom-to-image (in-browser) | Puppeteer (headless browser) |
| **Output** | Download from browser | Files saved to `exports/` directory |

**Interface:** An exporter takes a list of rendered cards and produces output.

```
Exporter {
  export(cards, options): Promise<ExportResult>
}
```

---

## Deployment Targets

### Web Demo (hosted site)

A single-page app where everything runs in the browser.

```
┌─────────────────────────────────────────────┐
│  Browser                                     │
│                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Data     │   │ Template │   │ Renderer │ │
│  │  Source   │──▶│ Engine   │──▶│ (React)  │ │
│  │ (localStorage│ (in-memory│   │          │ │
│  │  / remote)│   │  compile)│   │          │ │
│  └──────────┘   └──────────┘   └──────────┘ │
│                                      │       │
│                               ┌──────▼─────┐ │
│                               │  Exporter  │ │
│                               │ (html2canvas│ │
│                               │  / download)│ │
│                               └────────────┘ │
└─────────────────────────────────────────────┘
```

- User edits data in a JSON textarea, templates in a template textarea
- Changes save to localStorage and trigger re-render
- Export downloads files directly from the browser

### Local App (Electron)

A desktop app with filesystem access.

```
┌─────────────────────────────────────────────┐
│  Electron                                    │
│                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Data     │   │ Template │   │ Renderer │ │
│  │  Source   │──▶│ Engine   │──▶│ (React)  │ │
│  │ (files /  │   │ (in-memory│  │          │ │
│  │  watcher) │   │  compile)│   │          │ │
│  └──────────┘   └──────────┘   └──────────┘ │
│                                      │       │
│                               ┌──────▼─────┐ │
│                               │  Exporter  │ │
│                               │ (Puppeteer /│ │
│                               │  fs write) │ │
│                               └────────────┘ │
└─────────────────────────────────────────────┘
```

- User edits data and template files on disk
- File watchers detect changes and trigger re-render
- Export writes files to a local `exports/` directory

---

## Data Flow

```
Data Source ──▶ Template Engine ──▶ HTML string ──▶ Renderer ──▶ Visual card
                                                        │
                                                        ▼
                                                    Exporter ──▶ PDF / PNG / TTS sheet
```

1. **Data Source** emits game data (JSON)
2. **Template Engine** compiles template + data into HTML
3. **Renderer** displays the HTML inside a card frame with trim/bleed
4. **Exporter** captures the rendered output and produces files

Changes at any point in the pipeline (new data, updated template) flow forward and trigger a re-render of everything downstream.

---

## Current State

What exists today:
- Monorepo structure with pnpm workspaces
- Basic type definitions (`PieceDef`, `PieceInstance`, `Trim`, `PieceType`)
- String parsing helpers (split-by-spaces, indentation, slugify)
- Hardcoded sample data and a basic JSX template
- CLI that generates React components + Storybook stories from data/template
- Card visualization component with trim/bleed overlay system
- Puppeteer-based screenshot tool (partial)
- Storybook for browsing components

What needs to be built:
- [ ] Template engine (PUG + Handlebars hybrid parser)
- [ ] Data source interface + implementations (localStorage, file, remote)
- [ ] Template source interface + implementations
- [ ] Exporter interface + implementations (html2canvas, Puppeteer, PDF, TTS)
- [ ] Web demo app shell (browsing UI, edit panels)
- [ ] Electron app shell
- [ ] Reactive pipeline wiring (change detection → re-render)
