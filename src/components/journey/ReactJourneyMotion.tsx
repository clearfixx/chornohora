'use client';

import {memo, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import type {CSSProperties, FocusEvent, PointerEvent} from 'react';
import {ROUTE_STOPS, clampProgress} from '@/lib/journey';
import {useTranslations} from 'next-intl';
import {Mountain, MapPin, Droplets, Star} from 'lucide-react';
import {LocationPreview} from '@/features/journey/components/LocationPreview';
import {locationTooltips} from '@/features/journey/data/locations';
import type {JourneyStore} from '@/engine/journey-store';

const peakKeys = ['peak1','peak2','peak3','peak4'] as const;
const phaseKeys = ['phase1','phase2','phase3','phase4'] as const;
const tooltipDescKeys = ['tooltipDesc1','tooltipDesc2','tooltipDesc3','tooltipDesc4'] as const;
const tooltipHeightKeys = ['tooltipHeight1','tooltipHeight2','tooltipHeight3','tooltipHeight4'] as const;
const tooltipPlaceKeys = ['tooltipPlace1','tooltipPlace2','tooltipPlace3','tooltipPlace4'] as const;
const tooltipFactKeys = ['tooltipFact1','tooltipFact2','tooltipFact3','tooltipFact4'] as const;
const tooltipShortDescKeys = ['tooltipShortDesc1','tooltipShortDesc2','tooltipShortDesc3','tooltipShortDesc4'] as const;
const anchors = ROUTE_STOPS.map(stop => stop.progress);
const tooltipData = locationTooltips;
const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function getRouteFill(progress: number, centers: readonly number[]): number {
  if (centers.length !== 4 || centers[3] <= centers[0]) return 0;
  const p = clampProgress(progress);
  if (p <= anchors[0]) return 0;
  if (p >= anchors[3]) return 1;
  for (let i = 0; i < 3; i++) {
    if (p <= anchors[i + 1]) {
      const t = clamp((p - anchors[i]) / (anchors[i + 1] - anchors[i]));
      const x = centers[i] + (centers[i + 1] - centers[i]) * t;
      return clamp((x - centers[0]) / (centers[3] - centers[0]));
    }
  }
  return 1;
}
function stopClass(passedMask: number, activeIndex: number, index: number): string {
  return 'stop' + ((passedMask & (1 << index)) ? ' is-passed' : '') +
    (activeIndex === index ? ' is-active' : '');
}

/** Four tooltip cards are static between route threshold changes.
 * Only the route fill and hiker need the continuous frame progress. */
const RouteStops = memo(function RouteStops({passedMask, activeIndex, activeTooltip}: {
  passedMask: number; activeIndex: number; activeTooltip: number | null;
}) {
  const t = useTranslations('Journey');
  return (
    <div className="stops">
<a aria-describedby={activeTooltip === 0 ? 'react-route-tooltip' : 'peak-1-b'} aria-label={t("tooltipNavigate") + " " + t("peak1")} className={stopClass(passedMask, activeIndex, 0)} aria-current={activeIndex === 0 ? 'step' : undefined} data-peak="1" href="#govla" data-journey-action="goGovla"><span className="dot d1"></span><span className="route-badge"><span className="route-symbol">☀</span><span className="route-labels"><span className="route-phase">01 / {t("phase1").toUpperCase()}</span><span className="stop-name">{t("peak1")}</span></span></span><span className="stop-card" id="peak-1-b" role="tooltip"><span className="eyebrow">01 / {t("phase1")}</span><strong>{t("peak1")}</strong><p>{t("tooltipShortDesc1")}</p><span className="facts"><span><b>{t("tooltipElevation")}</b> {t('tooltipHeight1')}</span><span><b>{t("tooltipCoords")}</b> 48.160° N, 24.500° E</span></span></span></a>
<a aria-describedby={activeTooltip === 1 ? 'react-route-tooltip' : 'peak-2-b'} aria-label={t("tooltipNavigate") + " " + t("peak2")} className={stopClass(passedMask, activeIndex, 1)} aria-current={activeIndex === 1 ? 'step' : undefined} data-peak="2" href="#brebeneskul" data-journey-action="goBreb"><span className="dot d2"></span><span className="route-badge"><span className="route-symbol">≋</span><span className="route-labels"><span className="route-phase">02 / {t("phase2").toUpperCase()}</span><span className="stop-name">{t("peak2")}</span></span></span><span className="stop-card" id="peak-2-b" role="tooltip"><span className="eyebrow">02 / {t("phase2")}</span><strong>{t("peak2")}</strong><p>{t("tooltipShortDesc2")}</p><span className="facts"><span><b>{t("tooltipElevation")}</b> {t('tooltipHeight2')}</span><span><b>{t("tooltipCoords")}</b> 48.102° N, 24.563° E</span></span></span></a>
<a aria-describedby={activeTooltip === 2 ? 'react-route-tooltip' : 'peak-3-b'} aria-label={t("tooltipNavigate") + " " + t("peak3")} className={stopClass(passedMask, activeIndex, 2)} aria-current={activeIndex === 2 ? 'step' : undefined} data-peak="3" href="#nesamovyte" data-journey-action="goNes"><span className="dot d3"></span><span className="route-badge"><span className="route-symbol">♧</span><span className="route-labels"><span className="route-phase">03 / {t("phase3").toUpperCase()}</span><span className="stop-name">{t("peak3")}</span></span></span><span className="stop-card" id="peak-3-b" role="tooltip"><span className="eyebrow">03 / {t("phase3")}</span><strong>{t("peak3")}</strong><p>{t("tooltipShortDesc3")}</p><span className="facts"><span><b>{t("tooltipElevation")}</b> {t('tooltipHeight3')}</span><span><b>{t("tooltipCoords")}</b> 48.123° N, 24.541° E</span></span></span></a>
<a aria-describedby={activeTooltip === 3 ? 'react-route-tooltip' : 'peak-4-b'} aria-label={t("tooltipNavigate") + " " + t("peak4")} className={stopClass(passedMask, activeIndex, 3)} aria-current={activeIndex === 3 ? 'step' : undefined} data-peak="4" href="#petros" data-journey-action="goPetros"><span className="dot d4"></span><span className="route-badge"><span className="route-symbol">☾</span><span className="route-labels"><span className="route-phase">04 / {t("phase4").toUpperCase()}</span><span className="stop-name">{t("peak4")}</span></span></span><span className="stop-card" id="peak-4-b" role="tooltip"><span className="eyebrow">04 / {t("phase4")}</span><strong>{t("peak4")}</strong><p>{t("tooltipShortDesc4")}</p><span className="facts"><span><b>{t("tooltipElevation")}</b> {t('tooltipHeight4')}</span><span><b>{t("tooltipCoords")}</b> 48.171° N, 24.421° E</span></span></span></a>
</div>
  );
});

/** The fill is the only continuously updated part of the route indicator.
 * Keep the tooltip portal, marker cards and event listeners outside its render loop. */
function RouteProgressFill({store, centers, lineStyle}: {
  store: JourneyStore; centers: readonly number[]; lineStyle: CSSProperties;
}) {
  const progress = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().progress,
    () => store.getServerSnapshot().progress,
  );
  const fillStyle: CSSProperties = {...lineStyle, transform: 'scaleX(' + getRouteFill(progress, centers) + ')'};
  return <div className="fill" style={{"position":"absolute","left":"6vw","right":"6vw","top":"28px","height":"3px","background":"#ffae64","transformOrigin":"left center",...fillStyle} as React.CSSProperties}></div>;
}

