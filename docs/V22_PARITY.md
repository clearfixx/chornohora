# Approved v22 parity contract

The immutable visual reference is committed under `public/legacy/index.html`, `public/legacy/styles.css`, and `public/legacy/assets/`.

## Active comparison modes

- `/uk`, `/en`: canonical original iframe, used for reference.
- `?preview=native`: previous extracted static fallback plus compatibility DOM controllers.
- `?preview=react`: experimental checked-in React JSX, observable JourneyStore and JourneyController.

The original iframe includes Ukrainian scene copy in both locales. The experimental React preview has working navbar locale links, but scene translations are not complete. Do not claim full bilingual parity.

## Invariants

- Preserve every original mountain SVG path, layer order, tree occlusion and visual scene timing.
- Preserve the approved route anchors 0.21, 0.42, 0.63, 0.83.
- Preserve animation in both directions, progress sync, mobile responsive layout and menu interactions.
- Retain the approved source untouched until all React-native release gates pass.
- A low screenshot pixel error is helpful diagnostic evidence, **not** proof of correct continuous animations or interactions.

## Acceptance

See `docs/REACT_MIGRATION_EXECUTION.md`, `docs/MIGRATION_QUALITY_GATE.md` and the most recent GitHub Actions artifacts. No merge to `main` before full visual and interaction parity.
