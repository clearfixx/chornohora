'use client';

import {useEffect, useRef} from 'react';
import {V22ScrollController} from '@/lib/v22-scroll-controller';
import {mountV22RouteDrawer} from '@/lib/v22-route-drawer';
import {mountV22StaticNavigation} from '@/lib/v22-static-navigation';
import {mountV22UI} from '@/lib/v22-ui-v8';
import {mountV22UIFixes} from '@/lib/v22-ui-fixes-v11';
import {mountV22DemoBooking} from '@/lib/v22-demo-booking';

/**
 * The original static fallback is legacy HTML, not React-owned JSX.
 * Mount it only after hydration: browsers repair legacy HTML nesting during
 * SSR parsing, making React's hydrated tree differ from the server markup.
 * Do not rewrite the original markup to hide this issue.
 */
export function V22SourceInteraction({
  html,
  drawerHtml,
  inlineCss,
}: {
  html: string;
  drawerHtml: string;
  inlineCss: string;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const drawer = drawerRef.current;
    if (!scene || !drawer) return;

    const style = document.createElement('style');
    style.dataset.v22SourceStyles = '';
    style.textContent = inlineCss;
    document.head.appendChild(style);
    scene.innerHTML = html;
    drawer.innerHTML = drawerHtml;

    let dispose = () => {};
    {
      const scroll = new V22ScrollController();
      scroll.mount();
      const unmountDrawer = mountV22RouteDrawer();
      const unmountNavigation = mountV22StaticNavigation(scene, scroll);
      const unmountUI = mountV22UI();
      const unmountUIFixes = mountV22UIFixes();
      const unmountBooking = mountV22DemoBooking(scene);
      dispose = () => {
        unmountBooking();
        unmountUIFixes();
        unmountUI();
        unmountNavigation();
        unmountDrawer();
        scroll.unmount();
      };
    }
    return () => {
      dispose();
      scene.replaceChildren();
      drawer.replaceChildren();
      style.remove();
    };
  }, [html, drawerHtml, inlineCss]);

  return (
    <>
      <div data-v22-source-scene="" ref={sceneRef} />
      <div data-v22-source-drawer="" ref={drawerRef} />
    </>
  );
}
