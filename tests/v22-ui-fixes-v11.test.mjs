import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original = readFileSync('public/legacy/assets/ui-fixes-v11.js', 'utf8');
const port = readFileSync('src/lib/v22-ui-fixes-v11.ts', 'utf8');
const host = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');

test('v11 foreground SVG is exactly retained', () => {
  const svg = original.match(/const ridge = `([\s\S]*?)`;/)?.[1];
  assert.ok(svg);
  assert.ok(port.includes('const ridge = `' + svg + '`;'));
});
test('v11 stop thresholds and behaviors remain present', () => {
  for (const token of ['[0.21, 0.42, 0.63, 0.83]', 'route-floating-tooltip', 'hero-foreground-v11', 'is-active', 'is-passed', 'aria-current', 'pointerover', 'pointerout', 'focusin', 'focusout', 'pointerdown', 'Escape', 'hover: none', 'MutationObserver']) {
    assert.ok(original.includes(token), 'original missing: ' + token);
    assert.ok(port.includes(token), 'port missing: ' + token);
  }
});
test('v11 lifecycle runs after source DOM and disposes all listeners', () => {
  assert.match(host, /const unmountUIFixes = mountV22UIFixes\(\)/);
  assert.match(host, /unmountUIFixes\(\)/);
  for (const name of ['pointerover','pointerout','focusin','focusout','click','pointerdown','scroll','resize','keydown']) {
    assert.ok(port.includes("removeEventListener('" + name + "'"), 'missing cleanup for ' + name);
  }
  assert.match(port, /observer.disconnect\(\)/);
  assert.match(port, /clearTip\(\)/);
});
