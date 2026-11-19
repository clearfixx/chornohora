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
