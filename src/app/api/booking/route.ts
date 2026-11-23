import {NextResponse} from 'next/server';

// Portfolio demonstration only. No outbound request is permitted, even when
// historical RESEND_* environment variables happen to be configured.
export async function POST() {
  return NextResponse.json({ok: false, code: 'demo_only'}, {
    status: 503,
    headers: {'cache-control': 'no-store'},
  });
}
