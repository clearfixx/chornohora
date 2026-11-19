'use client';

import {useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import type {CSSProperties} from 'react';
import {ROUTE_STOPS, clampProgress} from '@/lib/journey';
import type {JourneyStore} from '@/engine/journey-store';

const anchors = ROUTE_STOPS.map(stop => stop.progress);
const tooltipData = [
  {eyebrow: '01 / Світанок', title: 'Говерла', description: 'Найвища вершина Українських Карпат та України. Початок нашої подорожі над хмарами.', height: '2 061 м', coordinates: '48.160° N, 24.500° E'},
  {eyebrow: '02 / День', title: 'Бребенескул', description: 'Високогірне озеро серед Чорногірського хребта — місце для перепочинку під денним небом.', height: '1 801 м', coordinates: '48.102° N, 24.563° E'},
  {eyebrow: '03 / Вечір', title: 'Несамовите', description: 'Льодовикове озеро в карпатському високогір’ї. Тут зустрічаємо вечірні барви.', height: '≈1 750 м', coordinates: '48.123° N, 24.541° E'},
  {eyebrow: '04 / Ніч', title: 'Петрос', description: 'Одна з найвищих вершин Чорногори. Завершення мандрівки під зоряним небом.', height: '2 020 м', coordinates: '48.171° N, 24.421° E'},
] as const;
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
function stopClass(progress: number, activeIndex: number, index: number): string {
  return 'stop' + (progress >= anchors[index] - .0005 ? ' is-passed' : '') +
    (activeIndex === index ? ' is-active' : '');
}

/** Route bar repaints as React state, not through mutation observers or legacy scripts. */
export function ReactRouteIndicator({store}: {store: JourneyStore}) {
  const {progress, activeIndex} = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
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

  const onPointerOver = (event: React.PointerEvent<HTMLDivElement>) => {
    const stop = event.target instanceof Element ? event.target.closest<HTMLElement>('.stop[data-peak]') : null;
    if (!stop || (event.relatedTarget instanceof Node && stop.contains(event.relatedTarget))) return;
    activateFrom(stop);
  };
  const onPointerOut = (event: React.PointerEvent<HTMLDivElement>) => {
    const stop = event.target instanceof Element ? event.target.closest<HTMLElement>('.stop[data-peak]') : null;
    if (stop && stop === activeSource.current &&
        !(event.relatedTarget instanceof Node && stop.contains(event.relatedTarget))) closeTooltip();
  };
  const onFocus = (event: React.FocusEvent<HTMLDivElement>) => activateFrom(event.target);
  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
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
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
      const top = Math.max(12, rect.top - height - 18);
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
  const fillStyle: CSSProperties = {...lineStyle, transform: 'scaleX(' + getRouteFill(progress, centers) + ')'};
  return (
<div ref={barRef} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onFocusCapture={onFocus} onBlurCapture={onBlur} className="band route-ui-v6" style={{"position":"absolute","left":"0","right":"0","bottom":"0","height":"92px","background":"var(--m4)","zIndex":"10"} as React.CSSProperties}>
<div style={{"position":"absolute","left":"6vw","right":"6vw","top":"28px","height":"3px","background":"rgba(255,255,255,.28)",...lineStyle} as React.CSSProperties}></div>
<div className="fill" style={{"position":"absolute","left":"6vw","right":"6vw","top":"28px","height":"3px","background":"#ffae64","transformOrigin":"left center",...fillStyle} as React.CSSProperties}></div>
<div className="stops">
<a aria-describedby={activeTooltip === 0 ? 'react-route-tooltip' : 'peak-1-b'} aria-label="Перейти до локації Говерла" className={stopClass(progress, activeIndex, 0)} aria-current={activeIndex === 0 ? 'step' : undefined} data-peak="1" href="#govla" data-journey-action="goGovla"><span className="dot d1"></span><span className="route-badge"><span className="route-symbol">☀</span><span className="route-labels"><span className="route-phase">01 / СВІТАНОК</span><span className="stop-name">Говерла</span></span></span><span className="stop-card" id="peak-1-b" role="tooltip"><span className="eyebrow">01 / Світанок</span><strong>Говерла</strong><p>Найвища вершина Українських Карпат та України. Початок нашої подорожі над хмарами.</p><span className="facts"><span><b>Висота</b> 2 061 м</span><span><b>Координати</b> 48.160° N, 24.500° E</span></span></span></a>
<a aria-describedby={activeTooltip === 1 ? 'react-route-tooltip' : 'peak-2-b'} aria-label="Перейти до локації Бребенескул" className={stopClass(progress, activeIndex, 1)} aria-current={activeIndex === 1 ? 'step' : undefined} data-peak="2" href="#breb" data-journey-action="goBreb"><span className="dot d2"></span><span className="route-badge"><span className="route-symbol">≋</span><span className="route-labels"><span className="route-phase">02 / ДЕНЬ</span><span className="stop-name">Бребенескул</span></span></span><span className="stop-card" id="peak-2-b" role="tooltip"><span className="eyebrow">02 / День</span><strong>Бребенескул</strong><p>Високогірне озеро серед Чорногірського хребта — місце для перепочинку під денним небом.</p><span className="facts"><span><b>Висота</b> 1 801 м</span><span><b>Координати</b> 48.102° N, 24.563° E</span></span></span></a>
<a aria-describedby={activeTooltip === 2 ? 'react-route-tooltip' : 'peak-3-b'} aria-label="Перейти до локації Несамовите" className={stopClass(progress, activeIndex, 2)} aria-current={activeIndex === 2 ? 'step' : undefined} data-peak="3" href="#nes" data-journey-action="goNes"><span className="dot d3"></span><span className="route-badge"><span className="route-symbol">♧</span><span className="route-labels"><span className="route-phase">03 / ВЕЧІР</span><span className="stop-name">Несамовите</span></span></span><span className="stop-card" id="peak-3-b" role="tooltip"><span className="eyebrow">03 / Вечір</span><strong>Несамовите</strong><p>Льодовикове озеро в карпатському високогір’ї. Тут зустрічаємо вечірні барви.</p><span className="facts"><span><b>Висота</b> ≈1 750 м</span><span><b>Координати</b> 48.123° N, 24.541° E</span></span></span></a>
<a aria-describedby={activeTooltip === 3 ? 'react-route-tooltip' : 'peak-4-b'} aria-label="Перейти до локації Петрос" className={stopClass(progress, activeIndex, 3)} aria-current={activeIndex === 3 ? 'step' : undefined} data-peak="4" href="#petros" data-journey-action="goPetros"><span className="dot d4"></span><span className="route-badge"><span className="route-symbol">☾</span><span className="route-labels"><span className="route-phase">04 / НІЧ</span><span className="stop-name">Петрос</span></span></span><span className="stop-card" id="peak-4-b" role="tooltip"><span className="eyebrow">04 / Ніч</span><strong>Петрос</strong><p>Одна з найвищих вершин Чорногори. Завершення мандрівки під зоряним небом.</p><span className="facts"><span><b>Висота</b> 2 020 м</span><span><b>Координати</b> 48.171° N, 24.421° E</span></span></span></a>
</div>
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
    <span className="eyebrow">{tooltipData[activeTooltip].eyebrow}</span>
    <strong>{tooltipData[activeTooltip].title}</strong>
    <p>{tooltipData[activeTooltip].description}</p>
    <span className="facts">
      <span><b>Висота</b> {tooltipData[activeTooltip].height}</span>
      <span><b>Координати</b> {tooltipData[activeTooltip].coordinates}</span>
    </span>
  </div>,
  document.body,
)}

  );
}

