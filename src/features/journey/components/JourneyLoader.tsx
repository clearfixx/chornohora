import Image from 'next/image';

/** SSR-visible loading veil. It exits as soon as JourneyController is mounted;
 * no artificial delay, timeout, repeated progress updates or scroll lock. */
export function JourneyLoader({ready, locale}: {ready: boolean; locale: 'uk' | 'en'}) {
  return (
    <div className={'journey-loader' + (ready ? ' journey-loader--ready' : '')}
      aria-hidden={ready} data-journey-loader={ready ? 'complete' : 'pending'}
      role={ready ? undefined : 'status'} aria-live={ready ? undefined : 'polite'}>
      <div className="journey-loader__center">
        <Image src="/journey/assets/chornohora-mark.svg" width={243} height={81}
          alt={locale === 'uk' ? 'Чорногора — Чотири неба' : 'Chornohora — Four Skies'}
          className="journey-loader__logo" priority/>
        <div className="journey-loader__track" aria-hidden="true">
          <span className="journey-loader__trace"/>
        </div>
        <p className="journey-loader__caption">
          {locale === 'uk' ? 'Готуємо подорож' : 'Preparing your journey'}
        </p>
      </div>
    </div>
  );
}
