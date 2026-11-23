import {getLocale} from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  const english = locale === 'en';
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', background: '#140a32', color: '#fff6e8',
      textAlign: 'center', fontFamily: 'Onest, system-ui, sans-serif',
    }}>
      <section style={{maxWidth: 600}}>
        <p style={{letterSpacing: '0.25em', color: '#ffbf83', fontSize: 14}}>CHORNOHORA · 404</p>
        <h1 style={{fontSize: 'clamp(36px, 7vw, 66px)', lineHeight: 1.08, margin: '20px 0'}}>
          {english ? 'Trail not found' : 'Стежку не знайдено'}
        </h1>
        <p style={{fontSize: 18, lineHeight: 1.6, color: '#d6c4f0', marginBottom: 36}}>
          {english ? 'This page is not part of our route. Return to the beginning of the journey.' :
            'Цієї сторінки немає на нашому маршруті. Поверніться до початку подорожі.'}
        </p>
        <a href={english ? '/en' : '/uk'} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 50, padding: '0 28px', borderRadius: 999,
          textDecoration: 'none', background: '#ffe14d', color: '#140a32', fontWeight: 700,
        }}>
          {english ? 'Back to the journey' : 'До початку подорожі'}
        </a>
      </section>
    </main>
  );
}
