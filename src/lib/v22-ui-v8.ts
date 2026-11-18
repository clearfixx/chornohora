/* Port of the approved original ui-v8.js. Keep calculations unchanged. */
export function mountV22UI(): () => void {
  const POINTS = [0.21, 0.42, 0.63, 0.83];
  const FIRST_SCENE_START = POINTS[0];
  const clamp = (n: number,a: number,b: number) => Math.max(a,Math.min(b,n));
  let raf = 0;
  function getScrollContainer(track: HTMLElement): HTMLElement {
    let n: HTMLElement | null=track.parentElement;
    while(n && n!==document.body && n!==document.documentElement){
      const cs=getComputedStyle(n);
      if((cs.overflowY==='auto'||cs.overflowY==='scroll')&&n.scrollHeight>n.clientHeight+2)return n;
      n=n.parentElement;
    }
    return document.scrollingElement||document.documentElement;
  }
  function update(){
    raf=0;
    const track=document.querySelector<HTMLElement>('.track');
    if(!track)return;
    const stage=track.querySelector<HTMLElement>('.stage');
    if(!stage)return;
    const sc=getScrollContainer(track);
    const isDoc=[document.documentElement,document.body,document.scrollingElement].includes(sc);
    const trackTop=track.getBoundingClientRect().top-(isDoc?0:sc.getBoundingClientRect().top)+sc.scrollTop;
    const travel=Math.max(1,track.offsetHeight-stage.offsetHeight);
    const progress=clamp((sc.scrollTop-trackTop)/travel,0,1);
    // Hero has no route panel. Entering Hoverla reveals the panel and hiker;
    // scrolling back into Hero reverses the same animation.
    document.body.classList.toggle('route-started', progress >= FIRST_SCENE_START - 0.0005);
    document.querySelectorAll<HTMLElement>('.route-ui-v6').forEach(bar=>{
      const stops=[...bar.querySelectorAll<HTMLElement>('.stop')];
      const dots=stops.map(el=>el.querySelector<HTMLElement>('.dot'));
      if(dots.some(dot=>!dot))return;
      if(dots.length!==4)return;
      const bounds=bar.getBoundingClientRect();
      const centers=dots.map(dot=>{const r=dot!.getBoundingClientRect();return r.left+r.width/2-bounds.left});
      const first=centers[0],last=centers[3];
      if(last<=first)return;
      const line=bar.firstElementChild as HTMLElement | null;
      const fill=bar.querySelector<HTMLElement>('.fill');
      for(const el of [line,fill]){
        if(!el)continue;
        (el as HTMLElement).style.left=first+'px';(el as HTMLElement).style.right='auto';(el as HTMLElement).style.width=(last-first)+'px';
      }
      // The first marker is reached at the first scene anchor; subsequent
      // markers are reached at exactly the scroll positions used by navigation.
      let pos=first;
      if(progress>=POINTS[3])pos=last;
      else if(progress<=POINTS[0])pos=first;
      else for(let i=0;i<3;i++)if(progress<=POINTS[i+1]){
        const t=clamp((progress-POINTS[i])/(POINTS[i+1]-POINTS[i]),0,1);
        pos=centers[i]+(centers[i+1]-centers[i])*t;break;
      }
      if(fill)fill.style.transform='scaleX('+clamp((pos-first)/(last-first),0,1)+')';
      stops.forEach((stop,i)=>{
        stop.classList.toggle('is-passed',progress>=POINTS[i]-0.0005);
        stop.classList.toggle('is-active',i===POINTS.reduce((acc,p,j)=>progress>=p?j:acc,0));
      });
    });
    // Each scene has a hiker. The local travel spans the four scene anchors;
    // keep the character within the landscape, never over the route controls.
    
    {
      const fraction=clamp((progress-POINTS[0])/(POINTS[3]-POINTS[0]),0,1);
      const viewportWidth=stage.clientWidth;
      const x=(0.06+0.79*fraction)*viewportWidth;
      stage.querySelectorAll<HTMLElement>('.hiker').forEach(hiker=>{
        hiker.style.left='0px';
        hiker.style.setProperty('--hiker-x',Math.round(x)+'px');
      });
    }
    document.querySelectorAll<HTMLAnchorElement>('.nav .nl').forEach(a=>{
      const href=a.getAttribute('href');
      const active=href==='#book'?progress>.98:href==='#start'?progress<POINTS[0]:href==='#govla'?progress>=POINTS[0]&&progress<POINTS[2]:href==='#nesamovyte'?progress>=POINTS[2]&&progress<=.98:false;
      if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
    });
  }
  function request(){if(!raf)raf=requestAnimationFrame(update)}
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  const timeout=window.setTimeout(request,300);
  request();
  return () => {
    window.removeEventListener('scroll',request);
    window.removeEventListener('resize',request);
    if(raf)cancelAnimationFrame(raf);
    clearTimeout(timeout);
    document.body.classList.remove('route-started');
  };
}
