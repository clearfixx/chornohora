/** Browser-local calendar date for a demo departure request. */
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


/** Minimal, country-agnostic contact check; this is a demo request, not phone verification.
 * Accept international or local numbers with common visual separators.
 * Reject text-only entries and implausibly short/long digit counts.
 */
export function isPlausiblePhoneNumber(value: string): boolean {
  const phone = value.trim();
  if (!/^\+?[0-9\s().-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
