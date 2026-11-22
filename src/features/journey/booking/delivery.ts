import type {BookingRequest} from './validation';

type MailConfig = {apiKey: string; from: string; to: string};
export function bookingMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.BOOKING_FROM_EMAIL?.trim();
  const to = env.BOOKING_TO_EMAIL?.trim();
  if (!apiKey || !from || !to) return null;
  // Keep control characters out of SMTP header fields and addresses.
  const email = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  if (!email.test(from) || !email.test(to)) return null;
  return {apiKey, from, to};
}

export function bookingEmailText(data: BookingRequest): string {
  return [
    'Chornohora · new hiking enquiry',
    'Name: ' + data.name,
    'Phone: ' + data.phone,
    'Email: ' + (data.email || '—'),
    'Departure: ' + data.date,
    'People: ' + data.people,
    'Language: ' + data.locale,
    'Message:',
    data.message || '—',
    '',
    'This is an enquiry, not a confirmed reservation.',
  ].join('\n');
}

export type DeliveryResult = 'sent' | 'unavailable' | 'failed';
export async function deliverBookingRequest(
  data: BookingRequest,
  env: NodeJS.ProcessEnv = process.env,
  fetcher: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const config = bookingMailConfig(env);
  if (!config) return 'unavailable';
  try {
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + config.apiKey,
        'content-type': 'application/json',
        'Idempotency-Key': data.requestId,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: 'Chornohora hiking enquiry · ' + data.date,
        text: bookingEmailText(data),
        ...(data.email ? {reply_to: data.email} : {}),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    return response.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
