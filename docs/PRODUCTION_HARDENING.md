# Production hardening — launch gate

The canonical React Journey (`/uk`, `/en`) no longer depends on a copied legacy HTML file. With or without `public/legacy/index.html`, the primary route must display the same React Journey.

## Default public deployment

- **Never** configure `CHORNOHORA_ENABLE_DIAGNOSTICS=1` on a public production deployment.
- `?preview=legacy` and `?preview=native` are ignored in production unless explicitly enabled. Canonical React remains the default.
- Direct `/legacy/*` requests return 404 in normal production through the Next.js proxy. This blocks the source HTML and all related assets, even when they are present on disk. Make sure requests go through the Next.js application; a CDN that serves `public/` directly would bypass this guard.
- In local development comparison modes remain available. Browser parity tests explicitly opt in for their temporary production-mode test server.
- Baseline security headers are set for all Next.js routes: `nosniff`, same-origin frame protection, referrer and permissions policies. `SAMEORIGIN` is intentional to support the opt-in comparison iframe.
- A restrictive Content Security Policy is **not** enabled in this change: it needs a separate audit of script, style, font and SVG dependencies and should be deployed with Report-Only observation first.
- HSTS is **not** enabled before the production TLS/domain setup has been verified.

## Not yet launch-ready

- **Email requests remain deferred.** No real booking should be advertised until a verified sender/recipient, data-use notice, and external provider delivery check are present.
- The current rate limiter for `POST /api/booking` is per-process and its IP identification assumes trusted forwarding headers. Before enabling real delivery, enforce a CDN/proxy-level limit and use a shared limiter keyed from a trusted client identity. Avoid interpreting the built-in limiter as an abuse-proof production boundary.
- Enable indexing only after configuring a verified `SITE_URL` and confirming `robots.txt`, `sitemap.xml` and rendered canonical/hreflang URLs against the actual deployment.
- Run real mobile and desktop performance tests with hardware acceleration; CI uses software-rendered browser tests for stability.
- Check browser network failures, response headers and unknown routes on the **deployed URL**, not just in CI.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test:release
pnpm build
pnpm test:browser
pnpm test:browser-scroll
```

The browser test scripts enable diagnostic access only in their own spawned temporary server; this is not a recommendation to deploy the variable to production.
