/* eslint-disable @next/next/no-css-tags -- The shared locale route has three mutually exclusive renderers.
 * These public stylesheets must load only for their selected preview mode.
 * Bundling both global styles through a shared layout or import would leak
 * v22-native styling into canonical React (and vice versa) on client navigation.
 * Keep this narrow exception until preview modes have separate route boundaries.
 */
import type {Metadata} from 'next';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {getLocale} from 'next-intl/server';
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
  // The canonical React route must always render, even without v22 assets.
  // Diagnostics require an explicit server-side opt-in in a production build.
  const {preview} = await searchParams;
  const diagnosticsEnabled =
    process.env.NODE_ENV !== 'production' || process.env.CHORNOHORA_ENABLE_DIAGNOSTICS === '1';
  const hasV22Assets = existsSync(join(process.cwd(), 'public', 'legacy', 'index.html'));
  if (diagnosticsEnabled && hasV22Assets) {
    if (preview === 'legacy') {
      return <LegacyJourney locale={locale === 'en' ? 'en' : 'uk'} />;
    }
    if (preview === 'native') {
      const {html, drawerHtml, inlineCss} = getV22SourceScene();
      return <><link rel="stylesheet" href="/legacy/styles.css" /><V22SourceInteraction html={html} drawerHtml={drawerHtml} inlineCss={inlineCss} locale={locale === 'en' ? 'en' : 'uk'} /></>;
    }
  }
  // Do not let preview query parameters change canonical production ownership.
  return <><link rel="stylesheet" href="/react-journey.css" /><ReactJourneyPreview locale={locale === 'en' ? 'en' : 'uk'} /></>;
}
