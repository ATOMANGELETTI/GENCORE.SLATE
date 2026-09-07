---
id: 04-typescript
title: TypeScript
description: Type-safety rules, module conventions, and the patterns expected in every .ts and .tsx file.
globs: ['**/*.ts', '**/*.tsx']
alwaysApply: false
---

# TypeScript

Strict mode, everywhere, with no exceptions granted per-file.

## Banned

| Banned                    | Use instead                                                |
| ------------------------- | ---------------------------------------------------------- |
| `any`                     | `unknown` plus a narrowing check                            |
| `as` type assertions      | A type guard, or fix the type at its source                 |
| `!` non-null assertion    | An explicit check, or a type that admits the absence        |
| `@ts-ignore`              | `@ts-expect-error` with a comment explaining why            |
| `enum`                    | `const` object plus a derived union type                    |
| Default exports           | Named exports (Biome enforces this outside config files)    |
| Barrel files across layers| Re-export only within a folder's own `index.ts`             |

Prefer a union of literals over a `boolean` flag once a third state becomes
imaginable: `status: 'idle' | 'launching' | 'running'` beats `isRunning`.

## Types

Use `type` for unions, intersections, and function shapes; use `interface` only
when declaration merging is genuinely needed (almost never here).

Derive rather than duplicate:

```ts
const APP_STATUS = { idle: 'idle', launching: 'launching', running: 'running' } as const;
type AppStatus = (typeof APP_STATUS)[keyof typeof APP_STATUS];
```

Anything crossing the IPC boundary is defined once in `@slate/bindings` and
imported from there. Never redeclare a Rust-facing shape locally — a silent
drift between the two sides is the hardest bug in this codebase to find.

## Imports

Workspace packages are imported by name, never by relative path across a
project boundary:

```ts
import { Button, TitleBar } from '@slate/ui-kit';   // correct
import { Button } from '../../../packages/slate-ui-kit/src';  // never
```

Type-only imports use the `type` modifier so the bundler can erase them:

```ts
import type { AppDescriptor } from '@slate/bindings';
```

## Errors

Functions that can fail return a discriminated result rather than throwing,
mirroring the Rust side:

```ts
type Result<T, E = SlateError> = { ok: true; value: T } | { ok: false; error: E };
```

Throw only for programmer error — a violated invariant that no caller could
sensibly handle. Never throw a bare string or a plain object.

## Async

`async`/`await` only; no raw `.then()` chains. Every `await` that can reject is
either inside a `try` or returned to a caller that handles it. Do not create
floating promises — if a promise is intentionally unawaited, mark it `void` and
comment why.

## Bun APIs

Prefer Bun's standard library over npm packages for anything Bun does natively:
`Bun.file`, `Bun.write`, `Bun.Glob`, `Bun.$`, `Bun.hash`, `bun:test`,
`bun:sqlite`. A dependency added for something Bun already does is a
dependency that will be removed in review.
