/* ================= Deney simülatörü: breadboard + cihazlar ================= */
const $=s=>document.querySelector(s);
const board=$('#board');
const P=17,X0=190,Y0=128,NC=42;
const ROWS=[0,1,3,4,5,6,7,10,11,12,13,14,16,17];
const RL={a:3,b:4,c:5,d:6,e:7,f:10,g:11,h:12,i:13,j:14,TN:0,TP:1,BP:16,BN:17};
const ROWNAME={0:'üst – rayı',1:'üst + rayı',3:'a',4:'b',5:'c',6:'d',7:'e',10:'f',11:'g',12:'h',13:'i',14:'j',16:'alt + rayı',17:'alt – rayı'};
const hx=c=>X0+c*P,hy=r=>Y0+r*P;
const validHole=(c,r)=>c>=0&&c<NC&&ROWS.includes(r);
function netOf(h){if(!h)return null;const [c,r]=h;if(!validHole(c,r))return null;if(r===0)return 'RT-';if(r===1)return 'RT+';if(r<=7)return 'T'+c;if(r<=14)return 'B'+c;if(r===16)return 'RB+';return 'RB-';}
function holeName(h){const [c,r]=h;return (r>=3&&r<=14)?(ROWNAME[r]+(c+1)):(ROWNAME[r]+' '+(c+1));}
const H=(s)=>{const m=/^([a-j]|TN|TP|BP|BN)(\d+)$/.exec(s);return [ +m[2]-1, RL[m[1]] ];};
let say=(m,t)=>{const f=$('#fb');f.className=t&&t!=='info'?t:'';f.textContent=m;};
function info(t,b){$('#infoCard').innerHTML=`<div class="stepno">Bilgi · imleci bir parçanın üzerine getir</div><h2>${t}</h2><p style="margin:2px 0 0">${b}</p>`;}
const fmtSI=(x,u,d=3)=>{const a=Math.abs(x);let sc=1,p='';if(a>=1e6){sc=1e6;p='M';}else if(a>=1e3){sc=1e3;p='k';}else if(a>=1||a===0){}else if(a>=1e-3){sc=1e-3;p='m';}else if(a>=1e-6){sc=1e-6;p='μ';}else{sc=1e-9;p='n';}return (+(x/sc).toPrecision(d))+' '+p+u;};

/* ---------- Eleman tipleri ---------- */
const BAND=['#111','#7b3f00','#d62828','#f77f00','#f2d51b','#2a9d3a','#1d4ed8','#7b2cbf','#8d8d8d','#f5f5f5'];
const RVALS=[10,22,47,100,220,330,470,680,1000,2200,4700,10000,22000,47000,100000,220000,470000,1000000];
const CVALS_C=[1e-9,10e-9,47e-9,100e-9,470e-9,1e-6];
const CVALS_E=[1e-6,10e-6,47e-6,100e-6,470e-6,1000e-6];
const LVALS=[100e-6,470e-6,1e-3,4.7e-3,10e-3];
const LEDCOL={red:['#ff2a2a','Kırmızı'],yellow:['#ffd400','Sarı'],green:['#2bdc4a','Yeşil'],blue:['#3a7bff','Mavi'],white:['#f4f8ff','Beyaz']};
function bands(R){const e=Math.floor(Math.log10(R))-1,v=Math.round(R/Math.pow(10,e));const d1=Math.floor(v/10)%10,d2=v%10;const mul=e>=0?BAND[e]:(e===-1?'#c9a227':'#b8b8b8');return [BAND[d1],BAND[d2],mul,'#c9a227'];}
const TYPES={
 res:{name:'Direnç',rigid:true,pins:[[0,0],[4,0]],props:{R:1000},info:'Akımı sınırlar. Renk halkaları değeri gösterir (1. ve 2. halka rakam, 3. halka çarpan, altın %5). Gücü 0.25 W: P = I²R bunu aşarsa ısınır, çok aşarsa yanar.'},
 led:{name:'LED',rigid:true,pins:[[0,0],[1,0]],props:{color:'red'},info:'Işık yayan diyot. Uzun bacak anot (+). İleri yön gerilimi kırmızıda ≈1.9 V, mavi/beyazda ≈3 V. Akımı 5–20 mA arasında tut; seri direnç olmadan bağlarsan yanar!'},
 diode:{name:'Diyot 1N4007',rigid:true,pins:[[0,0],[4,0]],props:{},info:'Doğrultucu diyot (1 A, 1000 V). Gümüş halka katottur. İleri yönde ≈0.7 V düşüm, ters yönde akım geçirmez.'},
 schottky:{name:'Schottky 1N5819',rigid:true,pins:[[0,0],[4,0]],props:{},info:'Schottky diyot: ileri düşüm ≈0.3–0.4 V, çok hızlı. Kıyıcılarda serbest geçiş (freewheel) diyotu olarak kullanılır.'},
 zener:{name:'Zener diyot',rigid:true,pins:[[0,0],[4,0]],props:{Vz:5.1},info:'Ters yönde Vz geriliminde iletime geçer (kırılma). Kırpıcı ve gerilim referansı devrelerinde kullanılır. Siyah halka katottur.'},
 ccap:{name:'Seramik kondansatör',rigid:true,pins:[[0,0],[2,0]],props:{C:100e-9},info:'Kutupsuz küçük değerli kondansatör (pF–μF). Üzerindeki kod: 104 = 10·10⁴ pF = 100 nF.'},
 ecap:{name:'Elektrolitik kondansatör',rigid:true,pins:[[0,0],[1,0]],props:{C:100e-6,Vmax:25},info:'Kutuplu, büyük değerli kondansatör. Gri şeritli bacak (−) eksidir. Ters bağlanırsa veya gerilim sınırı aşılırsa patlar!'},
 ind:{name:'Bobin',rigid:true,pins:[[0,0],[4,0]],props:{L:1e-3},info:'Akımdaki değişime karşı koyar (V = L·di/dt). Kıyıcılarda enerjiyi depolar ve akımı süzer. Sargı direnci de hesaba katılır.'},
 pot:{name:'Potansiyometre',rigid:true,pins:[[0,0],[1,0],[2,0]],props:{R:10000,pos:0.5},info:'Ayarlı direnç. Uç bacaklar arası sabit R, orta bacak (sürgü) konuma göre değişir. Düğmeyi fareyle sürükleyerek çevir.'},
 btn:{name:'Buton',rigid:true,pins:[[0,0],[2,0]],props:{},info:'Basılıyken kontak kapanır (anlık buton). Bas-bırak; çift tıklarsan basılı kilitlenir.'},
 sw:{name:'Anahtar',rigid:true,pins:[[0,0],[2,0]],props:{on:false},info:'Kalıcı aç/kapa anahtarı. Tıklayarak konum değiştir.'},
 mos:{name:'MOSFET IRFZ44N',rigid:true,pins:[[0,0],[1,0],[2,0]],props:{},info:'N kanallı güç MOSFET\'i. Bacaklar soldan: G (kapı), D (savak), S (kaynak). Vgs > ~3 V olunca D–S iletime geçer (Rds(on) ≈ 17 mΩ). İçinde S→D gövde diyotu vardır.'},
 bat:{name:'9 V pil',rigid:false,np:2,props:{V:9},pinNames:['+','−'],info:'9 V pil, iç direnci ≈1.5 Ω. Kırmızı uç +, siyah uç −. Kısa devre edilirse hızla ısınır.'},
 dcs:{name:'Ayarlı DC kaynak',rigid:false,np:2,props:{V:12,I:1},pinNames:['+','−'],info:'Laboratuvar güç kaynağı: gerilimi (CV) ve akım sınırını (CC) ayarlanır. Yük akım sınırını aşarsa CC moduna geçer ve gerilimi düşürür. +/− düğmeleriyle ya da özellikler panelinden ayarla.'},
 trafo:{name:'Trafo 230 V / 12-0-12 V',rigid:false,np:3,props:{Vrms:12},pinNames:['A','CT','B'],info:'Şebekeden yalıtılmış orta uçlu trafo. A–CT ve CT–B arası 12 V rms (tepe ≈17 V), A ile B ters fazlıdır. Çıkışı yalıtımlıdır, bu yüzden osiloskop toprağı herhangi bir uca bağlanabilir.'},
 wire:{name:'Kablo',rigid:false,np:2,props:{color:'#e63946'},info:'Atlama kablosu: iki deliği birbirine bağlar.'}
};
const WIRECOLS=['#e63946','#1d4ed8','#111','#2a9d3a','#f4a300','#ffffff','#8338ec'];

