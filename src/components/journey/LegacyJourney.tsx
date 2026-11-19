'use client';

import {useEffect, useRef, useState} from 'react';
import {mountV22LanguageNav} from '@/lib/v22-language-nav';

type Props = {locale: 'uk' | 'en'};

/**
 * Temporary preservation mode for the approved v22 scene.
 * Only mounted after the server confirms that public/legacy/index.html exists.
 * The original page is still Ukrainian in both locales.
 */
export function LegacyJourney({locale}: Props) {
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const disposeRef = useRef<() => void>(() => {});
  useEffect(() => () => disposeRef.current(), []);
  return <main className="legacy-journey">
    {!ready && <p className="legacy-journey__loading" role="status">
      {locale === 'uk' ? 'Завантаження подорожі…' : 'Loading journey…'}
    </p>}
    <iframe title={locale === 'uk' ? 'Чорногора — Чотири неба' : 'Chornohora — Four Skies'}
      ref={frameRef} src="/legacy/index.html" className="legacy-journey__frame"
      onLoad={() => {
        disposeRef.current();
        const doc = frameRef.current?.contentDocument;
        if (doc) disposeRef.current = mountV22LanguageNav(doc, locale, false);
        setReady(true);
      }} />
  </main>;
}
