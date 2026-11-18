# Native route controller — migration package

This package extracts a pure timeline model from the approved v22 markup. The canonical anchor IDs are `govla`, `brebeneskul`, `nesamovyte`, `petros`; their scroll fractions are `0.21`, `0.42`, `0.63`, `0.83`.

The `getStopScrollTop` function converts the location fraction into an absolute scroll offset using the track's document position and scrollable height. `useJourneyProgress` samples scroll via one passive listener and animation-frame coalescing, and exposes `navigateToStop`. The progress component is keyboard-accessible and accepts translated labels.

## Status and integration

These modules are **not yet mounted into the original v22 stage**. The source still relies on its own `x-dc` runtime. Replacing that runtime without first importing and characterizing the full SVG source would risk visible regressions.

Before using this controller in production, validate actual scroll anchoring, transitions, hiker/tree occlusion, 3D drawer, and reduced-motion behavior in browser. The native stage remains the next dependency.

## Checks

```powershell
pnpm test:journey
pnpm lint
pnpm typecheck
pnpm build
```

Node 22+ is required for built-in TypeScript stripping in the zero-dependency journey tests.
