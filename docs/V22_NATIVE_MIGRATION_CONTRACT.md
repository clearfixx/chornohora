# v22 → Next.js: exact-source migration contract

**Source of truth:** `public/legacy/index.html`, `public/legacy/styles.css` and `public/legacy/assets/*`. These are the approved v22 assets and must not be altered as a side effect of migration.

## Confirmed from the original files

- The document is not plain HTML. The `<x-dc>` root is interpreted by the bundled DC runtime.
- The page embeds `class Component extends DCLogic` inside `<script type="text/x-dc">`.
- The controller handles scroll smoothing, route navigation and booking. Its navigation positions are **0.21, 0.42, 0.63, 0.83**.
- The bundled `runtime-1.js` and `runtime-2.js` are React/ReactDOM runtime distributions, separate from Next.js's React instance.
- `ui-v8.js`, `ui-fixes-v11.js` and `route-menu-v19.js` implement additional DOM behavior. The route drawer is outside `<x-dc>`.
- Original CSS and DOM define the visual scene, layer ordering and animation. A simplified SVG/CSS recreation is **not** a valid substitute.

## Required migration order

1. Capture the exact DOM and SVG produced by the original DC runtime at fixed viewport sizes and scroll positions. Keep a browser-based reference.
2. Identify the DC runtime's template syntax, state bindings, lifecycle and any generated elements. Record which structures are static and which are runtime-generated.
3. Transfer original static markup and SVG paths *verbatim* into React components. Adapt JSX syntax only when necessary and verify resulting DOM equivalence.
4. Port `DCLogic` scroll and navigation behavior with equivalent event semantics, easing, cleanup and reduced-motion behavior.
5. Transfer the existing UI and route-menu behavior without changing their visual geometry, timing, keyboard handling or layer order.
6. Compare screenshots and interactions against v22 at matching viewports and scroll progress. Only switch the main page after passing parity checks.

## Non-goals

- New mountain silhouettes, traveler drawings, typography, navigation or design.
- Claiming that an iframe or a route serving the original HTML constitutes a completed native React migration.
- Removing original runtime assets before their replacement is verified.

## Source inventory

Run `pnpm inventory:v22` to generate `docs/generated/v22-source-contract.json`. The inventory records original source hashes and key dependencies; it does not modify any source file.
