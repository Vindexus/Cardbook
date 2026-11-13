# Progress

Where the work stands, so it can be picked up later. The plan and its
decisions are in [mvp-data-and-templates.md](mvp-data-and-templates.md), and
the big picture is in [overview.md](overview.md).

_Last updated: 2026-11-12_

## Status

| Milestone | State | Branch |
|---|---|---|
| 1. Data package (`@vinforge/data`) | Done, not merged | `feat/data-package-fixes` |
| 2. Template package (`@vinforge/templater`) | Done, not merged | `feat/templater` (built on the branch above) |
| 3. Wire together (React app) | Not started | |

## Merge order

The branches are stacked, so merge them in this order:

1. Push local `main`. It has 4 commits that aren't on `origin/main` yet (the
   `@vinforge` rename and pnpm settings), and both PRs include them until it's pushed.
2. Open and merge a PR for `feat/data-package-fixes` into `main`.
3. Open a PR for `feat/templater`, switch its base to `main`, and merge it.

## What exists

- **`@vinforge/data`** — `parseProjectData(raw)` validates and normalizes a
  project. Bad pieces are skipped and reported in `errors`. Pieces get keys
  from their names, with `_002`-style suffixes for duplicates.
- **`@vinforge/templater`** — `createTemplater(config)` returns `getHTML`,
  `addPartial`, and `setGlobalData`. Markup like `.title= name` compiles to
  Handlebars. `getHTML` returns `{ success, data: { html, classes, styles } }`
  or a `TemplateError`, and never throws. A missing variable fails that
  piece's render (Handlebars strict mode).
- **`@vinforge/types`** — `TestCase<TInput, TExpect>`, used by every table test.

## Next up

Milestone 3 in the plan: use `@vinforge/data` and the templater in the React
app, so each piece renders from project data and failed pieces show their error.

## Open questions

- Should a `markdown` helper be added? If so, it must escape its input with
  `Handlebars.escapeExpression` before adding tags.
- `{{...}}` inside data values (the Health Potion example) is after the MVP.

## Known issues, not fixed

- `pnpm add-package <name>` runs an install instead of the script, and
  `pnpm run add-package` fails because `tsx` is only installed in `apps/cli`.
  Fixing it needs `tsx` as a root dev dependency. The README documents the
  broken form.
- Render errors give positions in the compiled Handlebars, not in the markup.
- `.title=name` (no space) is read as a class named `title=name`.
- `slugify` drops accented letters, so "Épée" becomes "pe".
- `packages/types` overlaps with the data model's types.
- `apps/react` has 4 type errors that predate this work.

## Worktrees

Each branch was worked on in its own worktree next to the repo. Once a
branch is merged, remove its worktree with `git worktree remove <path>`.

- `../cardbook-data` — `feat/data-package-fixes`
- `../cardbook-templater` — `feat/templater`
- `../cardbook-cleanup`, `../cardbook-readme`, `../cardbook-vinforge` — already merged
