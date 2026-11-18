'use client';

import {useRef} from 'react';
import {Link} from '@/i18n/navigation';
import {useJourneyProgress} from '@/hooks/useJourneyProgress';
import {RouteProgress} from '@/components/journey/RouteProgress';
import type {JourneyStopId} from '@/lib/journey';

type Locale = 'uk' | 'en';
const copy = {
  uk: {
    eyebrow: 'Чорногора · Чотири неба',
    heading: 'Одна подорож. Чотири небеса.',
    description: 'Нативний прототип сцени: рухайся вниз, щоб змінювати час доби.',
    stops: {
      govla: 'Говерла',
      brebeneskul: 'Бребенескул',
      nesamovyte: 'Несамовите',
      petros: 'Петрос',
    },
    scenes: ['Світанок', 'День', 'Надвечір’я', 'Ніч'],
    route: 'Маршрут Чорногорою',
    progress: 'Прогрес подорожі',
    back: 'До затвердженої версії',
    preview: 'Прототип · не фінальний дизайн',
  },
  en: {
    eyebrow: 'Chornohora · Four Skies',
    heading: 'One journey. Four skies.',
    description: 'Native scene prototype: scroll down to change the time of day.',
    stops: {
      govla: 'Hoverla',
      brebeneskul: 'Brebeneskul',
      nesamovyte: 'Nesamovyte',
      petros: 'Petros',
    },
    scenes: ['Sunrise', 'Daylight', 'Dusk', 'Night'],
    route: 'Chornohora route',
    progress: 'Journey progress',
    back: 'Back to approved version',
    preview: 'Prototype · not final design',
  },
} satisfies Record<Locale, {
  eyebrow: string;
  heading: string;
  description: string;
  stops: Record<JourneyStopId, string>;
  scenes: string[];
  route: string;
  progress: string;
  back: string;
  preview: string;
}>;

export function NativeJourney({locale}: {locale: Locale}) {
  const trackRef = useRef<HTMLElement>(null);
  const {progress, activeIndex, navigateToStop} = useJourneyProgress(trackRef);
  const t = copy[locale];
  const scene = Math.min(3, Math.max(0, activeIndex));
  const sceneProgress = Math.max(0, Math.min(1, progress));
  const shift = sceneProgress * 42;
  return <main className="native-preview">
    <section ref={trackRef} className="native-preview__track" aria-label={t.route}>
      <div className="native-preview__sticky" data-scene={scene}
        style={{
          '--journey-progress': String(sceneProgress),
          '--far-shift': shift + 'px',
          '--near-shift': shift * 2.4 + 'px',
        } as React.CSSProperties}>
        <div className="native-preview__sky" aria-hidden="true" />
        <div className="native-preview__sun" aria-hidden="true" />
        <div className="native-preview__mountain native-preview__mountain--far" aria-hidden="true" />
        <div className="native-preview__mountain native-preview__mountain--mid" aria-hidden="true" />
        <div className="native-preview__hiker" aria-hidden="true">
          <span className="native-preview__hiker-head" />
          <span className="native-preview__hiker-body" />
          <span className="native-preview__hiker-legs" />
        </div>
        <div className="native-preview__mountain native-preview__mountain--near" aria-hidden="true" />
        <div className="native-preview__content">
          <p className="native-preview__eyebrow">{t.eyebrow}</p>
          <h1>{t.heading}</h1>
          <p>{t.description}</p>
          <p className="native-preview__scene" aria-live="off">{t.scenes[scene]}</p>
        </div>
        <div className="native-preview__tools">
          <span>{t.preview}</span>
          <Link href="/">{t.back}</Link>
          <nav aria-label={locale === 'uk' ? 'Мова' : 'Language'}>
            <Link href="/native" locale="uk" aria-current={locale === 'uk' ? 'page' : undefined}>UA</Link>
            <Link href="/native" locale="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
          </nav>
        </div>
        <RouteProgress progress={progress} activeIndex={activeIndex}
          onNavigate={navigateToStop} labels={t.stops}
          ariaLabel={t.route} progressLabel={t.progress} />
      </div>
    </section>
  </main>;
}
