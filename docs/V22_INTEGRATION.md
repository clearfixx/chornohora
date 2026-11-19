# Approved v22 integration — current state

The approved source archive is already imported into `public/legacy/` (HTML, CSS, images, fonts and runtime assets). The old asset-copy instructions are historical, not an outstanding blocker.

## Architecture progression

1. **Reference**: canonical same-origin iframe, unchanged for trustworthy comparisons.
2. **Compatibility experiment**: `?preview=native`, source HTML inserted into a container and manually wired to ported v22 DOM controllers. This is temporary and carries acknowledged debt.
3. **React experiment**: `?preview=react`, original static fallback converted to checked-in JSX. Navbar locale links and route/drawer click handling are React-controlled. A single observable journey engine is mounted. Visual parity and remaining interaction migration are still in progress.

The canonical landing is **not** production-ready until step 3 replaces the reference and all imperative compatibility adapters are removed from the shipping app.

## Required engineering work

Finish the hiker, layer transitions, route progress, tooltips, booking UI and footer in real React components. Translate all copy via `next-intl`. Then verify Chromium original-vs-React screenshots and continuous scroll/touch/keyboard interactions.

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test:journey && pnpm test:jsx-source
pnpm build && pnpm test:browser && pnpm test:browser-scroll
```

See `docs/REACT_MIGRATION_EXECUTION.md` for the complete debt ledger and acceptance gates.
