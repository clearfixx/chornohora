import type {JourneyStore} from '@/engine/journey-store';
import {ReactHiker, ReactRouteIndicator} from '@/components/journey/ReactJourneyMotion';
import {SkyAtmosphere} from './scenes/SkyAtmosphere';
import {MountainAndCloudLayers} from './scenes/MountainAndCloudLayers';
import {ForestBackLayer, ForestForegroundLayer} from './scenes/ForestLayers';

/** Preserve the original strict stacking order; path geometry is unchanged. */
export function JourneyScenery({store}: {store: JourneyStore}) {
  return <>
    <SkyAtmosphere />
    <MountainAndCloudLayers />
    <ForestBackLayer />
    <ReactRouteIndicator store={store} />
    <ReactHiker store={store} />
    <ForestForegroundLayer />
  </>;
}
