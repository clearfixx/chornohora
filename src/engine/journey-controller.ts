import {getStopScrollTop, type JourneyStopId} from '../lib/journey.ts';
import {easeInOutCubic, journeyDuration, wheelScrollWasInterrupted} from './journey-easing';
import {JourneyStore} from './journey-store.ts';

type JourneyTraceEntry = {t: number; event: string; y: number; target: number; dir: number; detail?: number};

/**
 * Touch and keyboard scrolling remain native. Wheel input uses a single
 * eased policy across the journey and the booking/footer seam.
 * Explicit navigation animates at a controlled speed.
 * All measurements are read-only; React owns the rendered scene.
 */
export class JourneyController {
  private sampleFrame = 0;
  private navigationFrame = 0;
  private wheelFrame = 0;
  private wheelTarget = 0;
  private wheelDirection = 0;
  private wheelAppliedTop: number | null = null;
  private traceEnabled = false;
  private traceLog: JourneyTraceEntry[] = [];
  private scrollListenerTarget: Window | HTMLElement | null = null;
  private scrollElement: HTMLElement | null = null;
  // Layout measurements are invalidated by resize, not by each scroll frame.
  // Reading offsetHeight/getBoundingClientRect in every RAF may force layout
  // while the browser is animating large SVG layers.
  private trackStart = 0;
  private travel = 0;
  private resizeObserver: ResizeObserver | null = null;
  private mounted = false;

  constructor(private readonly track: HTMLElement, readonly store: JourneyStore) {}

