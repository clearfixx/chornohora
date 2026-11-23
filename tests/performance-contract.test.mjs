import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
