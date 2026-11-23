# Isolated performance benchmark

`pnpm test:performance` runs a short benchmark against a **current production build**. It does not run legacy comparison modes, visual parity or the full scroll regression suite; it does not change CSS, Journey controller, or approved art.

## Windows

```powershell
git fetch origin
git switch feat/performance-metrics-audit
pnpm install --frozen-lockfile
pnpm build
pnpm test:performance
```

Default: 3 repeats per viewport at 1440 and 390 px, Ukrainian route, software-rendered headless Chromium/Edge. To allow GPU:

```powershell
pnpm test:performance --gpu
```

Or set `$env:CHORNOHORA_BROWSER_GPU="1"` before the command. **GPU allowed is not evidence of actual hardware rendering**: inspect the reported WebGL vendor/renderer. `--repeats=5` and `--both-locales` are optional, and `CHORNOHORA_CHROME_BIN` overrides browser discovery.

The benchmark starts Next.js itself on localhost port 3193 and Chromium CDP on port 9343. Ensure neither port is already in use. It checks whether `.next/BUILD_ID` exists and whether application files changed after the build.

## Measurements

Output: `artifacts/performance/report.json`. Each completed sample contains:

- TTFB/FCP, observed laboratory LCP and CLS (missing paint observations are recorded as `null`)
- Controller readiness, first `requestAnimationFrame` after readiness and first frame when the original loader CSS fade is actually hidden (milliseconds since navigation)
- WebGL renderer and vendor, browser viewport and locale
- Network resource counts, transfer bytes by initiator and the 12 largest downloaded resources
- rAF frame interval median/p95, approximate FPS and slow-frame counts for forward Hoverla and reverse Petros gestures
- Direction movement flag and count of sampled frames

A failed sample is recorded under `errors` and already completed samples survive. Non-zero exit code means at least one failed sample or setup error. There are no arbitrary FPS pass/fail gates; frame pacing depends strongly on hardware and renderer. A passing exit code does not mean 60 FPS, and a headless WebGL identity is not a guarantee of GPU compositing.

**Limitations:** The lab LCP/CLS observation is not the field Core Web Vitals 75th percentile. Synthetic wheel input cannot supply meaningful INP. rAF intervals are a pacing proxy, not a complete GPU trace. Loading timestamps include local server and browser variations. Compare medians across several runs on the same machine and mode; for real-world UX also measure on a real phone and deployed HTTPS URL.

Do not interpret missing `petros-paint-ablation.json` as an error: this isolated benchmark does not generate it. It belongs to the optional legacy paint-ablation suite.

## Release follow-up

1. Capture Windows software and GPU-allowed baselines and inspect any mismatch at the Petros reversal.
2. Capture mobile Safari behavior and Core Web Vitals (LCP, CLS, INP) after deployment.
3. Audit bundle/network priorities and loader-to-controller initialization timing.
4. Optimize only measured hotspots in a separately approved branch, without changing approved Journey animation or 404 design.

## Additional read-only audits

After a production build:

```powershell
pnpm audit:performance:assets
```

Writes `artifacts/performance/assets.json`: the largest files in `public/` and `.next/static/` plus totals grouped by file type. These are **uncompressed on-disk sizes**, not network transfer sizes, and a file's presence does not prove it is downloaded by the current route. Use `resourceSummary` in the browser benchmark report for observed network transfers.

After collecting software/GPU reports, run:

```powershell
pnpm test:performance:compare
```

This reads `artifacts/performance/software.json` and `gpu.json`, writes `comparison.json` and prints medians of repeated tests. Missing LCP/FCP measurements are excluded from medians and their observation count is retained.

### Interpreting the new timing signals

- `loaderReadyMs`: the approved controller mounted and React set `data-journey-loader=complete`.
- `firstReadyFrameMs`: first rAF callback after that state change; **not proof the frame was displayed**.
- `loaderHiddenFrameMs`: first rAF callback that observed both `visibility:hidden` and opacity below 0.01 after the original fade. This includes the approved CSS transition, but remains a browser scheduling proxy.
- `fcpMs` and `lcpMs`: captured before synthetic scroll. Each run enters `about:blank` first to avoid repeated same-origin navigation reusing paint timing state. A missing LCP or FCP remains `null`; never impute it from loader time.

The benchmark does not change any Journey Engine animation or load sequence. Performance optimization is deferred until measurements on real mobile devices and actual deployment show a reproducible bottleneck.
