# Migration quality gate

Last verified: 2026-11-20. Migration development branch: `feat/react-journey-engine` (Draft PR #2 targets `feat/nextjs-migration`).
The React extraction is under review in Draft PR #2 (`feat/react-journey-engine`).

## Current facts

- `pnpm-lock.yaml` is committed. CI installs with `pnpm install --frozen-lockfile`.
- Approved v22 source assets are committed under `public/legacy` and must remain unchanged during migration.
- `main` contains the repository bootstrap, not the completed landing.
- The canonical `/uk` and `/en` still use the original v22 iframe.
- `?preview=native` uses extracted source markup and imperative compatibility adapters. It is **not** a completed React migration.
- `?preview=react` mounts checked-in JSX, a single observable journey engine and its independent CSS bundle. Its UA/EN content and demo draft interactions have automated coverage. This implementation is **not** signed off.
- CI has source, unit, Chromium geometry, scroll, touch, interaction and screenshot comparison checks. A passing CI run alone does not constitute final human visual acceptance.

## Mandatory checks

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:journey
pnpm test:jsx-source
pnpm test:source
pnpm audit:v22
pnpm build
pnpm test:browser
pnpm test:browser-scroll
pnpm test:geometry
```

GitHub Actions runs the full sequence and saves visual comparison artifacts. Inspect the most recent run before declaring any check green.

## Blocking acceptance criteria

1. Fully React-owned JSX for all scene, navbar, drawer, tooltip, booking and footer interactions.
2. No runtime dependence on `x-dc`, `iframe`, `innerHTML` or old compatibility controllers in the canonical landing.
3. Accurate route progress, traveler path/occlusion, animated backgrounds, scene timing, keyboard and touch behavior in the React version.
4. Complete UA/EN translation of the actual landing content.
5. Approved visual comparison across original/native/React at desktop and mobile checkpoints, plus continuous reverse scrolling.
6. Verified smooth scroll through Petros ↔ booking ↔ footer in both directions, including rapid reversals, plus a regression check that first validates the actual starting scroll position. No intermittent oscillation or unexplained scroll restoration.
7. COMPLETED IN REACT BRANCH: Replace all plain `<img>` uses in React-owned markup with `next/image` `<Image>`, preserving intrinsic geometry, alt text and image loading behavior. Keep decorative SVG scenes as SVG.
8. COMPLETED IN REACT BRANCH: Split the ~41 KB `NativeV22Markup.tsx` into cohesive scene/layer/header/route/booking/footer components and data without unnecessary micro-components.
9. Full CI green and a final review; only then merge and switch the canonical route.

The old snapshot-based migration documents are superseded by this status and `docs/REACT_MIGRATION_EXECUTION.md`.

## Progress on package 3 (2026-11-19)

The main 41 KB `NativeV22Markup.tsx` is deleted in the React branch and replaced by components under `src/features/journey/components/`, including `scenes/` layers. Nine React-owned image tags use `next/image`. The approved `public/legacy` reference remains untouched. This satisfies the decomposition and image-conversion implementation milestone, but **not** the release gate: old production iframe and compatibility adapters remain; visual and interaction checks, including intermittent Petros ↔ footer scroll, are unresolved.

For scroll diagnostics use `/uk?preview=react&trace=1` and copy `window.__journeyTrace?.()` from DevTools after a reproduction. The trace is bounded and opt-in.

## Responsive and reduced-motion coverage (React preview)

Chromium also checks the React renderer at widths 320, 375, 430, 768, 1280 and 1920 px, for both languages, including missing navigation/form controls, horizontal document overflow and touch-target geometry. An explicit emulated `prefers-reduced-motion: reduce` checks that button navigation is immediate and native wheel input still scrolls. This is an automated smoke gate, not a substitute for visual/manual acceptance.

## Intermediate visual checkpoints

In addition to the four summit captures, CI saves five transition frames for each of UA/EN × 390/1440; the 11-point trajectory gate asserts active stop, progress fill, traveler coordinate monotonicity and exact re-entry into previously sampled positions during reverse scroll. These are behavioral/geometry safeguards. Pixel reports for intentionally redesigned artwork are diagnostic only and must not be interpreted as a pass/fail equivalence to the older v22 rendering.

## Browser scroll ownership stress

The regression suite covers manual scrollbar movement during wheel easing, form-field wheel ownership and resize during programmatic navigation. Its trace must record external interruption, and the page may not spring back. Manual reverse-gesture acceptance remains a release requirement.

## React CSS isolation

The React preview references `/react-journey.css` instead of separately loading original legacy CSS at runtime. Its committed content must equal the normalized `public/legacy/styles.css` followed by `public/v22-react-scene.css` exactly; this preserves CSS cascade order while decoupling the rendered React route from the legacy stylesheet URL. Source and Chromium smoke gates enforce the contract. Frozen reference and native compatibility modes are still present and not replaced.

## React import ownership boundary

`pnpm check:react-ownership` traverses actual local static/dynamic import edges beginning at the ReactJourneyPreview entry, rather than flagging intentionally retained legacy comparison code elsewhere in the repository. It fails if the reachable graph imports old HTML/scroller adapters or uses an iframe, `innerHTML` assignment or `dangerouslySetInnerHTML`. The check separately verifies the server page's `preview=react` branch does not mount legacy HTML/CSS. `pnpm test:react-ownership` covers scanner behavior and guards source-level isolation. Neither gate implies manual visual/scroll acceptance is complete.

## React media isolation

The 11 media resources consumed by React (logo, six gallery SVGs, four local fonts) now live at `/journey/assets/` as byte-identical copies of the approved originals. The React stylesheet sync rewrites legacy asset URLs without changing CSS keyframes or cascade. `pnpm check:react-assets` verifies required files, byte identity, and that React JSX/CSS no longer refers to `/legacy/assets/`. Legacy JavaScript runtime blobs are deliberately excluded. The original v22 asset tree stays immutable.

## Continuous booking/footer seam acceptance

The Chromium scroll suite now also runs a locale-specific physical wheel sequence beginning within the booking region, continuing down toward the footer, reversing immediately and crossing back into the mountain track. It asserts that the real starting scrollY is established, down/up samples never oscillate by more than 2px, and the return crosses the actual journey end boundary by over 100px. Runs independently for UA and EN at 1440px; this complements prior summit-specific and mobile/touch checks. Human acceptance of fast trackpad momentum remains required.

## CI verification — 2026-11-20

GitHub Actions run [#421](https://github.com/clearfixx/chornohora/actions/runs/44666737800) completed successfully at commit `af04265`. It passed lint, TypeScript, unit/source/ownership checks, production build, Chromium browser and scroll suites, geometry comparison, and the original/native screenshot comparison. An earlier run failed TypeScript nullability in the scroll diagnostics; the follow-up fix was included in #421.

The wheel controller additionally clears its last applied origin at the start of each *new* gesture and checks for externally changed scroll coordinates before the next easing frame. The Chromium ownership-stress scenario tests both external interruption and completion followed by a manual jump and a fresh wheel gesture.

**Still blocking:** real-device manual reversal/stress acceptance, human review of redesigned SVG silhouettes and tooltips, and sign-off to switch the canonical iframe route to React. The form is draft-only; server delivery is explicitly deferred until after migration. Do not infer production readiness or merge permission from CI success alone.

## Scene-art and reverse-timeline regression — 2026-11-20

The 11-point React journey Chromium matrix (UA/EN × 390/1440) now checks that all three intentionally redesigned reference mountain SVGs retain their exact viewBox dimensions, expected lit-facet path counts and stacking indices. It also checks that Petros meteor activation follows the approved normalized interval `[0.76, 0.94)` while scrolling forward **and** returns to the same state at each checkpoint on reverse scroll. This is a structural/timeline safeguard, not a substitute for human evaluation of actual scene artwork or animation appearance. The frozen `public/legacy` source and approved scroll timing are unchanged.

## Traveler and forest occlusion gate — 2026-11-20

The eleven-checkpoint Chromium matrix now checks the forest composition in UA/EN at both 390px mobile and 1440px desktop. The back-forest SVG must remain behind the traveler and the foreground forest above it in computed stacking order; both forest layers must retain their existing 5000×220 viewBox and SVG geometry, and foreground pointer events must remain disabled. The assertions run at every forward checkpoint to detect incidental React/CSS regressions without altering approved artwork or motion. This structural layer check does **not** establish pixel-perfect occlusion at every intermediate traveler location; full visual review is still required prior to switching the canonical route.

## Mobile route tooltip viewport gate — 2026-11-20

The React route tooltip portal now clamps its measured position on **both** viewport axes, placing the popover below the focused route marker if the normal above-marker placement lacks room, then constraining the final position to a 12px safe edge. The Chromium responsive matrix focuses the Brebeneskul route marker by keyboard at 320/375/430px in UA and EN and asserts the rendered portal fits the viewport. This does not alter tooltip illustrations, copy, or the immutable v22 reference; real mobile-device review remains required.

## Homepage completion checkpoint — 2026-11-21

The user has explicitly prioritized **finishing the homepage before building a preloader or error pages**. No scope expansion into those features is authorized in this branch.

### Verified in the feature branch

- Full checks passed for CI **#551, #555 and #557**, including React JSX ownership, lint/type/build and Chromium browser interactions.
- Browser-only Petros aurora paint profiling finds a software-rendering bottleneck with CSS blur. Chromium #555 reports `ANGLE (... SwiftShader ...)`, **not a dedicated GPU**. Therefore these CI frame times cannot determine real-device acceptance.
- The cached Canvas aurora experiment is **diagnostic only**, not enabled in the product. Its initial screenshots at desktop/mobile/tablet show promising similarity but not full, time-synchronized visual parity.
- React-owned renderer is available at **`/uk?preview=react`** and **`/en?preview=react`**. Canonical **`/uk`** and **`/en`** still use the frozen v22 reference; no route switch or merge was approved.
- Booking on the React preview is a local demonstration/draft and does not transmit submissions. Do not describe it as a working production booking backend.

### Required acceptance work before shipping React as the homepage

| Gate | Current status | Evidence needed |
| --- | --- | --- |
| Complete CI (both locales, responsive, keyboard, reduced-motion and form smoke) | Automated green at #557 | Re-run at final candidate HEAD |
| Petros → booking → footer → Petros wheel / trackpad reversals | Automated regression green, manual **open** | Test on target Windows/desktop browser; no bounce, jump or involuntary return |
| Approved v22 appearance, clouds, moon rise, traveler, route panels, navbar, footer | **Human visual review open** | Compare React preview against canonical reference with real scrolling, including both directions |
| 390 px phone and 768 px tablet visual and touch parity | Screenshot geometry tests green, **device review open** | Verify no clipping, font/layout errors, menu or tooltip overflow, rotate viewport |
| Auroras at Petros | Original CSS stays unchanged | GPU-enabled hardware profile; if no proven win+visual parity, **ship original effect** and document performance limitation |
| Booking delivery | Explicitly demonstration-only | Either accept the draft-only scope for the homepage release or approve a separate server delivery scope before public use |
| Canonical route ownership and merge | **Blocked pending acceptance** | Approved release decision, then switch route and retire legacy runtime from public React path; re-run all checks |

### Manual acceptance steps (use the existing preview; do not alter production)

1. Compare **`http://localhost:3000/uk`** (frozen reference) with **`http://localhost:3000/uk?preview=react`** in a production build at desktop width. Repeat in **`/en`**.
2. Scroll slowly through all four mountain locations, then repeatedly reverse rapidly around **Petros → booking → footer**. Also test starting with the booking form focused.
3. Test the Hero scroll indicator, route dots, navbar/drawer, language switching, tooltip keyboard focus/Escape, booking validation/draft, and footer navigation.
4. Test phone widths **390 px** and **320 px**, tablet **768 px**, and reduced-motion preference. Check that sections remain accessible and no horizontal overflow appears.
5. If a scroll jump occurs, reproduce at **`?preview=react&trace=1`** and export **`window.__journeyTrace?.()`** from DevTools. Do not mask or relax the regression assertion.

**Release rule:** A green CI run, promising cache FPS, or a single clean manual scroll does not by itself authorize replacing the canonical v22 homepage. Once the above manual checks are accepted, switch routes in a separate controlled release package and only then begin preloader/404/500 work.

### React route anchor fallback repair — 2026-11-21

The React route indicator and footer used legacy abbreviated `href="#breb"` and `href="#nes"`, while the real stage anchor ids are `brebeneskul` and `nesamovyte`. Delegated click navigation hid this mismatch during ordinary use, but links could not resolve correctly as native URL hash destinations (e.g., copy/open link, fallback navigation). Both components now point to the real ids without altering their event handlers, scroll easing, route progress, geometry or visual appearance. A JSX source regression checks every journey-action/route-target hash link against known stage/book ids and rejects the abbreviated forms. The frozen v22 source and canonical route remain unchanged. Confirm the new CI before treating this gate as verified.

### Link and click-navigation regression — 2026-11-21

React route indicator and footer hash targets now match the actual stage anchor ids for Brebeneskul and Nesamovyte (no abbreviated `#breb` or `#nes` fallback destinations). A JSX source test enumerates 18 route links and checks each against real stage/form ids; its initial regex typo was fixed in commit `f36d9695`. The Chromium booking/footer seam scenario now also **clicks the actual footer Brebeneskul link and navbar booking CTA in both locales**, checking the destination scroll position after the approved easing duration. This covers real delegated click wiring rather than relying only on static href assertions. Check CI #574 before considering this additional browser gate passed. No changes to approved motion timing, CSS, v22 baseline or canonical routes.
