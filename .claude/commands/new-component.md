---
description: Add a component to the shared UI kit, following the kit's conventions.
argument-hint: <component-name>
---

Add `$1` to `@slate/ui-kit`, following `.agents/workflows/add-component.md` exactly.

Before writing anything:

- Read an existing component with a similar shape and match its structure.
- Check `packages/slate-tokens/src/tokens/` for the values you need. If a value
  is missing, add a token — never a literal.

Create:

```
packages/slate-ui-kit/src/$1/$1.component.tsx
packages/slate-ui-kit/src/$1/$1.variants.ts      (if it has variants)
packages/slate-ui-kit/src/$1/index.ts
packages/slate-ui-kit/tests/$1/$1.component.test.tsx
```

Then export it from `packages/slate-ui-kit/src/index.ts` and register it in
`packages/slate-ui-kit/gallery/gallery.entries.tsx` — a component missing from
the gallery drifts visually without anyone noticing.

Build on a Radix primitive if one exists. Do not hand-roll focus trapping,
dismiss behaviour, or roving tabindex.

Finish by running `moon run slate-ui-kit:test` and `moon run slate-ui-kit:typecheck`.
