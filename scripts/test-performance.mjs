// Isolated production Journey benchmark. No edits to runtime rendering or scroll.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const root=process.cwd(), windows=process.platform==='win32';
const output=join(root,'artifacts','performance');
mkdirSync(output,{recursive:true});
const gpu=process.argv.includes('--gpu')||process.env.CHORNOHORA_BROWSER_GPU==='1';
const repeats=Number(process.argv.find(a=>a.startsWith('--repeats='))?.split('=')[1]||'3');
assert.ok(Number.isInteger(repeats)&&repeats>=1&&repeats<=10,'--repeats must be 1..10');
const locales=process.argv.includes('--both-locales')?['uk','en']:['uk'];
const report={version:1,createdAt:new Date().toISOString(),node:process.version,platform:process.platform,
  gpuAllowed:gpu,repeats,locales,samples:[],errors:[],
  caution:'Lab data from headless Chromium. Not field Core Web Vitals; GPU allowed does not imply hardware acceleration.'};
const save=()=>writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
const paths=windows?[
  join(process.env.PROGRAMFILES||'C:\\Program Files','Google/Chrome/Application/chrome.exe'),
  join(process.env['PROGRAMFILES(X86)']||'C:\\Program Files (x86)','Google/Chrome/Application/chrome.exe'),
  join(process.env.LOCALAPPDATA||'','Google/Chrome/Application/chrome.exe'),
  join(process.env.PROGRAMFILES||'C:\\Program Files','Microsoft/Edge/Application/msedge.exe'),
]:['google-chrome','chromium','chromium-browser'];
const browser=process.env.CHORNOHORA_CHROME_BIN?
  (existsSync(process.env.CHORNOHORA_CHROME_BIN)?process.env.CHORNOHORA_CHROME_BIN:null):
  paths.find(p=>windows?existsSync(p):spawnSync('which',[p],{stdio:'ignore'}).status===0);
const nextBin=join(root,'node_modules','next','dist','bin','next');
const port=3193, debugPort=9343;
let server,chrome,ws,profile,seq=0;
const pending=new Map();
const cdp=(method,params={})=>new Promise((resolve,reject)=>{
  if(!ws||ws.readyState!==WebSocket.OPEN)return reject(Error('Browser disconnected'));
  const id=++seq, timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},20000);
  pending.set(id,{resolve,reject,timer});
  ws.send(JSON.stringify({id,method,params}));
});
const evaluate=async expression=>{
  const value=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(value.result.exceptionDetails)throw Error(JSON.stringify(value.result.exceptionDetails));
  return value.result.result.value;
};
async function waitFor(url,json=false){
  for(let i=0;i<100;i++){
    try{const r=await fetch(url);if(r.ok)return json?await r.json():true;}catch{}
    await delay(150);
  }
  throw Error('Unreachable: '+url);
}
const stats=items=>{
  const values=items.filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);
  const pct=p=>values.length?Math.round(values[Math.floor((values.length-1)*p)]*10)/10:null;
  const median=pct(.5);
  return {frames:values.length,medianMs:median,p95Ms:pct(.95),
    approximateFps:median?Math.round(1000/median):null,
    over34ms:values.filter(v=>v>34).length,over50ms:values.filter(v=>v>50).length};
};
// Install timing observers before any route script executes.
const earlyObserver="(function(){var d=window.__journeyPerf={loaderReadyMs:null,lcpMs:null,cls:0};"+
  "try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){d.lcpMs=e.startTime})}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){}"+
  "try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput)d.cls+=e.value})}).observe({type:'layout-shift',buffered:true})}catch(e){}"+
  "var o=new MutationObserver(function(){var e=document.querySelector('[data-journey-loader]');if(e&&e.dataset.journeyLoader==='complete'&&d.loaderReadyMs===null){d.loaderReadyMs=performance.now();o.disconnect()}});"+
  "o.observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['data-journey-loader']})})();";

