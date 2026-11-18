import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {getLocale, getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {LegacyJourney} from '@/components/journey/LegacyJourney';
import {V22SourceInteraction} from '@/components/journey/V22SourceInteraction';
import {getV22SourceScene} from '@/lib/v22-source-scene';

export default async function HomePage({searchParams}: {searchParams: Promise<{preview?: string}>}) {
  const locale = await getLocale();
  const t = await getTranslations('Migration');
  const hasV22Assets = existsSync(join(process.cwd(), 'public', 'legacy', 'index.html'));
  if (hasV22Assets) {
    // One canonical landing route per locale. The native port remains an
    // explicit comparison mode until visual and interaction parity is proven.
    const {preview} = await searchParams;
    if (preview === 'native') {
      const {html, drawerHtml, inlineCss} = getV22SourceScene();
      return <><link rel="stylesheet" href="/legacy/styles.css" /><V22SourceInteraction html={html} drawerHtml={drawerHtml} inlineCss={inlineCss} /></>;
    }
    return <LegacyJourney locale={locale === 'en' ? 'en' : 'uk'} />;
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
