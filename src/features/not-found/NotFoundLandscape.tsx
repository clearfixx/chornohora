import {MountainAndCloudLayers} from '@/features/journey/components/scenes/MountainAndCloudLayers';
import {ForestBackLayer, ForestForegroundLayer} from '@/features/journey/components/scenes/ForestLayers';

/**
 * Reuse the actual approved Chornohora scene components, including their
 * original mountain and spruce-tree SVG paths. The standalone 404 wrapper
 * only positions and recolors them; it does not mount JourneyStore, the
 * walking traveler, or the scroll controller.
 */
export function NotFoundLandscape() {
  return (
    <div className="nf-landscape" aria-hidden="true">
      <div className="nf-landscape-stage">
        <MountainAndCloudLayers />
        <ForestBackLayer />
        <ForestForegroundLayer />
      </div>
    </div>
  );
}
