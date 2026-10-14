/* =====================================================================
   ALBUM KENANGAN — script.js
   ===================================================================== */
(()=>{
'use strict';

/* ---------- utilitas ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ST=(k,v)=>{try{return v===undefined?localStorage.getItem('ak-'+k):localStorage.setItem('ak-'+k,v)}catch(e){return null}};
const R=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2600)};

/* =====================================================================
   DATA ALBUM
   l/r  : gambar latar halaman kiri/kanan (nama class .i-xxx di style.css)
   pf   : gambar bawaan bingkai profil bulat
   lcls/rcls : class animasi tambahan untuk latar
   pop  : album bertema pop-up book (tanpa bingkai profil)
   ===================================================================== */
const ALB=[
 {id:'ibra', name:'Ibra', t:'t-ibra', pf:null, cap:'Seluas galaksi, sehening malam',
  st:'Ada yang diam-diam jadi pusat gravitasi di antara kita. Tulis cerita tentang Ibra di sini: tatapan, kebiasaan, atau obrolan larut malam.'},
 {id:'dzio', name:'Dzio', t:'t-dzio', l:'dzio', r:'dzio', lf:'i-dzio-f', tint:'blue', pf:{img:'dzio',pos:'50% 35%'}, cap:'Tak ada keraguan di lapangan',
  st:'Setiap lemparan ada ceritanya. Tulis tentang Dzio di sini: pertandingan, tawa di pinggir lapangan, atau tembakan terakhir.'},
 {id:'faris', name:'Faris', t:'t-faris', l:'faris', r:'faris2', tint:'rose', pf:{img:'faris',pos:'45% 14%'}, cap:'Green flag yang bikin tenang',
  st:'Hangat, teduh, dan selalu ada. Tulis tentang Faris di sini: hal-hal kecil manis yang membuat harimu lebih ringan.'},
 {id:'radit', name:'Radit', t:'t-radit', l:'radit', r:'radit', lf:'i-radit-f', pf:{img:'radit',pos:'50% 55%'}, cap:'Gas pelan, tujuan jelas',
  st:'Deru XSR di ujung jalan selalu jadi tanda ia datang. Tulis tentang Radit di sini: touring, bengkel, dan jalanan malam.'},
 {id:'rama', name:'Rama', t:'t-rama', l:'rama', r:'rama', pf:{img:'rama',pos:'50% 30%'}, cap:'Merah yang tak bisa diabaikan',
  st:'Dingin di luar, menyala di dalam. Tulis tentang Rama di sini: sisi tegasnya, dunia animenya, dan momen yang tak terduga.'},
 {id:'abi', name:'Abi', t:'t-abi', l:'abi', r:'abi', tint:'navy', pf:{img:'abi',pos:'25% 48%'}, cap:'Petikan gitar di bawah langit navy',
  st:'Nada, bunga, dan malam yang biru. Tulis tentang Abi di sini: lagu favorit, petikan pertama, atau sore yang tenang.'},
 {id:'hana', name:'Hana', t:'t-hana', l:'hanabg', r:'hanabg2', rsoft:1, lcls:'swim wob', rcls:'vortex', pf:{img:'hana',pos:'50% 30%'}, cap:'Samudra tenang, angin biru, dan kucing putih',
  st:'Setenang laut dalam, selembut kucing putih. Tulis tentang Hana di sini: ombak, angin, dan hal yang bikin ia tersenyum.'},
 {id:'nura', name:'Nura', t:'t-nura', l:'nura', r:'nura', pf:{img:'nura',pos:'50% 30%'}, cap:'Manis, hangat, dan beraroma cokelat',
  st:'Dapur kecil penuh kue dan tawa. Tulis tentang Nura di sini: resep favorit, restoran langganan, dan rasa yang tak terlupa.'},
 {id:'yara', name:'Yara', t:'t-yara', l:'yara', r:'yara', pf:{img:'yara',pos:'50% 50%'}, cap:'Lampu kota Jakarta yang tak pernah tidur',
  st:'Malam, jalan layang, dan lampu yang berkedip. Tulis tentang Yara di sini: perjalanan pulang dan obrolan di atas kota.'},
 {id:'silpi', name:'Silpi', t:'t-silpi', l:'silpi', r:'silpi', tint:'violet', pf:{img:'silpi',pos:'50% 55%'}, cap:'Seribu kupu-kupu ungu di malam hari',
  st:'Percaya pada mimpi, percaya pada keajaiban kecil. Tulis tentang Silpi di sini: harapan, cahaya, dan hal yang membuatnya terbang.'},
 {id:'jeje', name:'Jeje', t:'t-jeje', l:'jeje', r:'jeje', lcls:'vortex', rcls:'vortex', pf:{img:'jeje',pos:'50% 50%'}, cap:'Berenang bersama pusaran biru',
  st:'Dalam, biru, dan penuh kejutan. Tulis tentang Jeje di sini: petualangan, laut, dan cerita yang mengalir seperti arus.'},
 {id:'foto', name:'Foto Bersama', pop:'foto', cap:'Semua warna, satu cerita',
  st:'Kita semua dalam satu bingkai. Nyalakan fotonya, dan lihat kenangan menyala di atas buku.'},
 {id:'video', name:'Video Bersama', pop:'video', cap:'Gerak yang menyimpan suara',
  st:'Putar ulang tawa kita. Nyalakan videonya, dan biarkan hologramnya bercerita.'}
];

/* =====================================================================
   PENYIMPANAN FOTO/VIDEO (IndexedDB, cadangan: memori)
   ===================================================================== */
const mem=new Map();
const dbp=new Promise(res=>{try{const r=indexedDB.open('album-kenangan',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('m');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}});
const tx=async(mode,fn)=>{const db=await dbp;if(!db)return null;
  return new Promise(res=>{try{const t=db.transaction('m',mode);const rq=fn(t.objectStore('m'));
  t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>res(null)}catch(e){res(null)}})};
const dbGet=async k=>{const v=await tx('readonly',s=>s.get(k));return v??mem.get(k)??null};
const dbSet=async(k,v)=>{mem.set(k,v);await tx('readwrite',s=>s.put(v,k))};
const dbDel=async k=>{mem.delete(k);await tx('readwrite',s=>s.delete(k))};

/* =====================================================================
   GENERATOR ANIMASI LATAR
   ===================================================================== */
function P(n,cls,o={}){
  let s='';
  for(let i=0;i<n;i++){
    const t=R(...(o.dur||[8,16])),sz=R(...(o.size||[.4,1]));
    s+=`<i class="p ${cls}" style="--x:${R(0,100).toFixed(1)}%;--s:${sz.toFixed(2)}em;--t:${t.toFixed(1)}s;--d:${(-R(0,t)).toFixed(1)}s;--w:${R(3,6).toFixed(1)}s;--dx:${R(-3,3).toFixed(1)}em;--rot:${Math.round(R(-720,720))}deg;--o:${R(.55,1).toFixed(2)};${o.st?o.st(i):''}">${o.h?o.h(i):''}</i>`;
  }
  return s;
}
const Y=(a,b)=>()=>`--y:${R(a,b).toFixed(1)}%`;
const waves=()=>['w3','w2','w1'].map(c=>`<svg class="wave ${c}" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 60Q150 0 300 60T600 60T900 60T1200 60V120H0Z"/></svg>`).join('');
const whale=(y,w,t,d,c)=>`<svg class="whale" style="--y:${y};--w:${w};--t:${t}s;--d:${d}s;${c?`--c:${c}`:''}" viewBox="0 0 220 90"><g transform="translate(220 0) scale(-1 1)"><path d="M8 46C30 14 120 6 168 38C182 30 198 22 214 8C212 30 202 44 190 52C202 58 212 70 216 84C196 74 182 64 166 56C130 82 40 80 8 46Z"/><path d="M92 62C100 76 112 84 126 86C120 76 114 68 112 60Z"/><circle cx="34" cy="44" r="2.2" class="eye"/></g></svg>`;
const bird=(y,t,d)=>`<svg class="bird" style="--y:${y};--t:${t}s;--d:${d}s" viewBox="0 0 40 24"><path d="M20 12C14 2 6 0 0 4C8 6 14 10 20 14Z"/><path d="M20 12C26 2 34 0 40 4C32 6 26 10 20 14Z"/><ellipse cx="20" cy="14" rx="4" ry="3"/></svg>`;
const school=(y,t,d)=>{let u='';for(let i=0;i<9;i++)u+=`<use href="#fish" x="${((i%3)*16+R(-3,3)).toFixed(1)}" y="${(Math.floor(i/3)*12+R(-2,2)).toFixed(1)}" width="12" height="7"/>`;
  return `<svg class="school" style="--y:${y};--t:${t}s;--d:${d}s" viewBox="0 0 60 40">${u}</svg>`};
const shark=(r,sz,t,d,rev)=>`<div class="orbit${rev?' rev':''}" style="--t:${t}s;--d:${d}s"><svg class="sk" viewBox="0 0 120 48" style="--r:${r}em;--sz:${sz}em"><use href="#shark"/></svg></div>`;
const wire=(x1,y1,x2,y2)=>{let b='';for(let i=1;i<9;i++){const x=x1+(x2-x1)*i/9,y=y1+(y2-y1)*i/9;b+=`<path d="M${x-1.6} ${y-2}L${x+1.6} ${y+2}M${x-1.6} ${y+2}L${x+1.6} ${y-2}"/>`}
  return `<svg class="wire" viewBox="0 0 100 140" preserveAspectRatio="none"><path d="M${x1} ${y1}L${x2} ${y2}"/>${b}</svg>`};
const bfly=(x,y,s,t)=>{const v=()=>R(-9,9).toFixed(1)+'em';return `<div class="bfly" style="--x:${x}%;--y:${y}%;--s:${s}em;--t:${t}s;--d:${(-R(0,t)).toFixed(1)}s;--ax:${v()};--ay:${v()};--bx:${v()};--by:${v()};--cx:${v()};--cy:${v()}"><i class="l"></i><i class="r"></i></div>`};
const bikeSvg=`<svg class="bike" viewBox="0 0 160 80"><path d="M40 38L62 22L92 20L108 30L124 40L120 46L60 46Z"/><path d="M20 36L44 32L50 40L24 44Z" style="fill:#aaa"/><path d="M96 22L108 14L112 21Z"/><path d="M112 32L130 56M50 46L30 56" style="stroke:#eee;stroke-width:4;fill:none"/><g class="wh"><circle class="tire" cx="30" cy="56" r="18"/><path class="sp" d="M12 56H48M30 38V74"/></g><g class="wh"><circle class="tire" cx="130" cy="56" r="18"/><path class="sp" d="M112 56H148M130 38V74"/></g></svg>`;
const hoop='<div class="hoop"><i class="bb"></i><i class="sq"></i><i class="rim"></i><i class="shotball"></i><i class="net"></i></div>';
const flag='<div class="flag"><i class="pole"></i><i class="cloth"></i></div>';
const mcircle='<svg class="mc" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="38" stroke-dasharray="1.5 2"/><circle cx="50" cy="50" r="27"/><path d="M50 8L58 40L92 50L58 60L50 92L42 60L8 50L42 40Z"/></svg>';

/* animasi per album: s = 'l' (halaman kiri) atau 'r' (halaman kanan) */
const FXG={
 ibra:s=>`<i class="gal" style="top:${s==='l'?'38%':'82%'}"></i><i class="gcore" style="top:${s==='l'?'38%':'82%'}"></i>`
   +P(s==='l'?70:50,'star',{size:[.12,.34],dur:[2,6],st:Y(0,100)})
   +`<i class="shoot" style="--x:8%;--y:12%;--d:-1s"></i><i class="shoot" style="--x:40%;--y:28%;--d:-3.6s"></i><i class="shoot" style="--x:2%;--y:50%;--d:-5s"></i>`
   +(s==='l'?'<i class="planet"></i>':''),
 dzio:s=>`<i class="beam" style="left:4%;--d:0s"></i><i class="beam" style="left:58%;--d:-3s"></i>`+(s==='l'?hoop:'')
   +`<i class="ball" style="--x:8%;--s:3.4em;--t:1.7s;--d:0s;--h:-.34"></i><i class="ball" style="--x:46%;--s:2.6em;--t:1.3s;--d:-.6s;--h:-.26"></i><i class="ball" style="--x:80%;--s:4em;--t:2.1s;--d:-1s;--h:-.44"></i>`,
 faris:s=>P(14,'grn dn',{size:[.9,1.6],dur:[9,16]})+P(12,'petal dn',{size:[.7,1.2],dur:[10,18]})
   +P(10,'heart g up',{size:[.5,1],dur:[8,15],h:()=>'♥'})+P(16,'fire',{size:[.2,.4],dur:[3,6],st:Y(30,100)})+(s==='l'?flag:''),
 radit:s=>P(s==='l'?18:12,'streak',{dur:[.9,2.6],size:[1,1],st:()=>`--y:${R(4,92).toFixed(1)}%;--w:${R(6,18).toFixed(1)}em;left:-30%`}).replace(/class="p streak"/g,'class="streak"')
   +'<i class="scan"></i>'+(s==='l'?bikeSvg+'<i class="road"></i>':''),
 rama:s=>'<i class="beat"></i>'+wire(-5,20,105,95)+wire(105,10,-5,70)
   +P(26,'ember up',{size:[.18,.5],dur:[5,11]})+P(14,'ash dn',{size:[.12,.3],dur:[9,18]})+(s==='r'?mcircle:''),
 abi:s=>P(14,'npetal dn',{size:[.6,1.1],dur:[9,17]})+P(11,'note g up',{size:[.5,.9],dur:[8,15],h:()=>pick(['♪','♫','♬','♩'])})
   +(s==='l'?'<i class="vinyl"></i><div class="strings">'+[1,1.2,1.5,1.9,2.4,3].map((th,i)=>`<i style="--th:${th}px;--t:${(.09+i*.012).toFixed(3)}s"></i>`).join('')+'</div>':''),
 hana:s=>'<i class="rays"></i>'+P(s==='l'?16:12,'bub up',{size:[.3,.9],dur:[7,14]})
   +`<i class="wind" style="--y:14%;--w:14em;--t:7s;--d:-2s"></i><i class="wind" style="--y:26%;--w:9em;--t:5.5s;--d:-4s"></i><i class="wind" style="--y:40%;--w:12em;--t:8s;--d:-1s"></i>`
   +(s==='l'
      ? whale('58%','22em',66,-24,'rgba(3,22,70,.5)')+whale('14%','9em',42,-10,'rgba(3,22,70,.4)')+school('34%',46,-6)+school('76%',60,-30)
      : shark(9,6.5,18,0)+shark(13,5,26,-9)+shark(16,4,34,-20,true)+shark(6,4.5,14,-5,true)+school('80%',52,-18))
   +bird('6%',16,-3)+bird('13%',22,-11)+waves(),
 nura:s=>P(8,'steam up',{size:[1,1],dur:[6,11],st:()=>'bottom:-12%'})+P(18,'chip dn',{size:[.3,.6],dur:[8,15]})
   +P(7,'em g',{size:[.6,1],dur:[4,8],h:()=>pick(['🍰','🍪','☕','🧁','🍩','🥐','🍫']),st:Y(8,86)})
   +(s==='l'?'<div class="sign"><b>OPEN ☕</b></div>':''),
 yara:s=>P(40,'star',{size:[.1,.26],dur:[2,5],st:Y(0,24)})+P(34,'win',{size:[.2,.34],dur:[1.5,5],st:Y(30,74)})
   +Array.from({length:12},(_,i)=>`<i class="trail ${i%2?'rd':'wh'}" style="--y:${R(66,95).toFixed(1)}%;--w:${R(4,10).toFixed(1)}em;--t:${R(2.5,6).toFixed(1)}s;--d:${(-R(0,6)).toFixed(1)}s"></i>`).join('')
   +`<i class="neon" style="--x:38%;--y:15%;--d:0s"></i><i class="neon" style="--x:68%;--y:34%;--d:-1.3s"></i><i class="plane"></i>`,
 silpi:s=>(s==='l'?[[10,22,4.4,9],[62,14,5.2,11],[34,52,4,8],[70,62,4.8,12],[8,70,3.6,10],[52,34,3.2,7]]:[[12,12,3.4,10],[70,22,3.8,9],[30,74,4,12],[76,70,3.2,8]]).map(a=>bfly(...a)).join('')
   +P(22,'spark',{size:[.35,.8],dur:[2,5],st:Y(0,100)})+P(10,'orb up',{size:[.5,1.4],dur:[10,18]}),
 jeje:s=>'<i class="glowc"></i><i class="rays"></i>'+P(s==='l'?16:12,'bub up',{size:[.3,1],dur:[7,15]})+P(24,'plank',{size:[.14,.3],dur:[3,6],st:Y(0,100)})
   +whale(s==='l'?'24%':'66%','22em',s==='l'?60:70,s==='l'?-20:-40,'rgba(2,10,34,.8)')
};

/* ---------- hiasan pop-up book ---------- */
function bunting(){
  const cols=['#b5533c','#d9a441','#5f8a8b','#8a5a8c','#6e8b3d'];let f='';
  for(let i=0;i<9;i++){const t=(i+.5)/9,x=200*t,y=(1-t)*(1-t)*4+2*(1-t)*t*34+t*t*4;
    f+=`<path d="M${(x-8).toFixed(1)} ${y.toFixed(1)}L${(x+8).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y+17).toFixed(1)}Z" fill="${cols[i%5]}" stroke="#5a3216" stroke-width=".6"/>`}
  return `<svg class="bunting" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 4Q100 34 200 4" fill="none" stroke="#5a3216" stroke-width="1"/>${f}</svg>`;
}
const camSvg=`<svg class="popfig" viewBox="0 0 120 92"><rect x="8" y="26" width="104" height="58" rx="7" fill="#c9a56b" stroke="#5a3216" stroke-width="2"/><rect x="8" y="40" width="104" height="22" fill="#7a4e26" opacity=".55"/><rect x="38" y="13" width="30" height="15" rx="3" fill="#a98450" stroke="#5a3216" stroke-width="2"/><circle cx="60" cy="56" r="23" fill="#e9d9b0" stroke="#5a3216" stroke-width="2.5"/><circle cx="60" cy="56" r="16" fill="#3a2a1a" stroke="#8b5a2b" stroke-width="2"/><circle cx="60" cy="56" r="8" fill="#14202e"/><circle cx="55" cy="51" r="3" fill="#fff" opacity=".7"/><rect x="88" y="14" width="18" height="11" rx="2" fill="#f3e3b8" stroke="#5a3216" stroke-width="1.5"/><circle class="flash" cx="97" cy="19" r="14" fill="#fff6c8"/></svg>`;
const projSvg=`<svg class="popfig" viewBox="0 0 150 100"><g class="reel"><circle cx="38" cy="26" r="22" fill="#d9bf86" stroke="#5a3216" stroke-width="2.5"/><circle cx="38" cy="26" r="4" fill="#5a3216"/><path d="M38 6V46M18 26H58M24 12L52 40M52 12L24 40" stroke="#5a3216" stroke-width="2"/></g><g class="reel b"><circle cx="88" cy="26" r="22" fill="#d9bf86" stroke="#5a3216" stroke-width="2.5"/><circle cx="88" cy="26" r="4" fill="#5a3216"/><path d="M88 6V46M68 26H108M74 12L102 40M102 12L74 40" stroke="#5a3216" stroke-width="2"/></g><rect x="16" y="52" width="96" height="38" rx="6" fill="#a98450" stroke="#5a3216" stroke-width="2.5"/><rect x="26" y="62" width="36" height="14" fill="#7a4e26" opacity=".6"/><rect x="112" y="64" width="16" height="14" fill="#8b6a3a" stroke="#5a3216" stroke-width="2"/><polygon class="beam" points="128,64 150,52 150,92 128,78" fill="#fff0b8" opacity=".75"/></svg>`;

/* =====================================================================
   STATE BUKU & TATA LETAK
   ===================================================================== */
let extras={};try{extras=JSON.parse(ST('extras')||'{}')||{}}catch(e){extras={}}
let N=0,flipped=0,leaves=[],busy=[],castL=null,castR=null,LAY=[];
const pagesEl=$('#pages'),book=$('#book'),lbl=$('#lbl'),prevB=$('#prev'),nxtB=$('#nxt');
const urls={};                       // object URL tiap slot media
const MAXX=10;                       // maksimal halaman (lembar) tambahan per album

function layout(){
  const L=[{t:'cover'},{t:'intro'},{t:'toc'}];
  ALB.forEach((a,n)=>{L.push({t:'aL',a,n},{t:'aR',a,n});
    for(let e=1;e<=(extras[a.id]||0);e++)L.push({t:'xL',a,n,e},{t:'xR',a,n,e})});
  L.push({t:'outro'},{t:'end'},{t:'back'});
  return L;
}

/* ---------- potongan HTML ---------- */
const pn=i=>`<div class="pn">— ${i} —</div>`;
const rose=c=>`<svg class="deco ${c}"><use href="#rose"/></svg>`;
const edit=(k,def,cls)=>`<div class="${cls}" contenteditable="plaintext-only" spellcheck="false" data-k="${k}">${def}</div>`;
const slot=key=>`<div class="photo-card" data-slot="${key}"><div class="photo-img"><span class="ph">📷<small>Klik untuk upload</small></span></div>
  <button class="x" title="Hapus">✕</button><button class="sw" title="Ganti">⟳</button>
  <div class="photo-caption" contenteditable="plaintext-only" spellcheck="false" data-k="pc-${key}">Kenangan</div>
  <input type="file" accept="image/*,video/*" hidden></div>`;
const popSlot=(key,i)=>`<div class="photo-card pop-card" style="--i:${i}" data-slot="${key}"><i class="hinge"></i><i class="fold fl"></i><i class="fold fr"></i>
  <div class="photo-img"><span class="ph">📷<small>Klik untuk upload</small></span></div>
  <button class="pwr" title="Nyalakan / matikan hologram">⏻</button>
  <button class="x" title="Hapus">✕</button><button class="sw" title="Ganti">⟳</button>
  <div class="photo-caption" contenteditable="plaintext-only" spellcheck="false" data-k="pc-${key}">Kenangan</div>
  <input type="file" accept="image/*,video/*" hidden></div>`;
const VID='<video class="bgv" muted loop playsinline autoplay></video>';
const cover=(a,b)=>`<div class="spine"></div><div class="frame"></div><i class="cn tl">❦</i><i class="cn tr">❦</i><i class="cn bl">❦</i><i class="cn br">❦</i>
  <div class="plate"><div class="sub">${a}</div><h1>${b}</h1><div class="orn">✦ ❦ ✦</div><div class="sub">${a==='Koleksi'?'Vintage Scrapbook':'klik untuk menutup'}</div></div>${a==='Koleksi'?'<div class="open">— klik untuk membuka —</div>':''}`;

/* ---------- halaman album biasa ---------- */
function albLeft(a,n,i){
  const cls=`album ${a.t}`,tint=a.tint?`<i class="tint ${a.tint}"></i>`:'';
  const bg=a.l?`<div class="bgimg i-${a.l} ${a.lf||''} ${a.lcls||''}"></div>`:'';
  const pf=a.pf?`class="portrait i-${a.pf.img}" style="background-position:${a.pf.pos}"`:`class="portrait pf-gal" data-ini="${a.name[0]}"`;
  return {cls,html:`${bg}${VID}${tint}<i class="veil"></i><div class="fx">${FXG[a.id]('l')}</div>
    <div class="inner center"><div class="stamp">ALBUM ${n+1}</div><div ${pf} data-pf="${a.id}" title="Klik untuk mengganti foto profil"><input type="file" accept="image/*" hidden></div>
    <h2 class="ttl">${a.name}</h2><div class="orn">✦ ❦ ✦</div>
    ${edit('cap-'+a.id,a.cap,'cap')}${edit('st-'+a.id,a.st,'story glass')}${pn(i)}</div>
    <div class="bgctl" data-album="${a.id}"><button class="bgbtn" title="Pasang video latar">🎬</button><button class="bgrm" title="Hapus video latar">✕</button><input class="bgin" type="file" accept="video/*" hidden></div>`};
}
function albGrid(a,i,key,title){
  const cls=`album ${a.t}`,tint=a.rtint?`<i class="tint ${a.rtint}"></i>`:(a.tint?`<i class="tint ${a.tint}"></i>`:'');
  const bg=a.r?`<div class="bgimg ${a.rsoft?'soft':'blur'} i-${a.r} ${a.rcls||''}"></div>`:'';
  return {cls,html:`${bg}${VID}${tint}<i class="veil lt"></i><div class="fx">${FXG[a.id]('r')}</div>
    <div class="inner"><h3 class="mini">${title}</h3><div class="grid">${[0,1,2,3].map(k=>slot(key+'-'+k)).join('')}</div>${pn(i)}</div>`};
}

/* ---------- halaman pop-up book (Foto & Video Bersama) ---------- */
function popLeft(a,n,i){
  const foto=a.pop==='foto';
  return {cls:`paper pop ${foto?'':'vid'}`,html:`<i class="pbord"></i>${foto?'':'<i class="sprock a"></i><i class="sprock b"></i>'}
    <div class="fx">${P(18,'dust up',{size:[.15,.4],dur:[10,20]})}</div>${bunting()}
    <div class="inner center"><div class="stamp">ALBUM ${n+1}</div><h2 class="ttl">${a.name}</h2><div class="orn">❦ ✦ ❦</div>
    ${edit('cap-'+a.id,a.cap,'cap')}${edit('st-'+a.id,a.st,'note')}${foto?camSvg:projSvg}${pn(i)}</div>`};
}
function popGrid(a,i,key,title){
  const foto=a.pop==='foto';
  return {cls:`paper pop ${foto?'':'vid'}`,html:`<i class="pbord"></i>${foto?'':'<i class="sprock a"></i><i class="sprock b"></i>'}
    <div class="fx">${P(14,'dust up',{size:[.15,.4],dur:[10,20]})}</div>
    <div class="inner"><h3 class="mini">${title}</h3><div class="grid">${[0,1,2,3].map(k=>popSlot(key+'-'+k,k)).join('')}</div>${pn(i)}</div>`};
}

/* ---------- pembuat halaman berdasar deskriptor ---------- */
function describe(d,i){
  const a=d.a;
  switch(d.t){
    case 'cover': return {cls:'cover leather',html:cover('Koleksi','Album<br>Kenangan')};
    case 'back':  return {cls:'cover leather',html:cover('Sampai jumpa','Tamat')};
    case 'intro': return {cls:'paper',html:`<div class="tape" style="left:42%;top:-.5em;transform:rotate(-2deg)"></div>${rose('a')}${rose('b')}
      <div class="inner"><h2 class="ttl">Pendahuluan</h2><div class="orn">❦ ✦ ❦</div>
      ${edit('intro','Buku ini adalah rumah kecil bagi semua kenangan kita. Setiap lembarnya menyimpan tawa, perjalanan, dan hari-hari sederhana yang terasa istimewa setelah waktu berlalu. Ibra, Dzio, Faris, Radit, Rama, Abi, Hana, Nura, Yara, Silpi, dan Jeje punya halamannya masing-masing, dan di bagian akhir kita berkumpul dalam satu bingkai. Tekan ＋ Halaman untuk menambah lembar pada album yang sedang dibuka.','story')}${pn(i)}</div>`};
    case 'toc': {
      const items=[['Pendahuluan',1],...ALB.map(x=>[x.name,LAY.findIndex(q=>q.t==='aL'&&q.a===x)]),['Penutup',LAY.findIndex(q=>q.t==='outro')]];
      return {cls:'paper',html:`<div class="tape" style="right:18%;top:-.5em;transform:rotate(3deg)"></div><svg class="deco s"><use href="#sprig"/></svg>
        <div class="inner"><h2 class="ttl">Daftar Isi</h2><ul class="toc">${items.map(([nm,p])=>`<li data-go="${(p+1)/2}"><span>${nm}</span><span>${p}</span></li>`).join('')}</ul>${pn(i)}</div>`};}
    case 'outro': return {cls:'paper',html:`<div class="tape" style="left:38%;top:-.5em;transform:rotate(2deg)"></div>${rose('a')}
      <div class="inner"><h2 class="ttl">Penutup</h2><div class="orn">❦ ✦ ❦</div>
      ${edit('outro','Setiap halaman pada akhirnya akan selesai, tetapi cerita kita tidak. Terima kasih sudah menjadi bagian dari semua kenangan di buku ini. Simpan baik-baik, dan mari terus menambah lembar baru di hari-hari yang akan datang.','story')}${pn(i)}</div>`};
    case 'end': return {cls:'paper',html:`${rose('a')}${rose('b')}<svg class="deco s" style="top:auto;bottom:6em;left:auto;right:1.5em;transform:rotate(172deg)"><use href="#sprig"/></svg>
      <div class="inner center"><div class="orn" style="font-size:3em">❦</div><h2 class="ttl" style="border:0">Tamat</h2><div class="cap">sampai jumpa di lembar berikutnya</div></div>`};
    case 'aL': return a.pop?popLeft(a,d.n,i):albLeft(a,d.n,i);
    case 'aR': return a.pop?popGrid(a,i,a.id,a.name+' · Pop-Up'):albGrid(a,i,a.id,a.name+' · Kenangan');
    case 'xL': return (a.pop?popGrid:albGrid)(a,i,`${a.id}-x${d.e}l`,`${a.name} · Halaman ${d.e+1}`);
    case 'xR': return (a.pop?popGrid:albGrid)(a,i,`${a.id}-x${d.e}r`,`${a.name} · Halaman ${d.e+1}`);
  }
}
const face=(p,i)=>`<div class="face ${i%2?'back l':'front r'} ${p.cls||''}" data-p="${i}">${p.html}<i class="shade"></i>${(p.cls||'').includes('cover')?'':`<button class="corner" aria-label="${i%2?'Sebelumnya':'Berikutnya'}"></button>`}</div>`;

/* =====================================================================
   RAKIT / BANGUN ULANG BUKU
   ===================================================================== */
function rebuild(){
  holoOff();
  LAY=layout();N=LAY.length/2;
  flipped=Math.min(flipped,N);
  pagesEl.innerHTML='';leaves=[];busy=[];
  const pg=LAY.map(describe);
  for(let k=0;k<N;k++){
    const L=document.createElement('div');L.className='leaf';
    const done=k<flipped;
    L.style.zIndex=done?k:N-k;L.style.transform=`rotateY(${done?-180:0}deg)`;
    L.innerHTML=face(pg[2*k],2*k)+face(pg[2*k+1],2*k+1);
    pagesEl.appendChild(L);leaves.push(L);busy.push(false);
  }
  pagesEl.insertAdjacentHTML('beforeend','<div class="cast l"></div><div class="cast r"></div>');
  castL=$('.cast.l');castR=$('.cast.r');
  wireUp();update();
}

/* ---------- animasi balik halaman ---------- */
let DUR=1300;
function flip(i,dir,dur){
  const leaf=leaves[i],hard=(i===0||i===N-1);
  busy[i]=true;leaf.style.zIndex=100;
  const from=dir>0?0:-180,to=dir>0?-180:0;
  const kf=[
    {transform:`rotateY(${from}deg)`},
    {transform:`translateZ(${hard?0:2}em) rotateY(-90deg) ${hard?'':`skewY(${dir>0?-2.5:2.5}deg)`}`,offset:.5},
    {transform:`rotateY(${to}deg)`}
  ];
  const a=leaf.animate(kf,{duration:dur,easing:'cubic-bezier(.55,.06,.25,1)',fill:'forwards'});
  const f=$('.front .shade',leaf),b=$('.back .shade',leaf);
  (dir>0?f:b).animate([{opacity:0},{opacity:.6}],{duration:dur/2,easing:'ease-in'});
  (dir>0?b:f).animate([{opacity:.6},{opacity:0}],{duration:dur/2,delay:dur/2,easing:'ease-out',fill:'backwards'});
  [castL,castR].forEach(c=>c&&c.animate([{opacity:0},{opacity:.5},{opacity:0}],{duration:dur}));
  a.onfinish=()=>{leaf.style.transform=`rotateY(${to}deg)`;a.cancel();leaf.style.zIndex=dir>0?i:N-i;busy[i]=false};
}
function setLive(){
  const lo=2*flipped-1,hi=2*flipped;
  $$('.face').forEach(f=>{const p=+f.dataset.p;f.classList.toggle('live',p>=lo-2&&p<=hi+2);f.classList.toggle('show',p===lo||p===hi)});
}
function curAlbum(){const d=LAY[flipped>0?2*flipped-1:-1]||LAY[2*flipped];return d&&d.a?d.a:null}
function update(){
  book.dataset.state=flipped===0?'0':flipped===N?'end':'mid';
  book.style.setProperty('--tl',(flipped*.2)+'em');
  book.style.setProperty('--tr',((N-flipped)*.2)+'em');
  const d=flipped>0&&flipped<N?LAY[2*flipped-1]:null;
  lbl.textContent=flipped===0?'Sampul':flipped===N?'Sampul Belakang':(d&&d.a?`${d.a.name} · hal. ${2*flipped-1}–${2*flipped}`:`Halaman ${2*flipped-1}–${2*flipped}`);
  prevB.disabled=flipped===0;nxtB.disabled=flipped===N;
  $('#addp').disabled=!(d&&d.a);
  $('#delp').disabled=!(d&&d.a&&extras[d.a.id]>0);
  setLive();
}
function next(d=DUR){if(flipped>=N||busy[flipped])return false;holoOff();const i=flipped++;update();flip(i,1,d);return true}
function prev(d=DUR){if(flipped<=0||busy[flipped-1])return false;holoOff();const i=--flipped;update();flip(i,-1,d);return true}
let token=0;
async function goTo(j){
  const my=++token;
  while(flipped!==j&&my===token){const ok=flipped<j?next(800):prev(800);await sleep(ok?340:150)}
}

/* =====================================================================
   TAMBAH / HAPUS HALAMAN (lembar) PADA ALBUM
   ===================================================================== */
async function addSpread(){
  if(busy.some(Boolean))return;
  const a=curAlbum();if(!a)return toast('Buka halaman sebuah album dulu, lalu tekan ＋ Halaman');
  const c=extras[a.id]||0;if(c>=MAXX)return toast(`Maksimal ${MAXX} halaman tambahan per album`);
  extras[a.id]=c+1;ST('extras',JSON.stringify(extras));
  rebuild();
  const target=(LAY.findIndex(q=>q.t==='xL'&&q.a===a&&q.e===c+1)+1)/2;
  toast(`Halaman baru ditambahkan di album ${a.name}`);
  await sleep(250);goTo(target);
}
async function delSpread(){
  if(busy.some(Boolean))return;
  const a=curAlbum(),c=a&&extras[a.id]||0;if(!a||!c)return toast('Tidak ada halaman tambahan untuk dihapus di album ini');
  if(!confirm(`Hapus halaman tambahan terakhir di album ${a.name}? Foto/video di halaman itu ikut terhapus.`))return;
  for(const s of['l','r'])for(let k=0;k<4;k++){await dbDel(`${a.id}-x${c}${s}-${k}`);ST(`pc-${a.id}-x${c}${s}-${k}`,'')}
  const first=LAY.findIndex(q=>q.t==='aL'&&q.a===a);
  extras[a.id]=c-1;ST('extras',JSON.stringify(extras));
  const lastLeft=first+2*(c-1);              // halaman kiri terakhir setelah dihapus
  if(2*flipped-1>lastLeft)flipped=(lastLeft+1)/2;
  rebuild();toast('Halaman tambahan terakhir dihapus');
}

/* =====================================================================
   LIGHTBOX & HOLOGRAM
   ===================================================================== */
const lb=$('#lb');
function openLB(u,t){lb.innerHTML=t==='video'?`<video src="${u}" controls autoplay loop playsinline></video>`:`<img src="${u}" alt="">`;lb.classList.add('on')}
function closeLB(){lb.classList.remove('on');lb.innerHTML=''}
lb.addEventListener('click',e=>{if(e.target.tagName!=='VIDEO')closeLB()});

const holo=$('#holo');let holoCard=null;
function holoOff(){
  if(!holoCard)return;
  $$('.pwr.on').forEach(b=>b.classList.remove('on'));
  holoCard=null;holo.hidden=true;$('.hm',holo).innerHTML='';
}
function holoOn(card){
  const key=card.dataset.slot,box=$('.photo-img',card),url=urls[key];
  if(!url)return;
  if(holoCard===card){holoOff();return}
  holoOff();
  const bk=book.getBoundingClientRect(),cr=card.getBoundingClientRect();
  const hh=Math.min(bk.height*.5,bk.width*.34),hw=hh*1.34;
  const onRight=cr.left+cr.width/2>bk.left+bk.width/2;
  const hx=bk.left+bk.width*(onRight?.27:.73)-hw/2,hy=Math.max(10,bk.top-hh*.06);
  const cx=cr.left+cr.width/2,cy=cr.top+cr.height*.3,yb=hy+hh;
  const st=holo.style;
  st.setProperty('--hx',hx+'px');st.setProperty('--hy',hy+'px');st.setProperty('--hw',hw+'px');st.setProperty('--hh',hh+'px');
  st.setProperty('--cx',cx+'px');st.setProperty('--cy',cy+'px');
  $('.hb',holo).style.clipPath=`polygon(${cx-16}px ${cy}px,${cx+16}px ${cy}px,${hx+hw*.96}px ${yb}px,${hx+hw*.04}px ${yb}px)`;
  const isV=box.dataset.type==='video';
  $('.hm',holo).innerHTML=(isV?`<video src="${url}" autoplay loop playsinline></video>`:`<img src="${url}" alt="">`)+'<i class="hscan"></i><i class="hline"></i>';
  $('.hcap',holo).textContent=$('.photo-caption',card).textContent;
  holo.hidden=false;holoCard=card;$('.pwr',card).classList.add('on');
}
$('.hs',holo).addEventListener('click',e=>{
  if(e.target.closest('.hx'))return holoOff();
  const v=$('video',holo);if(v)v.paused?v.play():v.pause();
});
$('.hx',holo).addEventListener('click',holoOff);

/* =====================================================================
   PEMASANGAN INTERAKSI (dipasang ulang setiap buku dibangun)
   ===================================================================== */
function initSlot(card){
  const key=card.dataset.slot,box=$('.photo-img',card),inp=$('input',card),pop=card.classList.contains('pop-card');
  const show=blob=>{
    if(urls[key]){URL.revokeObjectURL(urls[key]);delete urls[key]}
    $$('img,video',box).forEach(x=>x.remove());
    if(!blob){card.classList.remove('has-media');box.classList.remove('has-media');delete box.dataset.type;return}
    const u=urls[key]=URL.createObjectURL(blob),isV=(blob.type||'').startsWith('video');
    const el=document.createElement(isV?'video':'img');
    el.src=isV?u+'#t=0.1':u;
    if(isV){el.muted=true;el.loop=true;el.playsInline=true;el.preload='metadata'}
    box.appendChild(el);box.dataset.type=isV?'video':'image';
    card.classList.add('has-media');box.classList.add('has-media');
  };
  const act=()=>card.classList.contains('has-media')?(pop?holoOn(card):openLB(urls[key],box.dataset.type)):inp.click();
  box.addEventListener('click',act);
  const pw=$('.pwr',card);if(pw)pw.addEventListener('click',e=>{e.stopPropagation();holoOn(card)});
  $('.sw',card).addEventListener('click',e=>{e.stopPropagation();inp.click()});
  $('.x',card).addEventListener('click',async e=>{e.stopPropagation();if(confirm('Hapus media ini?')){if(holoCard===card)holoOff();await dbDel(key);show(null)}});
  inp.addEventListener('change',async()=>{const f=inp.files[0];if(!f)return;if(holoCard===card)holoOff();await dbSet(key,f);show(f);inp.value=''});
  dbGet(key).then(b=>{if(b)show(b)});
}
function initPortrait(el){
  const key='pf-'+el.dataset.pf,inp=$('input',el);let url=null;
  const set=blob=>{
    if(url){URL.revokeObjectURL(url);url=null}
    if(blob){url=URL.createObjectURL(blob);el.style.backgroundImage=`url("${url}")`;el.style.backgroundPosition='50% 50%';el.classList.remove('pf-gal');el.dataset.has='1'}
  };
  el.addEventListener('click',e=>{if(e.target!==inp)inp.click()});
  el.addEventListener('dblclick',async()=>{if(el.dataset.has&&confirm('Kembalikan foto profil ke bawaan?')){await dbDel(key);location.reload()}});
  inp.addEventListener('change',async()=>{const f=inp.files[0];if(!f)return;await dbSet(key,f);set(f);inp.value=''});
  dbGet(key).then(b=>{if(b)set(b)});
}
function initBg(ctl){
  const key='bg-'+ctl.dataset.album,L=+ctl.closest('.face').dataset.p;
  const fs=[L,L+1].map(p=>$(`.face[data-p="${p}"]`)).filter(Boolean),vids=fs.map(f=>$('.bgv',f));
  const inp=$('.bgin',ctl);let url=null;
  const apply=blob=>{
    if(url){URL.revokeObjectURL(url);url=null}
    fs.forEach(f=>f.classList.toggle('has-v',!!blob));
    if(blob){url=URL.createObjectURL(blob);vids.forEach(v=>{v.src=url;v.play().catch(()=>{})})}
    else vids.forEach(v=>{v.removeAttribute('src');v.load()});
  };
  $('.bgbtn',ctl).addEventListener('click',e=>{e.stopPropagation();inp.click()});
  $('.bgrm',ctl).addEventListener('click',async e=>{e.stopPropagation();await dbDel(key);apply(null)});
  inp.addEventListener('change',async()=>{const f=inp.files[0];if(!f)return;await dbSet(key,f);apply(f);inp.value=''});
  dbGet(key).then(b=>{if(b)apply(b)});
}
function wireUp(){
  $$('[contenteditable]').forEach(el=>{
    const s=ST(el.dataset.k);if(s)el.textContent=s;
    el.addEventListener('input',()=>ST(el.dataset.k,el.textContent));
    el.addEventListener('click',e=>e.stopPropagation());
    el.addEventListener('keydown',e=>e.stopPropagation());
  });
  $$('.photo-card').forEach(initSlot);
  $$('.portrait').forEach(initPortrait);
  $$('.bgctl').forEach(initBg);
}

/* =====================================================================
   INTERAKSI GLOBAL
   ===================================================================== */
prevB.onclick=()=>prev();nxtB.onclick=()=>next();
$('#tocb').onclick=()=>goTo(1);
$('#addp').onclick=addSpread;$('#delp').onclick=delSpread;
document.addEventListener('click',e=>{
  const c=e.target.closest('.corner');
  if(c){c.closest('.face').classList.contains('r')?next():prev();return}
  const cv=e.target.closest('.face.cover');
  if(cv){cv.classList.contains('r')?next():prev();return}
  const g=e.target.closest('[data-go]');
  if(g)goTo(+g.dataset.go);
});
document.addEventListener('keydown',e=>{
  if(e.target.isContentEditable)return;
  if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev();
  else if(e.key==='Home')goTo(0);else if(e.key==='End')goTo(N);
  else if(e.key==='Escape'){closeLB();holoOff()}
});
let sx=null;
$('#scene').addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
$('#scene').addEventListener('touchend',e=>{
  if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;
  if(Math.abs(dx)>60)dx<0?next():prev();
});

rebuild();
window.__a={goTo,next,prev,addSpread,delSpread};   // untuk pengujian
})();
