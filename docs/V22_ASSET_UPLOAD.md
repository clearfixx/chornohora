# Import the approved v22 archive

The original v22 assets are large and include binary fonts/images. The feature branch contains the React iframe wrapper but deliberately does not activate it until those assets are committed.

Extract the provided `chornohora-nextjs-v22-parity-package.zip` at the repository root, then run:

```powershell
pnpm lint
pnpm typecheck
pnpm build
git status --short
git add public/legacy src/app/globals.css 'src/app/[locale]/page.tsx' src/components/journey/LegacyJourney.tsx docs/V22_PARITY.md postcss.config.mjs
git commit -m "feat: integrate approved v22 parity baseline"
git push origin feat/nextjs-migration
```

Do not merge into main until native migration and visual parity checks are complete.
