/**
 * Cross-platform Petros paint diagnostics runner.
 * Usage: pnpm test:petros-perf       (software baseline)
 *        pnpm test:petros-perf:gpu   (allow hardware acceleration)
 *
 * The production scene is never modified: the aurora variants are injected
 * into a disposable browser page by test-v22-scroll-browser.mjs.
 */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const mode = process.argv[2];
if (mode !== '--software' && mode !== '--gpu') {
  console.error('Usage: node scripts/run-petros-diagnostics.mjs --software|--gpu');
  process.exitCode = 2;
} else {
  const script = fileURLToPath(new URL('./test-v22-scroll-browser.mjs', import.meta.url));
  const child = spawn(process.execPath, [script], {
    stdio: 'inherit',
    env: {
      ...process.env,
      CHORNOHORA_PERF_DIAGNOSTICS: '1',
      CHORNOHORA_BROWSER_GPU: mode === '--gpu' ? '1' : '0',
    },
  });
  child.on('error', error => {
    console.error('Unable to launch Petros diagnostics:', error);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      console.error('Petros diagnostics terminated by signal:', signal);
      process.exitCode = 1;
    } else {
      process.exitCode = code ?? 1;
    }
  });
}
