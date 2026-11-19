# Journey controller — React implementation

The target route data lives in `src/lib/journey.ts` and retains v22's four exact anchors: `govla: 0.21`, `brebeneskul: 0.42`, `nesamovyte: 0.63`, `petros: 0.83`.

## React controller

- `src/engine/journey-store.ts`: stable immutable snapshot with progress, active stop and programmatic navigation state. One subscription API for all scene consumers.
- `src/engine/journey-controller.ts`: one browser adapter for scroller measurements, scroll sampling on window for document scrolling (element listeners for nested scrolling), continuous eased wheel input across the React preview page, with momentum cancellation on reverse direction, native touch/keyboard scrolling. Cancels navigation state on user interaction and handles cleanup.
- `src/hooks/useJourneyProgress.ts`: uses `useSyncExternalStore`, mounting one controller for the JSX track.
- `src/components/journey/ReactJourneyPreview.tsx`: isolated mount under `?preview=react`.

The old v22 controller remains active **only in the canonical source/compatibility modes**. Never mount it alongside the new engine.

## Remaining work

Traveler and progress indicator now subscribe to the shared React store. Still validate exact visual parity, touch gestures, external scrollers and final full-browser acceptance before production use. Thoroughly validate touch gestures, reverse scrolling, external scrollers and reduced motion before production use.

## Checks

```sh
pnpm test:journey
pnpm test:jsx-source
pnpm lint
pnpm typecheck
pnpm build
pnpm test:browser
```

React location cards use a React portal for hover and keyboard-focus tooltips, preserving the original four descriptions while avoiding animated-scene clipping. Escape, pointer leave and scrolling dismiss the tooltip.\n
The route drawer's approved v19 perspective (`rotateY`/scale on the sticky `.stage`) is restored in `?preview=react`. Flat scene styling is scoped exclusively to `?preview=native`; the tall `.track` is never transformed, and reduced-motion preference disables stage perspective. Chromium checks open/close and scroll stability.\n