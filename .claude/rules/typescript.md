---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript

- No `any`. Use `unknown` and narrow it. If `any` is truly needed, add a comment
  saying why.
- Don't use `as` or `!` to silence the compiler. Fix the types instead.
- Use named exports, unless a framework requires a default export.
- Use discriminated unions so invalid states can't be represented.

Bad:

```ts
type Result = { result: boolean; message?: string };
```

Good:

```ts
type Result = { result: true; message?: never } | { result: false; message: string };
```
