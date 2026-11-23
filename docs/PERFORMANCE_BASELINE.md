# Isolated performance benchmark

`pnpm test:performance` runs a short benchmark against a **current production build**. It does not run legacy comparison modes, visual parity or the full scroll regression suite; it does not change CSS, Journey controller, or approved art.

## Windows

```powershell
git fetch origin
git switch feat/isolated-performance-benchmark
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

- TTFB/FCP, observed laboratory LCP and CLS, and loader completion timestamp relative to navigation (milliseconds)
- WebGL renderer and vendor, browser viewport and locale
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
