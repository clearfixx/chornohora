# Migration quality gate

Last verified: 2026-11-19. Migration development branch: `feat/react-journey-engine` (Draft PR #2 targets `feat/nextjs-migration`).
The React extraction is under review in Draft PR #2 (`feat/react-journey-engine`).

## Current facts

- `pnpm-lock.yaml` is committed. CI installs with `pnpm install --frozen-lockfile`.
- Approved v22 source assets are committed under `public/legacy` and must remain unchanged during migration.
- `main` contains the repository bootstrap, not the completed landing.
- The canonical `/uk` and `/en` still use the original v22 iframe.
- `?preview=native` uses extracted source markup and imperative compatibility adapters. It is **not** a completed React migration.
- `?preview=react` mounts checked-in JSX, a single observable journey engine and its independent CSS bundle. Its UA/EN content and demo draft interactions have automated coverage. This implementation is **not** signed off.
- CI has source, unit, Chromium geometry, scroll, touch, interaction and screenshot comparison checks. A passing CI run alone does not constitute final human visual acceptance.

## Mandatory checks

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:journey
pnpm test:jsx-source
pnpm test:source
pnpm audit:v22
pnpm build
pnpm test:browser
pnpm test:browser-scroll
pnpm test:geometry
```

GitHub Actions runs the full sequence and saves visual comparison artifacts. Inspect the most recent run before declaring any check green.

## Blocking acceptance criteria

1. Fully React-owned JSX for all scene, navbar, drawer, tooltip, booking and footer interactions.
2. No runtime dependence on `x-dc`, `iframe`, `innerHTML` or old compatibility controllers in the canonical landing.
3. Accurate route progress, traveler path/occlusion, animated backgrounds, scene timing, keyboard and touch behavior in the React version.
4. Complete UA/EN translation of the actual landing content.
5. Approved visual comparison across original/native/React at desktop and mobile checkpoints, plus continuous reverse scrolling.
6. Verified smooth scroll through Petros ↔ booking ↔ footer in both directions, including rapid reversals, plus a regression check that first validates the actual starting scroll position. No intermittent oscillation or unexplained scroll restoration.
7. COMPLETED IN REACT BRANCH: Replace all plain `<img>` uses in React-owned markup with `next/image` `<Image>`, preserving intrinsic geometry, alt text and image loading behavior. Keep decorative SVG scenes as SVG.
8. COMPLETED IN REACT BRANCH: Split the ~41 KB `NativeV22Markup.tsx` into cohesive scene/layer/header/route/booking/footer components and data without unnecessary micro-components.
9. Full CI green and a final review; only then merge and switch the canonical route.

The old snapshot-based migration documents are superseded by this status and `docs/REACT_MIGRATION_EXECUTION.md`.

## Progress on package 3 (2026-11-19)

The main 41 KB `NativeV22Markup.tsx` is deleted in the React branch and replaced by components under `src/features/journey/components/`, including `scenes/` layers. Nine React-owned image tags use `next/image`. The approved `public/legacy` reference remains untouched. This satisfies the decomposition and image-conversion implementation milestone, but **not** the release gate: old production iframe and compatibility adapters remain; visual and interaction checks, including intermittent Petros ↔ footer scroll, are unresolved.

For scroll diagnostics use `/uk?preview=react&trace=1` and copy `window.__journeyTrace?.()` from DevTools after a reproduction. The trace is bounded and opt-in.

## Responsive and reduced-motion coverage (React preview)

Chromium also checks the React renderer at widths 320, 375, 430, 768, 1280 and 1920 px, for both languages, including missing navigation/form controls, horizontal document overflow and touch-target geometry. An explicit emulated `prefers-reduced-motion: reduce` checks that button navigation is immediate and native wheel input still scrolls. This is an automated smoke gate, not a substitute for visual/manual acceptance.

## Intermediate visual checkpoints

In addition to the four summit captures, CI saves five transition frames for each of UA/EN × 390/1440; the 11-point trajectory gate asserts active stop, progress fill, traveler coordinate monotonicity and exact re-entry into previously sampled positions during reverse scroll. These are behavioral/geometry safeguards. Pixel reports for intentionally redesigned artwork are diagnostic only and must not be interpreted as a pass/fail equivalence to the older v22 rendering.

## Browser scroll ownership stress

The regression suite covers manual scrollbar movement during wheel easing, form-field wheel ownership and resize during programmatic navigation. Its trace must record external interruption, and the page may not spring back. Manual reverse-gesture acceptance remains a release requirement.

## React CSS isolation

The React preview references `/react-journey.css` instead of separately loading original legacy CSS at runtime. Its committed content must equal the normalized `public/legacy/styles.css` followed by `public/v22-react-scene.css` exactly; this preserves CSS cascade order while decoupling the rendered React route from the legacy stylesheet URL. Source and Chromium smoke gates enforce the contract. Frozen reference and native compatibility modes are still present and not replaced.
