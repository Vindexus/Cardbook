# MVP Plan: Data + Templates

## Why these two first?

These are the foundation everything else builds on. The renderer needs resolved HTML. The exporter needs resolved pieces. Both of those depend on data + templates working together. Getting these right (with tests) means the rest of the system has a solid base to build on.

## Should they be built separately or together?

**Data first, then templates, then wire them together.**

Reasoning:
- **Data is simpler and more well-defined** — it's mostly about types, validation, and defaults. You can write and test it without any template system.
- **Templates are harder and less defined** — the PUG+Handlebars hybrid syntax needs design iteration. Having real data types to test against makes template development more grounded.
- **They connect at one clear point** — the templater's `getHTML(templateName, cardData)` call. Building data first means you'll have realistic test fixtures ready when you start on templates.

---

## What we can port from `~/cardbook_older`

There's significant prior art in the old codebase. Here's a file-by-file breakdown of what's reusable, what needs adaptation, and what should be rewritten.

### Data / Schemas

**Source:** `~/cardbook_older/src/cc/zod/schema.ts`
**Tests:** `~/cardbook_older/src/cc/zod/schema.test.ts`

| What | Status | Notes |
|---|---|---|
| `keyStringSchema` (regex `^[@A-Za-z][/A-Za-z0-9_-]*$`) | **Port directly** | Already supports `@scope/name` pattern. Use for all resource references. |
| `trblSchema` (TopRightBottomLeft) | **Port directly** | Clever CSS-shorthand-style parsing: `10` → all sides, `"10,20"` → top/bottom + right/left. Tests exist. |
| `pieceTypeSchema` | **Port with changes** | Rename to `componentTypeSchema`. Same shape (key, widthPX, heightPX, trims). |
| `pieceSchema` / `pieceDefSchema` | **Port with changes** | Rename `type` → `componentType`. Add `data` as explicit catchall instead of top-level catchall. The `superRefine` for auto-generating key from name via slugify is great — keep it. |
| `templateDefSchema` | **Port directly** | Simple `{ key, contents }`. |
| Zod `z.input` / `z.output` type pattern | **Port directly** | Good pattern: `PieceInput` (what user writes) vs `PieceDef` (what the system uses after validation). |

**Key change needed:** In the old code, piece custom fields (name, elements, description, etc.) live at the top level via `catchall(z.any())`. In the new design, they're nested under a `data` field. This is cleaner because it separates system fields (template, componentType, qty, key) from user data.

Old:
```json
{ "name": "Sword", "type": "card", "template": "item", "damage": 5, "cost": 3 }
```

New:
```json
{ "key": "sword", "componentType": "@core/poker", "template": "item", "data": { "name": "Sword", "damage": 5, "cost": 3 } }
```

### Template Parser

**Source:** `~/cardbook_older/src/cc/templates/templates.ts`
**Tests:** `~/cardbook_older/src/cc/templates/templates.test.ts`

| What | Status | Notes |
|---|---|---|
| `parseMarkupLine()` | **Port directly** | Parses individual lines into typed `ParsedLine` objects (open, element, content, directVar). Well-tested. |
| `getPieceElement()` | **Port directly** | Extracts ID and CSS classes from `.class1.class2` or `#id.class` syntax. |
| `elementToOpenHTML()` / `elementToCloseHTML()` | **Port with changes** | Works well. Consider removing the closing comments (`<!-- closing div.header -->`) or making them optional — they're useful for debugging but add noise. |
| `convertMarkupToHandlebarsTemplate()` | **Port with changes** | This is the core compiler. It works but has limitations to address (see below). |
| `parseTemplate()` | **Port with changes** | Handles `_classes` directive and `style` section extraction. Good concept, rough implementation (splits on literal "style" string). |
| `getTemplateStringLineInfos()` | **Port directly** | Line-by-line parser with indentation tracking, blank line / comment skipping. |
| `templateStrToCompiler()` | **Rewrite** | Currently creates a Handlebars compiler directly. In the new design this should return intermediate HTML, not a bound compiler — separation of concerns. |
| Handlebars helper registration (global `Handlebars.registerHelper`) | **Rewrite** | Old code registers helpers globally on the Handlebars module. New design needs per-instance helpers on the templater. |

