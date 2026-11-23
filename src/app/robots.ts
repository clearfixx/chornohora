import type {MetadataRoute} from 'next';
import {publicSiteOrigin} from '@/lib/site-seo';

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteOrigin();
  if (!origin) {
    // An unconfigured preview/staging deployment must not be indexed.
    return {rules: [{userAgent: '*', disallow: '/'}]};
  }
  return {
    rules: [{userAgent: '*', allow: '/', disallow: ['/api/', '/legacy/']}],
    sitemap: origin + '/sitemap.xml',
  };
}
