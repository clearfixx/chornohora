// Compare two isolated baseline reports; never imply headless rAF is display FPS.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const [softwarePath='artifacts/performance/software.json',gpuPath='artifacts/performance/gpu.json']=process.argv.slice(2);
const load=path=>{
  const report=JSON.parse(readFileSync(path,'utf8'));
  if(!Array.isArray(report.samples))throw Error('Invalid performance report: '+path);
  return report;
};
const median=nums=>{
  const sorted=nums.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!sorted.length)return null;
  const mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])*10)/20;
};
const summarize=report=>{
  const groups={};
  for(const s of report.samples){
    const key=s.locale+'/'+s.width;
    const group=groups[key]||(groups[key]={count:0,loader:[],fcp:[],lcp:[],cls:[],readyFrame:[],hidden:[],scenes:{}});
    group.count++;
    for(const [target,source] of [['loader','loaderReadyMs'],['fcp','fcpMs'],['lcp','lcpMs'],
      ['cls','cls'],['readyFrame','firstReadyFrameMs'],['hidden','loaderHiddenFrameMs']]){
      if(Number.isFinite(s.initial?.[source]))group[target].push(s.initial[source]);
    }
    for(const scene of s.scenes||[]){
      const bucket=group.scenes[scene.point]||(group.scenes[scene.point]={p95:[],fps:[],failedDirection:0});
      if(Number.isFinite(scene.p95Ms))bucket.p95.push(scene.p95Ms);
      if(Number.isFinite(scene.approximateFps))bucket.fps.push(scene.approximateFps);
      if(!scene.directionMatched)bucket.failedDirection++;
    }
  }
  return Object.fromEntries(Object.entries(groups).map(([key,g])=>[key,{
    samples:g.count,loaderObservations:g.loader.length,fcpObservations:g.fcp.length,
    lcpObservations:g.lcp.length,firstReadyFrameObservations:g.readyFrame.length,
    loaderHiddenFrameObservations:g.hidden.length,
    loaderReadyMs:median(g.loader),fcpMs:median(g.fcp),
    lcpMs:median(g.lcp),cls:median(g.cls),
    firstReadyFrameMs:median(g.readyFrame),loaderHiddenFrameMs:median(g.hidden),
    scenes:Object.fromEntries(Object.entries(g.scenes).map(([name,s])=>[name,{
      p95Ms:median(s.p95),approximateFps:median(s.fps),failedDirection:s.failedDirection,
    }]))
  }]));
};
const software=load(softwarePath),gpu=load(gpuPath);
const softwareGroups=summarize(software),gpuGroups=summarize(gpu);
const warnings=[];
for(const key of new Set([...Object.keys(softwareGroups),...Object.keys(gpuGroups)])){
  const a=softwareGroups[key],b=gpuGroups[key];
  if(!a||!b){warnings.push(key+': missing '+(!a?'software':'GPU')+' group');continue;}
  if(a.samples!==b.samples)warnings.push(key+': unmatched sample counts (software '+a.samples+', GPU '+b.samples+')');
  for(const [label,g] of [['software',a],['GPU',b]]){
    for(const metric of ['loader','fcp','lcp','firstReadyFrame','loaderHiddenFrame']){
      const count=g[metric+'Observations'];
      if(count<g.samples)warnings.push(key+' '+label+': '+metric+' coverage '+count+'/'+g.samples);
    }
  }
}
if((software.errors||[]).length||(gpu.errors||[]).length)warnings.push('One or both input reports contain sample errors');
const summary={schema:2,inputs:{software:softwarePath,gpu:gpuPath},
  renderer:{
    software:[...new Set(software.samples.map(s=>s.initial?.webgl?.renderer).filter(Boolean))],
    gpu:[...new Set(gpu.samples.map(s=>s.initial?.webgl?.renderer).filter(Boolean))],
  },
  software:softwareGroups,gpu:gpuGroups,warnings,
  errors:{software:software.errors||[],gpu:gpu.errors||[]},
  caution:'rAF-derived FPS are not physical display FPS. Medians of repeats; compare identical devices and versions only.'};
mkdirSync(join('artifacts','performance'),{recursive:true});
writeFileSync(join('artifacts','performance','comparison.json'),JSON.stringify(summary,null,2)+'\n');
for(const key of [...new Set([...Object.keys(summary.software),...Object.keys(summary.gpu)])]){
  const a=summary.software[key],b=summary.gpu[key];
  console.log(key+' | loader software/gpu '+(a?.loaderReadyMs??'n/a')+'/'+(b?.loaderReadyMs??'n/a')+' ms');
  for(const name of new Set([...Object.keys(a?.scenes||{}),...Object.keys(b?.scenes||{})])){
    console.log('  '+name+' p95 software/gpu: '+(a?.scenes[name]?.p95Ms??'n/a')+'/'+(b?.scenes[name]?.p95Ms??'n/a')+' ms');
  }
}
for(const warning of warnings)console.warn('PERFORMANCE WARNING '+warning);
console.log('Wrote artifacts/performance/comparison.json');
