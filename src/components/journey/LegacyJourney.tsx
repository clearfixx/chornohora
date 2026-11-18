'use client';

import {useState} from 'react';
import {JourneyLocaleNav} from './JourneyLocaleNav';

type Props = {locale: 'uk' | 'en'};

/**
 * Temporary preservation mode for the approved v22 scene.
 * Only mounted after the server confirms that public/legacy/index.html exists.
 * The original page is still Ukrainian in both locales.
 */
export function LegacyJourney({locale}: Props) {
  const [ready, setReady] = useState(false);
  return <main className="legacy-journey">
    <JourneyLocaleNav locale={locale} />
    {!ready && <p className="legacy-journey__loading" role="status">
      {locale === 'uk' ? 'Завантаження подорожі…' : 'Loading journey…'}
    </p>}
    <iframe title={locale === 'uk' ? 'Чорногора — Чотири неба' : 'Chornohora — Four Skies'}
      src="/legacy/index.html" className="legacy-journey__frame"
      onLoad={() => setReady(true)} />
  </main>;
}