/* ---------- Kartlar / klipsler ---------- */
let ELS=[],NEXT=1,SEL=null,VER=1;
const CLIP_ORDER=['mmR','mmB','g1R','g1B','g2R','g2B','s1T','s1G','s2T','s2G'];
const CLIPS={};
CLIP_ORDER.forEach((k,i)=>{const pair=Math.floor(i/2);CLIPS[k]={h:null,px:208+i*64+pair*10,py:62};});
const CLIPINFO={
 mmR:['Multimetre kırmızı prob','Multimetrenin VΩmA (ya da 10A) girişine bağlı. Gerilim için ölçülen noktaya, akım için devreye seri bağlanır.'],
 mmB:['Multimetre siyah prob','COM girişine bağlı. Genelde devrenin eksi/toprak noktasına.'],
 g1R:['Jeneratör CH1 kırmızı timsah','BNC kablonun sinyal ucu.'],g1B:['Jeneratör CH1 siyah timsah','BNC kablonun dış (toprak) ucu. Jeneratörün toprağı şebeke toprağına bağlıdır!'],
 g2R:['Jeneratör CH2 kırmızı timsah','BNC kablonun sinyal ucu.'],g2B:['Jeneratör CH2 siyah timsah','Toprak ucu (şebeke toprağı).'],
 s1T:['Osiloskop CH1 prob ucu','Ölçülen noktaya değdirilir. Giriş direnci 1 MΩ (10X probda 10 MΩ).'],s1G:['Osiloskop CH1 toprak klipsi','Osiloskobun toprağı şebeke toprağına bağlıdır: yalıtımsız devrede yanlış noktaya takılırsa kısa devre yapar!'],
 s2T:['Osiloskop CH2 prob ucu','İkinci kanal prob ucu.'],s2G:['Osiloskop CH2 toprak klipsi','CH1 toprak klipsiyle aynı noktaya bağlıdır (şebeke toprağı).']
};

/* ---------- Eleman işlemleri ---------- */
function rotP(dx,dy,r){switch(r&3){case 0:return[dx,dy];case 1:return[-dy,dx];case 2:return[-dx,-dy];default:return[dy,-dx];}}
function pinHoles(el){const T=TYPES[el.type];if(T.rigid)return T.pins.map(([dx,dy])=>{const [a,b]=rotP(dx,dy,el.rot);return [el.at[0]+a,el.at[1]+b];});return el.pins.map(p=>p.h);}
function pinXY(el,i){const T=TYPES[el.type];if(T.rigid){const h=pinHoles(el)[i];return [hx(h[0]),hy(h[1])];}const p=el.pins[i];return p.h?[hx(p.h[0]),hy(p.h[1])]:[p.x,p.y];}
function addEl(type,o={}){
  const T=TYPES[type];
  const el={id:NEXT++,type,props:Object.assign({},T.props,o.props||{}),rot:o.rot||0,at:o.at||null,st:{},burnt:false,body:o.body||null};
  if(!T.rigid){
    el.pins=[];for(let i=0;i<T.np;i++){const h=o.pins&&o.pins[i];el.pins.push(h?{h:h.slice()}:{h:null,x:(el.body?el.body[0]:40)+20+i*24,y:(el.body?el.body[1]:200)+110});}
    if(!el.body&&type!=='wire')el.body=[20,150];
  }
  ELS.push(el);VER++;return el;
}
const GRAVE=new Map();
function delEl(el){GRAVE.set(el.id,el);ELS=ELS.filter(e=>e!==el);if(SEL===el)SEL=null;VER++;renderProps();}
function parkClip(k){const i=CLIP_ORDER.indexOf(k),pair=Math.floor(i/2);CLIPS[k].h=null;CLIPS[k].px=208+i*64+pair*10;CLIPS[k].py=62;}
function clearBoard(){ELS=[];SEL=null;CLIP_ORDER.forEach(parkClip);VER++;renderProps();}
function wire(a,b,color){return addEl('wire',{pins:[H(a),H(b)],props:{color:color||'#e63946'}});}
function part(type,at,o={}){return addEl(type,Object.assign({at:H(at)},o));}
function clip(k,h){if(h)CLIPS[k].h=H(h);else parkClip(k);VER++;}

