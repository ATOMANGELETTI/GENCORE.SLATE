---
description: Run every quality gate the way CI does, and report what failed.
---

Run the full check suite and report the results honestly.

```bash
bun run check
```

If anything fails:

1. Show the actual error output — never summarise a failure as "some tests failed".
2. Fix the cause, not the symptom. Silencing a lint with an allow attribute or
   loosening a type is not a fix.
3. Re-run until clean.

Also run these when the change touched their area:

- `bun run agents:check` — after editing anything in `.agents/`
- `bun run scripts/bun-version.ts --check` — after touching a version
- `moon run slate-tokens:check` — after editing design tokens

Report at the end which gates passed and which were not applicable.
