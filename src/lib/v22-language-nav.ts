/**
 * Turn the approved v22 navbar's decorative language label into real links.
 * Works in both the original same-origin iframe and the native extracted scene.
 */
export function mountV22LanguageNav(doc: Document, locale: 'uk' | 'en', native: boolean): () => void {
  const label = doc.querySelector<HTMLElement>('.nav .nav-language');
  if (!label) return () => {};
  const oldMarkup = label.innerHTML;
  const oldAria = label.getAttribute('aria-label');
  const suffix = native ? '?preview=native' : '';
  label.innerHTML = '';
  const style = doc.createElement('style');
  style.textContent = '.nav .nav-language a{color:inherit;text-decoration:none;padding:8px 3px;font:inherit}.nav .nav-language a[aria-current="page"]{color:#ffab65}.nav .nav-language a:focus-visible{outline:2px solid #ffe14d;outline-offset:3px}';
  doc.head.append(style);
  label.setAttribute('aria-label', locale === 'uk' ? 'Змінити мову' : 'Change language');
  for (const language of ['uk', 'en'] as const) {
    const link = doc.createElement('a');
    link.href = `/${language}${suffix}`;
    link.textContent = language.toUpperCase();
    link.setAttribute('hreflang', language);
    if (language === locale) link.setAttribute('aria-current', 'page');
    label.append(link);
    if (language === 'uk') {
      const divider = doc.createElement('span');
      divider.textContent = ' / ';
      divider.setAttribute('aria-hidden', 'true');
      label.append(divider);
    }
  }
  return () => {
    style.remove();
    label.innerHTML = oldMarkup;
    if (oldAria === null) label.removeAttribute('aria-label');
    else label.setAttribute('aria-label', oldAria);
  };
}
