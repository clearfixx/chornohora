'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';

type Locale = 'uk' | 'en';
type NavProps = {
  locale: Locale;
  labels: {
    brand: string;
    brandSmall: string;
    home: string;
    menu: string;
    close: string;
    language: string;
    places: [string, string, string, string];
    phases: [string, string, string, string];
    booking: string;
    drawerLabel: string;
  };
};

/** 404 navigation is independent of JourneyStore and its scroll controller. */
export function NotFoundNavigation({locale, labels}: NavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const home = '/' + locale;
  const ukHome = '/uk';
  const enHome = '/en';
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) toggleRef.current?.focus({preventScroll: true});
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const dialog = drawerRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector<HTMLElement>('.nf-drawer-close')?.focus({preventScroll: true});
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
      const first = items[0], last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  return <>
    <header className="nf-nav">
      <a className="nf-brand" href={home} aria-label={labels.home}>
        <Image src="/journey/assets/chornohora-mark.svg" alt="" width={243} height={81}/>
        <span><b>{labels.brand}</b><small>{labels.brandSmall}</small></span>
      </a>
      <nav className="nf-navlinks" aria-label={labels.drawerLabel}>
        <a href={home + '#govla'}>{labels.places[0]}</a>
        <a href={home + '#brebeneskul'}>{labels.places[1]}</a>
        <a href={home + '#petros'}>{labels.places[3]}</a>
        <a className="nf-nav-book" href={home + '#book'}>{labels.booking}</a>
      </nav>
      <div className="nf-navtools">
        <nav className="nf-language" aria-label={labels.language}>
          <a href={ukHome} aria-current={locale === 'uk' ? 'page' : undefined}>UA</a>
          <span aria-hidden="true">/</span>
          <a href={enHome} aria-current={locale === 'en' ? 'page' : undefined}>EN</a>
        </nav>
        <button ref={toggleRef} className="nf-menu-trigger" type="button" aria-label={open ? labels.close : labels.menu} aria-controls="nf-route-drawer" aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <span/><span/><span/>
        </button>
      </div>
    </header>
    <div className={'nf-drawer-layer' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <button className="nf-drawer-scrim" type="button" onClick={() => setOpen(false)} aria-label={labels.close} tabIndex={open ? 0 : -1}/>
      <aside id="nf-route-drawer" className="nf-drawer" ref={drawerRef} role="dialog" aria-modal={open ? true : undefined} aria-label={labels.drawerLabel} inert={!open}>
        <div className="nf-drawer-head">
          <span className="nf-drawer-heading">{labels.brand} <small>{labels.brandSmall}</small></span>
          <button className="nf-drawer-close" type="button" onClick={() => setOpen(false)} aria-label={labels.close}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 5 19 19 M19 5 5 19"/></svg>
          </button>
        </div>
        <nav className="nf-drawer-links" aria-label={labels.drawerLabel}>
          {labels.places.map((name,i) => <a href={home + '#' + ['govla','brebeneskul','nesamovyte','petros'][i]} key={name}>
            <small>0{i + 1} / {labels.phases[i]}</small><span>{name}</span><b aria-hidden="true">↗</b>
          </a>)}
          <a className="nf-drawer-book" href={home + '#book'}>{labels.booking}<b aria-hidden="true">↗</b></a>
        </nav>
      </aside>
    </div>
  </>;
}