/** Compress active marker and passed thresholds into one stable primitive.
 * React 19 avoids re-rendering the shell when progress changes within a stop. */
function getRouteMarkerState(store: JourneyStore): number {
  const {progress, activeIndex} = store.getSnapshot();
  const passedMask = anchors.reduce((mask, anchor, index) =>
    progress >= anchor - .0005 ? mask | (1 << index) : mask, 0);
  return ((activeIndex + 1) << 4) | passedMask;
}

/** The route shell only re-renders when marker states or tooltips change. */
export function ReactRouteIndicator({store}: {store: JourneyStore}) {
  const t = useTranslations('Journey');
  const markerState = useSyncExternalStore(
    store.subscribe,
    () => getRouteMarkerState(store),
    () => getRouteMarkerState(store),
  );
  const passedMask = markerState & 15;
  const activeIndex = (markerState >> 4) - 1;
  const barRef = useRef<HTMLDivElement>(null);
  const [centers, setCenters] = useState<number[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({left: 12, top: 12});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const activeSource = useRef<HTMLElement | null>(null);

  const closeTooltip = useCallback(() => {
    activeSource.current = null;
    setActiveTooltip(null);
  }, []);

  const activateFrom = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const stop = target.closest<HTMLElement>('.stop[data-peak]');
    if (!stop || !barRef.current?.contains(stop)) return;
    const index = Number(stop.dataset.peak) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= tooltipData.length) return;
    activeSource.current = stop;
    setActiveTooltip(index);
  }, []);

  const onPointerOver = (event: PointerEvent<HTMLDivElement>) => {
    const stop = event.target instanceof Element ? event.target.closest<HTMLElement>('.stop[data-peak]') : null;
    if (!stop || (event.relatedTarget instanceof Node && stop.contains(event.relatedTarget))) return;
    activateFrom(stop);
  };
  const onPointerOut = (event: PointerEvent<HTMLDivElement>) => {
    const stop = event.target instanceof Element ? event.target.closest<HTMLElement>('.stop[data-peak]') : null;
    if (stop && stop === activeSource.current &&
        !(event.relatedTarget instanceof Node && stop.contains(event.relatedTarget))) closeTooltip();
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => activateFrom(event.target);
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const stop = event.target instanceof Element ? event.target.closest<HTMLElement>('.stop[data-peak]') : null;
    if (stop && stop === activeSource.current &&
        !(event.relatedTarget instanceof Node && stop.contains(event.relatedTarget))) closeTooltip();
  };

  useLayoutEffect(() => {
    if (activeTooltip === null) return;
    const place = () => {
      const source = activeSource.current;
      const tooltip = tooltipRef.current;
      if (!source || !tooltip) return;
      const rect = source.getBoundingClientRect();
      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      // The portal is viewport-fixed: constrain both axes, including when
      // the browser viewport is short or the tooltip content wraps on mobile.
      const margin = 12;
      const left = Math.max(margin, Math.min(window.innerWidth - width - margin, rect.left + rect.width / 2 - width / 2));
      const above = rect.top - height - 18;
      const below = rect.bottom + 18;
      const desiredTop = above >= margin ? above : below + height + margin <= window.innerHeight ? below : above;
      const top = Math.max(margin, Math.min(window.innerHeight - height - margin, desiredTop));
      setTooltipPosition(previous => Math.abs(previous.left - left) < .5 && Math.abs(previous.top - top) < .5
        ? previous : {left, top});
    };
    place();
    window.addEventListener('resize', place, {passive: true});
    return () => window.removeEventListener('resize', place);
  }, [activeTooltip]);

  useEffect(() => {
    if (activeTooltip === null) return;
    const onScroll = () => closeTooltip();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTooltip();
    };
    // Any scroll (including a programmatic nav) dismisses, as in v22.
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
    };
  }, [activeTooltip, closeTooltip]);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const measure = () => {
      const bounds = bar.getBoundingClientRect();
      const dots = [...bar.querySelectorAll<HTMLElement>('.stop .dot')];
      if (dots.length !== 4) return;
      const values = dots.map(dot => {
        const rect = dot.getBoundingClientRect();
        return rect.left + rect.width / 2 - bounds.left;
      });
      setCenters(previous => previous.length === 4 && values.every((v, i) => Math.abs(v - previous[i]) < .1)
        ? previous : values);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    const stops = bar.querySelector('.stops');
    if (stops) observer.observe(stops);
    measure();
    return () => observer.disconnect();
  }, []);
  const first = centers[0] ?? 0;
  const span = Math.max(0, (centers[3] ?? 0) - first);
  const lineStyle: CSSProperties = span ? {left: first, right: 'auto', width: span} : {};
  return (
<>
<div ref={barRef} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onFocusCapture={onFocus} onBlurCapture={onBlur} className="band route-ui-v6" style={{"position":"absolute","left":"0","right":"0","bottom":"0","height":"92px","background":"var(--m4)","zIndex":"10"} as React.CSSProperties}>
<div style={{"position":"absolute","left":"6vw","right":"6vw","top":"28px","height":"3px","background":"rgba(255,255,255,.28)",...lineStyle} as React.CSSProperties}></div>
<RouteProgressFill store={store} centers={centers} lineStyle={lineStyle}/>
<RouteStops
  passedMask={passedMask}
  activeIndex={activeIndex}
  activeTooltip={activeTooltip}
/>
</div>
{activeTooltip !== null && typeof document !== 'undefined' && createPortal(
  <div
    id="react-route-tooltip"
    ref={tooltipRef}
    className="route-floating-tooltip"
    role="tooltip"
    data-react-route-tooltip={activeTooltip + 1}
    style={{left: tooltipPosition.left, top: tooltipPosition.top}}
  >
    <div className="reference-tooltip-layout">
      <div className="reference-tooltip-preview"><LocationPreview index={activeTooltip}/></div>
      <div className="reference-tooltip-content">
        <span className="eyebrow">{String(activeTooltip + 1).padStart(2, '0')} / {t(phaseKeys[activeTooltip]).toUpperCase()}</span>
        <strong>{t(peakKeys[activeTooltip])}</strong>
        <p>{t(tooltipDescKeys[activeTooltip])}</p>
      </div>
    </div>
    <ul className="reference-tooltip-facts">
      <li><Mountain aria-hidden="true" size={20}/><span>{t(tooltipHeightKeys[activeTooltip])}</span></li>
      <li><MapPin aria-hidden="true" size={20}/><span>{t(tooltipPlaceKeys[activeTooltip])}</span></li>
      <li>
        {tooltipData[activeTooltip].icon==='star'?<Star aria-hidden="true" size={20}/>:
          tooltipData[activeTooltip].icon==='water'?<Droplets aria-hidden="true" size={20}/>:
          <Mountain aria-hidden="true" size={20}/>}
        <span>{t(tooltipFactKeys[activeTooltip])}</span>
      </li>
    </ul>
  </div>,
  document.body,
)}
</>
  );
}

