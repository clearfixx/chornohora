import type {Metadata} from 'next';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {localizedUrls, publicSiteOrigin} from '@/lib/site-seo';
import '../globals.css';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({locale, namespace: 'Journey'});
  const origin = publicSiteOrigin();
  const path = '/' + locale;
  const description = t('heroDescription');
  const title = t('brand') + ' — ' + t('brandSmall');
  return {
    ...(origin ? {
      metadataBase: new URL(origin),
      alternates: {
        canonical: origin + path,
        languages: localizedUrls(origin),
      },
    } : {}),
    title,
    description,
    robots: origin
      ? {index: true, follow: true}
      : {index: false, follow: false},
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'uk' ? 'uk_UA' : 'en_US',
      alternateLocale: locale === 'uk' ? ['en_US'] : ['uk_UA'],
      siteName: 'Чорногора · Чотири неба',
      ...(origin ? {url: origin + path} : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
export function generateStaticParams() {return routing.locales.map((locale) => ({locale}));}
export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <html lang={locale}><body><NextIntlClientProvider>{children}</NextIntlClientProvider></body></html>;
}
