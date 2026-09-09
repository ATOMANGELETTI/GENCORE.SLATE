# Workflow — adding a UI kit component

Use this whenever two applications need the same piece of UI. A component that
only one app will ever use belongs in that app's `src/components/`.

## 1. Create the files

```
packages/slate-ui-kit/src/<component>/
├── <component>.component.tsx    The component. One export.
├── <component>.variants.ts      cva variants, if it has any
├── <component>.types.ts         Props and related types, if non-trivial
└── index.ts                     Public re-exports
```

Then add the folder to `packages/slate-ui-kit/src/index.ts`.

## 2. Write it

- Build on a Radix primitive when one exists. Do not hand-roll focus trapping,
  roving tabindex, or dismiss behaviour.
- Every colour, space, radius, and duration comes from a token. No literals.
- Accept and merge `className`, and spread the remaining native props.
- Variants live in `*.variants.ts` via `cva`, never as `if` branches inside the
  component.
- `ref` is an ordinary prop in React 19 — do not wrap in `forwardRef`.

## 3. Test it

```
packages/slate-ui-kit/tests/<component>/<component>.component.test.tsx
```

Cover what a user can observe: it renders, each variant applies, keyboard
interaction works, and the accessible name is right. Do not assert class
strings — that tests Tailwind, not the component.

## 4. Add it to the gallery

Register it in `packages/slate-ui-kit/gallery/gallery.entries.tsx` so it renders
in both themes at `bun run gallery`. A component absent from the gallery will
drift visually without anyone noticing.

## 5. Verify

```bash
moon run slate-ui-kit:test
moon run slate-ui-kit:typecheck
bun run gallery      # look at it, in both themes
```

## 6. Commit

```
feat(ui-kit): add <component> with <variants>
```

Add a changeset if the component is user-visible in any app.
