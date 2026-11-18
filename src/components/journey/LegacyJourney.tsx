'use client';

import {useState} from 'react';
import {Link} from '@/i18n/navigation';

type Props = {locale: 'uk' | 'en'};

/** Temporary v22 parity harness. Requires the original assets in public/legacy. */
export function LegacyJourney({locale}: Props) {
  const [ready, setReady] = useState(false);
  return <main className="legacy-journey">
    <div className="legacy-journey__locale" aria-label="Language">
      <Link href="/" locale="uk" aria-current={locale === 'uk' ? 'page' : undefined}>UA</Link>
      <span aria-hidden="true">/</span>
      <Link href="/" locale="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
    </div>
    {!ready && <p className="legacy-journey__loading" role="status">{locale === 'uk' ? 'Завантаження подорожі…' : 'Loading journey…'}</p>}
    <iframe title={locale === 'uk' ? 'Чорногора — Чотири неба' : 'Chornohora — Four Skies'}
      src="/legacy/index.html" className="legacy-journey__frame"
      onLoad={() => setReady(true)} />
  </main>;
}
