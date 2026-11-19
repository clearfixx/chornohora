# v22 visual comparison — Chromium baseline (2026-11-18)

Source: GitHub Actions run 44333186008, artifact `v22-browser-comparison` (40 PNGs).
Each comparison uses the same viewport (1440×900 or 390×900) and the same
scene scroll anchor. Original = canonical iframe; native = `?preview=native`.

## Pixel difference summary

Computed locally from exported PNGs with RGB absolute error. MAE is mean
absolute RGB channel error (0–255). Changed % is the proportion of pixels
where at least one RGB channel differs by more than 12.

| Locale | Viewport | Hero MAE | Hoverla MAE | Brebeneskul MAE | Nesamovyte MAE | Petros MAE |
|---|---:|---:|---:|---:|---:|---:|
| uk | 1440 | 2.758 | 2.147 | 3.229 | 2.326 | 2.295 |
| uk | 390 | 0.964 | 0.508 | 1.540 | 1.621 | 0.827 |
| en | 1440 | 2.679 | 2.279 | 2.672 | 2.132 | 2.137 |
| en | 390 | 0.840 | 0.438 | 1.548 | 1.236 | 0.698 |

Across all 20 original/native pairs, MAE is below 3.23/255; this is
encouraging but **not proof of pixel-perfect parity**. Different rendering
timestamps, animations, antialiasing and locale overlay all contribute.

## Visually confirmed differences

1. The original iframe host renders a fixed bottom-right UA/EN switch;
   native mode previously lacked this host control. Fixed by sharing
   `JourneyLocaleNav` across the two modes.
2. Hero CTA buttons have different horizontal dimensions in the two
   renderings. Requires browser geometry inspection before changing CSS.
3. Route timeline and stop labels show small vertical alignment differences
   in some captures. Do not apply offsets without identifying root cause.

## Remaining acceptance gates

- Compare computed bounding boxes for Hero CTA, route timeline, stop cards,
  navigation and footer on both modes.
- Verify scene transitions continuously (not only five anchor positions).
- Exercise real pointer/touch navigation, booking form, drawer and tooltip.
- Repeat the 40-screenshot comparison after each parity fix.
- Keep canonical original until those gates pass.

Do not interpret low average pixel error as a sign-off for release.
