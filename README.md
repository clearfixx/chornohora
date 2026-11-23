# Чорногора — Чотири неба

Interactive illustrated journey through four Carpathian locations. The approved **v22** remains an immutable visual and behavioral reference while the landing is migrated to **Next.js 16 / React 19 / TypeScript** with `next-intl` (UA/EN), Motion and pnpm.

## Migration status

**Current release:** React Journey merged to `main` on 2026-11-22 in [PR #3](https://github.com/clearfixx/chornohora/pull/3).

- `/uk` and `/en` render the **React-owned Journey** by default. The original approved v22 remains available under `?preview=legacy` as a frozen comparison and rollback reference.
- `/uk?preview=react` and `/en?preview=react` are diagnostic aliases of the canonical React-owned scene, traveler, navigation, drawer, location tooltips, booking **draft** and footer.
- `?preview=native` is a legacy compatibility/comparison mode, **not** a production target.
- The v22 reference under `public/legacy` is frozen. Preserve visual geometry, approved timing, and scene assets unless a user-approved redesign explicitly overrides the relevant reference.
- The React booking form supports reviewed server-side email enquiries when Resend is configured. Without provider credentials it remains a copyable draft; no booking or availability is confirmed.
- The user accepted the current appearance and browser interaction. The migration was merged after green CI #817/#818.

## Local development

Prerequisites: Node.js 22, pnpm 11.9.0, Chromium for browser tests.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000/uk` or `/en` for the canonical React Journey. Use `?preview=legacy` to inspect the preserved reference.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test:journey
pnpm check:react-css
pnpm check:react-assets
pnpm check:react-ownership
pnpm test:react-ownership
pnpm test:jsx-source
pnpm build
pnpm test:browser
pnpm test:browser-scroll
pnpm test:geometry
```

The GitHub Actions quality workflow checks the canonical React route, the frozen v22 source, source/ownership contracts and browser scrolling. Exact pixel-level screenshot comparison is available as an opt-in diagnostic, not a mandatory merge gate. The later **CI runs #551, #555 and #557** passed their full jobs, including browser/scroll coverage. The #555 renderer report identifies **SwiftShader** (software rendering) rather than a physical GPU; a green software-CI benchmark is not evidence of smooth hardware-accelerated scrolling on the target device. Automated success is not equivalent to real-device acceptance; see the quality gate before changing canonical route ownership.

### Windows / hardware-allowed browser diagnostics

The Chromium scroll suite supports Chrome or Edge on Windows (standard install locations) and an explicit `CHORNOHORA_CHROME_BIN` executable path. In PowerShell:

```powershell
pnpm install --frozen-lockfile
pnpm build
$env:CHORNOHORA_BROWSER_GPU = "1"
$env:CHORNOHORA_PERF_DIAGNOSTICS = "1"
# Optional if Chrome/Edge is installed outside standard locations:
# $env:CHORNOHORA_CHROME_BIN = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
pnpm test:browser-scroll
```

The default suite tests navigation, responsive layout, and scroll regressions without running time-consuming paint ablations. Setting `CHORNOHORA_PERF_DIAGNOSTICS=1` additionally captures FPS metrics, responsive aurora comparisons, and `artifacts/v22-browser/petros-paint-ablation.json` (including WebGL renderer). **GPU allowed does not guarantee hardware acceleration**: check the reported renderer and treat SwiftShader as software fallback. Never use a green automated run alone to approve a canonical route switch.

For opt-in scrolling diagnostics, open `/uk?preview=react&trace=1` and inspect `window.__journeyTrace?.()` in browser DevTools; no production telemetry is sent.

## Release and SEO

Localized metadata, an OG image, robots.txt, sitemap.xml, favicon, and 404 are included. Search indexing is **disabled until a verified HTTPS `SITE_URL` is configured**. See [release SEO](docs/RELEASE_SEO.md).

## Documentation

- [Migration quality gate](docs/MIGRATION_QUALITY_GATE.md) — current acceptance checklist and constraints
- [React execution plan](docs/REACT_MIGRATION_EXECUTION.md) — implementation, debt ledger and parity checkpoints
- [Journey controller](docs/JOURNEY_CONTROLLER.md) — scroll ownership, cancellation and diagnostics
- [Migration reference](docs/MIGRATION.md) — preserved visual/interaction requirements

**Release state:** React Journey is in `main`; preserve `?preview=legacy` for comparison and rollback. Booking requests can now be sent to the organizer through a configured Resend email account; without server credentials the form remains a copyable draft. Provider acceptance is not a confirmed reservation. See [booking delivery](docs/BOOKING_DELIVERY.md).
