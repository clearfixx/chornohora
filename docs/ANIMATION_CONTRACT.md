# Animation migration contract (approved v22)

The original geometry and timing are a strict visual reference, not an optional aesthetic guideline.

## Ownership

The React experimental route mounts real JSX (rather than injecting source HTML). `JourneyStore` publishes normalized progress and derived active stop; `JourneyController` samples the browser scroller. `useJourneyProgress` subscribes through `useSyncExternalStore`.

The large JSX stage and drawer are now available under `?preview=react`, but many dynamic subparts remain to be split into React components. Current availability is **not** final animation parity.

## Do not regress

- Original stage scroll length, gradients, SVG geometry and mountain-layer order.
- Traveler position, foreground tree occlusion and bobbing.
- Original transitions and parallax timing, including reverse scrolling.
- Hero route progress hidden before the first summit.
- Right-side route drawer behavior, focus, backdrop, Escape and keyboard interactions.
- UA/EN translations, mobile typography and reduced-motion behavior.

## Verification

Compare Hero, Hoverla, Brebeneskul, Nesamovyte and Petros screenshots for 1440×900 and 390×900 in both locales; also test 0%, 10%, 21%, 32%, 42%, 53%, 63%, 73%, 83%, 95%, 100% track positions.

Browser CI now produces original/native/React diagnostic screenshot artifacts. Do not infer that the React version is accepted merely because captures exist or CI completes.

See `docs/REACT_MIGRATION_EXECUTION.md` for sign-off requirements.

## React preview pacing and Petros moon — 2026-11-19

A user video showed a delayed lunar rise: the original orb keyframes stayed near the lower horizon at the Petros anchor (83% travel), rising substantially only nearer 88%. The React-only `journey-earlier-petros-moon` keyframes keep the sun portions unchanged through 70% and move the rise into 76–83%, reaching its high night position by the Petros stop. The approved legacy CSS is untouched. Wheel step and cap are raised from 0.85/160 to 0.95/180, and click navigation durations are shortened by 1/1.12 (about 10.7% shorter, 12% greater average speed), preserving cubic easing and bidirectional wheel handling. Browser tests check computed lunar vertical position at 83%.
