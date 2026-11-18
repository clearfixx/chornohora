/**
 * React lifecycle adapter for the original v19 route drawer.
 * Source of truth: public/legacy/assets/route-menu-v19.js.
 * This module is intentionally not mounted until the original drawer DOM is
 * migrated. The approved original script remains unchanged.
 */
export function mountV22RouteDrawer(): () => void {
  const points = [.21, .42, .63, .83];
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

  const pending = new Set<number>();
  function navigate(target: string) {
    close(false);
    const track = document.querySelector<HTMLElement>('.track');
    if (!track) return;
    const sc = scrollEl();
    const stage = track.querySelector<HTMLElement>('.stage');
    let y = 0;
    if (target === 'book') {
      const book = document.getElementById('book');
      if (!book) return;
      y = sc.scrollTop + book.getBoundingClientRect().top - 24;
    } else {
      const idx = Number(target);
      if (!Number.isInteger(idx) || idx < 0 || idx >= points.length) return;
      const distance = track.offsetHeight - (stage ? stage.offsetHeight : 0);
      y = sc.scrollTop + track.getBoundingClientRect().top + distance * points[idx];
    }
    // Identical v19 timing; tracked only to prevent callbacks after unmount.
    requestAnimationFrame(() => {
      const id = window.setTimeout(() => {
        pending.delete(id);
        window.scrollTo({top: Math.max(0, y), behavior: 'smooth'});
      }, 80);
      pending.add(id);
    });
  }

  const click = (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const toggle = target.closest('[data-route-menu-toggle]');
    if (toggle) {
      e.preventDefault();
      isOpen() ? close() : open();
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
    for (const id of pending) window.clearTimeout(id);
    pending.clear();
    void lastScroll; // retained as part of the original v19 state contract
  };
}
