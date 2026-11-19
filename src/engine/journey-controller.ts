import {getStopScrollTop, type JourneyStopId} from '../lib/journey.ts';
import {easeInOutCubic, journeyDuration} from './journey-easing';
import {JourneyStore} from './journey-store.ts';

/**
 * Browser scrolling remains native for wheel, touch and keyboard.
 * Only explicit navigation animates at a controlled speed.
 * All measurements are read-only; React owns the rendered scene.
 */
export class JourneyController {
  private sampleFrame = 0;
  private navigationFrame = 0;
  private scrollElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
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
    return scroller === document.scrollingElement ||
      scroller === document.documentElement || scroller === document.body;
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
    this.sampleFrame = 0;
    if (!this.mounted || !this.scrollElement) return;
    const travel = this.getTravel();
    const value = travel > 0 ? (this.scrollElement.scrollTop - this.trackTop(this.scrollElement)) / travel : 0;
    this.store.setProgress(value);
  };

  private schedule = (): void => {
    if (!this.sampleFrame) this.sampleFrame = requestAnimationFrame(this.sample);
  };

  private cancelNavigation = (): void => {
    if (this.navigationFrame) cancelAnimationFrame(this.navigationFrame);
    this.navigationFrame = 0;
    this.store.setNavigation(null);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      this.cancelNavigation();
    }
  };

  mount(): () => void {
    if (this.mounted) return () => this.unmount();
    this.mounted = true;
    this.scrollElement = this.getScroller();
    this.scrollElement.addEventListener('scroll', this.schedule, {passive: true});
    window.addEventListener('resize', this.schedule, {passive: true});
    window.addEventListener('wheel', this.cancelNavigation, {passive: true});
    window.addEventListener('touchstart', this.cancelNavigation, {passive: true});
    window.addEventListener('pointerdown', this.cancelNavigation, {passive: true});
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

  /** Animate only intentional, click-initiated navigation. */
  navigate(id: JourneyStopId): void {
    if (!this.mounted) return;
    const scroller = this.scrollElement ?? this.getScroller();
    const top = getStopScrollTop(this.trackTop(scroller), this.getTravel(), 0, id);
    this.animateTo(scroller, top, id);
  }

  navigateToElement(element: HTMLElement): void {
    if (!this.mounted) return;
    const scroller = this.scrollElement ?? this.getScroller();
    const offset = element.getBoundingClientRect().top -
      (this.isDocumentScroller(scroller) ? 0 : scroller.getBoundingClientRect().top);
    this.animateTo(scroller, scroller.scrollTop + offset, null);
  }

  navigateToTop(): void {
    if (!this.mounted) return;
    const scroller = this.scrollElement ?? this.getScroller();
    this.animateTo(scroller, 0, null);
  }

  private animateTo(scroller: HTMLElement, requestedTop: number, stop: JourneyStopId | null): void {
    this.cancelNavigation();
    const start = scroller.scrollTop;
    const end = Math.max(0, Math.min(requestedTop, scroller.scrollHeight - scroller.clientHeight));
    const distance = end - start;
    if (Math.abs(distance) < 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scroller.scrollTo({top: end, behavior: 'instant'});
      this.schedule();
      return;
    }
    const duration = journeyDuration(distance, scroller.clientHeight);
    let began: number | null = null;
    this.store.setNavigation(stop);
    const tick = (timestamp: number): void => {
      if (!this.mounted) return;
      if (began === null) began = timestamp;
      const t = Math.min(1, (timestamp - began) / duration);
      scroller.scrollTo({top: start + distance * easeInOutCubic(t), behavior: 'instant'});
      this.schedule();
      if (t < 1) this.navigationFrame = requestAnimationFrame(tick);
      else {
        this.navigationFrame = 0;
        this.store.setNavigation(null);
      }
    };
    this.navigationFrame = requestAnimationFrame(tick);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.scrollElement?.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    window.removeEventListener('wheel', this.cancelNavigation);
    window.removeEventListener('touchstart', this.cancelNavigation);
    window.removeEventListener('pointerdown', this.cancelNavigation);
    window.removeEventListener('keydown', this.onKeyDown);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.sampleFrame) cancelAnimationFrame(this.sampleFrame);
    this.sampleFrame = 0;
    this.cancelNavigation();
    this.scrollElement = null;
  }
}
