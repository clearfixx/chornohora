/** Best-effort process-local throttle. For multi-instance hosting, replace with
 * a shared Redis/edge limit before considering this a hard abuse boundary. */
const buckets = new Map<string, {count: number; resetsAt: number}>();
export function allowBookingRequest(key: string, now = Date.now()): boolean {
  if (buckets.size > 2000) {
    for (const [id, value] of buckets) if (value.resetsAt <= now) buckets.delete(id);
    if (buckets.size > 2000) buckets.clear();
  }
  const slot = buckets.get(key);
  if (!slot || slot.resetsAt <= now) {
    buckets.set(key, {count: 1, resetsAt: now + 15 * 60_000});
    return true;
  }
  if (slot.count >= 5) return false;
  slot.count++;
  return true;
}
