'use client';

import {useCallback, useEffect, useState, type RefObject} from 'react';
import {getJourneyState, getStopScrollTop, type JourneyStopId} from '@/lib/journey';

export function useJourneyProgress(trackRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - window.innerHeight);
      const value = Math.max(0, Math.min(1, -rect.top / travel));
      setProgress((previous) => Math.abs(previous - value) >= 0.0005 ? value : previous);
    };
    const schedule = () => {if (!frame) frame = requestAnimationFrame(update);};
    schedule();
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackRef]);

  const navigateToStop = useCallback((id: JourneyStopId) => {
    const track = trackRef.current;
    if (!track) return;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const top = getStopScrollTop(trackTop, track.offsetHeight, window.innerHeight, id);
    window.scrollTo({
      top,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [trackRef]);

  return {...getJourneyState(progress), navigateToStop};
}
