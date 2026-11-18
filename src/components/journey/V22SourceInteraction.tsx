'use client';

import {useEffect} from 'react';
import {V22ScrollController} from '@/lib/v22-scroll-controller';
import {mountV22RouteDrawer} from '@/lib/v22-route-drawer';

/**
 * Experimental parity harness for approved v22 markup.
 * Never mount alongside the original DC runtime.
 * Only scroll and drawer behavior is ported so far; DC template bindings
 * and the other original UI scripts are not yet implemented.
 */
export function V22SourceInteraction({
  html,
  drawerHtml,
}: {
  html: string;
  drawerHtml: string;
}) {
  useEffect(() => {
    const scroll = new V22ScrollController();
    scroll.mount();
    const unmountDrawer = mountV22RouteDrawer();
    return () => {
      unmountDrawer();
      scroll.unmount();
    };
  }, []);

  return (
    <>
      <div data-v22-source-scene="" dangerouslySetInnerHTML={{__html: html}} />
      <div data-v22-source-drawer="" dangerouslySetInnerHTML={{__html: drawerHtml}} />
    </>
  );
}
