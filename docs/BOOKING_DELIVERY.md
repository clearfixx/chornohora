# Booking request delivery

The React Journey form retains the two-step review workflow and sends requests with `POST /api/booking` only when the user explicitly presses **Send enquiry**. A success response means **Resend accepted the email request**, **not** that the organizer received it or confirmed a booking. No reservation availability is managed by this site.

## Setup

1. Verify a sending domain with [Resend](https://resend.com/domains).
2. Copy `.env.example` to `.env.local`. Set `RESEND_API_KEY` (secret), `BOOKING_FROM_EMAIL` (verified sender), and `BOOKING_TO_EMAIL` (real organizer inbox).
3. Add the same **server-only** variables to your production hosting environment. Do not use `NEXT_PUBLIC_` for secrets.
4. Restart the application and test with a real inbox. Check Resend delivery events separately from HTTP 200; provider acceptance is not final inbox delivery.
5. Replace fictional contact information in the site, and publish an accurate privacy notice/retention policy before handling real users' data.

Without all three settings the API returns HTTP 503 and the UI offers a copyable draft. It does not fake delivery or silently email third parties. Never commit `.env.local`.

## API contract

JSON only, same-origin requests:
`name` (2–120), `phone` (7–15 digits allowing separators), optional `email`, `date` (YYYY-MM-DD, not earlier than today in Europe/Kyiv), `people` (1–12), optional `message` (up to 2000), `locale` (`uk`/`en`), `consent: true`, optional hidden `website: ''`. Maximum JSON body size 8 KiB.

- 200: email service accepted submission
- 400 / 413 / 415: invalid request
- 403: origin check failed
- 429: request frequency limit
- 502: email provider error or timeout
- 503: missing provider configuration

The endpoint does not persist applications in a database or log applicant data. Request details pass to the configured email provider and recipient; their separate storage/retention policies apply.

## Hardening before public launch

The built-in per-IP limiter (five requests per 15 minutes) is **process-local, best effort**, not shared between serverless instances. Add a trusted proxy/CDN rate limit or shared Redis limiter, plus spam monitoring/alerting, before public production use. User-controlled forwarding headers should not be trusted when an origin server is directly exposed. Ensure the organizer has approved collection of applicants' personal information.

The preserved `?preview=legacy` and `?preview=native` demo forms intentionally do not deliver real requests. Only the canonical React Journey form does.
