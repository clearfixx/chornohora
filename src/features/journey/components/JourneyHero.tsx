import type * as React from 'react';
import {useTranslations} from 'next-intl';
export function JourneyHero() {
  const t = useTranslations('Journey');
  return (
    <>
<div className="herosub hero-ui-v6" style={{"left":"6vw","right":"6vw","top":"112px","zIndex":"12","display":"flex","flexWrap":"wrap","alignItems":"flex-start","justifyContent":"space-between","gap":"24px"} as React.CSSProperties}>
<div className="hero-copy" style={{"maxWidth":"660px"} as React.CSSProperties}><span className="hero-kicker">48°09′ N   ·   24°30′ E</span><h1 className="hero-brand-title">{t("brand")}</h1><div className="hero-brand-subtitle">{t("brandSmall")}</div><p className="hero-brand-tagline">{t("heroTagline")}</p><h2 className="hero-original-title" style={{"margin":"0 0 16px","font":"800 clamp(28px,4.2vw,60px)/1.05 Unbounded,Onest,system-ui,sans-serif","color":"#fff","textShadow":"0 2px 30px rgba(10,5,60,.3)"} as React.CSSProperties}>{t("heroHeading")}</h2><p className="hero-original-copy" style={{"margin":"0","maxWidth":"540px","font":"400 19px/1.5 Onest,system-ui,sans-serif","color":"#fff","textShadow":"0 1px 3px rgba(10,5,60,.4)"} as React.CSSProperties}>{t("heroDescription")}</p><div className="hero-actions"><a className="cta hero-primary" href="#govla" style={{"background":"#FFE14D"} as React.CSSProperties} data-journey-action="goGovla">{t("heroStart")}</a><a className="hero-secondary" href="#book" data-journey-action="goBook">{t("book")}</a></div></div>
</div>
<a aria-label={t("heroScroll")} className="mouse" href="#govla" style={{"left":"50%","bottom":"118px","marginLeft":"-23px","width":"46px","height":"104px","zIndex":"13","display":"block","textDecoration":"none"} as React.CSSProperties} data-journey-action="goGovla">
<span style={{"position":"relative","display":"block","width":"46px","height":"74px"} as React.CSSProperties}>
<span className="ring" style={{"position":"absolute","inset":"0","borderRadius":"26px","border":"2px solid #fff","opacity":"0"} as React.CSSProperties}></span>
<span style={{"position":"absolute","inset":"0","boxSizing":"border-box","border":"3px solid #fff","borderRadius":"26px","background":"rgba(255,255,255,.14)"} as React.CSSProperties}><span className="wheel" style={{"position":"absolute","left":"50%","top":"12px","marginLeft":"-3px","width":"6px","height":"14px","borderRadius":"3px","background":"#fff"} as React.CSSProperties}></span></span>
</span>
<svg aria-hidden="true" className="chev" height="22" style={{"display":"block","marginTop":"8px","fill":"none","stroke":"#fff","strokeWidth":"3","strokeLinecap":"round","strokeLinejoin":"round"} as React.CSSProperties} viewBox="0 0 46 22" width="46"><path d="M13 5 L23 15 L33 5"></path></svg>
</a>

    </>
  );
}
