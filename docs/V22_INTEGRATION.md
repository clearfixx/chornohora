# V22 integration package

This branch now contains an **asset-aware** route. It renders the approved v22 scene in an isolated iframe only when `public/legacy/index.html` exists. Without those assets, the original Next.js placeholder remains available and builds safely.

## Required assets

Copy the entire approved v22 source directory into `public/legacy/` preserving its paths: `index.html`, `styles.css`, `assets/`, and `original-v5.html`. Do not omit the binary font or image files. The source archive is `chornohora-illustrated-ui-v22.zip`.

The original page remains untranslated; both `/uk` and `/en` currently display the Ukrainian scene. The locale switch affects the surrounding Next.js shell. This limitation must be resolved before claiming full bilingual support.

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm build` and `pnpm dev`. Compare the original and integrated page at desktop/mobile viewports and multiple scroll positions. Confirm navigation, form, and drawer interactions. Do not merge or deploy to production before parity checks.

## Native migration

The temporary iframe is not the final architecture. Move the SVG stage, scroll timeline, route indicator, traveler, navbar, drawer, booking form, and footer into React modules while retaining the approved v22 behavior. The pure timeline primitives under `src/lib` are preparatory and are not yet a replacement for the original animation runtime.
