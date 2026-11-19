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
  label.setAttribute('aria-label', locale === 'uk' ? 'Змінити мову' : 'Change language');
  const links: HTMLAnchorElement[] = [];
  for (const language of ['uk', 'en'] as const) {
    const link = doc.createElement('a');
    link.href = `/${language}${suffix}`;
    link.textContent = language.toUpperCase();
    link.setAttribute('hreflang', language);
    if (language === locale) link.setAttribute('aria-current', 'page');
    label.append(link);
    links.push(link);
    if (language === 'uk') {
      const divider = doc.createElement('span');
      divider.textContent = ' / ';
      divider.setAttribute('aria-hidden', 'true');
      label.append(divider);
    }
  }
  return () => {
    label.innerHTML = oldMarkup;
    if (oldAria === null) label.removeAttribute('aria-label');
    else label.setAttribute('aria-label', oldAria);
    void links;
  };
}
