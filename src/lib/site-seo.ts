/** Canonical site origin for public indexing; no guessed deployment URLs. */
export function publicSiteOrigin(value: string | undefined = process.env.SITE_URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
        url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
        /^127\\./.test(url.hostname) || url.hostname === '0.0.0.0' ||
        url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export const supportedLocales = ['uk', 'en'] as const;

export function localizedUrls(origin: string) {
  return {
    'uk-UA': origin + '/uk',
    'en': origin + '/en',
    'x-default': origin + '/uk',
  };
}
