# Approved v22 parity contract

The immutable visual reference is committed under `public/legacy/index.html`, `public/legacy/styles.css`, and `public/legacy/assets/`.

## Active comparison modes

- `/uk`, `/en`: canonical original iframe, used for reference.
- `?preview=native`: previous extracted static fallback plus compatibility DOM controllers.
- `?preview=react`: experimental checked-in React JSX, observable JourneyStore and JourneyController.

The original iframe contains Ukrainian source copy even when loaded under the English canonical route. The React preview independently renders translated navbar, scenes, booking draft, route controls, accessible gallery alternatives, and footer in UA/EN. Automated i18n checks are green; user review of translated copy remains part of acceptance.

## Invariants

- Keep the original mountain/SVG visual baseline frozen. The React preview includes a separately user-approved three-layer mountain redesign and new location tooltips; these intentional differences are not regressions against v22. Preserve the approved React layer ordering, tree occlusion, route anchors, and now-approved +12% pacing and earlier Petros moonrise.
- Preserve the approved route anchors 0.21, 0.42, 0.63, 0.83.
- Preserve animation in both directions, progress sync, mobile responsive layout and menu interactions.
- Retain the approved source untouched until all React-native release gates pass.
- A low screenshot pixel error is helpful diagnostic evidence, **not** proof of correct continuous animations or interactions.

## Acceptance

See `docs/REACT_MIGRATION_EXECUTION.md`, `docs/MIGRATION_QUALITY_GATE.md` and the most recent GitHub Actions artifacts. No merge to `main` before full visual and interaction parity.
