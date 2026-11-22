# React Journey integration candidate

Status: **feature branch only** (`feat/react-journey-engine`). Do not merge into `main` without explicit approval and acceptance checks.

## Route ownership

| URL | Renderer | Purpose |
| --- | --- | --- |
| `/uk`, `/en` | React JSX Journey + JourneyStore/Controller | Canonical integration candidate in this branch |
| `/uk?preview=react`, `/en?preview=react` | Same React renderer | Backward-compatible diagnostics link |
| `/uk?preview=legacy`, `/en?preview=legacy` | Frozen approved v22 iframe | Visual and behavioral reference / rollback option |
| `/uk?preview=native`, `/en?preview=native` | Extracted DOM + legacy compatibility adapters | Migration-only comparison |

The original contents of `public/legacy/` remain unchanged. The canonical React page must not mount an iframe, `innerHTML`, `x-dc` or a legacy scroll controller. The two comparison paths are intentionally isolated from the canonical renderer.

Navbar UA/EN switches now use clean locale URLs with the current route hash (`#start`, `#book` or a peak ID). The compatibility query `?preview=react` continues to work for existing diagnostic URLs, but is no longer emitted by the React language switch.

## Validation before sign-off

Run on the integration branch:

```sh
pnpm lint
pnpm typecheck
pnpm test:journey
pnpm test:jsx-source
pnpm test:source
pnpm test:v22-routes
pnpm check:react-ownership
pnpm test:react-ownership
pnpm check:react-css
pnpm check:react-assets
pnpm build
pnpm test:browser
pnpm test:browser-scroll
pnpm test:geometry
pnpm test:petros-perf:gpu
```

Manual comparison must use `/uk` versus `/uk?preview=legacy` (and equivalent English URLs), especially rapid forward/reverse scroll at Petros → booking → footer, responsive widths, focus, drawer, route tooltip, touch and reduced motion. This is essential even if automated tests pass.

The booking form remains **draft-only**: preparing a request does not send a server-side reservation. Aurora caching was measured only diagnostically, and was not enabled in production.

**Integration commit state is not a test pass.** The current branch needs a fresh full verification against its final HEAD. Only after manual acceptance should the release/merge be authorized; subsequent removal of compatibility artifacts should be a separate, scoped package.

## Historical reference

The earlier v22 integration stages remain described in `docs/REACT_MIGRATION_EXECUTION.md` and `docs/MIGRATION_QUALITY_GATE.md`. Those documents describe the previous preview-first state; this file records the controlled route integration candidate.
