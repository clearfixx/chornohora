/* v19: no dependencies; the original scene and DCLogic scroll engine stay intact. */
(() => {
  const points = [.21,.42,.63,.83];
  let lastFocus = null;
  let lastScroll = 0;
  const drawer = document.getElementById('route-drawer');
  const body = document.body;
  if (!drawer) return;
  const toggles = () => Array.from(document.querySelectorAll('[data-route-menu-toggle]'));
  const isOpen = () => body.classList.contains('route-menu-open');
  const scrollEl = () => document.scrollingElement || document.documentElement;
  function open() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    lastScroll = scrollEl().scrollTop;
    body.classList.add('route-menu-open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden','false');
    toggles().forEach(el=>{el.setAttribute('aria-expanded','true');el.setAttribute('aria-label','Закрити меню');});
    drawer.querySelector('.route-drawer-close').focus({preventScroll:true});
  }
  function close(restoreFocus = true) {
    if (!isOpen()) return;
    body.classList.remove('route-menu-open');
    drawer.setAttribute('inert','');
    drawer.setAttribute('aria-hidden','true');
    toggles().forEach(el=>{el.setAttribute('aria-expanded','false');el.setAttribute('aria-label','Відкрити меню');});
    if (restoreFocus && lastFocus && lastFocus.isConnected) lastFocus.focus({preventScroll:true});
  }
  function navigate(target) {
    close(false);
    const track = document.querySelector('.track');
    if (!track) return;
    const sc = scrollEl();
    const stage = track.querySelector('.stage');
    let y = 0;
    if (target === 'book') {
      const book = document.getElementById('book');
      if (!book) return;
      y = sc.scrollTop + book.getBoundingClientRect().top - 24;
    } else {
      const idx = Number(target);
      const distance = track.offsetHeight - (stage ? stage.offsetHeight : 0);
      y = sc.scrollTop + track.getBoundingClientRect().top + distance * points[idx];
    }
    // Allow the perspective transform to settle before measuring/scrolling.
    requestAnimationFrame(() => setTimeout(() => window.scrollTo({top:Math.max(0,y),behavior:'smooth'}), 80));
  }
  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-route-menu-toggle]');
    if(toggle){e.preventDefault();isOpen()?close():open();return;}
    const dismiss=e.target.closest('[data-route-menu-close]');
    if(dismiss){e.preventDefault();close();return;}
    const link=e.target.closest('[data-route-target]');
    if(link){e.preventDefault();navigate(link.dataset.routeTarget);}
  },true);
  document.addEventListener('keydown',e=>{
    if(!isOpen())return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const nodes=[...drawer.querySelectorAll('a[href],button:not([disabled])')];
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  // Freeze wheel while the drawer is open; do not change scrollTop or animated scene state.
  window.addEventListener('wheel',e=>{if(isOpen()&&!drawer.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}}, {passive:false,capture:true});
})();
