import {getLocale, getTranslations} from 'next-intl/server';
import {NotFoundScene} from '@/features/not-found/NotFoundScene';
import '@/features/not-found/not-found.css';

export default async function NotFound() {
  const locale = (await getLocale()) === 'en' ? 'en' : 'uk';
  const [t, journey] = await Promise.all([
    getTranslations({locale,namespace: 'NotFound'}),
    getTranslations({locale,namespace: 'Journey'}),
  ]);
  return <NotFoundScene locale={locale} copy={{
    eyebrow: t('eyebrow'),
    heading: t('heading'),
    description: t('description'),
    home: t('home'),
    brand: journey('brand'),
    brandSmall: journey('brandSmall'),
    booking: journey('book'),
    menu: journey('navOpen'),
    close: journey('navClose'),
    language: locale === 'en' ? 'Language' : 'Мова',
    drawerLabel: journey('drawerLabel'),
    places: [journey('peak1'),journey('peak2'),journey('peak3'),journey('peak4')],
    phases: [journey('phase1'),journey('phase2'),journey('phase3'),journey('phase4')],
  }}/>;
}