async function sample(locale,width,iteration){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:width<700,maxTouchPoints:1});
  await cdp('Page.navigate',{url:'http://127.0.0.1:'+port+'/'+locale});
  let initialized=false;
  for(let n=0;n<100;n++){
    initialized=await evaluate("!!document.querySelector('[data-react-journey] .track[data-journey-ready]') && document.querySelector('[data-journey-loader]')?.dataset.journeyLoader==='complete'");
    if(initialized)break;
    await delay(100);
  }
  assert.ok(initialized,'Journey was not ready');
  const initial=await evaluate("(() => {"+
    "const p=performance, n=p.getEntriesByType('navigation')[0],paint=p.getEntriesByType('paint');"+
    "const d=window.__journeyPerf||{}, track=document.querySelector('[data-react-journey] .track'),stage=track?.querySelector('.stage');"+
    "const gl=document.createElement('canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');"+
    "return {loaderReadyMs:d.loaderReadyMs,lcpMs:d.lcpMs,cls:d.cls,"+
    "fcpMs:paint.find(e=>e.name==='first-contentful-paint')?.startTime??null,"+
    "ttfbMs:n?.responseStart??null,domContentLoadedMs:n?.domContentLoadedEventEnd??null,"+
    "resourceCount:p.getEntriesByType('resource').length,"+
    "geometry:track&&stage?{top:track.getBoundingClientRect().top+scrollY,travel:track.offsetHeight-stage.offsetHeight}:null,"+
    "webgl:{available:!!gl,renderer:gl?String(gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL||gl.RENDERER)):null,vendor:gl?String(gl.getParameter(ext?.UNMASKED_VENDOR_WEBGL||gl.VENDOR)):null}}})()");
  assert.ok(initial.geometry?.travel>500,'Journey geometry missing');
  const scenes=[];
  for(const point of [{name:'hoverla-forward',progress:.25,direction:1},
    {name:'petros-reverse',progress:.92,direction:-1}]){
    await evaluate("window.scrollTo({top:"+(initial.geometry.top+initial.geometry.travel*point.progress)+",behavior:'instant'})");
    await delay(300);
    const before=await evaluate('scrollY');
    await evaluate("(() => {window.__perfFrames=[];window.__perfDone=false;let prev=null;const start=performance.now();"+
      "const tick=now=>{if(prev!==null)window.__perfFrames.push(now-prev);prev=now;"+
      "if(now-start<1600)requestAnimationFrame(tick);else window.__perfDone=true};requestAnimationFrame(tick)})()");
    for(let i=0;i<12;i++){
      await cdp('Input.dispatchMouseEvent',{type:'mouseWheel',x:Math.min(620,width/2),y:400,
        deltaY:point.direction*100,deltaX:0});
      await delay(65);
    }
    for(let k=0;k<35;k++){
      if(await evaluate('window.__perfDone===true'))break;
      await delay(75);
    }
    const capture=await evaluate("({frames:window.__perfFrames||[],finished:window.__perfDone===true,y:scrollY})");
    scenes.push({point:point.name,startY:before,endY:capture.y,
      directionMatched:(capture.y-before)*point.direction>50,
      complete:capture.finished,...stats(capture.frames)});
  }
  const entry={locale,width,iteration,initial,scenes};
  report.samples.push(entry);save();
  console.log('PERFORMANCE SAMPLE '+JSON.stringify({locale,width,iteration,loaderReadyMs:initial.loaderReadyMs,
    fcpMs:initial.fcpMs,lcpMs:initial.lcpMs,renderer:initial.webgl.renderer,
    scenes:scenes.map(s=>({point:s.point,p95Ms:s.p95Ms,fps:s.approximateFps,directionMatched:s.directionMatched}))}));
}
try{
  assert.ok(browser,'Chrome/Edge missing. Specify CHORNOHORA_CHROME_BIN.');
  assert.ok(existsSync(nextBin),'pnpm install is required');
  const build=join(root,'.next','BUILD_ID');
  assert.ok(existsSync(build),'Production build missing: run pnpm build');
  const builtAt=statSync(build).mtimeMs,stale=[];
  const scan=p=>{
    if(!existsSync(p))return;
    const st=statSync(p);
    if(st.isDirectory())for(const entry of readdirSync(p,{withFileTypes:true})){
      if(!entry.isSymbolicLink())scan(join(p,entry.name));
    }else if(st.isFile()&&st.mtimeMs>builtAt+1000)stale.push(relative(root,p));
  };
  for(const p of ['src','public','messages','next.config.ts','package.json','pnpm-lock.yaml'])scan(join(root,p));
  assert.ok(!stale.length,'Production build stale; rerun pnpm build. Changed: '+stale.slice(0,5));
  profile=mkdtempSync(join(tmpdir(),'chornohora-perf-'));
  server=spawn(process.execPath,[nextBin,'start','--port',String(port)],{detached:!windows,stdio:'ignore'});
  chrome=spawn(browser,['--headless=new','--no-sandbox',...(!gpu?['--disable-gpu']:[]),
    '--disable-dev-shm-usage','--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
  await waitFor('http://127.0.0.1:'+port+'/uk');
  const pages=await waitFor('http://127.0.0.1:'+debugPort+'/json/list',true);
  const page=pages.find(p=>p.type==='page');
  assert.ok(page?.webSocketDebuggerUrl,'Chrome CDP target not found');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',event=>{
    const msg=JSON.parse(event.data), task=pending.get(msg.id);
    if(!task)return;
    clearTimeout(task.timer);pending.delete(msg.id);
    if(msg.error)task.reject(Error(JSON.stringify(msg.error)));else task.resolve(msg);
  });
  await cdp('Page.enable');await cdp('Runtime.enable');
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:earlyObserver});
  for(const locale of locales)for(const width of [1440,390])for(let run=1;run<=repeats;run++){
    try{await sample(locale,width,run);}
    catch(error){report.errors.push({locale,width,run,message:String(error)});save();
      console.error('PERF SAMPLE FAILED '+locale+'/'+width+'/'+run+': '+error);}
  }
  if(report.errors.length||!report.samples.length)process.exitCode=1;
}catch(error){report.errors.push({phase:'setup',message:String(error)});process.exitCode=1;console.error(error);}
finally{
  save();
  ws?.close();
  for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error('Benchmark ending'));}
  if(chrome?.pid){if(windows)spawnSync('taskkill',['/PID',String(chrome.pid),'/T','/F'],{stdio:'ignore'});
    else chrome.kill('SIGTERM');}
  if(server?.pid){if(windows)spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{stdio:'ignore'});
    else {try{process.kill(-server.pid,'SIGTERM');}catch{server.kill('SIGTERM');}}}
  if(profile)try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}catch{}
  console.log('REPORT artifacts/performance/report.json | samples='+report.samples.length+' errors='+report.errors.length);
}
