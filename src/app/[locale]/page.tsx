/* eslint-disable @next/next/no-css-tags -- The shared locale route has three mutually exclusive renderers.
 * These public stylesheets must load only for their selected preview mode.
 * Bundling both global styles through a shared layout or import would leak
 * v22-native styling into canonical React (and vice versa) on client navigation.
 * Keep this narrow exception until preview modes have separate route boundaries.
 */
import type {Metadata} from 'next';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {getLocale, getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {LegacyJourney} from '@/components/journey/LegacyJourney';
import {V22SourceInteraction} from '@/components/journey/V22SourceInteraction';
import {ReactJourneyPreview} from '@/components/journey/ReactJourneyPreview';
import {getV22SourceScene} from '@/lib/v22-source-scene';

type HomeSearchParams = {preview?: string};

export async function generateMetadata({
  searchParams,
}: {searchParams: Promise<HomeSearchParams>}): Promise<Metadata> {
  const {preview} = await searchParams;
  // Comparison renderers and diagnostic aliases must not compete with
  // canonical /uk and /en URLs in search results.
  if (preview === 'legacy' || preview === 'native' || preview === 'react') {
    return {robots: {index: false, follow: false}};
  }
  return {};
}

export default async function HomePage({searchParams}: {searchParams: Promise<HomeSearchParams>}) {
  const locale = await getLocale();
  const t = await getTranslations('Migration');
  const hasV22Assets = existsSync(join(process.cwd(), 'public', 'legacy', 'index.html'));
  if (hasV22Assets) {
    // React owns canonical /uk and /en.
    // Keep legacy and native comparison modes isolated for diagnostics.
    const {preview} = await searchParams;
    if (preview === 'legacy') {
      return <LegacyJourney locale={locale === 'en' ? 'en' : 'uk'} />;
    }
    if (preview === 'native') {
      const {html, drawerHtml, inlineCss} = getV22SourceScene();
      return <><link rel="stylesheet" href="/legacy/styles.css" /><V22SourceInteraction html={html} drawerHtml={drawerHtml} inlineCss={inlineCss} locale={locale === "en" ? "en" : "uk"} /></>;
    }
    return <><link rel="stylesheet" href="/react-journey.css" /><ReactJourneyPreview locale={locale === 'en' ? 'en' : 'uk'} /></>;
  }
  return <main className="min-h-screen flex items-center justify-center p-8">
    <section className="max-w-xl space-y-6">
      <p className="text-orange-300 text-sm uppercase tracking-[.2em]">Chornohora · Next.js</p>
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="text-lg text-slate-300">{t('notice')}</p>
      <nav className="flex gap-4 text-orange-200" aria-label={t('language')}>
        <Link href="/" locale="uk">Українська</Link>
        <Link href="/" locale="en">English</Link>
      </nav>
    </section>
  </main>;
}
