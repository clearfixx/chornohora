# React Journey integration candidate

Status: **merged to `main` on 2026-11-22** via [PR #3](https://github.com/clearfixx/chornohora/pull/3), merge commit `2a0a880`. CI runs #817 and #818 passed. The user accepted the existing visual result. This document retains implementation checkpoints for historical reference; the React renderer is now canonical, while the legacy and native modes remain available for diagnostics.

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

## Trackpad response adjustment — 2026-11-22

User-reported manual Windows touchpad acceptance revealed that the React wheel handler was too conservative at the Hero → Hoverla threshold: it previously applied a 0.95 multiplier and a ±180px per-event cap. React is now the default route in this integration branch, so this was noticeable even though the approved scene timelines themselves were unchanged.

The React wheel handler now uses a standalone `journeyWheelDelta` policy with a 1.5x distance gain and a ±270px per-event cap, preserving the scroll-easing model, direction reversal, external-scroll ownership and the existing click-navigation duration. This does **not** alter scene timestamps, CSS keyframes, traveler timing, the original v22 baseline or legacy/native comparison handlers. Unit tests exercise pixel, line, page and reverse input.

**Required confirmation:** run `pnpm test:journey`, `pnpm typecheck`, `pnpm build`, and `pnpm test:petros-perf:gpu`, then manually test both short trackpad gestures at Hero → Hoverla and rapid reversals at Petros → booking/footer. A faster wheel multiplier alone is not a substitute for a device acceptance run.

## Integration polish — 2026-11-22

- Kept the user-approved wheel/trackpad sensitivity and all approved scene timings unchanged.
- The user-supplied vector logo is rendered by `next/image` with intrinsic 243×81 proportions; desktop/mobile layout widths remain CSS-controlled while image height scales automatically in the navbar, drawer and footer. This addresses the Next.js warning about changing only one image dimension and avoids distorting the SVG.
- Added regression assertions for canonical UA/EN locale hashes, drawer keyboard/focus handling and inert background, and responsive logo aspect ratio. These source assertions supplement but do not replace browser interaction and manual device checks.
- Pending acceptance: run `pnpm test:jsx-source`, `pnpm test:v22-routes`, `pnpm check:react-assets`, `pnpm lint`, `pnpm typecheck`, `pnpm build` and `pnpm test:petros-perf:gpu` on the Windows host. Confirm responsive logo, UA/EN language switching at a scene and booking, Escape and focus restoration in the drawer, and touchpad scroll on the physical laptop.
- Leave `main` and immutable original v22 assets alone until the user signs off.

## Conditional CSS policy and browser navigation regression — 2026-11-22

The canonical React and temporary native comparison share `/[locale]` but have incompatible, globally scoped stylesheets. Their stylesheet links remain conditional in the server page until comparison modes are removed or split into independent route boundaries. The `@next/next/no-css-tags` ESLint exception is documented **only** in this route file to preserve CSS isolation; it is not a general license to manually link new stylesheets. Blindly moving both stylesheets into a shared global import risks leaking legacy selectors into the React journey.

The real-browser interaction suite now exercises a direct `/uk#petros` entry, checks that the EN navbar link preserves `#petros`, clicks it and verifies the resulting locale/fragment, then checks that React loads only `/react-journey.css` and `?preview=native` only `/legacy/styles.css`. Existing original iframe comparisons, scene checks, scroll behavior and responsive diagnostics remain.

Acceptance on Windows: `pnpm lint`, `pnpm typecheck`, `pnpm test:jsx-source`, `pnpm build`, then `pnpm test:petros-perf:gpu`. The browser suite has to complete successfully before declaring navigation/CSS isolation accepted. No wheel or scene timing changes in this package.
