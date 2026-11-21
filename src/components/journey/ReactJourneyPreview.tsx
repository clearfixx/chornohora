'use client';

import {memo, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
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
  const {navigateToStop, navigateToTop, navigateToElement} = useJourneyProgress(trackRef, store);
  // A boolean selector prevents the entire preview tree from rendering at
  // every wheel animation frame; only the threshold transition matters here.
  const routeStarted = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().progress >= 0.2095,
    () => false,
  );

  useEffect(() => {
    document.body.classList.toggle('route-started', routeStarted);
  }, [routeStarted]);
  useEffect(() => () => document.body.classList.remove('route-started'), []);

  useLayoutEffect(() => {
    document.body.classList.toggle('route-menu-open', menuOpen);
    if (!menuOpen) return () => document.body.classList.remove('route-menu-open');
    const drawer = document.getElementById('route-drawer');
    const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInitial = () => {
      // Do not steal focus back from a menu link if the user already tabbed.
      if (drawer?.contains(document.activeElement)) return;
      const first = drawer?.querySelector<HTMLElement>('.route-drawer-close');
      if (first) first.focus({preventScroll: true});
      else drawer?.focus({preventScroll: true});
    };
    // Visibility and transform transitions can defer focusability until the
    // drawer is painted. Try immediately and after paint, then at transition end.
    focusInitial();
    const frame = requestAnimationFrame(focusInitial);
    drawer?.addEventListener('transitionend', focusInitial, {once: true});
    const getFocusable = () => drawer
      ? [...drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.hasAttribute('inert') && getComputedStyle(el).visibility !== 'hidden')
      : [];
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
      } else if (event.key === 'Tab' && drawer) {
        const items = getFocusable();
        if (!items.length) {
          event.preventDefault();
          drawer.focus({preventScroll: true});
          return;
        }
        const first = items[0];
        const last = items.at(-1)!;
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !drawer.contains(active))) {
          event.preventDefault(); last.focus({preventScroll: true});
        } else if (!event.shiftKey && (active === last || !drawer.contains(active))) {
          event.preventDefault(); first.focus({preventScroll: true});
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (drawer && event.target instanceof Node && !drawer.contains(event.target)) {
        const first = getFocusable()[0];
        (first ?? drawer).focus({preventScroll: true});
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.body.classList.remove('route-menu-open');
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocusIn);
      cancelAnimationFrame(frame);
      drawer?.removeEventListener('transitionend', focusInitial);
      if (prior?.isConnected) prior.focus({preventScroll: true});
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
    <div data-v22-source-scene="" data-react-journey="" inert={menuOpen}>
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
