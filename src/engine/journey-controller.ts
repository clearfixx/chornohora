import {getStopScrollTop, type JourneyStopId} from '../lib/journey';
import {JourneyStore} from './journey-store';

/**
 * Browser adapter for a React-owned journey scene.
 * Native wheel/touch/keyboard scrolling remains browser-owned: no global
 * preventDefault wheel handler, and no competing animation loops.
 */
export class JourneyController {
  private frame = 0;
  private scrollElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private stopTimer = 0;
  private mounted = false;

  constructor(private readonly track: HTMLElement, readonly store: JourneyStore) {}

  private getScroller(): HTMLElement {
    let ancestor = this.track.parentElement;
    while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
      const style = getComputedStyle(ancestor);
      if (/(auto|scroll)/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight + 2) {
        return ancestor;
      }
      ancestor = ancestor.parentElement;
    }
    return (document.scrollingElement || document.documentElement) as HTMLElement;
  }

  private isDocumentScroller(scroller: HTMLElement): boolean {
    return scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body;
  }

  private trackTop(scroller: HTMLElement): number {
    const rect = this.track.getBoundingClientRect();
    return rect.top - (this.isDocumentScroller(scroller) ? 0 : scroller.getBoundingClientRect().top) + scroller.scrollTop;
  }

  private getTravel(): number {
    const stage = this.track.querySelector<HTMLElement>('.stage');
    return Math.max(0, this.track.offsetHeight - (stage?.offsetHeight ?? window.innerHeight));
  }

  private sample = (): void => {
    this.frame = 0;
    if (!this.mounted || !this.scrollElement) return;
    const travel = this.getTravel();
    const value = travel > 0 ? (this.scrollElement.scrollTop - this.trackTop(this.scrollElement)) / travel : 0;
    this.store.setProgress(value);
    if (this.store.getSnapshot().isNavigating && this.store.getSnapshot().targetStop) {
      const target = getStopScrollTop(this.trackTop(this.scrollElement), travel, 0, this.store.getSnapshot().targetStop);
      if (Math.abs(target - this.scrollElement.scrollTop) < 2) this.endNavigation();
    }
  };

  private schedule = (): void => {
    if (!this.frame) this.frame = requestAnimationFrame(this.sample);
  };

  private interrupted = (): void => {
    if (this.store.getSnapshot().isNavigating) this.endNavigation();
  };

  private endNavigation(): void {
    if (this.stopTimer) window.clearTimeout(this.stopTimer);
    this.stopTimer = 0;
    this.store.setNavigation(null);
  }

  mount(): () => void {
    if (this.mounted) return () => this.unmount();
    this.mounted = true;
    this.scrollElement = this.getScroller();
    this.scrollElement.addEventListener('scroll', this.schedule, {passive: true});
    window.addEventListener('resize', this.schedule, {passive: true});
    // Only explicit user input interrupts a programmatic scroll.
    window.addEventListener('wheel', this.interrupted, {passive: true});
    window.addEventListener('touchstart', this.interrupted, {passive: true});
    window.addEventListener('keydown', this.onKeyDown);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.resizeObserver.observe(this.track);
      const stage = this.track.querySelector<HTMLElement>('.stage');
      if (stage) this.resizeObserver.observe(stage);
    }
    this.schedule();
    return () => this.unmount();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      this.interrupted();
    }
  };

  navigate(id: JourneyStopId): void {
    if (!this.mounted) return;
    const scroller = this.scrollElement ?? this.getScroller();
    const top = getStopScrollTop(this.trackTop(scroller), this.getTravel(), 0, id);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.store.setNavigation(reduced ? null : id);
    if (this.stopTimer) window.clearTimeout(this.stopTimer);
    scroller.scrollTo({top, behavior: reduced ? 'instant' : 'smooth'});
    // Safety net: browser smooth scroll may terminate without a final event.
    if (!reduced) this.stopTimer = window.setTimeout(() => this.endNavigation(), 3000);
    this.schedule();
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.scrollElement?.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    window.removeEventListener('wheel', this.interrupted);
    window.removeEventListener('touchstart', this.interrupted);
    window.removeEventListener('keydown', this.onKeyDown);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.endNavigation();
    this.scrollElement = null;
  }
}
