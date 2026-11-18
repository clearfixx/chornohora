import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const SOURCE = join(process.cwd(), 'public', 'legacy', 'index.html');

/**
 * Read-only extraction of the exact approved v22 DOM subtree.
 * This does NOT execute DCLogic or the original UI scripts.
 * React owns the host element; all original SVG path data and layer markup
 * are inserted verbatim, except URL rebasing for Next's public directory.
 */
export function getV22SourceScene() {
  const source = readFileSync(SOURCE, 'utf8');
  const rootStart = source.indexOf('<div data-canvas-height="8000"');
  const rootEnd = source.indexOf('</sc-if></x-dc>', rootStart);
  if (rootStart < 0 || rootEnd < 0) {
    throw new Error('Approved v22 source DOM boundary changed');
  }
  const html = source.slice(rootStart, rootEnd).replace(
    /((?:src|href)=["'])assets\//g,
    '$1/legacy/assets/',
  );
  const helmetStart = source.indexOf('<helmet>');
  const helmetEnd = source.indexOf('</helmet>', helmetStart);
  if (helmetStart < 0 || helmetEnd < 0) {
    throw new Error('Approved v22 helmet boundary changed');
  }
  const helmet = source.slice(helmetStart, helmetEnd);
  const styleStart = helmet.indexOf('<style>');
  const styleEnd = helmet.lastIndexOf('</style>');
  if (styleStart < 0 || styleEnd < 0) {
    throw new Error('Approved v22 inline CSS missing');
  }
  const inlineCss = helmet.slice(styleStart + '<style>'.length, styleEnd)
    .replace(/url\((["']?)assets\//g, 'url($1/legacy/assets/');
  return {html, inlineCss};
}
