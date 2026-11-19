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
  private wheelFrame = 0;
  private wheelTarget = 0;
  private scrollListenerTarget: Window | HTMLElement | null = null;
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

  /** A wheel sequence uses one bounded target and decelerates over subsequent frames.
   * Unlike programmatic peak navigation, this never snaps to a section.
   * Wheel input outside the journey, nested scroll controls and reduced-motion
   * preferences remain fully browser-owned.
   */
  private wheel = (event: WheelEvent): void => {
    if (!this.mounted || !this.scrollElement) return;
    this.cancelNavigation();
    const scroller = this.scrollElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || event.ctrlKey || event.metaKey || event.defaultPrevented || event.deltaY === 0) {
      this.schedule();
      return;
    }
    if (event.target instanceof Element) {
      if (event.target.closest('[data-v22-source-drawer], input, textarea, select, [contenteditable="true"]')) return;
      let ancestor = event.target.parentElement;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        if (ancestor !== this.track && /(auto|scroll)/.test(getComputedStyle(ancestor).overflowY) &&
            ancestor.scrollHeight > ancestor.clientHeight + 2) return;
        ancestor = ancestor.parentElement;
      }
    }
    const top = this.trackTop(scroller);
    const end = top + this.getTravel();
    const now = scroller.scrollTop;
    // Let wheel input leave the animated route in BOTH directions. Clamping
    // the destination to its end caused a wheel trap on the last night scene.
    if ((now <= top && event.deltaY < 0) || (now >= end && event.deltaY > 0) ||
        now < top - 1 || now > end + 1) {
      this.cancelWheel();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
    const lastPeak = top + this.getTravel() * 0.83;
    // The final scene remains visible while the last portion of the journey
    // can be traversed without dozens of tiny wheel turns.
    const leavingNight = event.deltaY > 0 && now >= lastPeak;
    const delta = leavingNight
      ? Math.max(-320, Math.min(320, event.deltaY * unit * 1.8))
      : Math.max(-140, Math.min(140, event.deltaY * unit * 0.72));
    if (!delta) return;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const target = Math.min(maxScroll, Math.max(0, (this.wheelFrame ? this.wheelTarget : now) + delta));
    // A target past the travel boundary is intentional: the scroll must reach
    // the booking/footer after the last scene, instead of sticking at 100%.
    if (Math.abs(target - now) < 0.1) return;
    event.preventDefault();
    this.wheelTarget = target;
    if (!this.wheelFrame) this.wheelFrame = requestAnimationFrame(this.tickWheel);
  };

  private tickWheel = (): void => {
    this.wheelFrame = 0;
    if (!this.mounted || !this.scrollElement) return;
    const scroller = this.scrollElement;
    const remaining = this.wheelTarget - scroller.scrollTop;
    const next = Math.abs(remaining) < 0.8 ? this.wheelTarget : scroller.scrollTop + remaining * 0.18;
    scroller.scrollTo({top: next, behavior: 'instant'});
    this.schedule();
    if (Math.abs(this.wheelTarget - next) >= 0.8) this.wheelFrame = requestAnimationFrame(this.tickWheel);
  };

  private cancelWheel = (): void => {
    if (this.wheelFrame) cancelAnimationFrame(this.wheelFrame);
    this.wheelFrame = 0;
  };

  private cancelNavigation = (): void => {
    if (this.navigationFrame) cancelAnimationFrame(this.navigationFrame);
    this.navigationFrame = 0;
    this.store.setNavigation(null);
  };

  private onTouchStart = (): void => {
    this.cancelNavigation();
    this.cancelWheel();
  };

  private onPointerDown = (): void => {
    this.cancelNavigation();
    this.cancelWheel();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      this.cancelNavigation();
      this.cancelWheel();
    }
  };

  mount(): () => void {
    if (this.mounted) return () => this.unmount();
    this.mounted = true;
    this.scrollElement = this.getScroller();
    // Root scroll events are delivered on window/document, not reliably on
    // document.scrollingElement. This was the cause of the static hiker and route.
    this.scrollListenerTarget = this.isDocumentScroller(this.scrollElement) ? window : this.scrollElement;
    this.scrollListenerTarget.addEventListener('scroll', this.schedule, {passive: true});
    window.addEventListener('resize', this.schedule, {passive: true});
    window.addEventListener('wheel', this.wheel, {passive: false});
    window.addEventListener('touchstart', this.onTouchStart, {passive: true});
    window.addEventListener('pointerdown', this.onPointerDown, {passive: true});
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
    this.cancelWheel();
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
    this.scrollListenerTarget?.removeEventListener('scroll', this.schedule);
    this.scrollListenerTarget = null;
    window.removeEventListener('resize', this.schedule);
    window.removeEventListener('wheel', this.wheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('keydown', this.onKeyDown);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.sampleFrame) cancelAnimationFrame(this.sampleFrame);
    this.sampleFrame = 0;
    this.cancelNavigation();
    this.cancelWheel();
    this.scrollElement = null;
  }
}
