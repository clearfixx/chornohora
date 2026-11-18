# Approved v22 source import

The canonical source is the **complete** `chornohora-illustrated-ui-v22.zip` archive (21 files). Do not use the older original-v5 HTML as the live page.

Run from repository root:

```powershell
node scripts/import-v22.mjs "F:\\path\\to\\chornohora-illustrated-ui-v22.zip"
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

The import copies the original files byte-for-byte to `public/legacy`, validates the required animation scripts, SVG gallery, logo and location anchors, refuses to overwrite existing files, and prints SHA-256 hashes. The import does not rewrite the original animation engine or imply native React parity.

Commit the imported `public/legacy` directory to the existing feature branch. The actual source archive is not in the GitHub repository yet; this script is a reproducible import path, not a substitute for that upload.

## v22 implementation facts

The source contains `<x-dc>` with a separate static fallback, a sticky `.track > .stage` scene, `.anc` anchors at 21%, 42%, 63%, and 83%, SVG mountain layers `.l1` through `.l4`, the traveler `.hiker`, and a second `.forest-foreground` tree layer above the traveler. Do not collapse the two tree layers during migration. Keep the drawer logic in `assets/route-menu-v19.js` until its behavior is covered by browser tests.

The original CSS and JavaScript assets are dependencies of `index.html`. The temporary iframe preserves that document boundary. Full UA/EN translations and native React scene components remain unfinished.
