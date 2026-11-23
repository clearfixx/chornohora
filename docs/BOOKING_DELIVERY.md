# Booking — demonstration-only draft

The Chornohora website is a visual and interaction demo, not a commercial booking system. The form is intentionally **nonfunctional as a submission service**.

## What works

- Client-side field validation (including phone and future date).
- Prepare and review a draft.
- Copy the completed request text, edit values or reset the form.
- UA and EN localized interface.

## What deliberately does not work

- **No Send button and no email submission.**
- No external request is made when preparing or copying a draft.
- `POST /api/booking` always responds with `503 {"ok":false,"code":"demo_only"}`, even if historic Resend environment variables are configured.
- No server storage or email delivery is promised.
- The demo should not be used to collect real booking applications.

Historic mail-delivery source modules may remain in the repository for reference, but are not imported by the live API route or form. Do not enable them as part of public deployment.

## Loader

The React Journey renders a lightweight SSR-visible, brand-colored loading veil. It disappears when `useJourneyProgress` confirms `JourneyController` is mounted. There are no arbitrary hold timers, artificial percentages, scroll overrides or new dependencies. `prefers-reduced-motion` disables the progress-line animation and fade.

The approved journey artwork, 404 and navigation remain unchanged.
