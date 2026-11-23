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

Default: 3 repeats per viewport at 1440 and 390 px, Ukrainian route, headless Chromium/Edge with `--disable-gpu`. The default cache mode is **cold**: browser cache is disabled and cleared before each measured navigation. This does not isolate operating-system caches, server-side Next.js caches or network conditions. To allow GPU:

```powershell
pnpm test:performance --gpu
```

Warm-cache testing is an **explicit separate scenario**: use `pnpm test:performance --cache=warm`. Each warm sample first navigates to the route to prime the browser cache, then navigates via `about:blank` to a measured document. Do not compare cold with warm baselines.

Or set `$env:CHORNOHORA_BROWSER_GPU="1"` before the command. **GPU allowed is not evidence of actual hardware rendering**: inspect the reported WebGL vendor/renderer. `--repeats=5` and `--both-locales` are optional, and `CHORNOHORA_CHROME_BIN` overrides browser discovery.

The benchmark starts Next.js itself on localhost port 3193 and Chromium CDP on port 9343. Ensure neither port is already in use. It checks whether `.next/BUILD_ID` exists and whether application files changed after the build.

## Measurements

Output: `artifacts/performance/report.json`. Each completed sample contains:

- TTFB/FCP, observed laboratory LCP and CLS, plus the LCP element tag, id, class, optional URL and size (missing paint observations are recorded as `null`)
- Controller readiness, first `requestAnimationFrame` after readiness and first frame when the original loader CSS fade is actually hidden (milliseconds since navigation)
- WebGL renderer and vendor, browser version, launch flags, cache mode, viewport and locale
- Network resource counts, transfer bytes by initiator and the 12 largest downloaded resources
- rAF frame interval median/p95, approximate FPS and slow-frame counts for forward Hoverla and reverse Petros gestures
- Direction movement flag and count of sampled frames; per-sample `quality` and warnings for missing/contradictory data

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

This reads `artifacts/performance/software.json` and `gpu.json`, writes `comparison.json` and prints medians of repeated tests. It **rejects identical reports, incorrect GPU flags, mismatched cache modes and browser versions**. Matching WebGL renderer strings result in a warning; `gpuComparisonVerified` remains false because a WebGL probe cannot establish how Chromium composited the whole page. Missing LCP/FCP measurements are excluded from medians and their observation count is retained.

### Interpreting the new timing signals

- `loaderReadyMs`: the approved controller mounted and React set `data-journey-loader=complete`.
- `firstReadyFrameMs`: `performance.now()` inside the first rAF callback after readiness, rather than rAF's frame-start timestamp, which may precede observer readiness. **Not proof the frame was displayed**.
- `loaderHiddenFrameMs`: first rAF callback that observed both `visibility:hidden` and opacity below 0.01 after the original fade. This includes the approved CSS transition, but remains a browser scheduling proxy.
- `fcpMs` and `lcpMs`: captured before synthetic scroll. Each run enters `about:blank` first to avoid repeated same-origin navigation reusing paint timing state. A missing LCP or FCP remains `null`; never impute it from loader time.

The benchmark does not change any Journey Engine animation or load sequence. Performance optimization is deferred until measurements on real mobile devices and actual deployment show a reproducible bottleneck.

## Repeatable Windows collection

Run these against the same production build, without editing the application between runs:

```powershell
pnpm test:performance --cache=cold --repeats=3 --both-locales
Copy-Item artifacts/performance/report.json artifacts/performance/software.json
pnpm test:performance --gpu --cache=cold --repeats=3 --both-locales
Copy-Item artifacts/performance/report.json artifacts/performance/gpu.json
pnpm test:performance:compare
```

Warm-load performance is a separate experiment and should use separate file names. The two named JSON input files must belong to different runs; `report.json` is overwritten after each invocation. Inspect `report.warnings`, `sample.quality`, `lcpElement` and the comparator's `warnings` before drawing conclusions. FCP equal to LCP is diagnostic only, not an automatic failure. Browser renderer identity is not sufficient to claim a true software-versus-hardware test.
