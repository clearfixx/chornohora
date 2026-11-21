/* Auto-converted from approved v22 static fallback. SVG paths are preserved.
 * This is a checked-in React JSX stage, NOT an HTML injection.
 * Interaction wiring and visual/browser acceptance are separate migration gates.
 */
import type * as React from 'react';
import type {RefObject} from 'react';
import type {JourneyStore} from '@/engine/journey-store';
import {JourneyNavbar} from '@/features/journey/components/JourneyNavbar';
import {JourneyScenery} from '@/features/journey/components/JourneyScenery';
import {JourneyHero} from '@/features/journey/components/JourneyHero';
import {JourneyLocationContent} from '@/features/journey/components/JourneyLocationContent';
import {BookingSection} from '@/features/journey/components/BookingSection';
import {JourneyFooter} from '@/features/journey/components/JourneyFooter';

type Locale = 'uk' | 'en';
type StageProps = {
  trackRef: RefObject<HTMLDivElement | null>;
  store: JourneyStore;
  locale: Locale;
  menuOpen: boolean;
  onAction: (action: string) => void;
  onToggleMenu: () => void;
};

export function JourneyStage({trackRef, store, locale, menuOpen, onAction, onToggleMenu}: StageProps) {
  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Preserve standard anchor behavior for Ctrl/Cmd/Shift/Alt-click.
    // Only a primary, unmodified click should start a smooth page transition.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    const node = event.target;
    if (!(node instanceof Element)) return;
    if (node.closest('[data-route-menu-toggle]')) {
      event.preventDefault();
      onToggleMenu();
      return;
    }
    const action = node.closest<HTMLElement>('[data-journey-action]')?.dataset.journeyAction;
    if (action) {
      event.preventDefault();
      onAction(action);
    }
  };
  return (
    <>
<div onClick={onClick} data-canvas-height="8000" data-canvas-width="1440" data-document-role="page" data-label="Чорногора" style={{"width":"100%","background":"#140B3A","fontFamily":"Onest,system-ui,sans-serif","color":"#fff"} as React.CSSProperties}>
<div className="track" ref={trackRef}>
<JourneyNavbar locale={locale} menuOpen={menuOpen} />
<div className="anc" id="start" style={{"top":"0"} as React.CSSProperties}></div>
<div className="anc" id="govla" style={{"top":"calc(var(--S) * .21)"} as React.CSSProperties}></div>
<div className="anc" id="brebeneskul" style={{"top":"calc(var(--S) * .42)"} as React.CSSProperties}></div>
<div className="anc" id="nesamovyte" style={{"top":"calc(var(--S) * .63)"} as React.CSSProperties}></div>
<div className="anc" id="petros" style={{"top":"calc(var(--S) * .83)"} as React.CSSProperties}></div>
<div className="stage">
<JourneyScenery store={store} /><JourneyHero /><JourneyLocationContent />
</div>
</div>
<BookingSection /><JourneyFooter />
</div>

    </>
  );
}

