# Journey controller — React implementation

The target route data lives in `src/lib/journey.ts` and retains v22's four exact anchors: `govla: 0.21`, `brebeneskul: 0.42`, `nesamovyte: 0.63`, `petros: 0.83`.

## React controller

- `src/engine/journey-store.ts`: stable immutable snapshot with progress, active stop and programmatic navigation state. One subscription API for all scene consumers.
- `src/engine/journey-controller.ts`: one browser adapter for scroller measurements, passive scroll sampling and native wheel/touch/keyboard behavior. Cancels navigation state on user interaction and handles cleanup.
- `src/hooks/useJourneyProgress.ts`: uses `useSyncExternalStore`, mounting one controller for the JSX track.
- `src/components/journey/ReactJourneyPreview.tsx`: isolated mount under `?preview=react`.

The old v22 controller remains active **only in the canonical source/compatibility modes**. Never mount it alongside the new engine.

## Remaining work

Move the interactive route progress, hiker and visual transitions to React-owned components receiving this store; remove their old DOM class togglers. Thoroughly validate touch gestures, reverse scrolling, external scrollers and reduced motion before production use.

## Checks

```sh
pnpm test:journey
pnpm test:jsx-source
pnpm lint
pnpm typecheck
pnpm build
pnpm test:browser
```
