import {getJourneyState, type JourneyStopId} from '../lib/journey.ts';

export type JourneySnapshot = ReturnType<typeof getJourneyState> & {
  isNavigating: boolean;
  targetStop: JourneyStopId | null;
};

/**
 * One observable source of truth for scene, route progress and navigation.
 * The snapshot object changes only when the underlying value changes.
 * React consumers subscribe with useSyncExternalStore.
 */
export class JourneyStore {
  private snapshot: JourneySnapshot = {...getJourneyState(0), isNavigating: false, targetStop: null};
  private listeners = new Set<() => void>();

  getSnapshot = (): JourneySnapshot => this.snapshot;
  getServerSnapshot = (): JourneySnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  setProgress(value: number): void {
    const next = getJourneyState(value);
    if (Math.abs(this.snapshot.progress - next.progress) < 0.00001) return;
    this.publish({...this.snapshot, ...next});
  }

  setNavigation(targetStop: JourneyStopId | null): void {
    const isNavigating = targetStop !== null;
    if (this.snapshot.targetStop === targetStop && this.snapshot.isNavigating === isNavigating) return;
    this.publish({...this.snapshot, isNavigating, targetStop});
  }

  private publish(snapshot: JourneySnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}
