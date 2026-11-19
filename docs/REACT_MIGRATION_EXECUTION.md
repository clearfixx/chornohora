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
6. Diagnose intermittent Petros ↔ booking/footer wheel regressions with timeline event traces and deterministic Chromium stress scenarios, then establish visual/interaction parity across all target viewport sizes.
7. **Architectural cleanup, mandatory before switching the canonical route:** decompose the imported 228-line / ~41 KB `NativeV22Markup.tsx` into small, cohesive React components and data modules while preserving every approved SVG path, visual layer order and measured geometry. Replace ordinary HTML `<img>` occurrences in React-owned markup with `next/image` `<Image>` (intrinsic dimensions/alt, appropriate `sizes`, and loading priority). Keep complex decorative scene SVG as SVG components rather than converting them into raster images. Standardize feature-oriented directories, file names, imports and ownership boundaries. After parity and quality gates pass, remove production dependence on the iframe, `innerHTML`, x-dc and duplicate legacy controllers; archive the immutable reference separately. Merge to main only after acceptance.

## Intermittent scroll defect — open release blocker

**Observed by manual testing:** smooth wheel scrolling generally works, but sporadic high-speed jumps and a brief upward/downward oscillation can occur when moving from Petros toward booking/footer and back. The issue is NOT considered fixed merely because the previous manual session succeeded. Capture (only in development/test mode) wheel delta/deltaMode, event timestamp, scrollTop, wheelTarget, active direction, scheduled animation frame, controller navigation state, and route boundary. Keep a small bounded trace buffer with manual copy/export on demand; do not log continuously in production. Add reproducible Chromium checks for rapid alternation, trackpad momentum, wheel direction reversals during RAF, scroll bar dragging while animation is pending, resize during navigation, touch, keyboard, and focus on fields/route links. The existing CI test can fail with its initial `scrollY` far below the requested Petros checkpoint; inspect focus/scroll restoration and await confirmed scroll-position setup before attributing this failure solely to the wheel controller. **Neither suppressing nor weakening the failing test is acceptable.**

## Architectural target — package 3

```text
src/
  features/
    journey/
      components/
        JourneyPage.tsx
        JourneyStage.tsx
        JourneyNavbar.tsx
        JourneyRouteIndicator.tsx
        JourneyTraveler.tsx
        JourneyDrawer.tsx
        JourneyLocationTooltip.tsx
        scenes/
          MountainLayers.tsx
          ForestLayers.tsx
          CloudLayers.tsx
          SceneContent.tsx
        booking/
          BookingSection.tsx
          BookingForm.tsx
        footer/
          JourneyFooter.tsx
      data/
        locations.ts
        scene-assets.ts
      engine/
        journey-controller.ts
        journey-store.ts
        journey-easing.ts
      hooks/
        useJourneyProgress.ts
      types/
        journey.ts
  i18n/
  app/
```

This is a target responsibility map, not a requirement to create empty directories or one-file components without a real boundary. Component names may be adjusted to the actual responsibilities, but avoid ambiguous prefixes such as `NativeV22` once the React replacement becomes canonical. Split the current monolith by scene, layer, UI, form and footer ownership; extract reusable data and preserve original SVG path values byte-for-byte where possible. Use `next/image` for the **nine currently present `<img>` tags** in React-owned JSX (including logo, drawer brand and six gallery illustrations); avoid changing the frozen legacy reference assets. Explicit dimensions or appropriate fill/sizes, accessible alt text and proper optimization behavior are required. Never use CSS backgrounds as a workaround merely to avoid `<Image>`.

Apply module boundaries by feature, keep React visual components declarative, and permit DOM reads only in narrow geometry/scroll adapters. Rename/move files in cohesive batches with updated imports and tests, avoiding an over-factored explosion of trivial components. Target clear files sized by responsibility (not an arbitrary universal line limit). Confirm a no-regression pixel comparison after each extraction block. Preserve the stable `main` branch and the immutable legacy reference until sign-off.

## Debt ledger

- BLOCKING: V22SourceInteraction renders original markup via innerHTML — must be removed.
- BLOCKING: LegacyJourney iframe is canonical — replace only after parity.
- BLOCKING: x-dc and legacy assets execute outside React — remove from production runtime.
- BLOCKING: v22-ui-v8 and v22-ui-fixes-v11 each write stop state — eliminate both after React replacement.
- BLOCKING: V22ScrollController and new JourneyController cannot be mounted together.
- BLOCKING: English content inside original scene is not localized.
- BLOCKING: Native mode needs manual browser acceptance for touch, reverse scroll, drawer and Hero.
- RESOLVED IN REACT BRANCH: The 228-line, ~41 KB imported JSX monolith was replaced with feature components for stage, navbar, Hero, sky, mountain/cloud layers, forest, locations, booking, footer and drawer. Original SVG geometry is retained; complete visual parity remains to be verified.
- RESOLVED IN REACT BRANCH: The nine plain `<img>` elements in React-owned markup were converted to Next `<Image>` with their original explicit dimensions. The immutable legacy reference still contains its historical HTML images intentionally.
- BLOCKING: The wheel seam between Petros and booking/footer has intermittent jumps and reverse oscillations; reproduce, instrument and fix without suppressing tests.
- MAINTENANCE: Migration docs and file names can become stale as ownership moves; update them with each integration package.

