export const ROUTE_STOPS = [
  {id: 'govla', progress: 0.21, labelKey: 'hoverla'},
  {id: 'brebeneskul', progress: 0.42, labelKey: 'brebeneskul'},
  {id: 'nesamovyte', progress: 0.63, labelKey: 'nesamovyte'},
  {id: 'petros', progress: 0.83, labelKey: 'petros'},
] as const;

export type JourneyStop = (typeof ROUTE_STOPS)[number];
export type JourneyStopId = JourneyStop['id'];

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function getJourneyState(progress: number) {
  const normalized = clampProgress(progress);
  const activeIndex = normalized < ROUTE_STOPS[0].progress ? -1
    : ROUTE_STOPS.reduce((index, stop, i) => normalized >= stop.progress ? i : index, -1);
  return {progress: normalized, activeIndex, activeStop: activeIndex < 0 ? null : ROUTE_STOPS[activeIndex]};
}
