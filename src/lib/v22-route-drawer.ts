import type {V22ScrollController, V22Target} from './v22-scroll-controller';

/**
 * React lifecycle adapter for the original v19 route drawer.
 * Source of truth: public/legacy/assets/route-menu-v19.js.
 * This module is intentionally not mounted until the original drawer DOM is
 * migrated. The approved original script remains unchanged.
 */
export function mountV22RouteDrawer(controller: V22ScrollController): () => void {
  let lastFocus: Element | null = null;
  let lastScroll = 0;
  let focusTimer = 0;
  const drawer = document.getElementById('route-drawer');
  const body = document.body;
  if (!drawer) return () => {};
  const toggles = () => Array.from(document.querySelectorAll<HTMLElement>('[data-route-menu-toggle]'));
  const isOpen = () => body.classList.contains('route-menu-open');
  const scrollEl = () => document.scrollingElement || document.documentElement;

  function open() {
    if (!drawer || isOpen()) return;
    lastFocus = document.activeElement;
    lastScroll = scrollEl().scrollTop;
    body.classList.add('route-menu-open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    toggles().forEach((el) => {
      el.setAttribute('aria-expanded', 'true');
      el.setAttribute('aria-label', 'Закрити меню');
    });
    // Original CSS transitions visibility for .58s. Chromium does not
    // allow focus until the drawer actually becomes visible.
    const focusClose = () => {
      focusTimer = 0;
      if (isOpen() && getComputedStyle(drawer).visibility === 'visible') {
        drawer.querySelector<HTMLElement>('.route-drawer-close')?.focus({preventScroll: true});
      }
    };
    focusTimer = window.setTimeout(focusClose, 650);
  }
  function close(restoreFocus = true) {
    if (!drawer || !isOpen()) return;
    if (focusTimer) { clearTimeout(focusTimer); focusTimer = 0; }
    body.classList.remove('route-menu-open');
    drawer.setAttribute('inert', '');
    drawer.setAttribute('aria-hidden', 'true');
    toggles().forEach((el) => {
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-label', 'Відкрити меню');
    });
    if (restoreFocus && lastFocus instanceof HTMLElement && lastFocus.isConnected) {
      lastFocus.focus({preventScroll: true});
    }
  }

  function navigate(target: string) {
    const routes: Record<string, V22Target> = {
      '0': 'govla', '1': 'brebeneskul',
      '2': 'nesamovyte', '3': 'petros', book: 'book',
    };
    const route = routes[target];
    if (!route) return;
    close(false);
    controller.navigate(route);
  }

  const click = (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const toggle = target.closest('[data-route-menu-toggle]');
    if (toggle) {
      e.preventDefault();
      if (isOpen()) close();
      else open();
      return;
    }
    const dismiss = target.closest('[data-route-menu-close]');
    if (dismiss) {
      e.preventDefault();
      close();
      return;
    }
    const link = target.closest<HTMLElement>('[data-route-target]');
    if (link) {
      e.preventDefault();
      navigate(link.dataset.routeTarget ?? '');
    }
  };
  const keydown = (e: KeyboardEvent) => {
    if (!drawer || !isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const nodes = [...drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  const wheel = (e: WheelEvent) => {
    if (drawer && isOpen() && e.target instanceof Node && !drawer.contains(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  document.addEventListener('click', click, true);
  document.addEventListener('keydown', keydown);
  window.addEventListener('wheel', wheel, {passive: false, capture: true});

  return () => {
    close(false);
    if (focusTimer) clearTimeout(focusTimer);
    document.removeEventListener('click', click, true);
    document.removeEventListener('keydown', keydown);
    window.removeEventListener('wheel', wheel, true);
    void lastScroll; // retained as part of the original v19 state contract
  };
}
