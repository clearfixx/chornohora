'use client';

import {ROUTE_STOPS, type JourneyStopId} from '@/lib/journey';

type Props = {
  progress: number;
  activeIndex: number;
  onNavigate: (id: JourneyStopId) => void;
  labels: Record<JourneyStopId, string>;
  ariaLabel: string;
  progressLabel: string;
};

/** Accessible route controls for the future native SVG stage. */
export function RouteProgress({
  progress, activeIndex, onNavigate, labels, ariaLabel, progressLabel,
}: Props) {
  return <nav aria-label={ariaLabel} className="route-progress">
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label={progressLabel}
      data-progress={progress.toFixed(4)}
    />
    {ROUTE_STOPS.map((stop, index) => <button
      key={stop.id}
      type="button"
      aria-current={index === activeIndex ? 'step' : undefined}
      aria-label={labels[stop.id]}
      onClick={() => onNavigate(stop.id)}
    >{index + 1}</button>)}
  </nav>;
}
