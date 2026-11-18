# Migration quality gate

The GitHub feature branch contains a Next.js shell and an optional preservation iframe, not a completed native v22 implementation.

## Checks

```powershell
pnpm install --no-frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:journey
pnpm test:source
pnpm build
```

When `public/legacy/index.html` is present, `pnpm audit:v22` validates all required source assets, route anchors and local file references.

**CI caveat:** the current repository does not include `pnpm-lock.yaml`. The workflow temporarily uses `--no-frozen-lockfile` and does not enable pnpm caching. This makes the checks runnable but not reproducible. Commit the lockfile and restore `--frozen-lockfile` before release.

## Release blockers

1. Commit the 21-file approved v22 source to `public/legacy`.
2. Complete native React migration with equivalent traveler, tree occlusion, scene timing and drawer behavior.
3. Translate the actual landing page content to English.
4. Add browser visual/interaction parity tests.
5. Run all checks and obtain a green CI result.

The presence of a workflow file is not evidence that GitHub Actions actually ran.
