import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicSiteOrigin, localizedUrls} from '../src/lib/site-seo.ts';

test('public SEO origin requires a clean HTTPS host, never invents a URL', () => {
  for (const value of [undefined, '', 'http://example.org', 'https://localhost:3000',
    'https://example.org/uk', 'https://example.org?preview=legacy',
    'https://user:secret@example.org', 'invalid-url']) {
    assert.equal(publicSiteOrigin(value), null, String(value));
  }
  assert.equal(publicSiteOrigin('https://chornohora.example'), 'https://chornohora.example');
  assert.equal(publicSiteOrigin(' https://chornohora.example/ '), 'https://chornohora.example');
});

test('both locales have reciprocal hreflang entries and one default', () => {
  assert.deepEqual(localizedUrls('https://chornohora.example'), {
    'uk-UA': 'https://chornohora.example/uk',
    en: 'https://chornohora.example/en',
    'x-default': 'https://chornohora.example/uk',
  });
});

test('SEO routes are opt-in and previews stay noindex', () => {
  const robots = readFileSync('src/app/robots.ts', 'utf8');
  const sitemap = readFileSync('src/app/sitemap.ts', 'utf8');
  const layout = readFileSync('src/app/[locale]/layout.tsx', 'utf8');
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  assert.match(robots, /disallow: '\/'/);
  assert.match(sitemap, /if \(!origin\) return \[\]/);
  assert.match(layout, /robots: origin/);
  assert.match(layout, /localizedUrls\(origin\)/);
  assert.match(page, /preview === 'legacy' \|\| preview === 'native' \|\| preview === 'react'/);
  assert.match(page, /index: false, follow: false/);
});
