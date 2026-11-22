import type {V22Target} from './v22-scroll-controller';
import {V22ScrollController} from './v22-scroll-controller';

/**
 * Original static fallback has sc-camel-on-click bindings from DCLogic.
 * React does not evaluate these attributes. This bridge resolves only the
 * six original navigation handlers, without rewriting approved markup.
 */
const bindings: Record<string, V22Target> = {
  goStart: 'start',
  goGovla: 'govla',
  goBreb: 'brebeneskul',
  goNes: 'nesamovyte',
  goPetros: 'petros',
  goBook: 'book',
};

export function mountV22StaticNavigation(
  scene: HTMLElement,
  controller: V22ScrollController,
): () => void {
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest<HTMLElement>('[sc-camel-on-click], a.mouse[href^="#"], a[href="#start"]');
    if (!element || !scene.contains(element)) return;
    const expression = element.getAttribute('sc-camel-on-click');
    const match = expression?.match(/^\{\{\s*(\w+)\s*\}\}$/);
    const hash = element.getAttribute('href')?.slice(1);
    const anchors: Record<string, V22Target> = {start: 'start', govla: 'govla', brebeneskul: 'brebeneskul', nesamovyte: 'nesamovyte', petros: 'petros', book: 'book'};
    const target = match ? bindings[match[1]] : hash ? anchors[hash] : undefined;
    if (target) controller.navigate(target, event);
  };
  scene.addEventListener('click', onClick);
  return () => scene.removeEventListener('click', onClick);
}
