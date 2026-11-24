import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script='scripts/test-performance.mjs';
const audit='scripts/audit-performance-assets.mjs';
const compare='scripts/compare-performance.mjs';
test('isolated performance harness parses on Node',()=>{
  const result=spawnSync(process.execPath,['--check',script],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
test('benchmark is read-only, opt-in and emits partial JSON results',()=>{
  const s=readFileSync(script,'utf8');
  for(const token of [
    'Page.addScriptToEvaluateOnNewDocument','CHORNOHORA_CHROME_BIN',
    'data-journey-loader','loaderReadyMs','fcpMs','lcpMs',
    'p95Ms','approximateFps','WebSocket','Input.dispatchMouseEvent',
    'artifacts','report.json','report.errors.push','save();',
  ])assert.ok(s.includes(token),token);
  assert.doesNotMatch(s,/writeFileSync\(.*(?:src\/|public\/)/);
});

test('all performance tool scripts parse',()=>{
  for(const file of [audit,compare]){
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,file+': '+result.stderr);
  }
});
test('navigation/paint metrics include visual dismissal and resource inventory',()=>{
  const s=readFileSync(script,'utf8');
  for(const token of ['firstReadyFrameMs','loaderHiddenFrameMs','about:blank','resourceSummary',
    'largest-contentful-paint','Page.addScriptToEvaluateOnNewDocument'])assert.ok(s.includes(token),token);
  assert.ok(readFileSync(audit,'utf8').includes('assets.json'));
  assert.ok(readFileSync(compare,'utf8').includes('comparison.json'));
});


test('comparison surfaces missing observations and input mismatches',()=>{
  const source=readFileSync(compare,'utf8');
  for(const token of ['fcpObservations','lcpObservations','firstReadyFrameObservations',
    'loaderHiddenFrameObservations','unmatched sample counts','PERFORMANCE WARNING']){
    assert.ok(source.includes(token),token);
  }
});

test('cache isolation, LCP attribution and monotonic ready timestamps are instrumented',()=>{
  const source=readFileSync(script,'utf8');
  for(const token of ['--cache=warm','Network.clearBrowserCache','Network.setCacheDisabled',
    'lcpElement','lcpSize','lcpUrl','const now=performance.now();',
    'first frame precedes readiness','quality={valid:','Browser.getVersion']){
    assert.ok(source.includes(token),token);
  }
});
test('comparator rejects duplicate reports and invalid GPU mode pairing',()=>{
  const source=readFileSync(compare,'utf8');
  for(const token of ['Comparison inputs are identical','software.gpuAllowed!==false',
    'gpu.gpuAllowed!==true','different cache modes','gpuComparisonVerified:false',
    'identical WebGL renderer','sample.quality?.valid===false']){
    assert.ok(source.includes(token),token);
  }
});

test('comparison rejects duplicated baselines and wrong mode flags at runtime',()=>{
  const dir=mkdtempSync(join(tmpdir(),'chornohora-perf-contract-'));
  try{
    const a=join(dir,'a.json'),b=join(dir,'b.json');
    const base={cacheMode:'cold',browser:{product:'Chrome/1'},samples:[],errors:[]};
    writeFileSync(a,JSON.stringify({...base,gpuAllowed:true}));
    writeFileSync(b,JSON.stringify({...base,gpuAllowed:true}));
    let run=spawnSync(process.execPath,[compare,a,b],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/Comparison inputs are identical/);
    writeFileSync(b,JSON.stringify({...base,gpuAllowed:false}));
    run=spawnSync(process.execPath,[compare,a,b],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/Invalid mode pair/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
