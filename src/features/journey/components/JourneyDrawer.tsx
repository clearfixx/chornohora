import type * as React from 'react';
import Image from 'next/image';
type DrawerProps = {
  open: boolean;
  onDismiss: () => void;
  onNavigate: (target: string) => void;
};

export function JourneyDrawer({open, onDismiss, onNavigate}: DrawerProps) {
  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    const node = event.target;
    if (!(node instanceof Element)) return;
    if (node.closest('[data-route-menu-close]')) {
      event.preventDefault();
      onDismiss();
      return;
    }
    const target = node.closest<HTMLElement>('[data-route-target]')?.dataset.routeTarget;
    if (target) {
      event.preventDefault();
      onNavigate(target);
    }
  };
  return (
    <>
<div onClick={onClick} className="route-menu-scrim" data-route-menu-close="" aria-hidden="true"></div>
<aside onClick={onClick} id="route-drawer" className="route-drawer" aria-label="Навігація маршрутом" aria-hidden={!open} inert={!open}>
  <div className="route-drawer-head"><div className="route-drawer-brand"><Image src="/legacy/assets/chornohora-mark.png" alt="" width="70" height="38"/><span><b>ЧОРНОГОРА</b><small>ЧОТИРИ НЕБА</small></span></div><button className="route-drawer-close" type="button" aria-label="Закрити меню" data-route-menu-close=""><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>
  <div className="route-drawer-inner"><p className="route-drawer-eyebrow">ЧОТИРИ НЕБА · ОДНА ПОДОРОЖ</p><nav aria-label="Перейти до локації" className="route-drawer-nav">
    <a href="#govla" data-route-target="0" data-journey-action="goGovla"><small>01 / СВІТАНОК</small><span>Говерла</span><b aria-hidden="true">↗</b></a>
    <a href="#brebeneskul" data-route-target="1"><small>02 / ДЕНЬ</small><span>Бребенескул</span><b aria-hidden="true">↗</b></a>
    <a href="#nesamovyte" data-route-target="2"><small>03 / ВЕЧІР</small><span>Несамовите</span><b aria-hidden="true">↗</b></a>
    <a href="#petros" data-route-target="3" data-journey-action="goPetros"><small>04 / НІЧ</small><span>Петрос</span><b aria-hidden="true">↗</b></a>
  </nav><a className="route-drawer-book" href="#book" data-route-target="book" data-journey-action="goBook">Забронювати місце <span aria-hidden="true">↗</span></a></div>
  <div className="route-drawer-foot"><span>Карпати, Україна</span><span>48°09′ N · 24°30′ E</span></div>
</aside>
    </>
  );
}
