import {useId} from 'react';

export function LocationPreview({index}: {index:number}) {
  const id=useId().replace(/:/g,'');
  const colors=[
    ['#2B1B6B','#E5546B','#FFA23A'],
    ['#1E90F5','#C8F7FF','#C8F7FF'],
    ['#3A1590','#FF4F8B','#FF9A3A'],
    ['#060833','#2A2A9A','#2A2A9A'],
  ][index] ?? ['#060833','#2A2A9A','#2A2A9A'];
  return <svg aria-hidden="true" viewBox="0 0 143 130" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={colors[0]}/>{index!==1 && index!==3 && <stop offset=".6" stopColor={colors[1]}/>}<stop offset="1" stopColor={colors[index===1||index===3?1:2]}/>
    </linearGradient></defs>
    <rect width="143" height="130" fill={`url(#${id})`}/>
    {index===0 && <>
      <circle cx="84" cy="76" r="18" fill="#FFD25A"/>
      <path d="M0 130V98Q30 70 70 88T143 80V130Z" fill="#8A3A1C"/>
      <path d="M0 98Q30 70 70 88Q52 102 0 112Z" fill="#FF8A2A"/>
      <path d="M0 130V112Q40 94 80 104T143 98V130Z" fill="#3A2A18"/>
    </>}
    {index===1 && <>
      <path d="M0 84 L40 38 L70 68 L100 30 L143 80 V130 H0 Z" fill="#1C9C8E"/>
      <path d="M40 38 L0 84 L36 80 Z" fill="#A8F0C8"/>
      <path d="M100 30 L70 68 L96 62 Z" fill="#A8F0C8"/>
      <rect y="88" width="143" height="42" fill="#1AA6D8"/>
      <rect x="20" y="100" width="40" height="3" rx="1.5" fill="#fff" fillOpacity=".35"/>
      <rect x="70" y="112" width="52" height="3" rx="1.5" fill="#fff" fillOpacity=".35"/>
    </>}
    {index===2 && <>
      <circle cx="72" cy="84" r="22" fill="#FF5A2B"/>
      <path d="M0 88 L30 64 L60 84 L95 58 L143 88 V130 H0 Z" fill="#5C1D80"/>
      <rect y="94" width="143" height="36" fill="#C43C9C"/>
      <ellipse cx="72" cy="106" rx="22" ry="6" fill="#FF5A2B" fillOpacity=".7"/>
      <ellipse cx="72" cy="118" rx="14" ry="3" fill="#FF5A2B" fillOpacity=".5"/>
    </>}
    {index===3 && <>
      <g fill="#fff"><circle cx="20" cy="20" r="1.4"/><circle cx="48" cy="40" r="1"/><circle cx="70" cy="16" r="1.6"/><circle cx="128" cy="62" r="1.2"/><circle cx="30" cy="64" r="1.2"/><circle cx="90" cy="50" r="1"/></g>
      <circle cx="108" cy="30" r="12" fill="#F2F0FF"/>
      <path d="M0 130 V102 L46 58 L62 78 L82 50 L143 106 V130 Z" fill="#161C62"/>
      <path d="M46 58 L0 102 L40 96 Z" fill="#3446B0"/>
      <path d="M82 50 L62 78 L80 74 Z" fill="#3446B0"/>
    </>}
  </svg>;
}
