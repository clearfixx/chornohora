import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const SOURCE = join(process.cwd(), 'public', 'legacy', 'index.html');

/**
 * Extract the source's existing static fallback scene, not the DC template.
 * The original contains TWO scene branches. The first contains sc-if and
 * DCLogic bindings; the second is the already-authored static fallback.
 *
 * No SVG geometry, scene markup or CSS is generated here.
 */
export function getV22SourceScene() {
  const source = readFileSync(SOURCE, 'utf8');
  const staticMarker = '<sc-if data-dc-static="" value="{{ false }}">';
  const staticStart = source.indexOf(staticMarker);
  const staticEnd = source.indexOf('</sc-if></x-dc>', staticStart);
  if (staticStart < 0 || staticEnd < 0) {
    throw new Error('Approved v22 static fallback boundary changed');
  }
  const fallback = source.slice(staticStart + staticMarker.length, staticEnd);
  const sceneStart = fallback.indexOf('<div data-canvas-height="8000"');
  if (sceneStart < 0) throw new Error('Approved v22 static canvas missing');
  const scene = fallback.slice(sceneStart);

  const drawerStart = source.indexOf('<div class="route-menu-scrim"');
  const drawerEnd = source.indexOf('</aside>', drawerStart);
  if (drawerStart < 0 || drawerEnd < 0) {
    throw new Error('Approved v22 route drawer missing');
  }
  const drawer = source.slice(drawerStart, drawerEnd + '</aside>'.length);
  const rebase = (markup: string) => markup.replace(
    /((?:src|href)=["'])assets\//g, '$1/legacy/assets/',
  );
  const helmetStart = source.indexOf('<helmet>');
  const helmetEnd = source.indexOf('</helmet>', helmetStart);
  if (helmetStart < 0 || helmetEnd < 0) throw new Error('Approved v22 helmet missing');
  const helmet = source.slice(helmetStart, helmetEnd);
  const styleStart = helmet.indexOf('<style>');
  const styleEnd = helmet.lastIndexOf('</style>');
  if (styleStart < 0 || styleEnd < 0) throw new Error('Approved v22 CSS missing');
  const inlineCss = helmet.slice(styleStart + '<style>'.length, styleEnd)
    .replace(/url\((["']?)assets\//g, 'url($1/legacy/assets/');
  return {html: rebase(scene), drawerHtml: rebase(drawer), inlineCss};
}
