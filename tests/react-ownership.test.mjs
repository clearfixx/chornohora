import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolveLocalImport, scanReactImports} from '../scripts/check-react-ownership.mjs';

test('React journey graph excludes legacy DOM ownership at current HEAD', () => {
  const report = scanReactImports();
  assert.equal(report.issues.length,0,report.issues.join('\n'));
  assert.ok(report.files.length>=12,'Expected a real JSX/module graph, not just entry');
  assert.ok(report.files.some(file=>file.endsWith('/JourneyStage.tsx')));
  assert.ok(report.files.some(file=>file.endsWith('/journey-controller.ts')));
  assert.ok(!report.files.some(file=>file.endsWith('/V22SourceInteraction.tsx')));
});

test('scanner detects injected HTML in a reachable React module', () => {
  const temp=mkdtempSync(join(tmpdir(),'chornohora-ownership-'));
  const file=join(temp,'bad.tsx');
  try {
    writeFileSync(file,'export const bad = (target) => { target.innerHTML = "<img>"; };\n');
    const report=scanReactImports(file);
    assert.ok(report.issues.some(issue=>issue.includes('HTML injection')));
  } finally {rmSync(temp,{recursive:true,force:true});}
});

test('local aliases and relatives resolve only within src', () => {
  const from=join(process.cwd(),'src/components/journey/ReactJourneyPreview.tsx');
  assert.ok(resolveLocalImport(from,'@/engine/journey-store')?.endsWith('journey-store.ts'));
  assert.ok(resolveLocalImport(from,'./ReactJourneyMotion')?.endsWith('ReactJourneyMotion.tsx'));
  assert.equal(resolveLocalImport(from,'react'),null);
});
