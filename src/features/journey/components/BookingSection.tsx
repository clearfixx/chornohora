import type * as React from 'react';
export function BookingSection() {
  return (
    <>
<section className="book" id="book">
<div aria-hidden="true" className="sunrise"><div className="sunrays"></div></div>
<svg aria-hidden="true" preserveAspectRatio="none" style={{"position":"absolute","left":"0","right":"0","bottom":"-1px","width":"100%","height":"160px","zIndex":"2","display":"block"} as React.CSSProperties} viewBox="0 0 1600 160"><path d="M0,160 L0,61 L145,103 L274,34 L399,120 L509,71 L594,122 L736,60 L797,111 L890,70 L982,121 L1122,41 L1184,123 L1267,42 L1340,111 L1509,41 L1578,125 L1600,90 L1600,160 Z" fill="#140B3A"></path></svg>
<div style={{"position":"relative","zIndex":"3","maxWidth":"1240px","margin":"0 auto","display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(420px,100%),1fr))","gap":"56px","alignItems":"start"} as React.CSSProperties}>
<div>
<h2 style={{"margin":"0 0 20px","font":"800 clamp(30px,4.4vw,64px)/1.05 Unbounded,Onest,system-ui,sans-serif","overflowWrap":"anywhere"} as React.CSSProperties}>Забронюйте місце на гребені</h2>
<p style={{"margin":"0 0 36px","maxWidth":"460px","font":"400 20px/1.5 Onest,system-ui,sans-serif"} as React.CSSProperties}>Залиште заявку. Ми зв&apos;яжемося, уточнимо дати й відповімо на всі запитання.</p>
<dl style={{"margin":"0","display":"flex","flexDirection":"column","gap":"14px","maxWidth":"460px"} as React.CSSProperties}>
<div style={{"display":"flex","justifyContent":"space-between","gap":"16px","paddingBottom":"14px","borderBottom":"1px solid rgba(255,255,255,.3)"} as React.CSSProperties}><dt style={{"font":"400 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>Тривалість</dt><dd style={{"margin":"0","font":"700 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>[КІЛЬКІСТЬ ДНІВ]</dd></div>
<div style={{"display":"flex","justifyContent":"space-between","gap":"16px","paddingBottom":"14px","borderBottom":"1px solid rgba(255,255,255,.3)"} as React.CSSProperties}><dt style={{"font":"400 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>Група</dt><dd style={{"margin":"0","font":"700 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>[РОЗМІР ГРУПИ]</dd></div>
<div style={{"display":"flex","justifyContent":"space-between","gap":"16px","paddingBottom":"14px","borderBottom":"1px solid rgba(255,255,255,.3)"} as React.CSSProperties}><dt style={{"font":"400 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>Вартість</dt><dd style={{"margin":"0","font":"700 18px/1.3 Onest,system-ui,sans-serif"} as React.CSSProperties}>[ЦІНА]</dd></div>
</dl>
</div>
<div style={{"boxSizing":"border-box","background":"#fff","color":"#1B0B5A","borderRadius":"28px","padding":"36px","boxShadow":"0 30px 80px rgba(20,8,70,.35)"} as React.CSSProperties}>
<form style={{"display":"flex","flexDirection":"column","gap":"18px"} as React.CSSProperties}>
<div className="fld"><label htmlFor="f-name">Ім&apos;я</label><input autoComplete="name" id="f-name" name="name" placeholder="Як до вас звертатися" required={true} type="text"/></div>
<div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(200px,100%),1fr))","gap":"18px"} as React.CSSProperties}>
<div className="fld"><label htmlFor="f-tel">Телефон</label><input autoComplete="tel" id="f-tel" name="tel" placeholder="+380" required={true} type="tel"/></div>
<div className="fld"><label htmlFor="f-mail">Пошта</label><input autoComplete="email" id="f-mail" name="email" placeholder="name@mail.com" type="email"/></div>
</div>
<div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(min(200px,100%),1fr))","gap":"18px"} as React.CSSProperties}>
<div className="fld"><label htmlFor="f-date">Дата виходу</label><input id="f-date" name="date" required={true} type="date"/></div>
<div className="fld"><label htmlFor="f-n">Скільки людей</label><input id="f-n" max="12" min="1" name="people" required={true} type="number" defaultValue="2"/></div>
</div>
<div className="fld"><label htmlFor="f-msg">Коментар</label><textarea id="f-msg" name="message" placeholder="Досвід походів, побажання, запитання"></textarea></div>
<label className="chk"><input name="consent" required={true} type="checkbox"/><span>Погоджуюсь на обробку персональних даних</span></label>
<button className="cta" style={{"width":"100%","justifyContent":"center","border":"0","cursor":"pointer","background":"#FFE14D"} as React.CSSProperties} type="submit">Забронювати місце</button>
<p style={{"margin":"0","font":"400 14px/1.4 Onest,system-ui,sans-serif","color":"#4A3E80"} as React.CSSProperties}>Ми відповімо протягом [ЧАС ВІДПОВІДІ].</p>
</form>
<div style={{"display":"flex","flexDirection":"column","alignItems":"flex-start","gap":"16px","padding":"24px 0"} as React.CSSProperties}>
<h3 style={{"margin":"0","font":"800 clamp(26px,3vw,38px)/1.1 Unbounded,Onest,system-ui,sans-serif"} as React.CSSProperties}>Заявку надіслано</h3>
<p style={{"margin":"0","font":"400 18px/1.5 Onest,system-ui,sans-serif"} as React.CSSProperties}>Ми зв&apos;яжемося з вами протягом [ЧАС ВІДПОВІДІ], щоб уточнити дати й деталі походу.</p>
<button className="cta" style={{"border":"0","cursor":"pointer","background":"#EFEAFF"} as React.CSSProperties} type="button">Надіслати ще одну заявку</button>
</div>
</div>
</div>
</section>

    </>
  );
}
