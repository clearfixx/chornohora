import {NotFoundLandscape} from './NotFoundLandscape';
import {NotFoundNavigation} from './NotFoundNavigation';

type Locale = 'uk' | 'en';
export type ErrorCopy = {
  eyebrow: string; heading: string; description: string; home: string;
  brand: string; brandSmall: string; booking: string; menu: string;
  close: string; language: string; drawerLabel: string;
  places: [string, string, string, string];
  phases: [string, string, string, string];
};

export function NotFoundScene({locale, copy}: {locale: Locale; copy: ErrorCopy}) {
  return <div className="nf-scene">
    <div className="nf-weather" aria-hidden="true">
      <div className="nf-halo"/>
      <div className="nf-cloud nf-cloud-back"/>
      <div className="nf-cloud nf-cloud-front"/>
      <svg className="nf-lightning" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <path d="M1130 70 1098 150 1126 158 1086 250 1100 254 M1108 152 1148 190" fill="none" stroke="#eaf3ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="nf-rain nf-rain-back"/>
      <div className="nf-wind nf-wind-one"/>
      <div className="nf-wind nf-wind-two"/>
      <div className="nf-rain nf-rain-front"/>
      <div className="nf-flash"/>
    </div>
    <NotFoundLandscape/>
    <NotFoundNavigation locale={locale} labels={{
      brand: copy.brand, brandSmall: copy.brandSmall, home: copy.home,
      menu: copy.menu, close: copy.close, language: copy.language,
      drawerLabel: copy.drawerLabel, places: copy.places, phases: copy.phases,
      booking: copy.booking,
    }}/>
    <main className="nf-content" id="not-found-content">
      <div className="nf-content-inner">
        <p className="nf-eyebrow"><span/>{copy.eyebrow}<span/></p>
        <h1 className="nf-404" aria-label="404"><span>4</span><span className="nf-zero" aria-hidden="true"/><span>4</span></h1>
        <h2 className="nf-heading">{copy.heading}</h2>
        <p className="nf-description">{copy.description}</p>
        <div className="nf-actions">
          <a className="nf-button nf-button-primary" href={'/' + locale}>{copy.home}
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 H18 M12 5 L18 11 L12 17"/></svg>
          </a>
          <a className="nf-button nf-button-secondary" href={'/' + locale + '#book'}>{copy.booking}</a>
        </div>
      </div>
    </main>
  </div>;
}
