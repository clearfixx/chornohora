'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {isPlausiblePhoneNumber, isValidFutureOrTodayDate, localISODate} from '@/features/journey/booking/validation';
import {useTranslations} from 'next-intl';

type RequestDraft = {
  name: string;
  phone: string;
  email: string;
  date: string;
  people: string;
  message: string;
};

export function JourneyBookingForm() {
  const t = useTranslations('Journey');
  const formRef = useRef<HTMLFormElement>(null);
  const previewTitleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusToForm = useRef(false);
  const [draft, setDraft] = useState<RequestDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<RequestDraft | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    // Set a browser-local minimum after hydration; no server/client date
    // mismatch, nor a state update just to configure a native input.
    const input = formRef.current?.querySelector<HTMLInputElement>('input[name="date"]');
    if (input) input.min = localISODate();
  }, [draft]);
  useEffect(() => {
    if (draft) {
      previewTitleRef.current?.focus({preventScroll: true});
    } else if (returnFocusToForm.current) {
      returnFocusToForm.current = false;
      formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({preventScroll: true});
    }
  }, [draft]);

  const returnToForm = (fresh: boolean) => {
    returnFocusToForm.current = true;
    if (fresh) setSavedDraft(null);
    setCopyState('idle');
    setDraft(null);
  };

  const onPrepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const get = (name: string) => String(values.get(name) ?? '').trim();
    const nextDraft = {
      name: get('name'), phone: get('tel'), email: get('email'),
      date: get('date'), people: get('people'), message: get('message'),
    };
    if (!isPlausiblePhoneNumber(nextDraft.phone)) {
      const phoneInput = form.elements.namedItem('tel') as HTMLInputElement | null;
      phoneInput?.setCustomValidity(t('bookingPhoneInvalid'));
      phoneInput?.reportValidity();
      return;
    }
    if (!isValidFutureOrTodayDate(nextDraft.date)) {
      const dateInput = form.elements.namedItem('date') as HTMLInputElement | null;
      dateInput?.setCustomValidity(t('bookingDatePast'));
      dateInput?.reportValidity();
      return;
    }
    setSavedDraft(nextDraft);
    setDraft(nextDraft);
    setCopyState('idle');
  };
  const summary = draft ? [
    t('bookingSummary'),
    t('bookingName') + ': ' + draft.name,
    t('bookingPhone') + ': ' + draft.phone,
    draft.email ? t('bookingEmail') + ': ' + draft.email : '',
    t('bookingDate') + ': ' + draft.date,
    t('bookingPeople') + ': ' + draft.people,
    draft.message ? t('bookingMessage') + ': ' + draft.message : '',
  ].filter(Boolean).join('\n') : '';

  const copySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };


  if (draft) return (
    <div className="journey-booking-preview" aria-live="polite">
      <h3 tabIndex={-1} ref={previewTitleRef}>{t('bookingPreviewTitle')}</h3>
      <p>{t('bookingPreviewNotice')}</p>
      <label className="journey-booking-summary-label" htmlFor="journey-booking-summary">{t('bookingSummary')}</label>
      <textarea id="journey-booking-summary" readOnly value={summary} rows={7}/>
      <p role="status" aria-live="polite">
        {copyState === 'copied' ? t('bookingCopied') :
          copyState === 'error' ? t('bookingCopyFail') : t('bookingNeedsBackend')}
      </p>
      <div className="journey-booking-actions">
        <button type="button" className="cta" onClick={copySummary}>{t('bookingCopy')}</button>
        <button type="button" className="journey-booking-secondary" onClick={() => returnToForm(false)}>{t('bookingEdit')}</button>
        <button type="button" className="journey-booking-secondary" onClick={() => returnToForm(true)}>{t('bookingReset')}</button>
      </div>
    </div>
  );

  return <form ref={formRef} onSubmit={onPrepare} style={{display:'flex',flexDirection:'column',gap:'18px'}}>
    <div className="fld"><label htmlFor="f-name">{t('bookingName')}</label><input autoComplete="name" id="f-name" name="name" defaultValue={savedDraft?.name} placeholder={t('bookingNamePlaceholder')} required type="text" maxLength={120}/></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))',gap:'18px'}}>
      <div className="fld"><label htmlFor="f-tel">{t('bookingPhone')}</label><input autoComplete="tel" id="f-tel" name="tel" defaultValue={savedDraft?.phone} placeholder="+380" onInput={event => event.currentTarget.setCustomValidity('')} required type="tel" inputMode="tel" maxLength={40}/></div>
      <div className="fld"><label htmlFor="f-mail">{t('bookingEmail')}</label><input autoComplete="email" id="f-mail" name="email" defaultValue={savedDraft?.email} placeholder="name@mail.com" type="email" maxLength={254}/></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))',gap:'18px'}}>
      <div className="fld"><label htmlFor="f-date">{t('bookingDate')}</label><input id="f-date" name="date" defaultValue={savedDraft?.date} onFocus={event => { event.currentTarget.min = localISODate(); }} onChange={event => event.currentTarget.setCustomValidity("")} required type="date"/></div>
      <div className="fld"><label htmlFor="f-n">{t('bookingPeople')}</label><input id="f-n" max="12" min="1" name="people" required type="number" defaultValue={savedDraft?.people ?? "2"}/></div>
    </div>
    <div className="fld"><label htmlFor="f-msg">{t('bookingMessage')}</label><textarea id="f-msg" name="message" defaultValue={savedDraft?.message} maxLength={2000} placeholder={t('bookingMessagePlaceholder')}/></div>
    <button className="cta" style={{width:'100%',justifyContent:'center',border:'0',cursor:'pointer',background:'#FFE14D'}} type="submit">{t('bookingPrepare')}</button>
    <p style={{margin:0,font:'400 14px/1.4 Onest,system-ui,sans-serif',color:'#4A3E80'}}>{t('bookingResponseUnknown')}</p>
    <p style={{margin:0,font:'400 13px/1.4 Onest,system-ui,sans-serif',color:'#4A3E80'}}>{t('bookingPreviewNotice')}</p>
  </form>;
}
