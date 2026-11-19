import type * as React from 'react';
import {useTranslations} from 'next-intl';
import {JourneyBookingForm} from './booking/JourneyBookingForm';
export function BookingSection() {
  const t = useTranslations('Journey');
  return (
    <>
<section className="book" id="book">
<div aria-hidden="true" className="sunrise"><div className="sunrays"></div></div>
<svg aria-hidden="true" preserveAspectRatio="none" style={{"position":"absolute","left":"0","right":"0","bottom":"-1px","width":"100%","height":"160px","zIndex":"2","display":"block"} as React.CSSProperties} viewBox="0 0 1600 160"><path d="M0,160 L0,61 L145,103 L274,34 L399,120 L509,71 L594,122 L736,60 L797,111 L890,70 L982,121 L1122,41 L1184,123 L1267,42 L1340,111 L1509,41 L1578,125 L1600,90 L1600,160 Z" fill="#140B3A"></path></svg>
<div style={{"position":"relative","zIndex":"3","maxWidth":"1240px","margin":"0 auto","display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(420px,100%),1fr))","gap":"56px","alignItems":"start"} as React.CSSProperties}>
<div>
<h2 style={{"margin":"0 0 20px","font":"800 clamp(30px,4.4vw,64px)/1.05 Unbounded,Onest,system-ui,sans-serif","overflowWrap":"anywhere"} as React.CSSProperties}>{t("bookingTitle")}</h2>
<p style={{"margin":"0 0 36px","maxWidth":"460px","font":"400 20px/1.5 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingDescription")}</p>
<dl style={{"margin":"0","display":"flex","flexDirection":"column","gap":"14px","maxWidth":"460px"} as React.CSSProperties}>
<div style={{"display":"flex","justifyContent":"space-between","gap":"16px","paddingBottom":"14px","borderBottom":"1px solid rgba(255,255,255,.3)"} as React.CSSProperties}><dt style={{"font":"400 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingDuration")}</dt><dd style={{"margin":"0","font":"700 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingDurationUnknown")}</dd></div>
<div style={{"display":"flex","justifyContent":"space-between","gap":"16px","paddingBottom":"14px","borderBottom":"1px solid rgba(255,255,255,.3)"} as React.CSSProperties}><dt style={{"font":"400 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingGroup")}</dt><dd style={{"margin":"0","font":"700 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingGroupUnknown")}</dd></div>
<div style={{"display":"flex","justifyContent":"space-between","gap":"16px","paddingBottom":"14px","borderBottom":"1px solid rgba(255,255,255,.3)"} as React.CSSProperties}><dt style={{"font":"400 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingPrice")}</dt><dd style={{"margin":"0","font":"700 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>{t("bookingPriceUnknown")}</dd></div>
</dl>
</div>
<div style={{"boxSizing":"border-box","background":"#fff","color":"#1B0B5A","borderRadius":"28px","padding":"36px","boxShadow":"0 30px 80px rgba(20,8,70,.35)"} as React.CSSProperties}>
<JourneyBookingForm />
</div>
</div>
</section>

    </>
  );
}