**Key changes needed:**
1. **Decouple from Handlebars library.** The old code compiles PUG → Handlebars template string → uses `Handlebars.compile()`. The new system should still do PUG → intermediate format, but we need to decide if we keep Handlebars as the expression engine or build our own. Handlebars is battle-tested but its global state (helpers, partials) conflicts with the per-instance design. Options:
   - Use Handlebars but create isolated instances (`Handlebars.create()`)
   - Use a lighter expression evaluator
   - This is a key decision for Milestone 2

2. **`directVar` wraps in `{{markdown varName}}`** — the old code always wraps `= varName` in a markdown helper. The new design should make this configurable or at least use a different default (plain interpolation, with markdown as an opt-in helper).

3. **Error handling** — old code throws on bad templates. New code should return structured errors.

### Resolution / Helpers

**Source:** `~/cardbook_older/src/cc/lib/helpers.ts`

| What | Status | Notes |
|---|---|---|
| `getPieceType()` | **Port pattern, rewrite** | The fallback pattern (user types → merge with default types → lookup) is exactly right. But the new version should return errors, not throw. |
| `getPieceTemplateDef()` | **Port pattern, rewrite** | Same fallback pattern. Same error handling change. |

**Key pattern to keep:** Custom resources override defaults, but defaults are always available as fallback. This is the `@core/` concept working in practice:
```ts
const look = { ...defaultPieceTypes, ...userTypes }  // defaults first, user overrides
```

### Default Resources

**Source:** `~/cardbook_older/src/cc/defaults/piece_types.ts`, `~/cardbook_older/src/cc/defaults/templates.ts`

| What | Status | Notes |
|---|---|---|
| `@cc/cs_playingcard` (850x1150, trims: [35, 90]) | **Port as `@core/poker`** | Rename from `@cc/` to `@core/`. Same dimensions. |
| `@cc/simple` template | **Port as `@core/simple`** | Good starter template. |

### String Helpers

**Source:** `~/cardbook_older/src/cc/lib/string-helpers.ts`

Already ported to `packages/helpers/src/strings.ts` — `splitBySpaces`, `countAndRemoveIndentation`, `countAndRemoveTabs`, `countAndRemoveDoubleSpaces`, `slugify`. These are identical.

### Existing Tests to Port

The old test files provide a great starting point. Here's what to bring over:

**From `schema.test.ts`:**
- TRBL parsing: `10` → all sides, `"10,20"` → cascading defaults
- PieceType with `@scope/` key validation (valid and invalid)
- Piece auto-key from name: `"My 1st Sword, It Attacks!"` → `"my_1st_sword_it_attacks"`
- Piece with extra fields via catchall
- Adapt all of these to the new schema shape (data nested, componentType renamed)

**From `templates.test.ts`:**
- Line parsing: content, open, element, directVar types with various indentation
- Element parsing: `#id.class1.class2`, `.class`, `#id`
- Opening/closing HTML generation
- Full template compilation with nested elements
- Error on excessive indentation
- Two root elements closing properly
- Double-space indentation support

---

## Milestone 1: Data Package (`@vinforge/data`)

### Goal

A package that takes raw project input (JSON) and produces validated, normalized data with defaults applied and IDs assigned. No template rendering — just data in, clean data out.

### What to figure out

- **Validation strategy** — Zod is already installed and the old code uses it well. Port the schemas, adapt to new shape.
- **ID generation** — Old code uses `slugify(name)` via `superRefine`. Keep this. For uniqueness when multiple pieces have the same name, append an index suffix (e.g. `health_potion`, `health_potion_2`).
- **Defaults** — `qty` defaults to 1 (old code does this). Consider project-level `defaultComponentType` so you don't repeat `"@core/poker"` on every piece.
- **The `@scope/name` resolution** — Validate syntax with the existing `keyStringSchema` regex. Don't resolve references — that's a separate concern.

### Shape of the work

```
packages/data/
  src/
    index.ts              // public API: parseProjectData()
    schemas.ts            // Zod schemas (port from old schema.ts)
    normalize.ts          // apply defaults, generate IDs
    types.ts              // TypeScript types (inferred from Zod)
  src/__tests__/
    schemas.test.ts       // port from old schema.test.ts + new cases
    normalize.test.ts     // defaults, IDs, uniqueness
```

### Test cases to write first (TDD)

