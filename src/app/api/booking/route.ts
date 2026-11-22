import {NextRequest, NextResponse} from 'next/server';
import {validateBookingRequest} from '@/features/journey/booking/validation';
import {bookingMailConfig, deliverBookingRequest} from '@/features/journey/booking/delivery';
import {allowBookingRequest} from '@/features/journey/booking/limit';

export const runtime = 'nodejs';

function result(code: string, status: number) {
  return NextResponse.json({ok: false, code}, {
    status, headers: {'cache-control': 'no-store'},
  });
}

async function readLimitedBody(request: NextRequest): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 8192) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', {fatal: true}).decode(joined);
}

export async function POST(request: NextRequest) {
  // Validate browser fetch metadata and public Host, not request.url:
  // Next.js can normalize its internal URL to a different hostname behind a proxy.
  // A cross-site browser request cannot spoof Sec-Fetch-Site or Origin.
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return result('forbidden', 403);
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin) {
    let originHost: string;
    try { originHost = new URL(origin).host; }
    catch { return result('forbidden', 403); }
    if (!host || originHost !== host) return result('forbidden', 403);
  } else if (site !== 'same-origin') {
    return result('forbidden', 403);
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return result('invalid', 415);
  }
  const length = Number(request.headers.get('content-length') ?? 0);
  if (!Number.isFinite(length) || length > 8192) return result('invalid', 413);
  // Fail closed when credentials/recipient are missing: never claim delivery.
  if (!bookingMailConfig()) return result('unavailable', 503);
  const ip = request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!allowBookingRequest(ip)) return result('rate_limited', 429);
  let payload: unknown;
  try {
    const body = await readLimitedBody(request);
    if (body === null) return result('invalid', 413);
    payload = JSON.parse(body);
  } catch {
    return result('invalid', 400);
  }
  const parsed = validateBookingRequest(payload);
  if (!parsed.ok) return result(parsed.error === 'spam' ? 'invalid' : parsed.error, 400);
  const delivery = await deliverBookingRequest(parsed.data);
  if (delivery === 'unavailable') return result('unavailable', 503);
  if (delivery !== 'sent') return result('delivery_failed', 502);
  return NextResponse.json({ok: true}, {status: 200, headers: {'cache-control': 'no-store'}});
}
