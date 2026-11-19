'use client';

import {useSyncExternalStore} from 'react';
import type {JourneyStore} from '@/engine/journey-store';

export function PetrosMeteors({store}: {store: JourneyStore}) {
  const {progress} = useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
  const visible = progress >= .76 && progress < .94;
  return <div aria-hidden="true" className={`shooting-stars${visible?' is-active':''}`} data-petros-meteors="">
    <span className="meteor meteor-one"/><span className="meteor meteor-two"/>
  </div>;
}