/** Static traveler artwork is invariant while progress only moves the outer SVG. */
const HikerArtwork = memo(function HikerArtwork() {
  return <>
<path d="M17 66 L27 66 L25 112 L15 112 Z" fill="#140A3A"></path><path d="M33 66 L43 66 L47 112 L37 112 Z" fill="#140A3A"></path>
<rect fill="#FFD23F" height="7" rx="3" width="16" x="12" y="110"></rect><rect fill="#FFD23F" height="7" rx="3" width="17" x="36" y="110"></rect>
<rect fill="#FFD23F" height="36" rx="6" width="16" x="6" y="28"></rect>
<path d="M19 26 L42 26 L44 68 L17 68 Z" fill="#FF6B2C"></path>
<circle cx="31" cy="14" fill="#FFD9B8" r="9"></circle><path d="M20 13 Q31 -2 42 13 Z" fill="#FFD23F"></path>
<path d="M40 34 L52 66" fill="none" stroke="#FF6B2C" strokeLinecap="round" strokeWidth="7"></path>
<path d="M52 56 L56 118" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.5"></path>
  </>;
});

export function ReactHiker({store}: {store: JourneyStore}) {
  const t = useTranslations('Journey');
  const {progress} = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const fraction = clamp((progress - anchors[0]) / (anchors[3] - anchors[0]));
  const x = (6 + 79 * fraction) + 'vw';
  return (
<svg aria-label={t("travelerAlt")} className="fx hiker" height="124" role="img" style={{"left":"0px","--hiker-x":x,"bottom":"86px","zIndex":"11","transformOrigin":"50% 100%"} as React.CSSProperties} viewBox="0 0 60 120" width="62">
<HikerArtwork />
</svg>
  );
}