/* ---------- Çizim ---------- */
let BOARD_STATIC='';
function buildStatic(){
  let s=`<defs><radialGradient id="ledGlow"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="currentColor" stop-opacity=".8"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
   <linearGradient id="bbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f6f1"/><stop offset="1" stop-color="#e9e7df"/></linearGradient></defs>
  <rect x="0" y="0" width="930" height="455" fill="#e7ebef"/>
  <rect x="6" y="6" width="918" height="92" rx="10" fill="#dfe5ec" stroke="#c5ced8"/>
  <text x="16" y="24" font-size="11" font-weight="700" fill="#52606d">PROB VE KLİPS PARKI</text><text x="16" y="40" font-size="9.5" fill="#52606d">Uçları sürükleyip</text><text x="16" y="52" font-size="9.5" fill="#52606d">breadboard deliklerine</text><text x="16" y="64" font-size="9.5" fill="#52606d">tak; geri bırakırsan</text><text x="16" y="76" font-size="9.5" fill="#52606d">park yerine döner.</text>
  ${[['Multimetre',0],['Jen. CH1',1],['Jen. CH2',2],['Osil. CH1',3],['Osil. CH2',4]].map(([t,p])=>`<text x="${208+p*138+32}" y="26" font-size="10.5" font-weight="700" fill="#334e68" text-anchor="middle">${t}</text>`).join('')}
  <rect x="172" y="108" width="735" height="330" rx="10" fill="url(#bbg)" stroke="#cfccc1" stroke-width="2"/>
  <rect x="172" y="${hy(8)-6}" width="735" height="${P+12}" fill="#e1dfd6"/>
  <line x1="${hx(0)-8}" y1="${hy(0)-9}" x2="${hx(NC-1)+8}" y2="${hy(0)-9}" stroke="#1d4ed8" stroke-width="2"/><line x1="${hx(0)-8}" y1="${hy(1)+9}" x2="${hx(NC-1)+8}" y2="${hy(1)+9}" stroke="#d62828" stroke-width="2"/>
  <line x1="${hx(0)-8}" y1="${hy(16)-9}" x2="${hx(NC-1)+8}" y2="${hy(16)-9}" stroke="#d62828" stroke-width="2"/><line x1="${hx(0)-8}" y1="${hy(17)+9}" x2="${hx(NC-1)+8}" y2="${hy(17)+9}" stroke="#1d4ed8" stroke-width="2"/>
  <text x="${hx(0)-16}" y="${hy(0)+4}" font-size="12" font-weight="800" fill="#1d4ed8" text-anchor="middle">–</text><text x="${hx(0)-16}" y="${hy(1)+4}" font-size="12" font-weight="800" fill="#d62828" text-anchor="middle">+</text>
  <text x="${hx(0)-16}" y="${hy(16)+4}" font-size="12" font-weight="800" fill="#d62828" text-anchor="middle">+</text><text x="${hx(0)-16}" y="${hy(17)+4}" font-size="12" font-weight="800" fill="#1d4ed8" text-anchor="middle">–</text>`;
  [3,4,5,6,7,10,11,12,13,14].forEach(r=>{s+=`<text x="${hx(0)-14}" y="${hy(r)+3.5}" font-size="8.5" fill="#8a8a80" text-anchor="middle">${ROWNAME[r]}</text><text x="${hx(NC-1)+14}" y="${hy(r)+3.5}" font-size="8.5" fill="#8a8a80" text-anchor="middle">${ROWNAME[r]}</text>`;});
  for(let c=0;c<NC;c++){if(c===0||(c+1)%5===0)s+=`<text x="${hx(c)}" y="${hy(3)-11}" font-size="8" fill="#8a8a80" text-anchor="middle">${c+1}</text><text x="${hx(c)}" y="${hy(14)+15}" font-size="8" fill="#8a8a80" text-anchor="middle">${c+1}</text>`;}
  for(let c=0;c<NC;c++)ROWS.forEach(r=>{s+=`<rect x="${hx(c)-2.6}" y="${hy(r)-2.6}" width="5.2" height="5.2" rx="1" fill="#3b3b3b" opacity=".75"/>`;});
  s+=`<text x="18" y="125" font-size="11" font-weight="700" fill="#52606d">KAYNAKLAR</text>`;
  BOARD_STATIC=s;
}
function lead(p,q,col,w=2.4){const mx=(p[0]+q[0])/2,my=Math.max(p[1],q[1])+20;return `<path d="M${p[0]} ${p[1]} Q${mx} ${my} ${q[0]} ${q[1]}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;}
function legLine(p,q){return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#b8bcc2" stroke-width="2.2" stroke-linecap="round"/>`;}
function pinDot(p,ok){return `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="${ok?'#9aa0a6':'#e63946'}"/>`;}
function axial(el,p0,p1,bodyFn){
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],L=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI;
  return `<g transform="translate(${p0[0]} ${p0[1]}) rotate(${ang})">${legLine([0,0],[L,0])}${bodyFn(L)}</g>`;
}
function drawEl(el){
  const T=TYPES[el.type],pr=el.props,np=T.rigid?T.pins.length:T.np;
  const pts=[];for(let i=0;i<np;i++)pts.push(pinXY(el,i));
  const holes=pinHoles(el),ok=holes.map(h=>!!netOf(h));
  const sel=SEL===el;let s='',body='';
  const burnt=el.burnt;
  switch(el.type){
   case 'res':{const b=bands(pr.R);body=axial(el,pts[0],pts[1],L=>{const w=Math.min(L-12,34),x=(L-w)/2;return `<rect x="${x}" y="-5.5" width="${w}" height="11" rx="5" fill="${burnt?'#3a2a1a':'#dcc48e'}" stroke="#a88f5a"/>${burnt?'':b.map((c,i)=>`<rect x="${x+5+i*(w-10)/4.2}" y="-5.5" width="3.2" height="11" fill="${c}"/>`).join('')}<rect id="heat${el.id}" x="${x}" y="-5.5" width="${w}" height="11" rx="5" fill="#ff3b1f" opacity="0"/>`;});break;}
   case 'diode':case 'schottky':case 'zener':{body=axial(el,pts[0],pts[1],L=>{const w=Math.min(L-12,30),x=(L-w)/2,c=el.type==='zener'?'#e9873a':'#1b1b1b',band=el.type==='zener'?'#111':'#d8d8d8';return `<rect x="${x}" y="-4.5" width="${w}" height="9" rx="2.5" fill="${burnt?'#3a2a1a':c}"/><rect x="${x+w-6}" y="-4.5" width="3.5" height="9" fill="${band}"/>`;});break;}
   case 'ind':{body=axial(el,pts[0],pts[1],L=>{const w=Math.min(L-12,34),x=(L-w)/2;let c=`<rect x="${x}" y="-7" width="${w}" height="14" rx="6" fill="#2f5d3a"/>`;for(let k=1;k<7;k++)c+=`<line x1="${x+k*w/7}" y1="-7" x2="${x+k*w/7}" y2="7" stroke="#c98a3d" stroke-width="2"/>`;return c;});break;}
   case 'led':{const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2],col=LEDCOL[pr.color][0];
     body=`${legLine(pts[0],[m[0]-2,m[1]-4])}${legLine(pts[1],[m[0]+2,m[1]-4])}<g transform="translate(${m[0]} ${m[1]-10})"><circle id="glow${el.id}" r="22" fill="url(#ledGlow)" style="color:${col}" opacity="0"/><path d="M-8 6 V-2 A8 8 0 0 1 8 -2 V6 Z" fill="${burnt?'#2b2118':col}" fill-opacity="${burnt?1:.55}" stroke="${burnt?'#111':col}" stroke-width="1.2"/><rect x="-9.5" y="5" width="19" height="3" fill="${burnt?'#2b2118':col}" fill-opacity=".7"/><circle id="core${el.id}" cy="-1" r="4" fill="#fff" opacity="0"/>${burnt?'<text y="-14" font-size="9" text-anchor="middle" fill="#555">💨</text>':''}</g>`;break;}
   case 'ccap':{const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2];body=`${legLine(pts[0],[m[0]-3,m[1]-6])}${legLine(pts[1],[m[0]+3,m[1]-6])}<ellipse cx="${m[0]}" cy="${m[1]-11}" rx="10" ry="8" fill="#e2a82f" stroke="#a87412"/><text x="${m[0]}" y="${m[1]-8.5}" font-size="6.5" text-anchor="middle" fill="#5a3c00">${capCode(pr.C)}</text>`;break;}
   case 'ecap':{const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2],ang=Math.atan2(pts[1][1]-pts[0][1],pts[1][0]-pts[0][0])*180/Math.PI;body=`<g transform="translate(${m[0]} ${m[1]}) rotate(${ang})"><circle r="11.5" fill="${burnt?'#3a2a1a':'#1f3f8f'}" stroke="#0f2457"/><path d="M5 -10.3 A11.5 11.5 0 0 1 5 10.3 Z" fill="#c9d3e6" opacity=".85"/><text x="8" y="2.5" font-size="7" font-weight="800" text-anchor="middle" fill="#0f2457">−</text><text x="-3" y="2.5" font-size="5.5" fill="#fff" text-anchor="middle">${fmtSI(pr.C,'F',2).replace(' ','')}</text>${burnt?'<text y="-14" font-size="10" text-anchor="middle">💥</text>':''}</g>`;break;}
   case 'pot':{const m=pts[1],ang=Math.atan2(pts[2][1]-pts[0][1],pts[2][0]-pts[0][0])*180/Math.PI;const ka=-135+270*pr.pos;body=`<g transform="translate(${m[0]} ${m[1]}) rotate(${ang})"><rect x="-21" y="-38" width="42" height="34" rx="4" fill="#2f63b5" stroke="#1d3f78"/><g data-act="pot" data-id="${el.id}" style="cursor:grab"><circle cy="-21" r="12.5" fill="#f2f2f2" stroke="#999"/><line x1="0" y1="-21" x2="0" y2="-31" stroke="#333" stroke-width="2.5" stroke-linecap="round" transform="rotate(${ka} 0 -21)"/></g></g>`;break;}
   case 'btn':{const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2],on=el.pressed||pr.latch;body=`<g transform="translate(${m[0]} ${m[1]})"><rect x="-16" y="-14" width="32" height="28" rx="3" fill="#2d2d2d" stroke="#111"/><g data-act="btn" data-id="${el.id}" style="cursor:pointer"><circle r="${on?8:9.5}" fill="${on?'#6b6b6b':'#8d8d8d'}" stroke="#222" stroke-width="2"/></g><g data-act="btnlock" data-id="${el.id}" style="cursor:pointer"><title>Kalıcı bas (kilit)</title><rect x="9" y="-29" width="18" height="15" rx="4" fill="${pr.latch?'#d62828':'#f1f1f1'}" stroke="${pr.latch?'#7a1010':'#777'}"/><path d="M14.5 -21.5 v-2.5 a3.5 3.5 0 0 1 7 0 ${pr.latch?'v2.5':'v-1'}" fill="none" stroke="${pr.latch?'#fff':'#555'}" stroke-width="1.6"/><rect x="13" y="-22" width="10" height="6" rx="1" fill="${pr.latch?'#fff':'#555'}"/></g>${pr.latch?'<text x="-4" y="-18" font-size="7" font-weight="700" text-anchor="middle" fill="#d62828">BASILI</text>':''}</g>`;break;}
   case 'sw':{const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2];body=`<g transform="translate(${m[0]} ${m[1]-8})" data-act="sw" data-id="${el.id}" style="cursor:pointer"><rect x="-17" y="-7" width="34" height="14" rx="3" fill="#3a3a3a"/><rect x="${pr.on?2:-14}" y="-5" width="12" height="10" rx="2" fill="#e8e8e8"/><text y="-10" font-size="7" text-anchor="middle" fill="#333">${pr.on?'AÇIK':'KAPALI'}</text></g>`;break;}
   case 'mos':{const m=pts[1],ang=Math.atan2(pts[2][1]-pts[0][1],pts[2][0]-pts[0][0])*180/Math.PI;body=`<g transform="translate(${m[0]} ${m[1]}) rotate(${ang})"><rect x="-15" y="-46" width="30" height="16" rx="2" fill="#b8bcc2" stroke="#7d8288"/><circle cy="-38" r="4" fill="#e7ebef"/><rect x="-15" y="-31" width="30" height="24" rx="2" fill="#1d1d1d"/><text y="-17" font-size="5.5" fill="#ddd" text-anchor="middle">IRFZ44N</text>${[-17,0,17].map((x,i)=>`<text x="${x}" y="-1" font-size="6.5" font-weight="700" fill="#334e68" text-anchor="middle">${'GDS'[i]}</text>`).join('')}</g>`;break;}
   case 'bat':{const [x,y]=el.body;body=`<g><rect x="${x}" y="${y}" width="56" height="84" rx="6" fill="#222"/><rect x="${x}" y="${y+46}" width="56" height="38" rx="6" fill="#c9a227"/><text x="${x+28}" y="${y+38}" font-size="18" font-weight="800" fill="#fff" text-anchor="middle">9V</text><circle cx="${x+16}" cy="${y-4}" r="6" fill="#c9a227" stroke="#7a6212"/><circle cx="${x+40}" cy="${y-4}" r="6" fill="#d7dce2" stroke="#8a929c"/><text x="${x+16}" y="${y-1}" font-size="9" font-weight="800" text-anchor="middle">+</text><text x="${x+40}" y="${y-1}" font-size="9" font-weight="800" text-anchor="middle">−</text></g>`;
     s+=lead([x+16,y-4],pts[0],'#d62828')+lead([x+40,y-4],pts[1],'#222');break;}
   case 'dcs':{const [x,y]=el.body;body=`<g><rect x="${x}" y="${y}" width="150" height="92" rx="8" fill="#e9e6dd" stroke="#9c9a90" stroke-width="2"/><text x="${x+8}" y="${y+14}" font-size="9" font-weight="700" fill="#333">DC GÜÇ KAYNAĞI</text><rect x="${x+8}" y="${y+20}" width="92" height="40" rx="3" fill="#0b1a12"/><text id="dcsV${el.id}" x="${x+96}" y="${y+37}" font-size="14" font-family="Menlo,monospace" font-weight="700" fill="#5dff7a" text-anchor="end">${pr.V.toFixed(2)}V</text><text id="dcsI${el.id}" x="${x+96}" y="${y+55}" font-size="12" font-family="Menlo,monospace" fill="#ff8a5d" text-anchor="end">0.000A</text>
     <g data-act="dcs+" data-id="${el.id}" style="cursor:pointer"><rect x="${x+108}" y="${y+20}" width="34" height="18" rx="4" fill="#cfcdc5" stroke="#888"/><text x="${x+125}" y="${y+33}" font-size="11" font-weight="800" text-anchor="middle">V+</text></g><g data-act="dcs-" data-id="${el.id}" style="cursor:pointer"><rect x="${x+108}" y="${y+42}" width="34" height="18" rx="4" fill="#cfcdc5" stroke="#888"/><text x="${x+125}" y="${y+55}" font-size="11" font-weight="800" text-anchor="middle">V−</text></g>
     <circle id="dcsCV${el.id}" cx="${x+14}" cy="${y+72}" r="4" fill="#2fbf4f"/><text x="${x+21}" y="${y+75}" font-size="8" fill="#333">CV</text><circle id="dcsCC${el.id}" cx="${x+44}" cy="${y+72}" r="4" fill="#555"/><text x="${x+51}" y="${y+75}" font-size="8" fill="#333">CC ${pr.I}A</text>
     <circle cx="${x+104}" cy="${y+78}" r="7" fill="#d62828" stroke="#7a1010"/><circle cx="${x+128}" cy="${y+78}" r="7" fill="#222" stroke="#000"/></g>`;
     s+=lead([x+104,y+78],pts[0],'#d62828')+lead([x+128,y+78],pts[1],'#222');break;}
   case 'trafo':{const [x,y]=el.body;body=`<g><rect x="${x}" y="${y}" width="150" height="74" rx="8" fill="#5b6470" stroke="#3a414a" stroke-width="2"/><rect x="${x+8}" y="${y+8}" width="60" height="58" rx="4" fill="#3a414a"/>${[0,1,2,3,4].map(k=>`<line x1="${x+12}" y1="${y+14+k*11}" x2="${x+64}" y2="${y+14+k*11}" stroke="#c98a3d" stroke-width="3"/>`).join('')}<text x="${x+110}" y="${y+22}" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">230V ~</text><text x="${x+110}" y="${y+36}" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">${pr.Vrms}-0-${pr.Vrms} V</text><text x="${x+110}" y="${y+50}" font-size="8" fill="#ddd" text-anchor="middle">50 Hz · yalıtımlı</text>${[0,1,2].map(k=>`<circle cx="${x+86+k*24}" cy="${y+64}" r="5" fill="${k===1?'#222':'#e0b000'}"/><text x="${x+86+k*24}" y="${y+82}" font-size="7.5" fill="#333" text-anchor="middle">${['A','CT','B'][k]}</text>`).join('')}<path d="M${x} ${y+30} q-14 0 -14 -40" fill="none" stroke="#222" stroke-width="3"/></g>`;
     s+=[0,1,2].map(k=>lead([x+86+k*24,y+64],pts[k],k===1?'#222':'#e0b000')).join('');break;}
   case 'wire':{const p=pts[0],q=pts[1],d=Math.hypot(q[0]-p[0],q[1]-p[1]),bow=Math.min(28,8+d*0.12),nx=(p[1]-q[1])/(d||1),ny=(q[0]-p[0])/(d||1),mx=(p[0]+q[0])/2-nx*bow,my=(p[1]+q[1])/2-ny*bow;
     const up=my>(p[1]+q[1])/2?1:-1;
     body=`<path d="M${p[0]} ${p[1]} Q${mx} ${(p[1]+q[1])/2-Math.abs(ny*bow)-bow*0.2} ${q[0]} ${q[1]}" fill="none" stroke="#00000040" stroke-width="5.5" stroke-linecap="round" transform="translate(1 2)"/><path d="M${p[0]} ${p[1]} Q${mx} ${(p[1]+q[1])/2-Math.abs(ny*bow)-bow*0.2} ${q[0]} ${q[1]}" fill="none" stroke="${pr.color}" stroke-width="4.2" stroke-linecap="round"/>`;break;}
  }
  s+=`<g data-el="${el.id}" class="el${sel?' sel':''}">${body}</g>`;
  // pim uçları / tutamaklar
  if(!T.rigid){pts.forEach((p,i)=>{s+=`<g data-pin="${el.id}:${i}" style="cursor:grab"><circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="${ok[i]?'#c8cdd2':'#ffb3b3'}" stroke="${ok[i]?'#555':'#e63946'}" stroke-width="1.5"/></g>`;});}
  else pts.forEach((p,i)=>{s+=pinDot(p,ok[i]);});
  if(sel){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);if(el.body){xs.push(el.body[0],el.body[0]+150);ys.push(el.body[1],el.body[1]+90);}s+=`<rect x="${Math.min(...xs)-14}" y="${Math.min(...ys)-30}" width="${Math.max(...xs)-Math.min(...xs)+28}" height="${Math.max(...ys)-Math.min(...ys)+44}" rx="8" fill="none" stroke="#1d6fa5" stroke-width="1.6" stroke-dasharray="5 3" pointer-events="none"/>`;}
  return s;
}
function capCode(C){const pf=C*1e12;const e=Math.floor(Math.log10(pf))-1;return e>=0?String(Math.round(pf/Math.pow(10,e))).slice(0,2)+e:String(Math.round(pf));}
function clipSvg(k){
  const c=CLIPS[k],p=c.h?[hx(c.h[0]),hy(c.h[1])]:[c.px,c.py];
  const col={mmR:'#d62828',mmB:'#222',g1R:'#d62828',g1B:'#222',g2R:'#d62828',g2B:'#222',s1T:'#e0b400',s2T:'#1fa6cf',s1G:'#222',s2G:'#222'}[k];
  let g='';
  if(k.startsWith('mm')) g=`<path d="M0 0 L-3 -12 L-6 -40 L6 -40 L3 -12 Z" fill="${col}" stroke="#000" stroke-width=".8"/><line x1="0" y1="0" x2="0" y2="-12" stroke="#ccc" stroke-width="2"/>`;
  else if(k[0]==='g'||k[2]==='G') g=`<path d="M0 0 l-8 -10 h4 l2 -18 h4 l2 18 h4 z" fill="${col}" stroke="#000" stroke-width=".7"/><rect x="-4" y="-34" width="8" height="8" rx="2" fill="${col}"/>${k[0]==='g'?`<text y="-37" font-size="8" font-weight="800" text-anchor="middle" fill="#333">${k[1]}</text>`:''}`;
  else g=`<path d="M0 0 q-5 -6 0 -10 v-4" fill="none" stroke="#999" stroke-width="2"/><rect x="-5" y="-42" width="10" height="28" rx="4" fill="#3a3a3a"/><rect x="-5" y="-22" width="10" height="5" fill="${col}"/>`;
  return `<g data-clip="${k}" transform="translate(${p[0]} ${p[1]})" style="cursor:grab">${g}<circle r="3.2" fill="${c.h?'#fff':'none'}" stroke="${c.h?col:'none'}" stroke-width="1.5"/></g>`;
}
function renderBoard(){
  let s='';
  const order=ELS.filter(e=>e.type!=='wire').concat(ELS.filter(e=>e.type==='wire'));
  order.forEach(el=>{s+=drawEl(el);});
  // osiloskop toprak kabloları
  if(CABLEMODE!=='hide')[1,2].forEach(i=>{const t=CLIPS['s'+i+'T'],g=CLIPS['s'+i+'G'];const pt=t.h?[hx(t.h[0]),hy(t.h[1])]:[t.px,t.py],pg=g.h?[hx(g.h[0]),hy(g.h[1])]:[g.px,g.py];s+=`<path d="M${pt[0]} ${pt[1]-24} Q${(pt[0]+pg[0])/2} ${Math.max(pt[1],pg[1])+30} ${pg[0]} ${pg[1]-30}" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" opacity="${CABLEMODE==='trans'?.25:.85}"/>`;});
  CLIP_ORDER.forEach(k=>{s+=clipSvg(k);});
  $('#bdyn').innerHTML=s;
  drawnVer=VER;
}
let drawnVer=0;

