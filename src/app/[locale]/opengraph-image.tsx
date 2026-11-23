import {ImageResponse} from 'next/og';

export const runtime = 'nodejs';
export const alt = 'CHORNOHORA — FOUR SKIES, a journey across the Carpathian mountains';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default async function OpenGraphImage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const english = locale === 'en';
  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', background: '#140a32', color: '#fff6e8',
      padding: '70px 76px', fontFamily: 'sans-serif', position: 'relative',
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <svg width="112" height="72" viewBox="0 0 112 72">
          <path d="M3 65 L32 40 L45 47 L73 5 L99 42 L109 65 L75 30 L47 62 L30 52 Z" fill="#fe8d4a"/>
          <path d="M44 47 L59 32 L72 38 L73 25 L88 42 L72 36 L56 57 Z" fill="#ffbf83"/>
        </svg>
        <span style={{fontSize: 22, letterSpacing: 7, color: '#ffbf83'}}>CHORNOHORA</span>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        <span style={{color: '#ffe14d', fontSize: 24, letterSpacing: 6}}>
          {english ? 'ONE JOURNEY · FOUR SKIES' : 'FOUR SKIES · ONE JOURNEY'}
        </span>
        <span style={{fontSize: 76, fontWeight: 800, letterSpacing: -3, lineHeight: 1.07}}>
          {english ? 'From sunrise' : 'A journey from'}<br/>
          {english ? 'to the stars.' : 'dawn to stars.'}
        </span>
      </div>
      <span style={{fontSize: 23, color: '#d6c4f0'}}>CARPATHIAN MOUNTAINS · UKRAINE</span>
    </div>,
    size,
  );
}