  /** Opt-in bounded diagnostic trace: append &trace=1 to the React preview URL. */
  private trace(event: string, detail?: number): void {
    if (!this.traceEnabled) return;
    const y = this.scrollElement?.scrollTop ?? 0;
    this.traceLog.push({
      t: Math.round(performance.now()),
      event, y: Math.round(y),
      target: Math.round(this.wheelTarget), dir: this.wheelDirection,
      ...(detail === undefined ? {} : {detail: Math.round(detail)}),
    });
    if (this.traceLog.length > 400) this.traceLog.shift();
  }

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
    return this.travel;
  }

  private updateGeometry = (): void => {
    if (!this.mounted || !this.scrollElement) return;
    const stage = this.track.querySelector<HTMLElement>('.stage');
    this.travel = Math.max(0, this.track.offsetHeight - (stage?.offsetHeight ?? window.innerHeight));
    this.trackStart = this.trackTop(this.scrollElement);
    this.schedule();
  };

  private sample = (): void => {
    this.sampleFrame = 0;
    if (!this.mounted || !this.scrollElement) return;
    // Detect a scrollbar drag, browser focus restoration or an external
    // scrollTo while wheel easing is pending. Never pull the user back.
    if (this.wheelFrame && wheelScrollWasInterrupted(this.scrollElement.scrollTop, this.wheelAppliedTop)) {
      this.trace('external-scroll', this.scrollElement.scrollTop - this.wheelAppliedTop!);
      this.cancelWheel();
    }
    const travel = this.travel;
    const value = travel > 0 ? (this.scrollElement.scrollTop - this.trackStart) / travel : 0;
    this.trace('sample', value * 10000);
    this.store.setProgress(value);
  };

  private schedule = (): void => {
    if (!this.sampleFrame) this.sampleFrame = requestAnimationFrame(this.sample);
  };

  /** A wheel sequence uses one target and decelerates over subsequent frames.
   * The same motion policy spans the mountain journey AND the lower page,
   * so there is no fast/slow boundary when entering booking or returning.
   * Nested scroll controls and reduced-motion preferences remain browser-owned.
   */
  private wheel = (event: WheelEvent): void => {
    if (!this.mounted || !this.scrollElement) return;
    // The drawer is a modal overlay. While it owns interaction, do not
    // translate wheel input into programmatic background scrolling. Let the
    // drawer's own overflow container scroll natively.
    if (document.body.classList.contains('route-menu-open')) {
      this.cancelWheel();
      if (!(event.target instanceof Element && event.target.closest('[data-v22-source-drawer]'))) {
        event.preventDefault();
      }
      return;
    }
    this.cancelNavigation();
    const scroller = this.scrollElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || event.ctrlKey || event.metaKey || event.defaultPrevented || event.deltaY === 0) {
      this.cancelWheel();
      this.schedule();
      return;
    }
    if (event.target instanceof Element) {
      if (event.target.closest('[data-v22-source-drawer], input, textarea, select, [contenteditable="true"]')) {
        this.cancelWheel();
        return;
      }
      let ancestor = event.target.parentElement;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        if (ancestor !== this.track && /(auto|scroll)/.test(getComputedStyle(ancestor).overflowY) &&
            ancestor.scrollHeight > ancestor.clientHeight + 2) {
          this.cancelWheel();
          return;
        }
        ancestor = ancestor.parentElement;
      }
    }
    const now = scroller.scrollTop;
    const maximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const direction = Math.sign(event.deltaY);
    this.trace('wheel', event.deltaY);
    // Use one continuous scrolling policy for the entire React page.
    // Switching from animated to native wheel after Petros caused speed jumps
    // and conflicting scroll momentum on the return trip.
    if ((now <= 0 && direction < 0) || (now >= maximum && direction > 0)) {
      this.cancelWheel();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
    const delta = Math.max(-180, Math.min(180, event.deltaY * unit * 0.95));
    if (!delta) return;
    // Reversing wheel direction must discard pending momentum from the old
    // direction; otherwise two successive inputs can visibly fight each other.
    if (this.wheelDirection && direction !== this.wheelDirection) this.cancelWheel();
    // A completed easing sequence must not carry its last applied position
    // into a new gesture. The user might have scrolled natively meanwhile.
    if (!this.wheelFrame) this.wheelAppliedTop = null;
    const base = this.wheelFrame ? this.wheelTarget : now;
    const target = Math.min(maximum, Math.max(0, base + delta));
    if (Math.abs(target - now) < 0.1) {
      this.cancelWheel();
      return;
    }
    event.preventDefault();
    this.wheelDirection = direction;
    this.wheelTarget = target;
    this.trace('wheel-target');
    if (!this.wheelFrame) this.wheelFrame = requestAnimationFrame(this.tickWheel);
  };

  private tickWheel = (): void => {
    this.wheelFrame = 0;
    if (!this.mounted || !this.scrollElement) return;
    // Opening the drawer can happen between wheel frames, even without
    // another wheel event. Freeze pending easing immediately.
    if (document.body.classList.contains('route-menu-open')) {
      this.cancelWheel();
      return;
    }
    const scroller = this.scrollElement;
    // Check BEFORE writing this RAF frame: a scrollbar drag or another scroll
    // between frames must win over the pending wheel momentum.
    if (wheelScrollWasInterrupted(scroller.scrollTop, this.wheelAppliedTop)) {
      this.trace('external-scroll', scroller.scrollTop - this.wheelAppliedTop!);
      this.cancelWheel();
      this.schedule();
      return;
    }
    // Layout changes can shrink the valid range while easing is in flight.
    // Never keep animating toward an unreachable stale destination.
    const maximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    this.wheelTarget = Math.max(0, Math.min(maximum, this.wheelTarget));
    const remaining = this.wheelTarget - scroller.scrollTop;
    const next = Math.abs(remaining) < 0.8 ? this.wheelTarget : scroller.scrollTop + remaining * 0.18;
    this.wheelAppliedTop = next;
    scroller.scrollTo({top: next, behavior: 'instant'});
    this.trace('wheel-frame');
    this.schedule();
    if (Math.abs(this.wheelTarget - next) >= 0.8) this.wheelFrame = requestAnimationFrame(this.tickWheel);
  };

  private cancelWheel = (): void => {
    if (this.wheelFrame) cancelAnimationFrame(this.wheelFrame);
    this.wheelFrame = 0;
    this.trace('wheel-cancel');
    this.wheelDirection = 0;
    this.wheelAppliedTop = null;
    this.wheelTarget = this.scrollElement?.scrollTop ?? 0;
  };

  private cancelNavigation = (): void => {
    if (this.navigationFrame) cancelAnimationFrame(this.navigationFrame);
    this.navigationFrame = 0;
    this.store.setNavigation(null);
  };

  private onResize = (): void => {
    // Navigation destinations are measured against the current viewport.
    // A resize (including orientation changes) invalidates the old target:
    // keep the browser's present scroll position instead of seeking stale geometry.
    this.cancelNavigation();
    this.cancelWheel();
    this.updateGeometry();
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
    this.traceEnabled = new URLSearchParams(window.location.search).get('trace') === '1';
    if (this.traceEnabled) {
      const host = window as Window & {__journeyTrace?: () => JourneyTraceEntry[]};
      host.__journeyTrace = () => this.traceLog.slice();
    }
    this.track.dataset.journeyReady = 'true';
    // Root scroll events are delivered on window/document, not reliably on
    // document.scrollingElement. This was the cause of the static hiker and route.
    this.scrollListenerTarget = this.isDocumentScroller(this.scrollElement) ? window : this.scrollElement;
    this.scrollListenerTarget.addEventListener('scroll', this.schedule, {passive: true});
    window.addEventListener('resize', this.onResize, {passive: true});
    window.addEventListener('wheel', this.wheel, {passive: false});
    window.addEventListener('touchstart', this.onTouchStart, {passive: true});
    window.addEventListener('pointerdown', this.onPointerDown, {passive: true});
    window.addEventListener('keydown', this.onKeyDown);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.updateGeometry);
      this.resizeObserver.observe(this.track);
      const stage = this.track.querySelector<HTMLElement>('.stage');
      if (stage) this.resizeObserver.observe(stage);
    }
    this.updateGeometry();
    return () => this.unmount();
  }

  /** Animate only intentional, click-initiated navigation. */
  navigate(id: JourneyStopId): void {
    if (!this.mounted) return;
    this.updateGeometry();
    const travel = this.getTravel();
    // Reduced motion and engines without scroll timelines display the four
    // destinations as vertically stacked content. A percentage of zero travel
    // would otherwise send every menu action to the start of the page.
    if (travel <= 1) {
      const order: JourneyStopId[] = ['govla', 'brebeneskul', 'nesamovyte', 'petros'];
      const index = order.indexOf(id);
      const location = index >= 0
        ? this.track.querySelector<HTMLElement>('.place.r' + (index + 1))
        : null;
      if (location) this.navigateToElement(location);
      return;
    }
    const scroller = this.scrollElement ?? this.getScroller();
    const top = getStopScrollTop(this.trackStart, travel, 0, id);
    this.animateTo(scroller, top, id);
  }

  /** Restore a URL fragment without playing a multi-second click animation.
   * This is used on initial deep links and browser Back/Forward.
   */
  jumpToStop(id: JourneyStopId): void {
    if (!this.mounted) return;
    this.updateGeometry();
    if (this.travel <= 1) {
      const index = (['govla', 'brebeneskul', 'nesamovyte', 'petros'] as JourneyStopId[]).indexOf(id);
      const location = this.track.querySelector<HTMLElement>('.place.r' + (index + 1));
      if (location) this.jumpToElement(location);
      return;
    }
    const scroller = this.scrollElement ?? this.getScroller();
    this.jumpTo(scroller, getStopScrollTop(this.trackStart, this.travel, 0, id));
  }

  jumpToElement(element: HTMLElement): void {
    if (!this.mounted) return;
    const scroller = this.scrollElement ?? this.getScroller();
    const offset = element.getBoundingClientRect().top -
      (this.isDocumentScroller(scroller) ? 0 : scroller.getBoundingClientRect().top);
    this.jumpTo(scroller, scroller.scrollTop + offset);
  }

  jumpToTop(): void {
    if (!this.mounted) return;
    this.jumpTo(this.scrollElement ?? this.getScroller(), 0);
  }

  private jumpTo(scroller: HTMLElement, requestedTop: number): void {
    this.cancelNavigation();
    this.cancelWheel();
    const maximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTo({top: Math.min(maximum, Math.max(0, requestedTop)), behavior: 'instant'});
    this.schedule();
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
    let lastAppliedTop: number | null = null;
    this.store.setNavigation(stop);
    const tick = (timestamp: number): void => {
      if (!this.mounted) return;
      // A route menu opened during animated navigation takes priority over
      // the pending motion. Navigation started by a drawer link resumes only
      // after the menu has closed.
      if (document.body.classList.contains('route-menu-open')) {
        this.cancelNavigation();
        return;
      }
      // A browser-owned scroll/focus restoration can happen between two
      // click-navigation frames without firing pointerdown or a wheel event.
      // Respect its new position instead of pulling the page back.
      if (wheelScrollWasInterrupted(scroller.scrollTop, lastAppliedTop)) {
        this.trace('navigation-external-scroll', scroller.scrollTop - lastAppliedTop!);
        this.cancelNavigation();
        this.schedule();
        return;
      }
      if (began === null) began = timestamp;
      const t = Math.min(1, (timestamp - began) / duration);
      const next = start + distance * easeInOutCubic(t);
      lastAppliedTop = next;
      scroller.scrollTo({top: next, behavior: 'instant'});
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
    window.removeEventListener('resize', this.onResize);
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
    delete this.track.dataset.journeyReady;
    if (this.traceEnabled) delete (window as Window & {__journeyTrace?: () => JourneyTraceEntry[]}).__journeyTrace;
    this.scrollElement = null;
    this.trackStart = 0;
    this.travel = 0;
  }
}
