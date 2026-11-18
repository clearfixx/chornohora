import {Link} from '@/i18n/navigation';
type Props = {locale: 'uk' | 'en'};
/** Shared locale control for the approved iframe and native comparison mode. */
export function JourneyLocaleNav({locale}: Props) {
  return <nav className="legacy-journey__locale" aria-label={locale === 'uk' ? 'Мова' : 'Language'}>
    <Link href="/" locale="uk" aria-current={locale === 'uk' ? 'page' : undefined}>UA</Link>
    <span aria-hidden="true">/</span>
    <Link href="/" locale="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
  </nav>;
}
