# Migration acceptance criteria

**Reference:** approved Illustrated Edition v22 (locally archived separately; must be imported into the repository before implementation).

## Preserve exactly

- Seamless four-scene landscape (Hoverla / Brebeneskul / Nesamovyte / Petros).
- Sky transitions, mountain/parallax layer positions, typography, logo and footer.
- Traveler walking at the tree base, alternately occluded by foreground trees.
- The same scroll progress source drives stage selection, traveler and progress bar.
- Hero-only decorative scroll mouse and transition to the first route scene.
- Right-side menu with approved restrained 13-degree perspective, fixed route links, booking CTA.
- Instagram 3 × 2 grid with 50 × 50 px tiles and 5 px gaps.

## Build plan

1. Import the full approved v22 reference assets into `public/legacy` (reference only).
2. Extract scene SVG and timeline into typed React components, using one scroll controller.
3. Move the navigation shell, language picker, progress cards, booking form and footer to React.
4. Replace reference content with native React; implement Ukrainian/English translations.
5. Screenshot regression and interaction tests at repeatable scroll positions; lint, typecheck, production build.
6. Vercel preview; confirm route transitions and browser errors; release to production.

**No production deployment while v22 behavior is replaced by a placeholder or iframe.**