**Ported from old codebase (adapt to new schema shape):**
- TRBL parsing: `10` → `{top:10, right:10, bottom:10, left:10}`
- TRBL parsing: `"10,20"` → `{top:10, right:20, bottom:10, left:20}`
- TRBL parsing: `"10,20,30,40"` → `{top:10, right:20, bottom:30, left:40}`
- ComponentType with valid `@core/poker` key passes
- ComponentType with invalid `@cc@card` key fails with regex error
- Piece auto-key: `name: "My 1st Sword, It Attacks!"` → `key: "my_1st_sword_it_attacks"`
- Piece with extra data fields in `data` object passes

**New test cases:**
- Valid minimal project (one piece, one template, one componentType) passes
- Missing required fields produce clear errors
- `qty` as non-integer or negative fails
- `componentType` and `template` are non-empty strings matching key regex
- Piece `data` can be any shape (Record<string, any>)
- Piece without `qty` defaults to 1
- Multiple pieces with same name get unique IDs
- Project-level `defaultComponentType` applies when piece omits it

### Done when

- [ ] `@vinforge/data` package exists with Zod schemas
- [ ] `parseProjectData(raw: unknown)` returns validated + normalized data or structured errors
- [ ] All test cases pass (ported + new)
- [ ] The existing `project/data.ts` sample can be expressed in the new format

---

## Milestone 2: Template Package (`@vinforge/templater`)

### Goal

A standalone package (no React, no browser dependencies) that takes template strings + data and produces HTML. Stateful — holds global data, partials, helpers. Returns errors instead of throwing.

### What to figure out

- **How much PUG to support?** The old code already supports exactly the right subset:
  - Class shorthand: `.title` → `<div class="title">` ✅ old code does this
  - ID shorthand: `#header` → `<div id="header">` ✅ old code does this
  - Combined: `#header.right.bold` ✅ old code does this
  - Text content: `.title Hello` ✅ old code does this (line type `element`)
  - Dynamic text: `.title= name` ✅ old code does this (line type `directVar`)
  - Nesting via indentation ✅ old code does this
  - `_classes` directive for dynamic class injection ✅ old code does this
  - `style` section extraction ✅ old code does this
  - **NOT in MVP:** attributes `img(src=url)`, explicit element tags like `p`/`span`

- **How much Handlebars to support?** The old code uses the Handlebars library directly. Key decision: keep Handlebars or replace it?
  - **Keep Handlebars (recommended for MVP):** Use `Handlebars.create()` for per-instance isolation. Gets us `{{var}}`, `{{helper arg}}`, `{{> partial}}`, `{{#each}}` for free. Battle-tested.
  - **Replace Handlebars:** More control, lighter, but significant work. Do this later if Handlebars becomes a limitation.

- **`directVar` and the `markdown` helper** — Old code wraps `= varName` in `{{markdown varName}}` which converts `**bold**` and `*italic*`. Decision: keep this default behavior? Or make `=` do plain interpolation and let users opt into markdown via `{{markdown varName}}` explicitly?

- **Expression resolution in data values** — card data like `"description": "Restore {{_.healBig}} health"`. This means running Handlebars on data values before passing them to the template. The old code doesn't do this — it's new functionality.

- **Error handling** — Old code throws. New code should catch and return `TemplateError`. Wrap the Handlebars compile/render calls in try/catch.

### Shape of the work

```
packages/templater/
  src/
    index.ts              // public API: createTemplater()
    parser.ts             // PUG-style → Handlebars string (port convertMarkupToHandlebarsTemplate)
    parseMarkupLine.ts    // line-level parser (port from old code)
    elements.ts           // element helpers (port getPieceElement, elementToOpenHTML, etc)
    errors.ts             // TemplateError types
    types.ts              // TemplaterConfig, ParsedLine, Element, etc.
  src/__tests__/
    parseMarkupLine.test.ts  // port from old templates.test.ts
    elements.test.ts         // port element open/close tests
    parser.test.ts           // port full compilation tests
    templater.test.ts        // new: createTemplater → getHTML integration
    errors.test.ts           // new: error cases
```

### Test cases to write first (TDD)

**Ported from old `templates.test.ts`:**
- `parseMarkupLine("div")` → content type, `content: "div"`
- `parseMarkupLine("\tHello, world!")` → content type, `indents: 1`
- `parseMarkupLine(".header= name")` → directVar type, element with class "header", variable "name"
- `parseMarkupLine("#header")` → open type, element with id "header"
- `parseMarkupLine("#header.right.bold= name")` → directVar with id + classes
- `parseMarkupLine("#header.right.bold My name is {{name}}")` → element type with content
- `parseMarkupLine(".header#header")` → throws "must start with #"
- `elementToOpenHTML({id: "header", cssClasses: ["right", "bold"]})` → `<div id="header" class="right bold">`
- `elementToCloseHTML(...)` → closing div with comment
- Full template: `.header\n\t.title= name\n\t.qty x{{qty}}` → correct nested HTML
- Excessive indentation → throws error
- Two root elements → both close properly
- Double-space indentation works

