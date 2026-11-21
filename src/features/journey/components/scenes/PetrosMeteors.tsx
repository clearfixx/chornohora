'use client';

import {useSyncExternalStore} from 'react';
import type {JourneyStore} from '@/engine/journey-store';

export function PetrosMeteors({store}: {store: JourneyStore}) {
  // Re-render only when the meteor visibility window changes, not on every
  // progress frame while heavy SVG/blur layers are animating.
  const visible = useSyncExternalStore(
    store.subscribe,
    () => { const progress = store.getSnapshot().progress; return progress >= .76 && progress < .94; },
    () => false,
  );
  return <div aria-hidden="true" className={`shooting-stars${visible?' is-active':''}`} data-petros-meteors="">
    <span className="meteor meteor-one"/><span className="meteor meteor-two"/>
  </div>;
}
