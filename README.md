# Чорногора — Чотири неба

Interactive illustrated journey through four Carpathian locations. The approved **v22** remains an immutable visual and behavioral reference while the landing is migrated to **Next.js 16 / React 19 / TypeScript** with `next-intl` (UA/EN), Motion and pnpm.

## Migration status

**Active branch:** `feat/react-journey-engine` (Draft PR #2 into `feat/nextjs-migration`).

- `/uk` and `/en` without query parameters still render the **approved v22 reference** through the legacy route. Do not treat this route as the completed React version.
- `/uk?preview=react` and `/en?preview=react` render the isolated React-owned scene, traveler, navigation, drawer, location tooltips, booking **draft** and footer.
- `?preview=native` is a legacy compatibility/comparison mode, **not** a production target.
- The v22 reference under `public/legacy` is frozen. Preserve visual geometry, approved timing, and scene assets unless a user-approved redesign explicitly overrides the relevant reference.
- The React booking form is **demonstration only**: local validation/preview/copy; it does not transmit requests. Server submission is deferred until migration acceptance.
- The canonical route switch, production deployment, and merging the Draft PR remain blocked on human visual/interaction acceptance, including repeat testing of rapid wheel/trackpad reversal around Petros ↔ booking/footer.

## Local development

Prerequisites: Node.js 22, pnpm 11.9.0, Chromium for browser tests.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000/uk?preview=react` or `/en?preview=react` to inspect the migration without modifying the canonical v22 route.

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

The GitHub Actions migration workflow additionally exercises the immutable v22 source and visual-comparison checks. The later **CI runs #551, #555 and #557** passed their full jobs, including browser/scroll coverage. The #555 renderer report identifies **SwiftShader** (software rendering) rather than a physical GPU; a green software-CI benchmark is not evidence of smooth hardware-accelerated scrolling on the target device. Automated success is not equivalent to real-device acceptance; see the quality gate before changing canonical route ownership.

### Windows / hardware-allowed browser diagnostics

The Chromium scroll suite supports Chrome or Edge on Windows (standard install locations) and an explicit `CHORNOHORA_CHROME_BIN` executable path. In PowerShell:

```powershell
pnpm install --frozen-lockfile
pnpm build
$env:CHORNOHORA_BROWSER_GPU = "1"
# Optional if Chrome/Edge is installed outside standard locations:
# $env:CHORNOHORA_CHROME_BIN = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
pnpm test:browser-scroll
```

The suite writes `artifacts/v22-browser/petros-paint-ablation.json` (including WebGL renderer) and screenshots. **GPU allowed does not guarantee hardware acceleration**: check the reported renderer and treat SwiftShader as software fallback. The complete browser suite is intentionally intensive and tests navigation as well as performance. Never use a green automated run alone to approve a canonical route switch.

For opt-in scrolling diagnostics, open `/uk?preview=react&trace=1` and inspect `window.__journeyTrace?.()` in browser DevTools; no production telemetry is sent.

## Documentation

- [Migration quality gate](docs/MIGRATION_QUALITY_GATE.md) — current acceptance checklist and constraints
- [React execution plan](docs/REACT_MIGRATION_EXECUTION.md) — implementation, debt ledger and parity checkpoints
- [Journey controller](docs/JOURNEY_CONTROLLER.md) — scroll ownership, cancellation and diagnostics
- [Migration reference](docs/MIGRATION.md) — preserved visual/interaction requirements

**Do not merge into `main` or replace the canonical v22 route until all acceptance gates are completed.**