/* ---------- Devre kurulumu ---------- */
const sim=new Solver.Sim();
let NETNODE=new Map(),NNODES=0,MODEL={leds:[],res:[],caps:[],srcs:[],fuseEls:[],meter:null,scopeN:[null,null],dcs:[],diodes:[]},needBuild=true,shortWarn='';
function genV(i,t){return GEN.sample(i,t)*(GEN.G.load==='50Ω'?2:1);}
function genFmax(c){return c.mod==='FM'?c.freq+c.freqDev:c.mod==='FSK'?Math.max(c.freq,c.hopFreq):(c.mod==='LIN'||c.mod==='LOG')?Math.max(c.swStart,c.swStop):c.freq;}
function build(){
  needBuild=false;
  const par=new Map();const find=a=>{while(par.has(a)&&par.get(a)!==a){a=par.get(a);}return a;};
  const add=a=>{if(!par.has(a))par.set(a,a);};const uni=(a,b)=>{add(a);add(b);const ra=find(a),rb=find(b);if(ra!==rb)par.set(ra,rb);};
  add('EARTH');
  ELS.forEach(el=>{if(el.type==='wire'){const [h0,h1]=el.pins.map(p=>netOf(p.h));if(h0&&h1)uni(h0,h1);}});
  ['g1B','g2B','s1G','s2G'].forEach(k=>{const n=netOf(CLIPS[k].h);if(n)uni(n,'EARTH');});
  const prevV=new Map();NETNODE.forEach((idx,net)=>{if(idx<sim.x.length)prevV.set(net,sim.x[idx]);});
  NETNODE=new Map();let N=0;
  const node=net=>{if(!net)return null;add(net);const r=find(net);if(r===find('EARTH'))return 0;if(!NETNODE.has(r))NETNODE.set(r,++N);return NETNODE.get(r);};
  const fresh=()=>++N;
  const S=Solver,els=[];
  MODEL={leds:[],res:[],caps:[],srcs:[],meter:null,scopeN:[null,null],dcs:[],diodes:[],node};
  let fmax=0;shortWarn='';
  ELS.forEach(el=>{
    if(el.type==='wire'||el.burnt)return;
    const nets=pinHoles(el).map(netOf),nd=nets.map(n=>n?node(n):null),pr=el.props;
    const two=()=>nd[0]!==null&&nd[1]!==null;
    const nn=i=>nd[i]===null?fresh():nd[i];
    switch(el.type){
     case 'res':if(two()){els.push(S.R(nd[0],nd[1],pr.R));MODEL.res.push({el,a:nd[0],b:nd[1]});}break;
     case 'led':if(two()){const m=fresh();els.push(S.R(nd[0],m,8));const d=S.Diode(m,nd[1],S.P.led(pr.color),el.st);els.push(d);MODEL.leds.push({el,d});}break;
     case 'diode':if(two()){const d=S.Diode(nd[0],nd[1],S.P.d1n4007,el.st);els.push(d);MODEL.diodes.push({el,d,max:3});}break;
     case 'schottky':if(two()){const d=S.Diode(nd[0],nd[1],S.P.d1n5819,el.st);els.push(d);MODEL.diodes.push({el,d,max:3});}break;
     case 'zener':if(two()){const d=S.Diode(nd[0],nd[1],S.P.zener(pr.Vz),el.st);els.push(d);MODEL.diodes.push({el,d,max:0.3});}break;
     case 'ccap':if(two()){els.push(S.Cap(nd[0],nd[1],pr.C,el.st));}break;
     case 'ecap':if(two()){els.push(S.Cap(nd[0],nd[1],pr.C,el.st));MODEL.caps.push({el,a:nd[0],b:nd[1]});}break;
     case 'ind':if(two()){els.push(S.Ind(nd[0],nd[1],pr.L,Math.max(0.2,pr.L*300),el.st));}break;
     case 'pot':{const a=nn(0),w=nn(1),b=nn(2);els.push(S.R(a,w,Math.max(0.5,pr.R*pr.pos)));els.push(S.R(w,b,Math.max(0.5,pr.R*(1-pr.pos))));break;}
     case 'btn':if(two()&&(el.pressed||pr.latch))els.push(S.R(nd[0],nd[1],0.05));break;
     case 'sw':if(two()&&pr.on)els.push(S.R(nd[0],nd[1],0.05));break;
     case 'mos':{const g=nn(0),d=nn(1),s=nn(2);els.push(S.Mos(g,d,s,S.P.irfz44n,el.st));el.st.body=el.st.body||{};els.push(S.Diode(s,d,S.P.body,el.st.body));els.push(S.R(g,s,1e7));break;}
     case 'bat':if(two()){if(nd[0]===nd[1])shortWarn='9 V pilin uçları kısa devre!';const v=S.Vsrc(nd[0],nd[1],()=>pr.V,1.5);els.push(v);MODEL.srcs.push({el,v,max:3,name:'9 V pil'});}break;
     case 'dcs':if(two()){el.st.dc=el.st.dc||{};const v=S.Vlim(nd[0],nd[1],()=>pr.V,0.05,pr.I,el.st.dc);els.push(v);MODEL.dcs.push({el,v});}break;
     case 'trafo':{fmax=Math.max(fmax,50);const a=nn(0),ct=nn(1),b=nn(2),vp=pr.Vrms*Math.SQRT2;const v1=S.Vsrc(a,ct,t=>vp*Math.sin(2*Math.PI*50*t),0.6),v2=S.Vsrc(ct,b,t=>vp*Math.sin(2*Math.PI*50*t),0.6);els.push(v1,v2);MODEL.srcs.push({el,v:v1,max:2,name:'trafo'},{el,v:v2,max:2,name:'trafo'});break;}
    }
  });
  // jeneratör
  [0,1].forEach(i=>{const c=GEN.CH[i],r=netOf(CLIPS['g'+(i+1)+'R'].h);if(c.on&&r!==null){const n=node(r);els.push(Solver.Vsrc(n,0,t=>genV(i,t),50));if(c.wave!=='dc'&&c.wave!=='noise')fmax=Math.max(fmax,genFmax(c));else fmax=Math.max(fmax,1000);}});
  // osiloskop
  [0,1].forEach(i=>{const t=netOf(CLIPS['s'+(i+1)+'T'].h);if(t!==null){const n=node(t);MODEL.scopeN[i]=n;els.push(Solver.R(n,0,1e6*(Scope.S.phys[i]===10?10:1)));}});
  // multimetre
  const mr=netOf(CLIPS.mmR.h),mb=netOf(CLIPS.mmB.h);
  if(mr!==null&&mb!==null){
    const r=node(mr),b=node(mb),m=MM.mtype(),M={r,b,rsh:0,kind:'open'};
    if(MM.S.jack==='10A'){if(MM.S.fuseA){els.push(Solver.R(r,b,0.01));M.rsh=0.01;M.kind='shunt10';}}
    else if(m==='I_UA'||m==='I_MA'){if(MM.S.fuseMA){const rs=m==='I_UA'?100:1;els.push(Solver.R(r,b,rs));M.rsh=rs;M.kind='shuntmA';}}
    else if(m==='R'||m==='CONT'){els.push(Solver.Vsrc(r,b,()=>3,10000));M.kind='ohm';M.rint=10000;}
    else if(m==='DIODE'){els.push(Solver.Vsrc(r,b,()=>3,2000));M.kind='ohm';M.rint=2000;}
    else if(m!=='OFF'&&m!=='HFE'&&m!=='NCV'){els.push(Solver.R(r,b,10e6));M.kind='volt';}
    MODEL.meter=M;
  }
  const dt=fmax>0?Math.min(1e-4,Math.max(1e-7,1/(fmax*200))):1e-4;
  sim.setup(N,els,dt);
  NETNODE.forEach((idx,net)=>{if(prevV.has(net))sim.x[idx]=prevV.get(net);});
  NNODES=N;
}

