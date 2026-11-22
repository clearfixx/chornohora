/** Browser-local calendar date for the departure request. */
export function localISODate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return [year,month,day].join('-');
}
export function isValidFutureOrTodayDate(date: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const checked = new Date(year, month - 1, day);
  if (checked.getFullYear() !== year || checked.getMonth() !== month - 1 || checked.getDate() !== day) return false;
  return date >= localISODate(now);
}


/** Minimal, country-agnostic contact check; this is a request, not phone verification.
 * Accept international or local numbers with common visual separators.
 * Reject text-only entries and implausibly short/long digit counts.
 */
export function isPlausiblePhoneNumber(value: string): boolean {
  const phone = value.trim();
  if (!/^\+?[0-9\s().-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export type BookingRequest = {
  name: string;
  phone: string;
  email: string;
  date: string;
  people: number;
  message: string;
  consent: true;
  locale: 'uk' | 'en';
  requestId: string;
};

type ValidationResult =
  | {ok: true; data: BookingRequest}
  | {ok: false; error: 'invalid' | 'consent' | 'spam'};

function todayInKyiv(now: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** Shared client/server data contract; unknown fields are never forwarded. */
export function validateBookingRequest(input: unknown, now: Date = new Date()): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {ok: false, error: 'invalid'};
  const raw = input as Record<string, unknown>;
  // A hidden field may catch basic automated submissions; it is never sent to the provider.
  if (raw.website !== undefined && raw.website !== '') return {ok: false, error: 'spam'};
  if (raw.consent !== true) return {ok: false, error: 'consent'};
  const fields = ['name','phone','email','date','message'] as const;
  for (const key of fields) if (typeof raw[key] !== 'string') return {ok: false, error: 'invalid'};
  const name = (raw.name as string).trim();
  const phone = (raw.phone as string).trim();
  const email = (raw.email as string).trim();
  const date = raw.date as string;
  const message = (raw.message as string).trim();
  const people = raw.people;
  const locale = raw.locale;
  const requestId = raw.requestId;
  if (name.length < 2 || name.length > 120 || /[\u0000-\u001F\u007F]/.test(name)) return {ok: false, error: 'invalid'};
  if (phone.length > 40 || !isPlausiblePhoneNumber(phone)) return {ok: false, error: 'invalid'};
  if (email.length > 254 || (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return {ok: false, error: 'invalid'};
  if (message.length > 2000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(message)) return {ok: false, error: 'invalid'};
  if (typeof people !== 'number' || !Number.isInteger(people) || people < 1 || people > 12) return {ok: false, error: 'invalid'};
  if (locale !== 'uk' && locale !== 'en') return {ok: false, error: 'invalid'};
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return {ok: false, error: 'invalid'};
  // Validate real calendar dates independently of the server's local timezone.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return {ok: false, error: 'invalid'};
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day || date < todayInKyiv(now)) return {ok: false, error: 'invalid'};
  return {ok: true, data: {name, phone, email, date, people, message, consent: true, locale, requestId}};
}
