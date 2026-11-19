# React ownership migration — execution and acceptance

Baseline: approved v22 in public/legacy. This source stays immutable until complete acceptance.

## Architecture

The target is real React-owned JSX for the entire stage, foregrounds, traveler, route controls, navbar, drawer, booking section and footer. No source HTML insertion through innerHTML, dangerouslySetInnerHTML or an iframe may ship in the final production route.

A single JourneyStore publishes the normalized progress and derived active stop. JourneyController reads the DOM only for measurements and browser scrolling. It does not own visible markup or mutate React-rendered elements. React components subscribe through useSyncExternalStore.

The first engine implementation is staged separately from the old v22 preview. This avoids risking the approved reference while SVG geometry and interactions are ported.

## Large integration packages

1. Freeze complete original DOM, SVG geometry, CSS, 11 timeline checkpoints, both locales and mobile/desktop references.
2. Convert legacy static stage and SVG into checked-in JSX components with no runtime HTML parsing. Check all source attributes and asset paths and verify DOM geometry. Implement scene, foreground, traveler and Hero.
3. Wire the new engine/store to these React components; remove duplicate progress and scroll controllers when the JSX stage is functional. One listener model, one progress selector, no preventDefault wheel hijacking.
4. Convert Navbar, route drawer, progress, booking and footer to React event handlers and local state. Remove imperative DOM lifecycle adapters.
5. Translate all user-facing content via next-intl and complete mobile, reduced motion, keyboard and touch behavior.
6. Run lint, typecheck, unit, Chromium visual, rapid reverse scroll and device interaction tests. Remove legacy production paths only after equivalence is demonstrated; merge to main last.

## Debt ledger

- BLOCKING: V22SourceInteraction renders original markup via innerHTML — must be removed.
- BLOCKING: LegacyJourney iframe is canonical — replace only after parity.
- BLOCKING: x-dc and legacy assets execute outside React — remove from production runtime.
- BLOCKING: v22-ui-v8 and v22-ui-fixes-v11 each write stop state — eliminate both after React replacement.
- BLOCKING: V22ScrollController and new JourneyController cannot be mounted together.
- BLOCKING: English content inside original scene is not localized.
- BLOCKING: Native mode needs manual browser acceptance for touch, reverse scroll, drawer and Hero.
- MAINTENANCE: migration documents contain stale claims about missing source assets/lockfile.

## Acceptance gates

- Every visual landmark must match v22; do not redraw mountains or simplify paths.
- React owns every interactive control and content element.
- There is exactly one scroll/progress source for the React route.
- No production reference to x-dc, legacy runtime, iframe or HTML injection.
- UA/EN, 320/375/390/430/768/1280/1440/1920 viewport widths validated.
- All quality checks and visual regression gates pass.
- Keep PR in draft and main untouched until all are green.

## Status

The React store and controller are now mounted in the isolated `?preview=react` route. The original static scene and drawer have been converted to checked-in JSX, and React controls route navigation and menu state. Chromium compares original/native/React frames at fixed checkpoints. The canonical iframe and older `?preview=native` DOM adapter remain only as reference/compatibility modes. Dynamic traveler/progress/tooltip/booking behavior and full UA/EN translation are outstanding; no architectural or visual completion is claimed.