## Acceptance gates

- Every visual landmark must match v22; do not redraw mountains or simplify paths.
- React owns every interactive control and content element.
- There is exactly one scroll/progress source for the React route.
- No production reference to x-dc, legacy runtime, iframe or HTML injection.
- UA/EN, 320/375/390/430/768/1280/1440/1920 viewport widths validated.
- All quality checks and visual regression gates pass.
- React image usages are `next/image` (except intentional inline SVG and documented platform exceptions); large imported source markup is split into meaningful components.
- No unexplained intermittent wheel/RAF reversals remain between Petros, booking and the footer.
- Keep PR in draft and main untouched until all are green.

## Status

The React store and controller are now mounted in the isolated `?preview=react` route. The original static scene and drawer have been converted to checked-in JSX, and React controls route navigation and menu state. Chromium compares original/native/React frames at fixed checkpoints. The canonical iframe and older `?preview=native` DOM adapter remain only as reference/compatibility modes. Traveler, route progress, location tooltips and drawer behavior are React-owned, but the booking behavior and full UA/EN translation remain unfinished; the imported JSX monolith and plain React `<img>` tags have been removed, but component naming, booking functionality, locale content and full browser parity still need work. The intermittent scroll issue and the CI scroll test are still open, so no architectural or visual completion is claimed.

## User-requested visual upgrade (separate from frozen v22 parity)

Approved source: the user's bundled `Чорногора1 — чотири неба.html` reference. This visual upgrade is **intentional**, so original-v22 pixel metrics for the newly replaced mountain silhouettes and tooltip designs are no longer valid as strict equality targets. Preserve baseline comparisons for the unchanged scene geometry, timing and UI.
- Replace **all** original React mountains (old `l1/l2/l3/l4`) with the reference's **three** complete `l1/l2/l3` SVG ranges (4200×560 / 4200×800 / 4200×440), including the lit facets of the latter two; retain existing parallax ordering and traveler/forest layers.
- Add the four exact supplied subtitles under the location titles. The existing “Ранок знову” heading is already in the closing scene, so avoid duplicating it.
- Render the four reference thumbnail SVGs (not stock images) and the reference's three icon facts in React tooltips with location-specific values.
- Petros meteors are decorative and only active during the Petros journey interval; reduced motion disables animation.
- Test click, wheel, reverse scrolling, mobile layering and tooltip keyboard interaction. Legacy source in `public/legacy` remains unchanged.

## Next integration — 2026-11-19

The React preview now uses next-intl for the visible navbar, Hero, four location descriptions, route drawer, footer, route buttons and floating tooltip details in UA/EN. Both language links explicitly retain `?preview=react`, rather than silently returning to the old iframe route. Locale-specific metadata is generated server-side. The booking form has a React-owned validated **draft preview and copy** workflow; real transmission remains unimplemented and MUST NOT be claimed to users. Server submission needs a configured organizer recipient, validation, abuse protection and consent retention before enabling. Legacy canonical routes remain unchanged. Scroll/visual acceptance and client interactions are release blockers.

## Accessibility checkpoint — 2026-11-19

The React route drawer is labelled as a modal dialog only while open; its focus loop handles Tab and Shift+Tab, attempted focus escape, Escape dismissal and focus restoration. A Chromium regression checks this behavior without changing the approved visual design. The page retains native keyboard and touch scrolling; reduced-motion and responsive acceptance remain required before switching the canonical route.

## Responsive and motion regression coverage

The browser suite adds a lightweight React-only viewport matrix (320/375/430/768/1280/1920 × UA/EN) alongside existing detailed 390/1440 captures. It validates scroll bounds and essential controls. Reduced-motion navigation and native wheel are exercised using Chromium media emulation. No changes are made to immutable `public/legacy`.

## Eleven-point trajectory acceptance

The Chromium suite now samples the React implementation at normalized progress 0, .105, .21, .315, .42, .525, .63, .73, .83, .915 and 1 in both languages and at mobile/desktop widths. It checks traveler geometry, route fill, current summit, document overflow and forward/reverse state equality; five in-between frames per combination are saved as screenshot artifacts. Deliberate reference-driven mountain and tooltip redesigns mean raw differences from original v22 cannot be treated as automatic visual regressions. These checks target preserved journey mechanics; human review of the changed artwork remains mandatory.

## Footer UA/EN accessibility audit

The React footer gallery now has six properly localized descriptive image alternatives. Five social-demo link accessible names and titles use `next-intl` placeholders; the back-to-top title also follows the current locale. Chromium checks these attributes in both languages. The demo-only social links and approved visual presentation remain unchanged.
