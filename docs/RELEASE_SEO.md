# Release SEO & indexing

The canonical React Journey lives at `/uk` and `/en`. This package adds localized titles, descriptions, canonical and alternate language links, Open Graph/Twitter metadata, a social card, favicon, sitemap, robots.txt and branded 404.

## Activation

There is **no confirmed production domain yet**. By design, the app does **not** guess a domain or permit search indexing until you configure the production HTTPS origin:

```dotenv
SITE_URL=https://your-verified-domain.example
```

This is a server-side variable, not `NEXT_PUBLIC_SITE_URL`. Set it in hosting settings, restart the deployment, then inspect the HTML, `/robots.txt` and `/sitemap.xml` on the real domain.

- Without a valid HTTPS `SITE_URL`: `noindex,nofollow`, robots disallows all, and sitemap contains no URLs.
- With a valid HTTPS `SITE_URL`: the canonical pages `/uk` and `/en` are indexable and advertise reciprocal `hreflang` links; `x-default` selects `/uk`.
- `?preview=legacy`, `?preview=native` and `?preview=react` are diagnostics: the page metadata requests `noindex,nofollow`, irrespective of production configuration.
- No hiking availability, prices, reviews, business address or organizer contact is represented as structured data; these facts have not been verified. Avoid marking this demonstrator as a real travel operator.

## Release checks

```bash
pnpm lint
pnpm typecheck
pnpm test:seo
pnpm build
```

After setting the real domain, verify both language pages in the rendered HTML, visually inspect the OG image and favicon, confirm unknown paths return 404, and test share previews with the target social platforms. Submit the sitemap to a search console only when the project is intentionally made public. This package does not deploy the site or configure a domain.

The email enquiry service remains **unconfigured** until the organizer supplies a verified sender and recipient; SEO readiness must not be mistaken for booking availability.