**New test cases (templater integration):**
- `createTemplater({templates: {item: ".title= name"}})` + `getHTML("item", {name: "Sword"})` → `<div class="title">Sword</div>`
- Template with `{{_.globalVal}}` + globalData → resolved
- Template with `{{> partialName}}` + registered partial → inlined
- Template with `{{helperName arg}}` + registered helper → helper output
- `addPartial("flavor", ...)` then re-render → new partial used
- `setGlobalData(...)` then re-render → new globals used
- Unknown template name → `TemplateError`
- Syntax error in template → `TemplateError` (not thrown)
- Missing variable → empty string or `TemplateError` (decide which)
- Data value `"Restore {{_.healBig}} health"` with globalData `{healBig: 50}` → `"Restore 50 health"`

### Done when

- [ ] `@vinforge/templater` package exists
- [ ] `createTemplater(config)` works with templates, globalData, partials, helpers
- [ ] `templater.getHTML(templateName, data)` returns HTML or TemplateError
- [ ] The PUG subset handles elements, classes, IDs, text, dynamic text, nesting (ported from old code)
- [ ] Handlebars expressions handle variables, globals, helpers, partials
- [ ] All test cases pass (ported + new)
- [ ] Can render the "Health Potion" and "Longest Road" examples from the overview doc

---

## Milestone 3: Wire Together

### Goal

Prove the two packages work together end-to-end: raw project JSON → validated data → resolved HTML for each piece.

### Shape of the work

This might live in a small integration test file, or in a new `@vinforge/core` package that combines data + templater. Or it might just be test cases that import both packages.

### Test fixture: sample project

Port the poker card example from `~/cardbook_older/src/projects/poker/data.ts` as a test fixture. It programmatically generates 52 cards across 2 templates (card, face) with suits, values, and icons. This is a great realistic test case.

Also create a simpler fantasy game fixture with the examples from the overview doc (Health Potion, Longest Road, etc.).

### Test cases

- Load a sample project JSON with 3-5 pieces across 2 templates
- Parse and validate with `@vinforge/data`
- Create a templater with the project's templates, globals, partials
- Render each piece → get HTML or error
- One piece has intentionally bad data → produces error, others still render
- Change global data → re-render → output reflects new values
- Poker card fixture: 52 cards validate and render without errors

### Done when

- [ ] End-to-end test passes: JSON → validated data → HTML for each piece
- [ ] Error isolation works: one bad piece doesn't affect others
- [ ] A sample project fixture exists that can be reused by future tests (renderer, exporter, etc)
- [ ] Poker card example from old codebase works in new system

---

## Open Questions

These don't need answers before starting, but should be resolved during development:

1. **Should `@vinforge/data` own the ComponentType definitions, or is that a separate package?** ComponentTypes feel like they belong with data, but `@core/poker` etc. are resources that need the resolution system. The old code puts defaults in `src/cc/defaults/` — we could do similar with a `@vinforge/core-resources` package or just a `defaults/` dir within data.

2. **Does the templater parse on every `getHTML` call, or cache compiled templates?** Probably cache — the old code compiles via `Handlebars.compile()` which returns a reusable function. Keep this pattern: compile once, call with different data many times.

3. **How do partials and helpers interact with the `@scope/name` resolution?** The templater takes partials/helpers as config — someone upstream needs to resolve `@core/icon` into an actual helper function before passing it in. That's not the templater's job.

4. **What's the right level of Handlebars support for MVP?** `{{#each}}` blocks are really useful for cards with lists (abilities, types). The old poker card template uses `{{#each icons}}` — include this in MVP.

5. **Keep `packages/helpers/strings.ts` as a shared dep.** The templater should import `splitBySpaces`, `countAndRemoveIndentation` from `@vinforge/helpers` rather than duplicating. This is already how the old code works (`import from "../lib/string-helpers"`).

6. **Handlebars isolation.** The old code uses global `Handlebars.registerHelper()`. The new code must use `Handlebars.create()` for per-templater-instance isolation. Verify this works with partials too.
