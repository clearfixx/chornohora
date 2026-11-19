import type * as React from 'react';
import {useTranslations} from 'next-intl';
/** Four original location scenes and closing state; all copy/geometry preserved. */
export function JourneyLocationContent() {
  const t = useTranslations('Journey');
  return (
    <>
<section className="place show r1" style={{"left":"6vw","top":"112px","width":"min(920px,88vw)","zIndex":"12"} as React.CSSProperties}>
<div style={{"display":"flex","flexWrap":"wrap","gap":"10px"} as React.CSSProperties}><span className="pill" style={{"background":"#fff","color":"#1B0B5A"} as React.CSSProperties}>{t("phase1")}</span><span className="pill alt a1 r1" style={{"background":"rgba(10,5,60,.4)","color":"#fff"} as React.CSSProperties}></span></div>
<h2 className="name"><span className="nmi n1">{t("peak1")}</span></h2>
<p className="location-subtitle">{t("subtitle1")}</p>
<p className="lead">{t("lead1")}</p>
</section>
<aside className="card show k1"><ul>
<li><b>{t("card11")}</b><span>{t("card11Text")}</span></li>
<li><b>{t("card12")}</b><span>{t("card12Text")}</span></li>
<li><b>{t("card13")}</b><span>{t("card13Text")}</span></li>
</ul></aside>
<section className="place show r2" style={{"left":"6vw","top":"112px","width":"min(920px,88vw)","zIndex":"12"} as React.CSSProperties}>
<div style={{"display":"flex","flexWrap":"wrap","gap":"10px"} as React.CSSProperties}><span className="pill" style={{"background":"#fff","color":"#0A2C7A"} as React.CSSProperties}>{t("phase2")}</span><span className="pill alt a2 r2" style={{"background":"rgba(5,20,90,.45)","color":"#fff"} as React.CSSProperties}></span></div>
<h2 className="name"><span className="nmi n2">{t("peak2")}</span></h2>
<p className="location-subtitle">{t("subtitle2")}</p>
<p className="lead">{t("lead2")}</p>
</section>
<aside className="card show k2"><ul>
<li><b>{t("card21")}</b><span>{t("card21Text")}</span></li>
<li><b>{t("card22")}</b><span>{t("card22Text")}</span></li>
<li><b>{t("card23")}</b><span>{t("card23Text")}</span></li>
</ul></aside>
<section className="place show r3" style={{"left":"6vw","top":"112px","width":"min(920px,88vw)","zIndex":"12"} as React.CSSProperties}>
<div style={{"display":"flex","flexWrap":"wrap","gap":"10px"} as React.CSSProperties}><span className="pill" style={{"background":"#fff","color":"#4A0F5A"} as React.CSSProperties}>{t("phase3")}</span><span className="pill alt a3 r3" style={{"background":"rgba(30,5,70,.45)","color":"#fff"} as React.CSSProperties}></span></div>
<h2 className="name"><span className="nmi n3">{t("peak3")}</span></h2>
<p className="location-subtitle">{t("subtitle3")}</p>
<p className="lead">{t("lead3")}</p>
</section>
<aside className="card show k3"><ul>
<li><b>{t("card31")}</b><span>{t("card31Text")}</span></li>
<li><b>{t("card32")}</b><span>{t("card32Text")}</span></li>
<li><b>{t("card33")}</b><span>{t("card33Text")}</span></li>
</ul></aside>
<section className="place show r4" style={{"left":"6vw","top":"112px","width":"min(920px,88vw)","zIndex":"12"} as React.CSSProperties}>
<div style={{"display":"flex","flexWrap":"wrap","gap":"10px"} as React.CSSProperties}><span className="pill" style={{"background":"#fff","color":"#0A0E50"} as React.CSSProperties}>{t("phase4")}</span><span className="pill alt a4 r4" style={{"background":"rgba(0,0,40,.5)","color":"#fff"} as React.CSSProperties}></span></div>
<h2 className="name"><span className="nmi n4">{t("peak4")}</span></h2>
<p className="location-subtitle">{t("subtitle4")}</p>
<p className="lead">{t("lead4")}</p>
</section>
<aside className="card show k4"><ul>
<li><b>{t("card41")}</b><span>{t("card41Text")}</span></li>
<li><b>{t("card42")}</b><span>{t("card42Text")}</span></li>
<li><b>{t("phase4")}</b><span>{t("card43Text")}</span></li>
</ul></aside>
<section className="final fn" style={{"left":"6vw","top":"112px","width":"min(920px,88vw)","zIndex":"12"} as React.CSSProperties}>
<h2 className="name final-heading" style={{"marginTop":"0"} as React.CSSProperties}>{t("finalTitle")}</h2>
<p className="lead">{t("finalDescription")}</p>
<div style={{"marginTop":"28px"} as React.CSSProperties}><a className="cta" href="#book" style={{"background":"#FFE14D"} as React.CSSProperties} data-journey-action="goBook">{t("finalBook")}</a></div>
</section>
    </>
  );
}