/* ---------- Kayıt halkaları ---------- */
const RCAP=1<<18,RM=RCAP-1;
const RING={t:new Float64Array(RCAP),a:new Float32Array(RCAP),b:new Float32Array(RCAP),head:0,n:0,ver:0};
const MCAP=1<<16,MMSK=MCAP-1;
const MRING={t:new Float64Array(MCAP),v:new Float32Array(MCAP),i:new Float32Array(MCAP),head:0,n:0};
function record(){
  const x=sim.x,t=sim.t,noise=()=>(Math.random()-.5)*0.002;
  const n1=MODEL.scopeN[0],n2=MODEL.scopeN[1];
  const h=RING.head;RING.t[h]=t;RING.a[h]=n1!==null?x[n1]+noise()*0.2:noise();RING.b[h]=n2!==null?x[n2]+noise()*0.2:noise();
  RING.head=(h+1)&RM;if(RING.n<RCAP)RING.n++;
  const M=MODEL.meter;
  if(M){const v=x[M.r]-x[M.b],k=MRING.head;MRING.t[k]=t;MRING.v[k]=v;MRING.i[k]=M.rsh?v/M.rsh:0;MRING.head=(k+1)&MMSK;if(MRING.n<MCAP)MRING.n++;
    const dt=sim.dt;
    if(M.kind==='shuntmA'){M.ie=(M.ie||0)+(Math.abs(v/M.rsh)-(M.ie||0))*Math.min(1,dt/2e-3);if(M.ie>0.5)ev.fuseMA=true;}
    if(M.kind==='shunt10'){M.ie=(M.ie||0)+(Math.abs(v/M.rsh)-(M.ie||0))*Math.min(1,dt/5e-3);if(M.ie>11)ev.fuseA=true;}
  }
  const dt=sim.dt;
  for(const L of MODEL.leds){const i=L.d.i||0,st=L.el.st;st.ia=(st.ia||0)+(Math.max(0,i)-(st.ia||0))*Math.min(1,dt/4e-3);if(st.ia>0.06&&!L.el._f){L.el._f=1;ev.burn.push(L.el);}}
  for(const R of MODEL.res){const v=x[R.a]-x[R.b],st=R.el.st;st.p=(st.p||0)+(v*v/R.el.props.R-(st.p||0))*Math.min(1,dt/0.03);if(st.p>1.0&&!R.el._f){R.el._f=1;ev.burn.push(R.el);}}
  for(const C of MODEL.caps){const v=x[C.a]-x[C.b];if((v<-1.5||v>C.el.props.Vmax*1.15)&&!C.el._f){C.el._f=1;ev.burn.push(C.el);}}
  for(const D of MODEL.diodes){const st=D.el.st;st.ia=(st.ia||0)+(Math.abs(D.d.i||0)-(st.ia||0))*Math.min(1,dt/0.01);if(st.ia>D.max&&!D.el._f){D.el._f=1;ev.burn.push(D.el);}}
  for(const Sx of MODEL.srcs){const i=Math.abs(Sx.v.cur(x));Sx.ia=(Sx.ia||0)+(i-(Sx.ia||0))*Math.min(1,dt/0.01);if(Sx.ia>Sx.max)ev.short=Sx.name;}
}
let ev={burn:[],fuseMA:false,fuseA:false,short:null};
function handleEvents(){
  let said=false;
  if(ev.fuseMA&&MM.S.fuseMA){said=true;MM.S.fuseMA=false;needBuild=true;say('💥 Multimetrenin mA sigortası attı! Akım konumunda gerilim kaynağına paralel bağlandı ya da akım 400 mA\'i aştı. "Sigortayı değiştir" ile yenile.','bad');}
  if(ev.fuseA&&MM.S.fuseA){said=true;MM.S.fuseA=false;needBuild=true;say('💥 Multimetrenin 10A sigortası attı! 10A girişi kısa devre gibi davranır; gerilim ölçerken kırmızı prob bu girişte kalmamalı.','bad');}
  const seen=new Set();
  ev.burn.forEach(el=>{if(seen.has(el)||el.burnt)return;seen.add(el);el.burnt=true;needBuild=true;VER++;
    const msg={led:'💨 LED yandı! Akımı sınırlayan direnç yoktu ya da çok küçüktü (LED akımı 20 mA civarında olmalı).',res:'💨 Direnç yandı! Üzerindeki güç 0.25 W sınırının çok üstündeydi (P = V²/R).',ecap:'💥 Elektrolitik kondansatör patladı! Ters bağlandı ya da gerilim sınırı aşıldı.',diode:'💨 Diyot aşırı akımdan yandı!',schottky:'💨 Diyot aşırı akımdan yandı!',zener:'💨 Zener aşırı akımdan yandı! Seri direnç kullan.'}[el.type]||'Eleman yandı.';
    say(msg+' Elemanı seçip "Yenile" ile değiştirebilirsin.','bad');said=true;});
  if(ev.short&&ev.short!==lastShort&&!said){say(`⚠ Kısa devre: ${ev.short} çok yüksek akım veriyor! Bağlantıları kontrol et (osiloskop/jeneratör toprak klipsleri şebeke toprağına bağlıdır).`,'bad');lastShort=ev.short;}
  if(!ev.short)lastShort=null;
  ev={burn:[],fuseMA:false,fuseA:false,short:null};
}
let lastShort=null;

