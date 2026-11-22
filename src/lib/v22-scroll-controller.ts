/**
 * Faithful extraction of the approved v22 DCLogic scroll/navigation methods.
 * Do not mount this controller while the original DC runtime is active:
 * duplicate wheel listeners would change behavior.
 *
 * Source: public/legacy/index.html, class Component extends DCLogic.
 * Only TypeScript types, constructor wiring and lifecycle names were adapted.
 */
export type V22Target = 'start' | 'govla' | 'brebeneskul' | 'nesamovyte' | 'petros' | 'book';

const positions = {
  govla: [0.21, 0],
  brebeneskul: [0.42, 1],
  nesamovyte: [0.63, 2],
  petros: [0.83, 3],
} as const;

export class V22ScrollController {
  private _t: number | null = null;
  private _raf = 0;
  private _anim = 0;
  private _reduced = false;

  private _sc(): Element {
    const track = document.querySelector('.track');
    let n = track ? track.parentElement : null;
    while (n && n !== document.body && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
        n.scrollHeight > n.clientHeight + 2) return n;
      n = n.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  private _animTo(sc: Element, y: number): void {
    if (this._anim) cancelAnimationFrame(this._anim);
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
    this._t = null;
    const start = sc.scrollTop;
    const dist = y - start;
    if (Math.abs(dist) < 2) return;
    if (this._reduced) { sc.scrollTo({top: y, behavior: 'instant'}); return; }
    const dur = Math.min(2200, Math.max(800, Math.abs(dist) * 0.22));
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      sc.scrollTo({top: start + dist * e, behavior: 'instant'});
      this._anim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    this._anim = requestAnimationFrame(step);
  }

  navigate(target: V22Target, e?: Event): void {
    if (e?.preventDefault) e.preventDefault();
    const track = document.querySelector<HTMLElement>('.track');
    if (!track) return;
    const sc = this._sc();
    const isDoc = sc === document.scrollingElement ||
      sc === document.documentElement || sc === document.body;
    const base = (el: Element) => el.getBoundingClientRect().top -
      (isDoc ? 0 : sc.getBoundingClientRect().top) + sc.scrollTop;
    let y = 0;
    if (target === 'book') {
      const b = document.getElementById('book');
      y = b ? base(b) : 0;
    } else if (target !== 'start') {
      const [p, idx] = positions[target];
      const stage = track.querySelector<HTMLElement>('.stage');
      const S = track.offsetHeight - (stage ? stage.offsetHeight : 0);
      if (S > 200) y = base(track) + S * p;
      else {
        const pl = track.querySelectorAll('.place')[idx];
        y = pl ? base(pl) - 90 : 0;
      }
    }
    this._animTo(sc, Math.max(0, y));
  }

  private _tick = (): void => {
    const el = this._sc();
    if (this._t === null) { this._raf = 0; return; }
    const diff = this._t - el.scrollTop;
    if (Math.abs(diff) < 1) {
      el.scrollTo({top: this._t, behavior: 'instant'});
      this._t = null;
      this._raf = 0;
      return;
    }
    el.scrollTo({top: el.scrollTop + diff * 0.085, behavior: 'instant'});
    this._raf = requestAnimationFrame(this._tick);
  };

  private _wheel = (e: WheelEvent): void => {
    if (e.ctrlKey || e.defaultPrevented) return;
    if (this._anim) { cancelAnimationFrame(this._anim); this._anim = 0; }
    const el = this._sc();
    if (el.scrollHeight <= el.clientHeight + 2) return;
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 32;
    else if (e.deltaMode === 2) dy *= el.clientHeight;
    if (this._t === null) this._t = el.scrollTop;
    this._t = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, this._t + dy));
    if (!this._raf) this._raf = requestAnimationFrame(this._tick);
  };

  private _scroll = (): void => {
    if (!this._raf) this._t = null;
  };

  mount(): void {
    this._t = null;
    this._raf = 0;
    this._reduced = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (this._reduced) return;
    window.addEventListener('wheel', this._wheel, {passive: false});
    window.addEventListener('scroll', this._scroll, {passive: true});
  }

  unmount(): void {
    window.removeEventListener('wheel', this._wheel);
    window.removeEventListener('scroll', this._scroll);
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._anim) cancelAnimationFrame(this._anim);
    this._raf = 0;
    this._anim = 0;
    this._t = null;
  }
}
