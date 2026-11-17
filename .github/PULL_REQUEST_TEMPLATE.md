## What and why

<!-- What this changes, and the problem it solves. Link the issue if there is one. -->

## Checklist

- [ ] `bun run check` passes (format, lint, typecheck, unit tests with coverage)
- [ ] `bun run build && bun run size && bun run lint:package && bun run test:pack` pass, if exports, dependencies or bundle size changed
- [ ] `bun run test:oracle` passes, if the generated Office files changed
- [ ] New behavior has tests
- [ ] Docs and READMEs are updated
- [ ] The changed packages have an entry under `## [Unreleased]` in their `CHANGELOG.md`
