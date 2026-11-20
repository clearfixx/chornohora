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

### Viewport resize during navigation — 2026-11-20

The React controller cancels both pending click-navigation RAF and wheel easing when the viewport resizes, then samples its current position. This avoids a stale navigation target (computed with the earlier viewport geometry) pulling the page after an orientation/viewport-height change. The existing Chromium stress scenario now also asserts the post-resize scroll coordinate remains steady before it issues the opposite wheel gesture. Manual mobile rotation acceptance is still required; this change does not adjust approved navigation durations or scene timing.

### Preview render budget and navigation timing — 2026-11-20

After field testing reported frame drops at Hero → Hoverla and booking → Petros (but no uncontrolled acceleration), the React preview no longer subscribes its entire top-level component to each progress snapshot. Its body class is driven by a boolean threshold selector (progress >= 0.2095) and the Petros meteor component subscribes to its boolean visibility window (0.76 <= progress < 0.94). Route indicator and hiker still receive the continuous values they need. This reduces React reconciliation without changing scene geometry or the original v22 presentation. Explicit navigation durations are now 15% faster than the baseline policy (/1.15), replacing the previously approved 12% adjustment (/1.12); wheel physics are unchanged, pending measured browser checks. FPS gains are a hypothesis until verified on the affected desktop device in production build; validate Hero → Hoverla, booking → Petros, scroll reversals and reduced-motion behavior before acceptance.

### Geometry sampling optimization — 2026-11-20

The controller now caches track start position and available scene travel instead of reading the sticky track/stage geometry in every scroll animation frame. Measurements are refreshed on mount, on viewport resize, by ResizeObserver (track/stage size changes), and before explicit stop navigation. Ordinary wheel/scroll frames read only the scroll position and the cached geometry to calculate progress, reducing potential forced synchronous layout at Hero → Hoverla and booking → Petros. Native scrolling, wheel easing and approved +15% click-navigation timing are unchanged. Revalidate responsive/reduced-motion layouts and rapid seam reversal against the automated Chromium gates. The actual FPS improvement still requires measurements on the affected device; frozen v22 CSS is untouched.
