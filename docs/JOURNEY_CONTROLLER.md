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
### Intermittent scroll diagnostics

The React preview exposes a bounded in-browser event trace only when the URL includes `&trace=1`. For example: `/uk?preview=react&trace=1`. After reproducing a jump, run `copy(JSON.stringify(window.__journeyTrace?.(), null, 2))` in Chromium DevTools. The latest 400 events include wheel deltas, scroll position, target, pending direction, animation frames and unexpected external jumps. No continuous production telemetry or network submission is performed. Browser tests now wait for controller readiness and require a verified Petros start coordinate before evaluating wheel exit; a failure at checkpoint setup is reported independently.

### Reduced motion / scroll-timeline fallback

The legacy CSS deliberately switches to a stacked, non-sticky layout under `prefers-reduced-motion: reduce` or without view-timeline support, hiding the animated route and traveler. The React controller now detects zero travel and navigates to the corresponding `.place.r1`–`.place.r4` section instead of incorrectly treating every stop as scroll position zero. The browser quality gate verifies all four static panels, immediate Hero navigation and native wheel behavior.

### Scroll ownership stress gate

Chromium tests direct scrollbar-style jumps while wheel RAF is active, wheel events over form text areas, and resizing during animated navigation followed by a reverse wheel input. The opt-in bounded `?trace=1` diagnostics must record `external-scroll` without pulling the page back. Wheel events on nested/editable content now cancel pending page easing and remain browser-owned. Approved scene timing is unchanged.

### External-scroll RAF guard — 2026-11-19

The React wheel controller now checks the last applied scroll position **at the beginning of each wheel animation frame**, before writing another scroll position. Previously, only the scroll-sampling callback detected external movement; frame ordering could overwrite a user scrollbar drag, browser focus restoration or other scroll first. An observed displacement greater than 80 CSS pixels cancels the pending wheel target and leaves the externally chosen position intact. A viewport/layout change also clamps the target against the current scroll range each frame. Unit checks cover detection boundaries and cancellation policy. This is a targeted mitigation, **not** evidence of complete resolution of the intermittent Petros-to-booking/footer bug. Repeat manual browser acceptance and Chromium stress scenarios before lifting the release blocker. The approved 12% navigation speed adjustment and v22 reference remain unchanged.

### New-gesture stale origin regression — 2026-11-20

A completed wheel easing sequence may leave its last programmatic scroll position cached. If a browser/manual scroll follows it, the next distinct wheel gesture must start from the actual scroll position rather than interpreting the new location as interference with the old gesture. The controller now clears the stale applied-wheel origin when starting a new wheel sequence. The Chromium ownership-stress scenario now verifies recovery immediately after an interrupted wheel sequence and again after a fully completed sequence followed by direct scrollbar-style repositioning. These are additions to the existing Petros ↔ booking/footer seam checks. Release acceptance still requires a green CI run and real-device reverse-scroll validation; v22 and approved motion timing remain untouched.
