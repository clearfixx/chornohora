import type {MetadataRoute} from 'next';
import {localizedUrls, publicSiteOrigin, supportedLocales} from '@/lib/site-seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteOrigin();
  if (!origin) return [];
  const languages = localizedUrls(origin);
  return supportedLocales.map(locale => ({
    url: origin + '/' + locale,
    changeFrequency: 'monthly' as const,
    priority: locale === 'uk' ? 1 : 0.9,
    alternates: {languages},
  }));
}
