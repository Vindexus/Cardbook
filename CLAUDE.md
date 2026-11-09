# CLAUDE.md

## Project Overview

Cardbook (`@vinforge`) is a card design system for generating, visualizing, and managing physical card designs with trim specifications, bleeds, and edges. It uses Storybook for component preview and Puppeteer for screenshot generation.

## Monorepo Structure

- `apps/react/` - React Storybook app for card visualization
- `apps/cli/` - CLI tools (story generation, screenshots)
- `packages/helpers/` - Shared utilities (string manipulation, etc.)
- `packages/types/` - Shared TypeScript type definitions
- `project/` - Card data and templates
- `exports/` - Screenshot output directory

## Tech Stack

- **Package manager:** pnpm (workspaces)
- **Language:** TypeScript (strict, ES2022 target, bundler module resolution)
- **UI:** React 19, Tailwind CSS, Storybook 10
- **Build:** Vite 7
- **Testing:** Vitest
- **Linting/Formatting:** Biome (tabs, double quotes)
- **Screenshots:** Puppeteer

## Common Commands

```bash
pnpm start              # Run Storybook (port 6006)
pnpm test               # Run tests (Vitest, watch mode)
pnpm cli:watch          # Watch and regenerate stories from project data
pnpm cli:screenshot     # Take screenshots of Storybook components
pnpm add-package        # Scaffold a new package
```

## Code Conventions

### Formatting & Linting
- Biome for formatting: **tabs** for indentation, **double quotes** for strings
- Biome handles import organization automatically
- **No single-line if statements** — always use braces and a newline (e.g. `if (x) { return; }`, not `if (x) return;`)

### TypeScript
- Strict mode with `noUncheckedIndexedAccess: true`
- ESM-only (`"type": "module"` in all package.json files)
- Use `import type { }` for type-only imports
- Use `node:` prefix for Node built-ins (e.g. `import fs from "node:fs"`)
- Use `fileURLToPath`/`path.dirname` for `__dirname` equivalent in ESM

### Imports
- Prefer named imports over default imports
- Import order: Node built-ins → third-party packages → `@vinforge/` packages → relative imports
- Use `workspace:*` protocol for internal package dependencies

### Exports
- Inline exports (`export function`, `export const`) — not bottom-of-file
- Default exports only for Storybook meta objects
- Barrel re-exports via `export * from` in package `index.ts` files

### Naming
- **Files:** PascalCase for React components (`Card.tsx`, `PieceList.tsx`), camelCase for utilities (`strings.ts`, `timeout.ts`)
- **Variables/functions:** camelCase
- **Types/interfaces:** PascalCase, use `Props` suffix for component props (e.g. `ButtonProps`)
- **Packages:** `@vinforge/` namespace

### React Components
- Arrow function components with `React.FC<Props>` typing
- Use `React.PropsWithChildren` for components that accept children
- Inline object types for simple one-off props: `({ items }: { items: Record<string, any>[] })`
- Use interfaces for reusable/documented prop types
- Fragment syntax `<>...</>` when no wrapper element needed

### Styling
- Tailwind CSS classes combined with inline styles where needed
- Dynamic CSS variables set via inline `style` props (e.g. `var(--trim-1-top)`)
- Dynamic class names built with array `.join(" ")` pattern
- Custom CSS utility classes generated at runtime via `<style>` tags in components

### Storybook
- Stories live in `apps/react/src/stories/`
- Story meta uses `satisfies Meta<typeof Component>` for type safety
- Story variants exported as named constants: `export const Primary: Story = { }`
- Components wrapped in decorators for layout context

### Package File Structure
- Each subfeature in a package gets its own folder under `src/`
- The folder name, main file, and spec file all share the same name:
  ```
  packages/<pkg>/src/
    <feature>/
      index.ts            # re-exports from <feature>.ts
      <feature>.ts        # implementation
      <feature>.spec.ts   # tests
    index.ts              # package barrel exports
    types.ts              # re-exports types from subfeatures
  ```
- The `index.ts` in each folder just re-exports so the folder can be imported by name
- This convention applies to packages (`packages/`). Apps may use a different structure.

### Testing
- Tests use `.spec.ts` suffix, colocated with their source in the same folder
- Vitest (`describe`, `it`, `expect`)

### Comments
- JSDoc with `@param` for exported utility functions
- `// TODO:` for known future work
- Keep comments sparse — only where logic isn't self-evident
