# Migration quality gate

Last verified: 2026-11-19. Migration branch: `feat/nextjs-migration`.
The React extraction is under review in Draft PR #2 (`feat/react-journey-engine`).

## Current facts

- `pnpm-lock.yaml` is committed. CI installs with `pnpm install --frozen-lockfile`.
- Approved v22 source assets are committed under `public/legacy` and must remain unchanged during migration.
- `main` contains the repository bootstrap, not the completed landing.
- The canonical `/uk` and `/en` still use the original v22 iframe.
- `?preview=native` uses extracted source markup and imperative compatibility adapters. It is **not** a completed React migration.
- `?preview=react` mounts checked-in JSX and a new observable journey engine. This experimental implementation is **not** signed off.
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
7. Replace all plain `<img>` uses in React-owned markup with `next/image` `<Image>`, preserving intrinsic geometry, alt text and image loading behavior. Keep decorative SVG scenes as SVG.
8. Split the ~41 KB `NativeV22Markup.tsx` into cohesive scene/layer/header/route/booking/footer components and data; normalize naming and feature/module structure without unnecessary micro-components.
9. Full CI green and a final review; only then merge and switch the canonical route.

The old snapshot-based migration documents are superseded by this status and `docs/REACT_MIGRATION_EXECUTION.md`.
