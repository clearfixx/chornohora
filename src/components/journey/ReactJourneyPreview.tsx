'use client';

import {memo, useCallback, useEffect, useRef, useState} from 'react';
import {useJourneyProgress} from '@/hooks/useJourneyProgress';
import {JourneyStore} from '@/engine/journey-store';
import {JourneyStage} from '@/features/journey/components/JourneyStage';
import {JourneyDrawer} from '@/features/journey/components/JourneyDrawer';
import type {JourneyStopId} from '@/lib/journey';

type Locale = 'uk' | 'en';
// The 45kB SVG/JSX scene must NOT reconcile at every scroll progress tick.
const MemoStage = memo(JourneyStage);
const MemoDrawer = memo(JourneyDrawer);
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
  const [store] = useState(() => new JourneyStore());
  const [menuOpen, setMenuOpen] = useState(false);
  const {progress, navigateToStop, navigateToTop, navigateToElement} = useJourneyProgress(trackRef, store);

  useEffect(() => {
    document.body.classList.toggle('route-started', progress >= 0.2095);
  }, [progress]);
  useEffect(() => () => document.body.classList.remove('route-started'), []);

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
      navigateToTop();
    } else if (action === 'goBook') {
      const section = document.getElementById('book');
      if (section) navigateToElement(section);
    } else {
      const stop = actionToStop[action];
      if (stop) navigateToStop(stop);
    }
  }, [navigateToStop, navigateToTop, navigateToElement]);

  const navigateFromDrawer = useCallback((target: string) => {
    if (target === 'book') navigate('goBook');
    else {
      const stop = drawerToStop[target];
      if (stop) navigateToStop(stop);
      setMenuOpen(false);
    }
  }, [navigate, navigateToStop]);

  const toggleMenu = useCallback(() => setMenuOpen(value => !value), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return <>
    <div data-v22-source-scene="" data-react-journey="">
      <MemoStage
        trackRef={trackRef} store={store} locale={locale} menuOpen={menuOpen}
        onAction={navigate} onToggleMenu={toggleMenu}
      />
    </div>
    <div data-v22-source-drawer="">
      <MemoDrawer open={menuOpen} onDismiss={closeMenu} onNavigate={navigateFromDrawer}/>
    </div>
  </>;
}
