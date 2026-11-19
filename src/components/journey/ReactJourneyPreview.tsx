'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useJourneyProgress} from '@/hooks/useJourneyProgress';
import {NativeV22StageMarkup, NativeV22DrawerMarkup} from './NativeV22Markup';
import type {JourneyStopId} from '@/lib/journey';

type Locale = 'uk' | 'en';
const actionToStop: Record<string, JourneyStopId> = {
  goGovla: 'govla', goBreb: 'brebeneskul',
  goNes: 'nesamovyte', goPetros: 'petros',
};
const drawerToStop: Record<string, JourneyStopId> = {
  '0': 'govla', '1': 'brebeneskul', '2': 'nesamovyte', '3': 'petros',
};

/** Isolated experimental React preview; the approved canonical v22 is unchanged. */
export function ReactJourneyPreview({locale}: {locale: Locale}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const {progress, navigateToStop} = useJourneyProgress(trackRef);

  useEffect(() => {
    document.body.classList.toggle('route-started', progress >= 0.2095);
    return () => document.body.classList.remove('route-started');
  }, [progress]);

  useEffect(() => {
    document.body.classList.toggle('route-menu-open', menuOpen);
    if (!menuOpen) return () => document.body.classList.remove('route-menu-open');
    const drawer = document.getElementById('route-drawer');
    const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => drawer?.querySelector<HTMLElement>('.route-drawer-close')?.focus({preventScroll: true}));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
      } else if (event.key === 'Tab' && drawer) {
        const items = [...drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault(); items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault(); items[0].focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('route-menu-open');
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
      prior?.focus({preventScroll: true});
    };
  }, [menuOpen]);

  const navigate = useCallback((action: string) => {
    setMenuOpen(false);
    if (action === 'goStart') {
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else if (action === 'goBook') {
      document.getElementById('book')?.scrollIntoView({behavior: 'smooth'});
    } else {
      const stop = actionToStop[action];
      if (stop) navigateToStop(stop);
    }
  }, [navigateToStop]);

  const navigateFromDrawer = useCallback((target: string) => {
    if (target === 'book') navigate('goBook');
    else {
      const stop = drawerToStop[target];
      if (stop) navigateToStop(stop);
      setMenuOpen(false);
    }
  }, [navigate, navigateToStop]);

  return <>
    <div data-v22-source-scene="">
      <NativeV22StageMarkup
        trackRef={trackRef} locale={locale} menuOpen={menuOpen}
        onAction={navigate} onToggleMenu={() => setMenuOpen(value => !value)}
      />
    </div>
    <div data-v22-source-drawer="">
      <NativeV22DrawerMarkup open={menuOpen} onDismiss={() => setMenuOpen(false)} onNavigate={navigateFromDrawer}/>
    </div>
  </>;
}
