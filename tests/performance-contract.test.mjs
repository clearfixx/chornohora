import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const script='scripts/test-performance.mjs';
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
