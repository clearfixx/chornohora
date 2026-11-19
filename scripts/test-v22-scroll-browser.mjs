/**
 * Real browser interaction regression for the v22 native comparison.
 * Uses Chrome DevTools Protocol over Node's built-in WebSocket (Node 22).
 * Requires a built Next.js app and system Chromium; no extra dependencies.
 */
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const browser = ['google-chrome', 'chromium', 'chromium-browser']
  .find(bin => spawnSync('which', [bin], {stdio: 'ignore'}).status === 0);
if (!browser) throw new Error('Chrome/Chromium required');
const port = 3188;
const debugPort = 9338;
const profile = mkdtempSync(join(tmpdir(), 'chornohora-cdp-'));
const screenshots = join(process.cwd(), 'artifacts', 'v22-browser');
mkdirSync(screenshots, {recursive: true});
const geometrySamples = [];
const server = spawn('pnpm', ['start', '--port', String(port)], {
  detached: true, stdio: 'ignore',
});
const chrome = spawn(browser, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
  '--window-size=1440,900', 'about:blank',
], {stdio: 'ignore'});
let ws;
const pending = new Map();
let sequence = 0;
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
  pending.set(id, {resolve, reject, timeout});
  ws.send(JSON.stringify({id, method, params}));
});
async function waitFor(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try { const response = await fetch(url); if (response.ok) return await response.json(); } catch {}
    await delay(250);
  }
  throw new Error('Browser endpoint unavailable: ' + url);
}
const evaluate = async expression => {
  const result = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.result.value;
};
const capture = async (locale, width, mode, name) => {
  const result = await command('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  writeFileSync(join(screenshots, `${locale}-${width}-${mode}-${name}.png`), Buffer.from(result.result.data, 'base64'));
};
const checkGhostTitle = async (locale, width, mode, name, expectedPeak) => {
  if (!expectedPeak) return;
  const state = await evaluate(`(() => {
    const doc = ${mode === 'original' ? "document.querySelector('iframe[src=\"/legacy/index.html\"]').contentDocument" : 'document'};
    const title = doc.querySelector('.track .ghost.g${expectedPeak}');
    if (!title) return {missing: true};
    const r = title.getBoundingClientRect();
    const viewWidth = doc.defaultView.innerWidth;
    const visibleWidth = Math.max(0, Math.min(r.right, viewWidth) - Math.max(r.left, 0));
    const css = doc.defaultView.getComputedStyle(title);
    return {
      text: title.textContent.trim(),
      opacity: Number(css.opacity),
      visibleFraction: r.width > 0 ? visibleWidth / r.width : 0,
      rect: {left: r.left, right: r.right, width: r.width},
      viewport: viewWidth,
      stroke: css.webkitTextStrokeWidth,
      stageHeight: doc.querySelector('.track .stage').getBoundingClientRect().height,
      mountainZ: Number(doc.defaultView.getComputedStyle(doc.querySelector('.track .stage .ly.l1')).zIndex),
      titleZ: Number(css.zIndex),
      centerOffset: (r.left + r.right) / 2 - (() => { const stage = doc.querySelector('.track .stage').getBoundingClientRect(); return (stage.left + stage.right) / 2; })(),
      topFraction: r.top / doc.querySelector('.track .stage').getBoundingClientRect().height,
    };
  })()`);
  console.log(`GHOST ${locale}/${width}/${mode}/${name}: ${JSON.stringify(state)}`);
  assert.ok(!state.missing, `outline title missing: ${locale}/${mode}/${name}`);
  assert.ok(state.opacity > 0.5, `outline title invisible: ${locale}/${width}/${mode}/${name}: ${JSON.stringify(state)}`);
  assert.ok(state.visibleFraction >= 0.9, `outline title clipped horizontally: ${locale}/${width}/${mode}/${name}: ${JSON.stringify(state)}`);
  assert.equal(state.stroke, '2px', `outline stroke missing: ${locale}/${mode}/${name}`);
  assert.ok(Math.abs(state.centerOffset) <= 1, `outline title not horizontally centered: ${locale}/${width}/${mode}/${name}: ${JSON.stringify(state)}`);
  assert.ok(state.topFraction >= 0.2 && state.topFraction <= 0.5, `outline title outside sky composition: ${locale}/${width}/${mode}/${name}: ${JSON.stringify(state)}`);
  assert.ok(state.mountainZ > state.titleZ, `mountains must render above outline title: ${locale}/${mode}/${name}`);
};
// Check intermediate scroll frames, not only the four static summit screenshots.
// Opacity should evolve continuously and the title must not jump sideways.
const checkGhostContinuity = async (locale, width, mode) => {
  const result = await evaluate(`(async () => {
    const doc = ${mode === 'original' ? "document.querySelector('iframe[src=\"/legacy/index.html\"]').contentDocument" : 'document'};
    const win = doc.defaultView;
    const track = doc.querySelector('.track');
    const stage = track.querySelector('.stage');
    const top = track.getBoundingClientRect().top + win.scrollY;
    const travel = track.offsetHeight - stage.offsetHeight;
    const peaks = [0.21, 0.42, 0.63, 0.83];
    const data = [];
    for (let index = 0; index < peaks.length; index++) {
      const samples = [];
      for (const offset of [-0.035, -0.025, -0.015, -0.005, 0, 0.005, 0.015, 0.025, 0.035]) {
        win.scrollTo({top: top + travel * (peaks[index] + offset), behavior: 'instant'});
        await new Promise(resolve => win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)));
        const el = doc.querySelector('.track .ghost.g' + (index + 1));
        const rect = el.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        samples.push({
          offset,
          opacity: Number(win.getComputedStyle(el).opacity),
          center: (rect.left + rect.right - stageRect.left - stageRect.right) / 2,
          visible: rect.right > 0 && rect.left < doc.documentElement.clientWidth,
        });
      }
      data.push(samples);
    }
    return data;
  })()`);
  for (let index = 0; index < result.length; index++) {
    const samples = result[index];
    for (const sample of samples) {
      assert.ok(Number.isFinite(sample.opacity) && sample.opacity >= 0 && sample.opacity <= 1,
        `invalid outline opacity at ${locale}/${width}/${mode}/peak${index + 1}: ${JSON.stringify(sample)}`);
      assert.ok(Math.abs(sample.center) <= 1,
        `outline jumped sideways at ${locale}/${width}/${mode}/peak${index + 1}: ${JSON.stringify(sample)}`);
      assert.ok(sample.visible, `outline left viewport at ${locale}/${width}/${mode}/peak${index + 1}`);
    }
    for (let i = 1; i < samples.length; i++) {
      assert.ok(Math.abs(samples[i].opacity - samples[i - 1].opacity) <= 0.55,
        `abrupt outline fade at ${locale}/${width}/${mode}/peak${index + 1}: ${JSON.stringify(samples)}`);
    }
    assert.ok(samples[4].opacity > 0.5,
      `outline not visible at summit center ${locale}/${width}/${mode}/peak${index + 1}`);
    console.log(`GHOST CONTINUITY ${locale}/${width}/${mode}/peak${index + 1}: ${JSON.stringify(samples)}`);
  }
};
// Exercise actual browser input rather than only window.scrollTo checkpoints.
// Mouse-wheel events are dispatched through CDP; mobile touch input is tested
// separately below. We check both forward and reverse scroll progression.
const checkRealInputScroll = async (locale, width, mode) => {
  const frameExpr = mode === 'original'
    ? "document.querySelector('iframe[src=\"/legacy/index.html\"]').contentWindow"
    : 'window';
  const reset = async () => {
    await evaluate(`(async () => {
      const win = ${frameExpr};
      win.scrollTo({top: 0, behavior: 'instant'});
      await new Promise(resolve => win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)));
    })()`);
    await delay(180);
  };
  const measure = () => evaluate(`(() => {
    const win = ${frameExpr};
    const doc = win.document;
    const track = doc.querySelector('.track');
    const stage = track.querySelector('.stage');
    const hiker = stage.querySelector('.hiker');
    return {
      y: win.scrollY,
      progress: Math.max(0, Math.min(1, (win.scrollY - (track.getBoundingClientRect().top + win.scrollY)) / (track.offsetHeight - stage.offsetHeight))),
      hikerX: Number.parseFloat(hiker.style.getPropertyValue('--hiker-x')),
      active: [...doc.querySelectorAll('.route-ui-v6 .stop.is-active')].map(el => el.dataset.peak),
    };
  })()`);
  await reset();
  const forward = [await measure()];
  const x = Math.round(width / 2);
  const y = 420;
  for (let i = 0; i < 8; i++) {
    await command('Input.dispatchMouseEvent', {type: 'mouseWheel', x, y, deltaX: 0, deltaY: 430});
    await delay(110);
    forward.push(await measure());
  }
  assert.ok(forward.at(-1).y > forward[0].y + 200,
    `wheel input did not scroll ${locale}/${width}/${mode}: ${JSON.stringify(forward)}`);
  for (let i = 1; i < forward.length; i++) {
    assert.ok(forward[i].y >= forward[i - 1].y - 2,
      `forward wheel scroll reversed unexpectedly: ${locale}/${width}/${mode}`);
  }
  const reverse = [await measure()];
  for (let i = 0; i < 8; i++) {
    await command('Input.dispatchMouseEvent', {type: 'mouseWheel', x, y, deltaX: 0, deltaY: -430});
    await delay(220);
    reverse.push(await measure());
  }
  assert.ok(reverse.at(-1).y < reverse[0].y - 200,
    `reverse wheel input did not scroll ${locale}/${width}/${mode}: ${JSON.stringify(reverse)}`);
  // Chromium may briefly finish momentum from the previous wheel direction.
  // Require the last four reverse samples to move upward after settling.
  for (let i = Math.max(2, reverse.length - 4); i < reverse.length; i++) {
    assert.ok(reverse[i].y <= reverse[i - 1].y + 5,
      `reverse wheel scroll failed to settle upward: ${locale}/${width}/${mode}: ${JSON.stringify(reverse)}`);
  }
  console.log(`INPUT WHEEL ${locale}/${width}/${mode}: ${JSON.stringify({forward, reverse})}`);
  await reset();
};
// CDP's synthesizeScrollGesture uses compositor-level touch input, not a
// scripted scrollTo or synthetic DOM TouchEvent. Exercise mobile swipe up/down.
const checkTouchScroll = async (locale, width, mode) => {
  if (width >= 700) return;
  const frameExpr = mode === 'original'
    ? "document.querySelector('iframe[src=\"/legacy/index.html\"]').contentWindow"
    : 'window';
  const measure = () => evaluate(`(() => {
    const win = ${frameExpr};
    const doc = win.document;
    const track = doc.querySelector('.track');
    const stage = track.querySelector('.stage');
    return {
      y: win.scrollY,
      active: [...doc.querySelectorAll('.route-ui-v6 .stop.is-active')].map(el => el.dataset.peak),
      hikerX: Number.parseFloat(stage.querySelector('.hiker').style.getPropertyValue('--hiker-x')),
    };
  })()`);
  await evaluate(`(async () => {
    const win = ${frameExpr};
    win.scrollTo({top: 0, behavior: 'instant'});
    await new Promise(resolve => win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)));
  })()`);
  await delay(300);
  // Explicit CDP touch stream is more portable in headless Chromium than
  // Input.synthesizeScrollGesture, which can report success without scrolling.
  const swipe = async (fromY, toY) => {
    const x = 25;
    await command('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y: fromY, id: 1}]});
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const y = fromY + (toY - fromY) * i / steps;
      await command('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y, id: 1}]});
      await delay(20);
    }
    await command('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  };
  {
    const before = await measure();
    const forward = [before];
    for (let i = 0; i < 5; i++) {
      await swipe(700, 250);
      await delay(220);
      forward.push(await measure());
    }
    if (forward.at(-1).y <= before.y + 200) {
      const diagnostics = await evaluate(`(() => {
        const win = ${frameExpr};
        const doc = win.document;
        const el = doc.elementFromPoint(25, 700);
        const track = doc.querySelector('.track');
        const ancestors = [];
        for (let node = track; node && ancestors.length < 8; node = node.parentElement) {
          const css = win.getComputedStyle(node);
          ancestors.push({tag: node.tagName, className: String(node.className).slice(0, 90),
            overflowY: css.overflowY, touchAction: css.touchAction,
            scrollTop: node.scrollTop, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight});
        }
        return {innerWidth: win.innerWidth, innerHeight: win.innerHeight,
          viewport: {width: win.visualViewport?.width, height: win.visualViewport?.height, scale: win.visualViewport?.scale},
          touchPoints: win.navigator.maxTouchPoints, scrollY: win.scrollY,
          scrollingElement: doc.scrollingElement?.tagName,
          hit: el?.outerHTML?.slice(0, 250), ancestors};
      })()`);
      console.error(`TOUCH DIAGNOSTICS ${locale}/${width}/${mode}: ${JSON.stringify(diagnostics)}`);
    }
    assert.ok(forward.at(-1).y > before.y + 200,
      `touch swipe up did not scroll ${locale}/${mode}: ${JSON.stringify(forward)}`);
    const reverse = [await measure()];
    for (let i = 0; i < 5; i++) {
      await swipe(250, 700);
      await delay(220);
      reverse.push(await measure());
    }
    assert.ok(reverse.at(-1).y < reverse[0].y - 200,
      `touch swipe down did not reverse scroll ${locale}/${mode}: ${JSON.stringify(reverse)}`);
    for (const sample of [...forward, ...reverse]) {
      assert.ok(Number.isFinite(sample.hikerX),
        `hiker lost position during touch scroll ${locale}/${mode}: ${JSON.stringify(sample)}`);
    }
    console.log(`INPUT TOUCH ${locale}/${width}/${mode}: ${JSON.stringify({forward, reverse})}`);
  }
};
const sampleGeometry = async (locale, width, mode, name) => {
  const data = await evaluate(`(() => {
    const doc = ${mode === 'original' ? "document.querySelector('iframe[src=\"/legacy/index.html\"]').contentDocument" : 'document'};
    const win = doc.defaultView;
    const selectors = {
      heroButtons: '.hero-actions .cta, .hero-actions a',
      routePanel: '.route-ui-v6',
      routeStops: '.route-ui-v6 .stop',
      hiker: '.track .stage .hiker',
      stage: '.track .stage',
      drawer: '.route-menu, .route-drawer',
    };
    const rect = element => {
      const r = element.getBoundingClientRect();
      return {x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2)};
    };
    return {
      scrollY: win.scrollY,
      elements: Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [
        key, [...doc.querySelectorAll(selector)].slice(0, 8).map(element => ({
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 70),
          rect: rect(element),
        })),
      ])),
    };
  })()`);
  geometrySamples.push({locale, width, mode, name, ...data});
};
const check = async (locale, width) => {
  await command('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 700});
  await command('Emulation.setTouchEmulationEnabled', {enabled: width < 700, maxTouchPoints: 1});
  await command('Page.navigate', {url: `http://127.0.0.1:${port}/${locale}?preview=native`});
  let mounted = false;
  for (let i = 0; i < 100; i++) {
    mounted = await evaluate("!!document.querySelector('.track .stage .hiker') && !!document.querySelector('.route-ui-v6 .stop')");
    if (mounted) break;
    await delay(150);
  }
  assert.ok(mounted, `native scene missing: ${locale}/${width}`);
  const geometry = await evaluate(`(() => {
    const track = document.querySelector('.track');
    const stage = track.querySelector('.stage');
    return {top: track.getBoundingClientRect().top + scrollY, travel: track.offsetHeight - stage.offsetHeight};
  })()`);
  assert.ok(geometry.travel > 200, `no scrollable travel: ${locale}/${width}`);
  const peaks = [['hero', 0, null], ['hoverla', .21, '1'], ['brebeneskul', .42, '2'], ['nesamovyte', .63, '3'], ['petros', .83, '4']];
  let previousX = -1;
  for (const [name, p, expectedStop] of peaks) {
    const state = await evaluate(`(async () => {
      window.scrollTo({top: ${name === 'hero' ? 0 : `(${geometry.top} + ${geometry.travel} * ${p})`}, behavior: 'instant'});
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const hiker = document.querySelector('.track .stage .hiker');
      const active = [...document.querySelectorAll('.route-ui-v6 .stop.is-active')];
      return {started: document.body.classList.contains('route-started'), x: hiker.style.getPropertyValue('--hiker-x'), active: active.map(el => el.dataset.peak), scroll: scrollY};
    })()`);
    assert.equal(state.started, name !== 'hero', `route panel mismatch at ${name} ${locale}/${width}`);
    assert.ok(state.x.endsWith('px'), `hiker position missing at ${name}`);
    const x = Number.parseFloat(state.x);
    assert.ok(Number.isFinite(x) && x >= previousX, `hiker must progress monotonically at ${name}`);
    previousX = x;
    assert.deepEqual(state.active, expectedStop === null ? [] : [expectedStop], `wrong active summit at ${name} ${locale}/${width}`);
    // Route panel uses CSS transitions: measure only after they settle.
    await delay(650);
    await checkGhostTitle(locale, width, 'native', name, expectedStop);
    await sampleGeometry(locale, width, 'native', name);
    await capture(locale, width, 'native', name);
    console.log(`CDP ${locale}/${width} ${name}: ${JSON.stringify(state)}`);
  }
  await checkGhostContinuity(locale, width, 'native');
  await checkRealInputScroll(locale, width, 'native');
  await checkTouchScroll(locale, width, 'native');
  const reverse = await evaluate(`(async () => {
    window.scrollTo({top: 0, behavior: 'instant'});
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return {started: document.body.classList.contains('route-started'), active: [...document.querySelectorAll('.route-ui-v6 .stop.is-active')].map(el => el.dataset.peak)};
  })()`);
  assert.equal(reverse.started, false, `route panel failed to hide on reverse scroll: ${locale}/${width}`);
  assert.deepEqual(reverse.active, [], `active summit not cleared on reverse scroll: ${locale}/${width}`);
  // Regression for user-reported broken mouse cue and drawer navigation:
  // assert destination is reached, not merely that the click handler fired.
  const navigation = await evaluate(`(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const mouse = document.querySelector('.track a.mouse[href="#govla"]');
    const track = document.querySelector('.track');
    const stage = track?.querySelector('.stage');
    if (!mouse || !stage) return {error: 'mouse cue missing'};
    const destination = track.getBoundingClientRect().top + scrollY
      + (track.offsetHeight - stage.offsetHeight) * .21;
    mouse.click();
    await sleep(2100);
    const mouseY = scrollY;
    const toggle = document.querySelector('[data-route-menu-toggle]');
    toggle?.click();
    await sleep(720);
    document.querySelector('#route-drawer [data-route-target="2"]')?.click();
    await sleep(2100);
    const drawerY = scrollY;
    const thirdDestination = track.getBoundingClientRect().top + scrollY
      + (track.offsetHeight - stage.offsetHeight) * .63;
    return {mouseY, drawerY, destination, thirdDestination,
      closed: !document.body.classList.contains('route-menu-open'),
      languageLinks: [...document.querySelectorAll('.nav-language a')].map(a => a.getAttribute('href')),
      floatingLocale: !!document.querySelector('.legacy-journey__locale')};
  })()`);
  assert.ok(!navigation.error, `native navigation controls missing: ${JSON.stringify(navigation)}`);
  assert.ok(Math.abs(navigation.mouseY - navigation.destination) < 45,
    `mouse cue did not reach first summit ${locale}/${width}: ${JSON.stringify(navigation)}`);
  assert.ok(Math.abs(navigation.drawerY - navigation.thirdDestination) < 45 && navigation.closed,
    `drawer did not reach third summit ${locale}/${width}: ${JSON.stringify(navigation)}`);
  assert.ok(navigation.languageLinks.includes('/uk?preview=native') &&
    navigation.languageLinks.includes('/en?preview=native') && !navigation.floatingLocale,
    `navbar locale links missing or duplicated ${locale}/${width}: ${JSON.stringify(navigation)}`);
  console.log(`NAVIGATION ${locale}/${width}: ${JSON.stringify(navigation)}`);
  await evaluate("window.scrollTo({top: 0, behavior: 'instant'})");
  await delay(2200);
  // Exercise real DOM event handlers in the native implementation, not only
  // static markup and scroll positions. All form values are synthetic.
  const interactions = await evaluate(`(async () => {
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const toggle = document.querySelector('[data-route-menu-toggle]');
    const drawer = document.querySelector('#route-drawer');
    if (!toggle || !drawer) return {error: 'drawer controls missing'};
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 720));
    const drawerOpenState = {
      body: document.body.classList.contains('route-menu-open'),
      aria: drawer.getAttribute('aria-hidden'),
      expanded: toggle.getAttribute('aria-expanded'),
      focus: document.activeElement === drawer.querySelector('.route-drawer-close'),
      activeTag: document.activeElement?.outerHTML?.slice(0, 180),
      closeButton: drawer.querySelector('.route-drawer-close')?.outerHTML?.slice(0, 180),
      visibility: getComputedStyle(drawer).visibility,
      display: getComputedStyle(drawer).display,
      buttonVisibility: getComputedStyle(drawer.querySelector('.route-drawer-close')).visibility,
      drawerInert: drawer.inert,
      wrapperInert: drawer.parentElement?.inert,
    };
    const drawerOpened = drawerOpenState.body && drawerOpenState.aria === 'false'
      && drawerOpenState.expanded === 'true' && drawerOpenState.focus;
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    const drawerClosed = !document.body.classList.contains('route-menu-open')
      && drawer.getAttribute('aria-hidden') === 'true'
      && drawer.hasAttribute('inert')
      && toggle.getAttribute('aria-expanded') === 'false';
    toggle.click();
    drawer.querySelector('[data-route-target="0"]').click();
    const drawerNavigated = !document.body.classList.contains('route-menu-open');
    await new Promise(resolve => setTimeout(resolve, 130));
    window.scrollTo({top: 0, behavior: 'instant'});
    await nextFrame();
    const stop = document.querySelector('.route-ui-v6 .stop');
    stop?.dispatchEvent(new FocusEvent('focusin', {bubbles: true}));
    const tooltipShown = !!document.querySelector('.route-floating-tooltip');
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    const tooltipClosed = !document.querySelector('.route-floating-tooltip');
    const form = document.querySelector('#book form');
    const success = form?.nextElementSibling;
    if (!form || !success) return {drawerOpened, drawerClosed, drawerNavigated, tooltipShown, tooltipClosed, error: 'booking DOM missing'};
    const beforeSubmit = !form.hidden && success.hidden;
    const invalidPrevented = !form.checkValidity();
    form.elements.namedItem('name').value = 'Тест';
    form.elements.namedItem('tel').value = '+380000000000';
    form.elements.namedItem('date').value = '2027-06-01';
    form.elements.namedItem('people').value = '2';
    form.elements.namedItem('consent').checked = true;
    const valid = form.checkValidity();
    form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    const bookingConfirmed = form.hidden && !success.hidden;
    success.querySelector('button[type="button"]').click();
    const bookingReset = !form.hidden && success.hidden && form.elements.namedItem('name').value === '';
    return {drawerOpened, drawerOpenState, drawerClosed, drawerNavigated, tooltipShown, tooltipClosed,
      beforeSubmit, invalidPrevented, valid, bookingConfirmed, bookingReset};
  })()`);
  for (const [key, value] of Object.entries(interactions)) {
    if (key === 'drawerOpenState') continue;
    assert.equal(value, true, `native interaction ${key} failed at ${locale}/${width}: ${JSON.stringify(interactions)}`);
  }
  console.log(`CDP native interactions ${locale}/${width}: ${JSON.stringify(interactions)}`);
  await command('Page.navigate', {url: `http://127.0.0.1:${port}/${locale}`});
  let originalReady = false;
  for (let i = 0; i < 100; i++) {
    originalReady = await evaluate(`(() => {
      const frame = document.querySelector('iframe[src="/legacy/index.html"]');
      return !!frame?.contentDocument?.querySelector('.track .stage');
    })()`);
    if (originalReady) break;
    await delay(150);
  }
  assert.ok(originalReady, `approved v22 iframe failed to load: ${locale}/${width}`);
  for (const [name, p] of [['hero', 0], ['hoverla', .21], ['brebeneskul', .42], ['nesamovyte', .63], ['petros', .83]]) {
    await evaluate(`(async () => {
      const frame = document.querySelector('iframe[src="/legacy/index.html"]');
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      const track = doc.querySelector('.track');
      const stage = track.querySelector('.stage');
      const top = track.getBoundingClientRect().top + win.scrollY;
      const travel = track.offsetHeight - stage.offsetHeight;
      win.scrollTo({top: ${name === 'hero' ? '0' : `top + travel * ${p}`}, behavior: 'instant'});
      await new Promise(r => win.requestAnimationFrame(() => win.requestAnimationFrame(r)));
    })()`);
    // Original DCLogic may finish a frame after the scroll event; give it
    // the same settling interval as the native controller.
    await delay(650);
    await checkGhostTitle(locale, width, 'original', name, ({hoverla: '1', brebeneskul: '2', nesamovyte: '3', petros: '4'})[name]);
    await sampleGeometry(locale, width, 'original', name);
    await capture(locale, width, 'original', name);
  }
  await checkGhostContinuity(locale, width, 'original');
  await checkRealInputScroll(locale, width, 'original');
  await checkTouchScroll(locale, width, 'original');
};
try {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/uk`)).ok) break; } catch {}
    if (i === 79) throw new Error('Next.js did not start');
    await delay(250);
  }
  const target = await waitFor(`http://127.0.0.1:${debugPort}/json/list`);
  const page = target.find(x => x.type === 'page');
  assert.ok(page?.webSocketDebuggerUrl);
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, {once: true});
    ws.addEventListener('error', reject, {once: true});
  });
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    const job = pending.get(msg.id);
    if (!job) return;
    clearTimeout(job.timeout);
    pending.delete(msg.id);
    if (msg.error) job.reject(new Error(JSON.stringify(msg.error)));
    else job.resolve(msg);
  });
  await command('Page.enable');
  await command('Runtime.enable');
  for (const locale of ['uk', 'en']) for (const width of [1440, 390]) await check(locale, width);
  writeFileSync(join(screenshots, 'geometry.json'), JSON.stringify({samples: geometrySamples}, null, 2));
  console.log('Saved geometry measurements:', geometrySamples.length);
} finally {
  ws?.close();
  const browserExit = chrome.exitCode === null ? once(chrome, 'exit') : Promise.resolve();
  if (chrome.exitCode === null) chrome.kill('SIGTERM');
  if (server.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); } }
  await Promise.race([browserExit, delay(5000)]);
  // Chrome may flush profile files briefly after exit. Retry transient races.
  for (let attempt = 0; attempt < 8; attempt++) {
    try { rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100}); break; }
    catch (error) { if (attempt === 7) throw error; await delay(250); }
  }
}
