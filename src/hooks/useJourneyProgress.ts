'use client';

import {useEffect, useState} from 'react';
import {getJourneyState} from '@/lib/journey';

export function useJourneyProgress(trackRef: React.RefObject<HTMLElement | null>) {
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
      setProgress(previous => Math.abs(previous - value) >= 0.0005 ? value : previous);
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
  return getJourneyState(progress);
}
