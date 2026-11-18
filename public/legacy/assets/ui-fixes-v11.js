/* V11: active-stop state, isolated tooltips and Hero foreground. */
(() => {
  const anchors = [0.21, 0.42, 0.63, 0.83];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let tip = null;
  let source = null;
  let raf = 0;
  const ridge = `<svg viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true"><path fill="#24104d" d="M0 83 105 48 194 92 304 32 412 81 524 44 639 104 757 37 856 90 966 48 1070 92 1190 39 1302 84 1440 43V150H0Z"/><path fill="#170b39" d="M0 119 130 85 244 129 367 74 496 119 601 92 742 132 864 76 985 122 1090 85 1240 132 1355 90 1440 113V150H0Z"/><path fill="#10082e" d="M0 143 100 126 210 147 340 116 475 147 603 120 732 145 862 117 998 148 1122 119 1240 148 1350 124 1440 145V150H0Z"/></svg>`;
  function clearTip(){ if(tip){tip.remove();tip=null;} source=null; }
  function placeTip(){
    if(!tip||!source)return;
    const r=source.getBoundingClientRect();
    const w=tip.offsetWidth;
    const x=clamp(r.left+r.width/2-w/2,12,Math.max(12,innerWidth-w-12));
    const y=Math.max(12,r.top-tip.offsetHeight-18);
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
  function showTip(stop){
    const original=stop.querySelector('.stop-card');
    if(!original)return;
    if(source===stop)return;
    clearTip();source=stop;
    tip=original.cloneNode(true);
    tip.removeAttribute('id');tip.removeAttribute('role');
    tip.className='route-floating-tooltip';
    tip.setAttribute('aria-hidden','true');
    document.body.appendChild(tip);
    placeTip();
  }
  function findTrack(){return document.querySelector('.track');}
  function getProgress(){
    const track=findTrack();if(!track)return 0;
    const stage=track.querySelector('.stage');if(!stage)return 0;
    let sc=document.scrollingElement||document.documentElement;
    let n=track.parentElement;
    while(n&&n!==document.body&&n!==document.documentElement){
      const cs=getComputedStyle(n);
      if((cs.overflowY==='scroll'||cs.overflowY==='auto')&&n.scrollHeight>n.clientHeight+2){sc=n;break;}
      n=n.parentElement;
    }
    const isDoc=[document.documentElement,document.body,document.scrollingElement].includes(sc);
    const top=track.getBoundingClientRect().top-(isDoc?0:sc.getBoundingClientRect().top)+sc.scrollTop;
    return clamp((sc.scrollTop-top)/Math.max(1,track.offsetHeight-stage.offsetHeight),0,1);
  }
  function update(){
    raf=0;
    const progress=getProgress();
    const active=progress<anchors[0]?-1:progress>=anchors[3]?3:anchors.findIndex((a,i)=>i<3&&progress>=a&&progress<anchors[i+1]);
    document.querySelectorAll('.route-ui-v6 .stop').forEach(stop=>{
      const i=Number(stop.dataset.peak)-1;
      stop.classList.toggle('is-active',i===active);
      stop.classList.toggle('is-passed',i>=0&&i<active);
      if(i===active)stop.setAttribute('aria-current','step');else stop.removeAttribute('aria-current');
    });
    if(tip)placeTip();
  }
  function request(){if(!raf)raf=requestAnimationFrame(update);}
  // Delegate interactions: the custom DC runtime can mount or replace stops
  // after DOMContentLoaded. Direct listeners attached during init were lost.
  function stopFrom(target){
    return target instanceof Element ? target.closest('.route-ui-v6 .stop') : null;
  }
  function init(){
    // The lower ridge is part of the original mountain composition, not an
    // additional row of trees. It is added to both scene copies once mounted.
    const ensureRidges=()=>document.querySelectorAll('.stage').forEach(stage=>{
      if(stage.querySelector('.hero-foreground-v11'))return;
      const el=document.createElement('div');el.className='hero-foreground-v11';
      el.setAttribute('aria-hidden','true');el.innerHTML=ridge;
      stage.appendChild(el);
    });
    ensureRidges();
    // DCLogic renders asynchronously and may replace the stage nodes.
    const observer=new MutationObserver(()=>{ensureRidges();request();});
    const root=document.querySelector('x-dc')||document.body;
    observer.observe(root,{childList:true,subtree:false});
    document.addEventListener('pointerover',e=>{
      const stop=stopFrom(e.target);
      if(stop&&(!e.relatedTarget||!stop.contains(e.relatedTarget)))showTip(stop);
    });
    document.addEventListener('pointerout',e=>{
      const stop=stopFrom(e.target);
      if(stop&&source===stop&&(!e.relatedTarget||!stop.contains(e.relatedTarget)))clearTip();
    });
    document.addEventListener('focusin',e=>{const stop=stopFrom(e.target);if(stop)showTip(stop);});
    document.addEventListener('focusout',e=>{
      const stop=stopFrom(e.target);
      if(stop&&source===stop&&(!e.relatedTarget||!stop.contains(e.relatedTarget)))clearTip();
    });
    // Touch: first tap opens details, second tap follows the route link.
    document.addEventListener('click',e=>{
      const stop=stopFrom(e.target);
      if(!stop)return;
      if(matchMedia('(hover: none)').matches && source!==stop){
        e.preventDefault();e.stopPropagation();showTip(stop);
      }
    },true);
    document.addEventListener('pointerdown',e=>{
      if(source&&!stopFrom(e.target)&&!(tip&&tip.contains(e.target)))clearTip();
    });
    window.addEventListener('scroll',()=>{clearTip();request();},{passive:true});
    window.addEventListener('resize',()=>{request();placeTip();},{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')clearTip();});
    request();setTimeout(request,400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
