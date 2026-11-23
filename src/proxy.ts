import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // public/legacy is comparison material, never a production public asset.
  if (request.nextUrl.pathname.startsWith('/legacy/')) {
    const enabled = process.env.NODE_ENV !== 'production' ||
      process.env.CHORNOHORA_ENABLE_DIAGNOSTICS === '1';
    if (!enabled) return new NextResponse('Not Found', {
      status: 404,
      headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow'},
    });
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/legacy/:path*', '/((?!api|_next|_vercel|legacy|.*\\..*).*)'],
};