/* ---------- Osiloskop bağlantısı (örnekli mod) ---------- */
const ridx=k=>(RING.head-RING.n+k+RCAP)&RM;
function rTime(k){return RING.t[ridx(k)];}
function rVal(ch,k){return (ch?RING.b:RING.a)[ridx(k)];}
function rFind(t){let lo=0,hi=RING.n-1;if(hi<0)return -1;if(t<=rTime(0))return 0;if(t>=rTime(hi))return hi;while(hi-lo>1){const m=(lo+hi)>>1;if(rTime(m)<=t)lo=m;else hi=m;}return lo;}
const scopeHost={
  getSignals:()=>[null,null],
  sample(ch,t){if(RING.n<2)return 0;const k=rFind(t);if(k>=RING.n-1)return rVal(ch,RING.n-1);const t0=rTime(k),t1=rTime(k+1),v0=rVal(ch,k),v1=rVal(ch,k+1);if(t<=t0)return v0;return v0+(v1-v0)*(t-t0)/(t1-t0||1);},
  now:()=>RING.n?rTime(RING.n-1):0,
  tStart:()=>RING.n?rTime(0):0,
  mean(ch){if(meanCache[ch].ver===RING.ver)return meanCache[ch].v;let s=0,c=0;const tEnd=scopeHost.now(),k0=rFind(tEnd-0.1);for(let k=k0;k<RING.n;k++){s+=rVal(ch,k);c++;}meanCache[ch]={ver:RING.ver,v:c?s/c:0};return meanCache[ch].v;},
  findCross(ch,L,rise,tMin,tMax){let k=rFind(tMax);const k0=rFind(tMin);for(;k>k0;k--){const a=rVal(ch,k-1),b=rVal(ch,k);if(rise?(a<L&&b>=L):(a>L&&b<=L)){const t0=rTime(k-1),t1=rTime(k);return t0+(t1-t0)*(L-a)/(b-a);}}return null;},
  stats(ch){
    if(RING.n<10)return null;const tEnd=scopeHost.now(),k0=rFind(tEnd-0.1);let mx=-1e9,mn=1e9,s=0,c=0;
    for(let k=k0;k<RING.n;k++){const v=rVal(ch,k);if(v>mx)mx=v;if(v<mn)mn=v;s+=v;c++;}
    const mid=(mx+mn)/2,hys=(mx-mn)*0.1;let st=0,first=null,last=null,cnt=0;
    if(mx-mn>0.004)for(let k=k0;k<RING.n;k++){const v=rVal(ch,k);if(st<=0&&v>mid+hys){if(st<0){const t=rTime(k);if(first===null)first=t;last=t;cnt++;}st=1;}else if(st>=0&&v<mid-hys){st=-1;}}
    const freq=cnt>=2&&last>first?(cnt-1)/(last-first):null;
    return {vmax:mx,vmin:mn,mean:s/c,freq,wave:null,duty:50};
  }
};
const meanCache=[{ver:-1,v:0},{ver:-1,v:0}];

