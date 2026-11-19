import type * as React from 'react';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';

export function JourneyNavbar({locale, menuOpen}: {locale: 'uk' | 'en'; menuOpen: boolean}) {
  const t = useTranslations('Journey');
  return (
<header className="nav">
<a aria-label={t("navHome")} className="logo" href="#start" data-journey-action="goStart">
<Image alt="" className="brand-mark" height="36" src="/journey/assets/chornohora-mark.png" width="76"/>
<span className="brand-type"><b>{t("brand")}</b><small>{t("brandSmall")}</small></span>
</a>
<nav aria-label={t("navQuick")} className="navlinks nav-actions"><a className="nav-phone" href="tel:+380440000000" aria-label={t("navPhone")}>+380 (44) 000-00-00</a><a className="nav-book-cta" href="#book" data-journey-action="goBook">{t("book")}</a></nav>

<nav className="nav-language" aria-label={locale === 'uk' ? 'Мова' : 'Language'}>
  <Link href={{pathname: "/", query: {preview: "react"}}} locale="uk" aria-current={locale === 'uk' ? 'page' : undefined}>UA</Link>
  <span aria-hidden="true"> / </span>
  <Link href={{pathname: "/", query: {preview: "react"}}} locale="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
</nav><button type="button" aria-label={menuOpen ? t('navClose') : t('navOpen')} aria-expanded={menuOpen} aria-controls="route-drawer" className="nav-menu" data-route-menu-toggle=""><span></span><span></span><span></span></button></header>
  );
}
