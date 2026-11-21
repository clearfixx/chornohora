'use client';

import {useCallback, useEffect, useState, type RefObject} from 'react';
import {JourneyController} from '@/engine/journey-controller';
import {JourneyStore} from '@/engine/journey-store';
import type {JourneyStopId} from '@/lib/journey';

/**
 * One controller per React journey. The browser owns physical scrolling;
 * components read the same immutable snapshot through useSyncExternalStore.
 * The old iframe and static compatibility adapters never mount this hook.
 */
export function useJourneyProgress(trackRef: RefObject<HTMLElement | null>, store: JourneyStore) {

  const [controller, setController] = useState<JourneyController | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const instance = new JourneyController(track, store);
    const dispose = instance.mount();
    setController(instance);
    return () => {
      dispose();
      setController(null);
    };
  }, [trackRef, store]);

  const navigateToStop = useCallback((id: JourneyStopId) => controller?.navigate(id), [controller]);
  const navigateToTop = useCallback(() => controller?.navigateToTop(), [controller]);
  const navigateToElement = useCallback((element: HTMLElement) => controller?.navigateToElement(element), [controller]);
  const jumpToStop = useCallback((id: JourneyStopId) => controller?.jumpToStop(id), [controller]);
  const jumpToTop = useCallback(() => controller?.jumpToTop(), [controller]);
  const jumpToElement = useCallback((element: HTMLElement) => controller?.jumpToElement(element), [controller]);
  return {ready: controller !== null, navigateToStop, navigateToTop, navigateToElement,
    jumpToStop, jumpToTop, jumpToElement};
}