/* ---------- Multimetre okuması ---------- */
function rng(v,ranges){const a=Math.abs(v);for(const [max,dec,sc,u] of ranges){if(a<max)return {num:(v/sc).toFixed(dec),unit:u};}const r=ranges[ranges.length-1];return {num:'OL',unit:r[3]};}
function meterStats(){
  if(MRING.n<4)return null;const tEnd=MRING.t[(MRING.head-1)&MMSK];let sv=0,si=0,c=0,sv2=0,si2=0;const vs=[],ts=[];
  for(let k=1;k<=MRING.n;k++){const j=(MRING.head-k)&MMSK;const t=MRING.t[j];if(tEnd-t>0.2)break;const v=MRING.v[j],i=MRING.i[j];sv+=v;si+=i;sv2+=v*v;si2+=i*i;c++;if(c%2===0){vs.push(v);ts.push(t);}}
  const vm=sv/c,im=si/c;const vac=Math.sqrt(Math.max(0,sv2/c-vm*vm)),iac=Math.sqrt(Math.max(0,si2/c-im*im));
  let mx=-1e9,mn=1e9;vs.forEach(v=>{if(v>mx)mx=v;if(v<mn)mn=v;});
  let freq=null;if(mx-mn>0.05){const mid=(mx+mn)/2,h=(mx-mn)*0.1;let st=0,cnt=0,f=null,l=null;for(let k=vs.length-1;k>=0;k--){const v=vs[k];if(st<=0&&v>mid+h){if(st<0){if(f===null)f=ts[k];l=ts[k];cnt++;}st=1;}else if(st>=0&&v<mid-h)st=-1;}if(cnt>=2&&l>f)freq=(cnt-1)/(l-f);}
  return {vm,im,vac,iac,freq,span:c};
}
function capBetween(){
  const a=netOf(CLIPS.mmR.h),b=netOf(CLIPS.mmB.h);if(!a||!b)return null;const na=MODEL.node(a),nb=MODEL.node(b);
  let C=0;ELS.forEach(el=>{if((el.type==='ccap'||el.type==='ecap')&&!el.burnt){const n=pinHoles(el).map(netOf).map(x=>x?MODEL.node(x):null);if((n[0]===na&&n[1]===nb)||(n[0]===nb&&n[1]===na))C+=el.props.C;}});
  return na===nb?0:C;
}
function meterReading(){
  const m=MM.mtype();
  const R={num:'',unit:'',ac:false,beep:false,diode:false,cont:false,level:-1,auto:true,off:false,tag:''};
  if(m==='OFF'){R.off=true;return R;}
  const M=MODEL.meter,st=M?meterStats():null,acSel=MM.S.sel===1;
  if((m==='I_UA'||m==='I_MA'||m==='I_A')&&acSel)R.ac=true;
  if(m==='VAC')R.ac=true;
  if(m==='DIODE'){R.diode=true;R.auto=false;}if(m==='CONT')R.cont=true;
  if(m==='HFE'){R.auto=false;R.tag='hFE';R.num='0';return R;}
  if(m==='NCV'){R.auto=false;R.level=ELS.some(e=>e.type==='trafo')?1:0;R.num='EF';return R;}
  const z={VDC:['0.000','V'],VAC:['0.000','V'],MV:['0.0','mV'],R:['OL','MΩ'],CONT:['OL','Ω'],DIODE:['OL','V'],CAP:['0.000','nF'],HZ:['0.000','Hz'],I_UA:['0.0','μA'],I_MA:['0.00','mA'],I_A:['0.00','A']}[m];
  if(!st){R.num=z[0];R.unit=z[1];return R;}
  const VR=[[4,3,1,'V'],[40,2,1,'V'],[400,1,1,'V'],[1000,0,1,'V']];
  const wrongJack=(MM.S.jack==='10A')!==(m==='I_A');
  if(m==='VDC'||m==='VAC'||m==='MV'||m==='HZ'||m==='CAP'||m==='R'||m==='CONT'||m==='DIODE'||m==='I_UA'||m==='I_MA'||m==='I_A'){if(wrongJack&&!(MM.S.jack==='10A'&&m!=='I_A')){/* devam */}}
  if(MM.S.jack==='10A'&&m!=='I_A'){R.num=z[0];R.unit=z[1];return R;}
  switch(m){
    case 'VDC':Object.assign(R,rng(st.vm,VR));break;
    case 'VAC':Object.assign(R,rng(st.vac,[[4,3,1,'V'],[40,2,1,'V'],[400,1,1,'V'],[750,0,1,'V']]));break;
    case 'MV':Object.assign(R,rng(st.vm,[[0.4,1,1e-3,'mV']]));break;
    case 'HZ':if(st.freq)Object.assign(R,rng(st.freq,[[10,3,1,'Hz'],[100,2,1,'Hz'],[1000,1,1,'Hz'],[1e4,3,1e3,'kHz'],[1e5,2,1e3,'kHz'],[1e6,1,1e3,'kHz'],[1e7,3,1e6,'MHz']]));else{R.num='0.000';R.unit='Hz';}break;
    case 'R':case 'CONT':{const v=st.vm,i=(3-v)/M.rint;const r=i>1e-9?v/i:Infinity;
      if(m==='CONT'){if(r<400&&r>=0){Object.assign(R,rng(r,[[400,1,1,'Ω']]));if(r<50)R.beep=true;}else{R.num='OL';R.unit='Ω';}}
      else{if(r<0){R.num='-'+'OL';R.unit='Ω';}else Object.assign(R,rng(r,[[400,1,1,'Ω'],[4000,3,1e3,'kΩ'],[4e4,2,1e3,'kΩ'],[4e5,1,1e3,'kΩ'],[4e6,3,1e6,'MΩ'],[4e7,2,1e6,'MΩ']]));}
      break;}
    case 'DIODE':{const v=st.vm;if(v>2.0||v<-0.05){R.num='OL';R.unit='V';}else Object.assign(R,rng(v,[[3,3,1,'V']]));break;}
    case 'CAP':{const C=capBetween();if(C===null){R.num='0.000';R.unit='nF';}else if(C===0){R.num='0.000';R.unit='nF';}else Object.assign(R,rng(C,[[4e-9,3,1e-9,'nF'],[4e-8,2,1e-9,'nF'],[4e-7,1,1e-9,'nF'],[4e-6,3,1e-6,'μF'],[4e-5,2,1e-6,'μF'],[4e-4,1,1e-6,'μF'],[4e-3,3,1e-3,'mF']]));break;}
    case 'I_UA':{if(!MM.S.fuseMA){R.num='0.0';R.unit='μA';break;}const i=acSel?st.iac:st.im;Object.assign(R,rng(i,[[4e-4,1,1e-6,'μA'],[4e-3,0,1e-6,'μA']]));break;}
    case 'I_MA':{if(!MM.S.fuseMA){R.num='0.00';R.unit='mA';break;}const i=acSel?st.iac:st.im;Object.assign(R,rng(i,[[0.04,2,1e-3,'mA'],[0.4,1,1e-3,'mA']]));break;}
    case 'I_A':{if(MM.S.jack!=='10A'){R.num='0.00';R.unit='A';break;}if(!MM.S.fuseA){R.num='0.00';R.unit='A';break;}const i=acSel?st.iac:st.im;Object.assign(R,rng(i,[[10,2,1,'A'],[20,1,1,'A']]));break;}
  }
  R.val=m==='VDC'?st.vm:m==='VAC'?st.vac:(m==='I_MA'||m==='I_UA'||m==='I_A')?(acSel?st.iac:st.im):null;
  return R;
}
let lastMeter=null;

