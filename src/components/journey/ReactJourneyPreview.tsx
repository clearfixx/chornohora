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
const drawerToAction: Record<string, string> = {
  '0': 'goGovla', '1': 'goBreb', '2': 'goNes', '3': 'goPetros',
};
const hashToStop: Record<string, JourneyStopId> = {
  govla: 'govla', brebeneskul: 'brebeneskul',
  nesamovyte: 'nesamovyte', petros: 'petros',
};

/** Isolated experimental React preview; the approved canonical v22 is unchanged. */
export function ReactJourneyPreview({locale}: {locale: Locale}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [store] = useState(() => new JourneyStore());
  const [menuOpen, setMenuOpen] = useState(false);
  // Capture the keyboard origin BEFORE the background becomes inert.
  const focusReturnRef = useRef<HTMLElement | null>(null);
  const {ready, navigateToStop, navigateToTop, navigateToElement,
    jumpToStop, jumpToTop, jumpToElement} = useJourneyProgress(trackRef, store);
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
    if (!menuOpen) {
      // React clears the inert background in the same commit. Wait until the
      // next frame so focus restoration is not rejected by the inert subtree.
      const frame = requestAnimationFrame(() => {
        const target = focusReturnRef.current;
        focusReturnRef.current = null;
        if (target?.isConnected) target.focus({preventScroll: true});
      });
      return () => {
        cancelAnimationFrame(frame);
        document.body.classList.remove('route-menu-open');
      };
    }
    const drawer = document.getElementById('route-drawer');
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
    };
  }, [menuOpen]);

  // Deep links and browser history restore the scene immediately; a click
  // remains animated by the existing +15% approved navigation policy.
  const restoreFromHash = useCallback(() => {
    // Browser navigation should also dismiss a modal opened on the old entry.
    setMenuOpen(false);
    const hash = window.location.hash.slice(1);
    // A fragment-free entry can represent a browser-restored position.
    // Do not replace that position with a forced jump to the Hero.
    if (hash === '') return;
    if (hash === 'start') jumpToTop();
    else if (hash === 'book') {
      const book = document.getElementById('book');
      if (book) jumpToElement(book);
    } else {
      const stop = hashToStop[hash];
      if (stop) jumpToStop(stop);
    }
  }, [jumpToStop, jumpToTop, jumpToElement]);

  useEffect(() => {
    if (!ready) return;
    // Wait until the controller has measured the rendered journey track.
    // With no fragment on initial entry, keep the browser's restored scroll
    // position instead of forcing the user back to the Hero.
    const frame = window.location.hash ? requestAnimationFrame(restoreFromHash) : 0;
    window.addEventListener('popstate', restoreFromHash);
    window.addEventListener('hashchange', restoreFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', restoreFromHash);
      window.removeEventListener('hashchange', restoreFromHash);
    };
  }, [ready, restoreFromHash]);

  const navigate = useCallback((action: string) => {
    const stop = actionToStop[action];
    const hash = action === 'goStart' ? 'start' : action === 'goBook' ? 'book' : stop;
    if (!hash) return;
    setMenuOpen(false);
    // pushState records an addressable destination without triggering native
    // anchor scrolling, which would fight the React scroll controller.
    if (window.location.hash !== '#' + hash) {
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.pushState(window.history.state, '', url);
    }
    if (action === 'goStart') navigateToTop();
    else if (action === 'goBook') {
      const section = document.getElementById('book');
      if (section) navigateToElement(section);
    } else if (stop) navigateToStop(stop);
  }, [navigateToStop, navigateToTop, navigateToElement]);

  const navigateFromDrawer = useCallback((target: string) => {
    const action = target === 'book' ? 'goBook' : drawerToAction[target];
    if (action) navigate(action);
    else setMenuOpen(false);
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    if (!menuOpen) {
      const active = document.activeElement;
      focusReturnRef.current = active instanceof HTMLElement
        ? active
        : document.querySelector<HTMLElement>('[data-react-journey] [data-route-menu-toggle]');
    }
    setMenuOpen(value => !value);
  }, [menuOpen]);
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
