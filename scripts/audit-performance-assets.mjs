// Read-only file-size audit of the shipped source assets and Next.js output.
import {existsSync,readdirSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,relative,extname} from 'node:path';
const root=process.cwd();
const roots=['public','.next/static'];
const groups={'.js':'javascript','.css':'css','.svg':'svg','.woff':'font','.woff2':'font',
  '.png':'image','.jpg':'image','.jpeg':'image','.webp':'image','.avif':'image','.gif':'image'};
const files=[],totals={};
const scan=(base,current)=>{
  if(!existsSync(current))return;
  for(const entry of readdirSync(current,{withFileTypes:true})){
    if(entry.isSymbolicLink())continue;
    const full=join(current,entry.name);
    if(entry.isDirectory())scan(base,full);
    else if(entry.isFile()){
      const stat=statSync(full),ext=extname(full).toLowerCase(),kind=groups[ext]||'other';
      const bytes=stat.size;
      files.push({path:relative(root,full).replaceAll('\\','/'),kind,bytes});
      const key=relative(root,base).replaceAll('\\','/');
      const sum=totals[key]||(totals[key]={totalBytes:0,byType:{}});
      sum.totalBytes+=bytes;sum.byType[kind]=(sum.byType[kind]||0)+bytes;
    }
  }
};
for(const base of roots)scan(base,join(root,base));
files.sort((a,b)=>b.bytes-a.bytes);
const report={schema:1,generatedAt:new Date().toISOString(),roots,filesScanned:files.length,
  totals,largest:files.slice(0,30),
  note:'On-disk uncompressed file sizes, not compressed transfer bytes or the browser actual requested bundle. Fonts and images may have multiple variants.'};
mkdirSync('artifacts/performance',{recursive:true});
writeFileSync('artifacts/performance/assets.json',JSON.stringify(report,null,2)+'\n');
console.log('ASSETS '+JSON.stringify({files:report.filesScanned,totals,largest:report.largest.slice(0,12)}));
console.log('Wrote artifacts/performance/assets.json');