/* ---------- Canlı görsel güncelleme ---------- */
function liveUpdate(){
  MODEL.leds.forEach(L=>{const g=document.getElementById('glow'+L.el.id),c=document.getElementById('core'+L.el.id);if(!g)return;const b=Math.max(0,Math.min(1.2,Math.sqrt((L.el.st.ia||0)/0.02)));g.setAttribute('opacity',Math.min(1,b*0.95).toFixed(3));g.setAttribute('r',(10+14*Math.min(1,b)).toFixed(1));c.setAttribute('opacity',Math.min(1,b*1.1).toFixed(3));});
  MODEL.res.forEach(R=>{const h=document.getElementById('heat'+R.el.id);if(h)h.setAttribute('opacity',Math.max(0,Math.min(0.8,((R.el.st.p||0)-0.25)/0.6)).toFixed(2));});
  MODEL.dcs.forEach(D=>{const st=D.el.st.dc||{},v=document.getElementById('dcsV'+D.el.id),i=document.getElementById('dcsI'+D.el.id);if(v){v.textContent=(st.mode==='cc'?Math.max(0,st.vout||0):D.el.props.V).toFixed(2)+'V';i.textContent=Math.max(0,st.i||0).toFixed(3)+'A';document.getElementById('dcsCC'+D.el.id).setAttribute('fill',st.mode==='cc'?'#ff3b1f':'#555');document.getElementById('dcsCV'+D.el.id).setAttribute('fill',st.mode==='cc'?'#555':'#2fbf4f');}});
}

/* ---------- Kablo katmanı (cihaz → klips) ---------- */
const overlay=$('#overlay'),bench=$('#bench');
function centerOf(el){const r=el.getBoundingClientRect(),b=bench.getBoundingClientRect();return [r.left+r.width/2-b.left,r.top+r.height/2-b.top];}
function boardPt(x,y){const m=board.getScreenCTM();const pt=board.createSVGPoint();pt.x=x;pt.y=y;const q=pt.matrixTransform(m);const b=bench.getBoundingClientRect();return [q.x-b.left,q.y-b.top];}
function clipPt(k,dy){const c=CLIPS[k],p=c.h?[hx(c.h[0]),hy(c.h[1])]:[c.px,c.py];return boardPt(p[0],p[1]+dy);}
function cable(a,b,col,w,down){const d=Math.hypot(b[0]-a[0],b[1]-a[1]);const s=Math.min(220,60+d*0.25);const c1=[a[0],a[1]+(down?s:-s)],c2=[b[0],b[1]-s*0.8];return `<g opacity=".78"><path d="M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}" fill="none" stroke="#00000030" stroke-width="${w+2.5}" stroke-linecap="round"/><path d="M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/></g>`;}
let CABLEMODE='normal';try{CABLEMODE=localStorage.getItem('simCableMode')||'normal';}catch(e){}
function drawOverlay(){
  overlay.style.opacity=CABLEMODE==='trans'?'0.22':'1';
  if(CABLEMODE==='hide'){if(overlay.innerHTML)overlay.innerHTML='';return;}
  const b=bench.getBoundingClientRect();overlay.setAttribute('width',b.width);overlay.setAttribute('height',b.height);overlay.setAttribute('viewBox',`0 0 ${b.width} ${b.height}`);
  let s='';
  const jr=MM.jackEl(MM.S.jack),jc=MM.jackEl('COM');
  if(jr&&jc){s+=cable(centerOf(jc),clipPt('mmB',-40),'#1b1b1b',4,true)+cable(centerOf(jr),clipPt('mmR',-40),'#c81e1e',4,true);}
  [0,1].forEach(i=>{const o=GEN.outEl(i);if(!o)return;const a=centerOf(o);s+=cable(a,clipPt('g'+(i+1)+'B',-34),'#2b2b2b',3.5,true)+cable(a,clipPt('g'+(i+1)+'R',-34),'#c81e1e',3.5,true);});
  [1,2].forEach(i=>{const o=document.querySelector(`#scopeRoot [data-si="bnc${i}"] circle`);if(!o)return;s+=cable(centerOf(o),clipPt('s'+i+'T',-42),i===1?'#8a7a2a':'#2a6f8a',5,true);});
  overlay.innerHTML=s;
}
