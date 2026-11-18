# V22 visual parity baseline

The approved v22 source must be placed under `public/legacy` before enabling the iframe wrapper.

The `/uk` and `/en` routes will display the same original Ukrainian v22 scene. The shell has a locale switch, but the embedded scene is not translated. This is a temporary baseline, not a native React migration.

## Migration contract

1. Preserve original SVG geometry, stage scroll length, traveler and tree occlusion.
2. Characterize `x-dc` runtime before extracting typed React components.
3. Extract Navbar, 3D drawer, booking form and footer.
4. Translate all scene copy with `next-intl`.
5. Compare browser screenshots and interactions at fixed scroll positions.
6. Only remove the iframe and deploy to production after tests.

**Important:** Until `public/legacy/index.html` and its assets are committed, do not switch the Next.js page to the iframe wrapper.
