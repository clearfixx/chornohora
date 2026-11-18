# Animation migration contract (v22)

The approved v22 animation is the reference, not an optional aesthetic guideline.

## Timeline ownership

`useJourneyProgress` samples the actual track element in a passive scroll handler coalesced into requestAnimationFrame. The pure `getJourneyState` selector is shared by scene changes, route progress and traveler. This is a foundation only; it is not yet wired into the legacy scene.

## Do not regress

- Preserve original v22 scroll length, sticky stage, scene gradients and SVG geometry.
- Preserve traveler position and occlusion ordering at foreground trees.
- Preserve original transitions and parallax timing; don't approximate with arbitrary Motion keyframes.
- Keep Hero route progress hidden until first location scene.
- Keep the right drawer 3D stage transform and Escape/backdrop behavior.
- Support Ukrainian and English without translating text inside raster assets.

## Verification before release

Compare screenshots at 0%, 10%, 21%, 32%, 42%, 53%, 63%, 73%, 83%, 95%, and 100% of track scroll, at desktop and mobile viewports. Validate drawer and reduced-motion fallback. Require lint, typecheck, build, and browser tests before production deployment.

**Current state:** controller/progress primitives only. The stage and v22 assets have not been ported into React. Do not deploy this scaffold as the finished site.
