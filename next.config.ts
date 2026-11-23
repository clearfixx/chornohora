import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        // SAMEORIGIN is required for the opt-in legacy comparison iframe.
        {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()'},
        {key: 'X-DNS-Prefetch-Control', value: 'off'},
      ],
    }];
  },
};
export default createNextIntlPlugin('./src/i18n/request.ts')(config);
