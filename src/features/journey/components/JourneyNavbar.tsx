import type * as React from 'react';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';

export function JourneyNavbar({locale, menuOpen}: {locale: 'uk' | 'en'; menuOpen: boolean}) {
  return (
<header className="nav">
<a aria-label="Чотири неба, на початок" className="logo" href="#start" data-journey-action="goStart">
<Image alt="" className="brand-mark" height="36" src="/legacy/assets/chornohora-mark.png" width="76"/>
<span className="brand-type"><b>ЧОРНОГОРА</b><small>ЧОТИРИ НЕБА</small></span>
</a>
<nav aria-label="Швидкі дії" className="navlinks nav-actions"><a className="nav-phone" href="tel:+380440000000" aria-label="Демонстраційний номер телефону">+380 (44) 000-00-00</a><a className="nav-book-cta" href="#book" data-journey-action="goBook">Забронювати місце</a></nav>

<nav className="nav-language" aria-label={locale === 'uk' ? 'Мова' : 'Language'}>
  <Link href="/" locale="uk" aria-current={locale === 'uk' ? 'page' : undefined}>UA</Link>
  <span aria-hidden="true"> / </span>
  <Link href="/" locale="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
</nav><button type="button" aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'} aria-expanded={menuOpen} aria-controls="route-drawer" className="nav-menu" data-route-menu-toggle=""><span></span><span></span><span></span></button></header>
  );
}
