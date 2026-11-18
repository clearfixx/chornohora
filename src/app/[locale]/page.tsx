import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export default async function HomePage() {
  const t = await getTranslations('Migration');
  return <main className="min-h-screen flex items-center justify-center p-8">
    <section className="max-w-xl space-y-6">
      <p className="text-orange-300 text-sm uppercase tracking-[.2em]">Chornohora · Next.js</p>
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="text-lg text-slate-300">{t('notice')}</p>
      <nav className="flex gap-4 text-orange-200"><Link href="/" locale="uk">Українська</Link><Link href="/" locale="en">English</Link></nav>
    </section>
  </main>;
}