export function ReactHiker({store}: {store: JourneyStore}) {
  const {progress} = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const fraction = clamp((progress - anchors[0]) / (anchors[3] - anchors[0]));
  const x = (6 + 79 * fraction) + 'vw';
  return (
<svg aria-label="Мандрівник із рюкзаком" className="fx hiker" height="124" role="img" style={{"left":"0px","--hiker-x":x,"bottom":"86px","zIndex":"11","transformOrigin":"50% 100%"} as React.CSSProperties} viewBox="0 0 60 120" width="62">
<path d="M17 66 L27 66 L25 112 L15 112 Z" fill="#140A3A"></path><path d="M33 66 L43 66 L47 112 L37 112 Z" fill="#140A3A"></path>
<rect fill="#FFD23F" height="7" rx="3" width="16" x="12" y="110"></rect><rect fill="#FFD23F" height="7" rx="3" width="17" x="36" y="110"></rect>
<rect fill="#FFD23F" height="36" rx="6" width="16" x="6" y="28"></rect>
<path d="M19 26 L42 26 L44 68 L17 68 Z" fill="#FF6B2C"></path>
<circle cx="31" cy="14" fill="#FFD9B8" r="9"></circle><path d="M20 13 Q31 -2 42 13 Z" fill="#FFD23F"></path>
<path d="M40 34 L52 66" fill="none" stroke="#FF6B2C" strokeLinecap="round" strokeWidth="7"></path>
<path d="M52 56 L56 118" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.5"></path>
</svg>
  );
}
