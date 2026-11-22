import {useEffect, useState, useSyncExternalStore} from 'react';
import type {JourneyStore} from '@/engine/journey-store';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';

export function JourneyNavbar({locale, menuOpen, store}: {locale: 'uk' | 'en'; menuOpen: boolean; store: JourneyStore}) {
  const t = useTranslations('Journey');
  const [bookingReached, setBookingReached] = useState(false);
  useEffect(() => {
    // Journey progress reaches 1 before the booking panel enters the viewport.
    // Observe the panel's actual position and only commit React state when
    // crossing the visibility threshold; do not redraw the mountain on scroll.
    const update = () => {
      const panel = document.getElementById('book');
      if (!panel) return;
      const reached = panel.getBoundingClientRect().top <= window.innerHeight * .5;
      setBookingReached(current => current === reached ? current : reached);
    };
    update();
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update, {passive: true});
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  // Reading a primitive threshold rather than the full progress snapshot
  // keeps language links current without re-rendering on every scroll frame.
  const sectionHash = useSyncExternalStore(
    store.subscribe,
    () => {
      const {activeStop} = store.getSnapshot();
      return activeStop ? '#' + activeStop.id : '#start';
    },
    () => '#start',
  );
  const localeDestination = bookingReached ? '#book' : sectionHash;
  return (
<header className="nav">
<a aria-label={t("navHome")} className="logo" href="#start" data-journey-action="goStart">
<Image alt="" className="brand-mark" height="36" src="/journey/assets/chornohora-mark.png" width="76"/>
<span className="brand-type"><b>{t("brand")}</b><small>{t("brandSmall")}</small></span>
</a>
<nav aria-label={t("navQuick")} className="navlinks nav-actions"><span className="nav-phone" aria-label={t("navPhone")}>+380 (44) 000-00-00</span><a className="nav-book-cta" href="#book" data-journey-action="goBook">{t("book")}</a></nav>

<nav className="nav-language" aria-label={locale === 'uk' ? 'Мова' : 'Language'}>
  <Link href={{pathname: "/", hash: localeDestination}} locale="uk" aria-current={locale === 'uk' ? 'page' : undefined}>UA</Link>
  <span aria-hidden="true"> / </span>
  <Link href={{pathname: "/", hash: localeDestination}} locale="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
</nav><button type="button" aria-label={menuOpen ? t('navClose') : t('navOpen')} aria-expanded={menuOpen} aria-controls="route-drawer" className="nav-menu" data-route-menu-toggle=""><span></span><span></span><span></span></button></header>
  );
}
