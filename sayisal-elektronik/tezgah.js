/* =====================================================================
   Tezgâh: eğitim setinin her bölümü ve gerçek cihazlar (RIGOL osiloskop,
   UTG932E jeneratör, UT136B+ multimetre) taşınabilir kartlardır.
   - Kart başlığından sürükle, ⟳ ile 90° döndür, × ile gizle; “▦ Bölümler” menüsünden geri ekle.
   - Düzen tarayıcıda saklanır. Kartlar arasındaki kablolar ve ölçümler aynen çalışır.
   Ana betikten SONRA yüklenir (ana betiğin globallerini kullanır).
   ===================================================================== */
'use strict';
const TZ=(()=>{
const KEY='y16-tezgah-v1';
{const st=document.createElement('style');st.textContent=`
.tcard .tbar{top:0!important;height:18px!important;border-radius:6px 6px 0 0!important;opacity:0!important;pointer-events:none!important;z-index:6}
body.tz-edit .tcard .tbar,.tcard.drag .tbar,.tcard.inst .tbar.tbar-show{opacity:1!important;pointer-events:auto!important}
.jack{z-index:12!important}
.tog,.knob,.btn3,.pw,.hot{z-index:11!important}
.tz-guide{position:absolute;pointer-events:none;z-index:35;display:none}
.tz-guide.x{width:0;border-left:1.5px dashed #1d6fa5;box-shadow:0 0 4px #1d6fa588}
.tz-guide.y{height:0;border-top:1.5px dashed #1d6fa5;box-shadow:0 0 4px #1d6fa588}
`;document.head.append(st)}
/* setin bölümleri: [kimlik, başlık, x, y, g, y (panel koordinatı), varsayılan gizli] */
const SECS=[
  ['power','Güç anahtarı',50,46,60,154],['logo','Logo',110,46,114,154,1],
  ['psu','Ayarlı güç kaynağı',224,46,302,154],['dc12','±12 V simetrik kaynak',526,46,100,154],['ac','AC simetrik kaynak',628,46,112,154],
  ['input','Giriş birimleri',46,201,301,106],['fg','Fonksiyon jeneratörü (set)',46,306,301,82],
  ['output','Çıkış birimleri',346,201,394,89],['hex','Hex kod çözücü',346,288,196,100],['logic','Lojik gösterge',540,288,200,100],
  ['osc','Osilatör',46,390,196,156],['pulse','Pals',46,546,196,56],['one','Tek atımlık pals',46,601,196,70],['sr','Set / Reset pals',46,670,196,77],
  ['bin','İkili anahtarlar',240,390,99,357],['ttl','TTL kaynak (±5 V)',343,390,49,357],['slot','Modül yuvası',396,388,350,358]];
const INST=[['scope','Osiloskop · RIGOL DS1202Z-E',480,250],['gen','Fonksiyon jeneratörü · UNI-T UTG932E',450,303],['mm','Multimetre · UNI-T UT136B+',200,364],['basic','Basit ölçer · LCR metre',540,176,1]];
const DEF={scope:[790,40],gen:[790,320],mm:[1290,40],basic:[790,650]};
const C={};let PMARK='';
const rot=(c)=>c.r%180?[c.h,c.w]:[c.w,c.h];
function save(){try{const o={};for(const k in C){const c=C[k];o[k]={x:c.x,y:c.y,r:c.r,hid:c.hid}}localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}

/* ---------- kart oluşturma ---------- */
function mkCard(id,title,w,h,kind){
  const el=h_('div',{class:'tcard '+kind,'data-card':id}),inn=h_('div',{class:'tin'+(kind==='inst'?' tinst':'')}),bar=h_('div',{class:'tbar',title:'Sürükleyerek taşıyın'});
  const rb=h_('button',{title:'90° döndür'},'⟳'),xb=h_('button',{title:'Gizle (▦ Bölümler menüsünden geri eklenir)'},'×');
  bar.append(h_('b',{},title));if(kind!=='inst')bar.append(rb);bar.append(xb);el.append(inn,bar);TR.append(el);
  const c={id,title,el,inn,w,h,x:0,y:0,r:0,hid:false,kind};C[id]=c;
  rb.onclick=e=>{e.stopPropagation();rotate(c)};xb.onclick=e=>{e.stopPropagation();setHidden(c,true)};
  bar.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();e.stopPropagation();bar.setPointerCapture(e.pointerId);
    const s=VW.s0*VW.z,st={x:e.clientX,y:e.clientY,cx:c.x,cy:c.y};el.classList.add('drag');
    const mv=ev=>{
      let rx=st.cx+(ev.clientX-st.x)/s,ry=st.cy+(ev.clientY-st.y)/s;
      if(ev.altKey){c.x=Math.round(rx);c.y=Math.round(ry);hideGuides();place(c);return}
      const sn=snapPos(c,rx,ry);c.x=sn.x;c.y=sn.y;place(c);
    };
    const up=()=>{bar.removeEventListener('pointermove',mv);bar.removeEventListener('pointerup',up);el.classList.remove('drag');hideGuides();save();bounds(false)};
    bar.addEventListener('pointermove',mv);bar.addEventListener('pointerup',up);bar.addEventListener('pointercancel',up)});
  if(kind==='inst'){
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();bar.classList.toggle('tbar-show',e.clientY-r.top<=20)});
    el.addEventListener('pointerleave',()=>bar.classList.remove('tbar-show'));
  }
  return c}
const h_=(t,p,...k)=>h(t,p,...k);
let gX=null,gY=null;
function ensureGuides(){if(!gX){gX=h_('div',{class:'tz-guide x'});gY=h_('div',{class:'tz-guide y'});TR.append(gX,gY)}}
function hideGuides(){if(gX){gX.style.display='none';gY.style.display='none'}}
function snapPos(c,rx,ry){
  ensureGuides();
  const[W,H]=rot(c),TH=10;
  let bx=null,by=null,dxMin=TH,dyMin=TH,gx=null,gy=null,gxSpan=null,gySpan=null;
  const tryX=(tx,lineX,y0,y1)=>{const d=Math.abs(rx-tx);if(d<dxMin){dxMin=d;bx=tx;gx=lineX;gxSpan=[Math.min(ry,y0)-12,Math.max(ry+H,y1)+12]}};
  const tryY=(ty,lineY,x0,x1)=>{const d=Math.abs(ry-ty);if(d<dyMin){dyMin=d;by=ty;gy=lineY;gySpan=[Math.min(rx,x0)-12,Math.max(rx+W,x1)+12]}};
  // Kendi varsayılan yuvasına (orijinal konumuna) mıknatıslanma
  const defX=c.sx!==undefined?c.sx:(DEF[c.id]?DEF[c.id][0]:null),defY=c.sy!==undefined?c.sy:(DEF[c.id]?DEF[c.id][1]:null);
  if(defX!==null&&c.r===0){tryX(defX,defX,defY,defY+H);tryY(defY,defY,defX,defX+W)}
  // Diğer görünür kartların kenarlarına ve hizalarına mıknatıslanma
  const gap=c.kind==='sec'?2:10;
  for(const k in C){
    const o=C[k];if(o===c||o.hid)continue;
    const[oW,oH]=rot(o),ox=o.x,oy=o.y,ox2=ox+oW,oy2=oy+oH;
    const nearY=Math.max(ry-oy2,oy-(ry+H))<120,nearX=Math.max(rx-ox2,ox-(rx+W))<120;
    // Sol-sol, sağ-sağ, merkez-merkez hizalamaları
    tryX(ox,ox,oy,oy2);
    tryX(ox2-W,ox2,oy,oy2);
    tryX(Math.round(ox+oW/2-W/2),Math.round(ox+oW/2),oy,oy2);
    // Üst-üst, alt-alt, merkez-merkez hizalamaları
    tryY(oy,oy,ox,ox2);
    tryY(oy2-H,oy2,ox,ox2);
    tryY(Math.round(oy+oH/2-H/2),Math.round(oy+oH/2),ox,ox2);
    // Yan yana bitişik yapışma (kenar kenara + standart boşluklu)
    if(nearY){
      tryX(ox2+gap,ox2,oy,oy2);tryX(ox2,ox2,oy,oy2);
      tryX(ox-W-gap,ox,oy,oy2);tryX(ox-W,ox,oy,oy2);
    }
    // Alt-üst bitişik yapışma (kenar kenara + standart boşluklu)
    if(nearX){
      tryY(oy2+gap,oy2,ox,ox2);tryY(oy2,oy2,ox,ox2);
      tryY(oy-H-gap,oy,ox,ox2);tryY(oy-H,oy,ox,ox2);
    }
  }
  const fx=bx!==null?bx:Math.round(rx/4)*4,fy=by!==null?by:Math.round(ry/4)*4;
  if(gx!==null){gX.style.display='block';gX.style.left=gx+'px';gX.style.top=gxSpan[0]+'px';gX.style.height=(gxSpan[1]-gxSpan[0])+'px'}else gX.style.display='none';
  if(gy!==null){gY.style.display='block';gY.style.top=gy+'px';gY.style.left=gySpan[0]+'px';gY.style.width=(gySpan[1]-gySpan[0])+'px'}else gY.style.display='none';
  return{x:fx,y:fy};
}
function place(c){const[W,H]=rot(c);const s=c.el.style;s.left=c.x+'px';s.top=c.y+'px';s.width=W+'px';s.height=H+'px';s.display=c.hid?'none':'';
  const i=c.inn.style;i.width=c.w+'px';i.height=c.h+'px';i.left=(W-c.w)/2+'px';i.top=(H-c.h)/2+'px';i.transform=c.r?`rotate(${c.r}deg)`:''}
/* alt alta duran yazı satırlarını (aynı hizalı, ≤12 px aralıklı) tek blok say; blok kendi merkezinde döner */
function textBlocks(svg){const T=[...svg.querySelectorAll('text')].map(t=>({t,x:+t.getAttribute('x'),y:+t.getAttribute('y'),s:+(t.getAttribute('font-size')||6),a:t.getAttribute('text-anchor')||'start'}));
  T.sort((p,q)=>p.y-q.y);const B=[];
  for(const p of T){const b=B.find(b=>b.a===p.a&&Math.abs(b.x-p.x)<3&&p.y-b.y1<=12&&p.y>b.y1);if(b){b.items.push(p);b.y1=p.y}else B.push({a:p.a,x:p.x,y0:p.y,y1:p.y,s:p.s,items:[p]})}
  return B.map(b=>{const w=Math.max(...b.items.map(i=>i.t.textContent.length))*b.s*0.5,cx=b.a==='middle'?b.x:b.a==='end'?b.x-w/2:b.x+w/2;return{items:b.items,cx,cy:(b.y0+b.y1)/2-b.s*0.35}})}
function counter(c){ // döndürülmüş kartta yazılar ve ekranlar dik kalsın
  if(c.svg){if(!c.blocks)c.blocks=textBlocks(c.svg);for(const b of c.blocks)for(const i of b.items){if(c.r)i.t.setAttribute('transform',`rotate(${-c.r} ${b.cx.toFixed(1)} ${b.cy.toFixed(1)})`);else i.t.removeAttribute('transform')}}
  c.inn.querySelectorAll(':scope>canvas.disp').forEach(cv=>cv.style.transform=c.r?`rotate(${-c.r}deg)`:'');
  c.inn.querySelectorAll('.dcp svg text').forEach(t=>{if(c.r)t.setAttribute('transform',`rotate(${-c.r} ${t.getAttribute('x')} ${t.getAttribute('y')})`);else t.removeAttribute('transform')})}
function rotate(c){const[W0,H0]=rot(c),cx=c.x+W0/2,cy=c.y+H0/2;c.r=(c.r+90)%360;const[W,H]=rot(c);c.x=Math.round(cx-W/2);c.y=Math.round(cy-H/2);place(c);counter(c);save();bounds(false)}
function setHidden(c,v){c.hid=v;place(c);save();bounds(true);menuSync();
  if(v&&wires.some(w=>cardOf(w.a)===c||cardOf(w.b)===c))toast('“'+c.title+'” gizlendi; ona bağlı kablolar görünmez ama bağlı kalır.',3500)}
function cardOf(j){const el=J[j]&&J[j].el;if(!el)return null;const k=el.closest('[data-card]');return k?C[k.dataset.card]:null}

/* ---------- çalışma alanı sınırları ve bölge düğmeleri ---------- */
function bbox(ids){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const k of ids){const c=C[k];if(!c||c.hid)continue;const[W,H]=rot(c);x0=Math.min(x0,c.x);y0=Math.min(y0,c.y-22);x1=Math.max(x1,c.x+W);y1=Math.max(y1,c.y+H)}
  return x0>x1?null:[x0-10,y0-6,x1-x0+20,y1-y0+16]}
const GROUPS={all:null,dig:['osc','pulse','one','sr','bin','ttl','hex','logic','slot'],mod:['bin','ttl','slot'],m:['slot'],top:['power','psu','dc12','ac'],ins:['scope','gen','mm']};
function bounds(refit){const all=bbox(Object.keys(C))||[0,0,768,799];[WS.x,WS.y,WS.w,WS.h]=all;
  for(const k in GROUPS){const b=GROUPS[k]?bbox(GROUPS[k]):all;REG[k]=[REG[k]?REG[k][0]:'Cihazlar',...(b||all)]}
  if(refit)fit()}

/* ---------- menü ---------- */
let menu=null;
function menuSync(){if(!menu)return;menu.querySelectorAll('input[data-k]').forEach(i=>i.checked=!C[i.dataset.k].hid)}
function buildMenu(){
  const zb=$('#zoombar');const btn=h_('button',{title:'Setin bölümlerini ve cihazları göster / gizle, düzeni sıfırla'},'▦ Bölümler');zb.insertBefore(btn,zb.children[4]);
  const eb=h_('button',{title:'Kart başlıklarını aç/kapat (bölümleri taşımak, döndürmek veya gizlemek için)'},'✥ Kartları Taşı');
  eb.onclick=e=>{e.stopPropagation();const on=document.body.classList.toggle('tz-edit');eb.classList.toggle('act',on)};
  zb.insertBefore(eb,btn.nextSibling);
  const ib=h_('button',{title:'Gerçek cihazlara odaklan','data-r':'ins'},'Cihazlar');ib.onclick=e=>{e.stopPropagation();focusReg('ins')};zb.insertBefore(ib,btn.nextSibling);
  menu=h_('div',{id:'tzmenu'});
  const sec=(t,list)=>{menu.append(h_('div',{class:'tzh'},t));const g=h_('div',{class:'tzg'});list.forEach(([k])=>{const c=C[k],i=h_('input',{type:'checkbox','data-k':k});i.checked=!c.hid;i.onchange=()=>setHidden(c,!i.checked);g.append(h_('label',{},i,' '+c.title))});menu.append(g)};
  sec('Eğitim seti',SECS);sec('Ölçü aletleri',INST);
  const row=h_('div',{class:'tzr'});
  [['Otomatik yerleştir',()=>pack(),'Görünen kartları boşluksuz yerleştirir'],['Varsayılan düzen',()=>reset(),'Seti orijinal düzenine döndürür'],['Hepsini göster',()=>{for(const k in C)if(k!=='logo'&&k!=='basic')C[k].hid=false;for(const k in C)place(C[k]);save();menuSync();bounds(true)}]]
    .forEach(([t,f,ti])=>{const b=h_('button',{title:ti||''},t);b.onclick=e=>{e.stopPropagation();f()};row.append(b)});
  menu.append(row,h_('div',{class:'tzi'},'Kartı başlığından sürükleyin; ⟳ döndürür, × gizler. Kablolar bağlı kalır.'));
  SWP.append(menu);btn.onclick=e=>{e.stopPropagation();menu.classList.toggle('open');menu.style.top=(zb.offsetHeight+14)+'px'};
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&e.target!==btn)menu.classList.remove('open')})}
function pack(){const vis=Object.values(C).filter(c=>!c.hid).sort((a,b)=>rot(b)[1]-rot(a)[1]);
  const area=vis.reduce((s,c)=>{const[W,H]=rot(c);return s+(W+14)*(H+30)},0),maxW=Math.max(800,Math.sqrt(area*1.7));
  let x=0,y=0,rh=0;for(const c of vis){const[W,H]=rot(c);if(x>0&&x+W>maxW){x=0;y+=rh+30;rh=0}c.x=x;c.y=y+22;x+=W+14;rh=Math.max(rh,H);place(c)}
  save();bounds(true);focusReg('all')}
function layoutDefault(){for(const[k,,x,y,,,hid]of SECS){const c=C[k];c.x=x;c.y=y;c.r=0;c.hid=!!hid}for(const[k,,,,hid]of INST){const c=C[k];[c.x,c.y]=DEF[k];c.r=0;c.hid=!!hid}}
function reset(){layoutDefault();for(const k in C){place(C[k]);counter(C[k])}save();menuSync();bounds(true);focusReg('all')}

/* ---------- setin panelini kartlara böl ---------- */
function splitTrainer(){
  const psvg=[...TR.children].find(e=>e.tagName==='svg');PMARK=psvg.innerHTML;psvg.remove();
  const kids=[...TR.children];
  for(const[k,t,x,y,w,hh]of SECS){const c=mkCard(k,t,w,hh,'sec');c.sx=x;c.sy=y;
    const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('width',w);sv.setAttribute('height',hh);sv.setAttribute('viewBox',`${x} ${y} ${w} ${hh}`);
    sv.setAttribute('class','tslice');sv.setAttribute('font-family','Arial Narrow,Helvetica Neue,Arial,sans-serif');sv.setAttribute('font-weight','700');sv.innerHTML=PMARK;c.inn.append(sv);c.svg=sv}
  const pick=(cx,cy)=>{let best=null,bd=1e9;for(const[k,,x,y,w,hh]of SECS){if(k==='logo')continue;const dx=Math.max(x-cx,0,cx-x-w),dy=Math.max(y-cy,0,cy-y-hh),d=dx*dx+dy*dy;if(d<bd){bd=d;best=k}}return C[best]};
  for(const el of kids){if(el.classList.contains('tcard'))continue;
    let c;if(el.classList.contains('modp'))c=C.slot;else c=pick(el.offsetLeft+el.offsetWidth/2,el.offsetTop+el.offsetHeight/2);
    const L=parseFloat(el.style.left),T=parseFloat(el.style.top);if(L===L)el.style.left=(L-c.sx)+'px';if(T===T)el.style.top=(T-c.sy)+'px';c.inn.append(el)}}

/* ---------- gerçek cihazlar ---------- */
const NB=1<<18,NM=NB-1,RING={t:new Float64Array(NB),a:new Float32Array(NB),b:new Float32Array(NB),head:0,n:0,ver:0};
const MRB=4096,MRM=MRB-1,MR={t:new Float64Array(MRB),v:new Float64Array(MRB),i:new Float64Array(MRB),head:0,n:0};
const ridx=k=>(RING.head-RING.n+k+NB)&NM,rTime=k=>RING.t[ridx(k)],rVal=(ch,k)=>(ch?RING.b:RING.a)[ridx(k)];
function rFind(t){let lo=0,hi=RING.n-1;if(hi<0)return -1;if(t<=rTime(0))return 0;if(t>=rTime(hi))return hi;while(hi-lo>1){const m=(lo+hi)>>1;if(rTime(m)<=t)lo=m;else hi=m}return lo}
const meanC=[{ver:-1,v:0},{ver:-1,v:0}];
const scopeHost={getSignals:()=>[null,null],
  sample(ch,t){if(RING.n<2)return 0;const k=rFind(t);if(k>=RING.n-1)return rVal(ch,RING.n-1);const t0=rTime(k),t1=rTime(k+1),v0=rVal(ch,k),v1=rVal(ch,k+1);if(t<=t0)return v0;return v0+(v1-v0)*(t-t0)/(t1-t0||1)},
  now:()=>RING.n?rTime(RING.n-1):0,tStart:()=>RING.n?rTime(0):0,
  mean(ch){if(meanC[ch].ver===RING.ver)return meanC[ch].v;let s=0,c=0;const k0=rFind(scopeHost.now()-0.1);for(let k=k0;k<RING.n;k++){s+=rVal(ch,k);c++}meanC[ch]={ver:RING.ver,v:c?s/c:0};return meanC[ch].v},
  findCross(ch,L,rise,tMin,tMax){let k=rFind(tMax);const k0=rFind(tMin);for(;k>k0;k--){const a=rVal(ch,k-1),b=rVal(ch,k);if(rise?(a<L&&b>=L):(a>L&&b<=L)){const t0=rTime(k-1),t1=rTime(k);return t0+(t1-t0)*(L-a)/(b-a)}}return null},
  stats(ch){if(RING.n<10)return null;const k0=rFind(scopeHost.now()-0.1);let mx=-1e9,mn=1e9,s=0,c=0;
    for(let k=k0;k<RING.n;k++){const v=rVal(ch,k);if(v>mx)mx=v;if(v<mn)mn=v;s+=v;c++}
    const mid=(mx+mn)/2,hys=(mx-mn)*0.1;let st=0,first=null,last=null,cnt=0;
    if(mx-mn>0.004)for(let k=k0;k<RING.n;k++){const v=rVal(ch,k);if(st<=0&&v>mid+hys){if(st<0){const t=rTime(k);if(first===null)first=t;last=t;cnt++}st=1}else if(st>=0&&v<mid-hys)st=-1}
    return{vmax:mx,vmin:mn,mean:s/c,freq:cnt>=2&&last>first?(cnt-1)/(last-first):null,wave:null,duty:50}}};
const info=(t,b)=>{const e=$('#infoCard');if(e)e.innerHTML=`<h4>${t}</h4><p>${b}</p>`};
const say=(m,t)=>{const f=$('#fb');if(f){f.className=t==='info'?'':t||'';f.textContent=m}};
let J_={};
function placeJack(c,id,label,node,elOrPt,dy=0){let x,y;
  if(elOrPt.getBBox){const b=elOrPt.getBBox(),m=elOrPt.getCTM();const px=b.x+b.width/2,py=b.y+b.height/2;x=m.a*px+m.c*py+m.e;y=m.b*px+m.d*py+m.f}else[x,y]=elOrPt;
  const i=mkJack(c.inn,'jack ijack',id,label,node,`left:${x}px;top:${y+dy}px`);J_[id]=i;return i}
const mt=()=>MM.mtype();
const MRINT=[300,3e3,3e4,3e5,3e6,3e7];let mRi=1,lastMeter='';
function redJack(){const v=J[J_['mm.vo']].wired>0,a=J[J_['mm.10a']].wired>0;return a&&!v?'10A':'vo'}
function meterHook(){
  if(!ST.analog)return null;const com=J_['mm.com'],red=MM.S.jack==='10A'?J_['mm.10a']:J_['mm.vo'];
  if(!(J[com].wired>0&&J[red].wired>0))return null;const m=mt(),js=[red,com];
  if(MM.S.jack==='10A'){if(!MM.S.fuseA)return null;return{js,seed:false,mk:n=>[Solver.R(n[0],n[1],0.01)],rsh:0.01}}
  if(m==='I_UA'||m==='I_MA'){if(!MM.S.fuseMA)return null;const r=m==='I_UA'?100:1;return{js,seed:false,mk:n=>[Solver.R(n[0],n[1],r)]}}
  if(m==='R'||m==='CONT'||m==='DIODE'){const r=m==='DIODE'?3000:MRINT[mRi];return{js,seed:true,mk:n=>[Solver.Vdyn(n[0],n[1],()=>({v:3,r}))]}}
  return{js,seed:false,mk:n=>[Solver.R(n[0],n[1],1e7)]}}
function rsh(){const m=mt();if(MM.S.jack==='10A')return 0.01;if(m==='I_UA')return 100;if(m==='I_MA')return 1;return 0}
function sub(){
  // osiloskop örnekleri
  const a=J_['sc.ch1'],b=J_['sc.ch2'];if(J[a].wired>0||J[b].wired>0){const va=rdV(a),vb=rdV(b);const h=RING.head;RING.t[h]=ST.t;RING.a[h]=va===va?va:0;RING.b[h]=vb===vb?vb:0;RING.head=(h+1)&NM;if(RING.n<NB)RING.n++;RING.ver++}
  // multimetre örnekleri
  const com=J_['mm.com'],red=MM.S.jack==='10A'?J_['mm.10a']:J_['mm.vo'];
  if(J[com].wired>0&&J[red].wired>0){const v1=rdV(red),v0=rdV(com);const v=(v1===v1?v1:0)-(v0===v0?v0:0),r=rsh(),i=r?v/r:0;const h=MR.head;MR.t[h]=ST.t;MR.v[h]=v;MR.i[h]=i;MR.head=(h+1)&MRM;if(MR.n<MRB)MR.n++;
    if(ST.analog&&r){if(r<0.1){if(Math.abs(i)>10&&MM.S.fuseA){MM.S.fuseA=false;say('💥 Multimetrenin 10A sigortası attı!','bad');DCX.need()}}
      else if(Math.abs(i)>0.4&&MM.S.fuseMA){MM.S.fuseMA=false;say('💥 Multimetrenin mA sigortası attı! Akım konumunda gerilim kaynağına paralel bağlandı ya da akım 400 mA\'i aştı.','bad');DCX.need()}}}
  else MR.n=0}
function mStats(){if(MR.n<4)return null;const tE=MR.t[(MR.head-1)&MRM];let sv=0,si=0,c=0,sv2=0,si2=0;const vs=[],ts=[];
  for(let k=1;k<=MR.n;k++){const j=(MR.head-k)&MRM;const t=MR.t[j];if(tE-t>0.2)break;const v=MR.v[j],i=MR.i[j];sv+=v;si+=i;sv2+=v*v;si2+=i*i;c++;if(c%2===0){vs.push(v);ts.push(t)}}
  const vm=sv/c,im=si/c,vac=Math.sqrt(Math.max(0,sv2/c-vm*vm)),iac=Math.sqrt(Math.max(0,si2/c-im*im));let mx=-1e9,mn=1e9;vs.forEach(v=>{if(v>mx)mx=v;if(v<mn)mn=v});
  let freq=null;if(mx-mn>0.05){const mid=(mx+mn)/2,hh=(mx-mn)*0.1;let st=0,cnt=0,f=null,l=null;for(let k=vs.length-1;k>=0;k--){const v=vs[k];if(st<=0&&v>mid+hh){if(st<0){if(f===null)f=ts[k];l=ts[k];cnt++}st=1}else if(st>=0&&v<mid-hh)st=-1}if(cnt>=2&&l>f)freq=(cnt-1)/(l-f)}
  return{vm,im,vac,iac,freq}}
function rng(v,R){const a=Math.abs(v);for(const[max,dec,sc,u]of R)if(a<max)return{num:(v/sc).toFixed(dec),unit:u};return{num:'OL',unit:R[R.length-1][3]}}
function reading(){const m=mt();const R={num:'',unit:'',ac:false,beep:false,diode:false,cont:false,level:-1,auto:true,off:false,tag:''};
  if(m==='OFF'){R.off=true;return R}
  const st=mStats(),acSel=MM.S.sel===1;if((m==='I_UA'||m==='I_MA'||m==='I_A')&&acSel)R.ac=true;if(m==='VAC')R.ac=true;
  if(m==='DIODE'){R.diode=true;R.auto=false}if(m==='CONT')R.cont=true;
  if(m==='HFE'){R.auto=false;R.tag='hFE';R.num='0';return R}if(m==='NCV'){R.auto=false;R.level=0;R.num='EF';return R}
  const z={VDC:['0.000','V'],VAC:['0.000','V'],MV:['0.0','mV'],R:['OL','MΩ'],CONT:['OL','Ω'],DIODE:['OL','V'],CAP:['0.000','nF'],HZ:['0.000','Hz'],I_UA:['0.0','μA'],I_MA:['0.00','mA'],I_A:['0.00','A']}[m];
  if(m==='CAP'){const C_=ST.analog?DCX.eqCLj('C',J_['mm.vo'],J_['mm.com']):NaN;if(!(C_>0)){R.num=z[0];R.unit=z[1]}else Object.assign(R,rng(C_,[[4e-9,3,1e-9,'nF'],[4e-8,2,1e-9,'nF'],[4e-7,1,1e-9,'nF'],[4e-6,3,1e-6,'μF'],[4e-5,2,1e-6,'μF'],[4e-4,1,1e-6,'μF'],[4e-3,3,1e-3,'mF']]));return R}
  if(!st||(MM.S.jack==='10A'&&m!=='I_A')){R.num=z[0];R.unit=z[1];return R}
  switch(m){
    case'VDC':Object.assign(R,rng(st.vm,[[4,3,1,'V'],[40,2,1,'V'],[400,1,1,'V'],[1000,0,1,'V']]));break;
    case'VAC':Object.assign(R,rng(st.vac,[[4,3,1,'V'],[40,2,1,'V'],[400,1,1,'V'],[750,0,1,'V']]));break;
    case'MV':Object.assign(R,rng(st.vm,[[0.4,1,1e-3,'mV']]));break;
    case'HZ':if(st.freq)Object.assign(R,rng(st.freq,[[10,3,1,'Hz'],[100,2,1,'Hz'],[1000,1,1,'Hz'],[1e4,3,1e3,'kHz'],[1e5,2,1e3,'kHz'],[1e6,1,1e3,'kHz']]));else{R.num='0.000';R.unit='Hz'}break;
    case'R':case'CONT':{if(!ST.analog){R.num='OL';R.unit='Ω';break}const v=st.vm,ri=MRINT[mRi],i=(3-v)/ri,r=i>1e-12?v/i:Infinity;
      if(v>2.7&&mRi<MRINT.length-1){mRi++;DCX.need()}else if(v<0.3&&mRi>0){mRi--;DCX.need()}
      if(m==='CONT'){if(r<400&&r>=0){Object.assign(R,rng(r,[[400,1,1,'Ω']]));if(r<50)R.beep=true}else{R.num='OL';R.unit='Ω'}}
      else Object.assign(R,rng(r,[[400,1,1,'Ω'],[4000,3,1e3,'kΩ'],[4e4,2,1e3,'kΩ'],[4e5,1,1e3,'kΩ'],[4e6,3,1e6,'MΩ'],[4e7,2,1e6,'MΩ']]));break}
    case'DIODE':{const v=st.vm;if(!ST.analog||v>2.0||v<-0.05){R.num='OL';R.unit='V'}else Object.assign(R,rng(v,[[3,3,1,'V']]));break}
    case'I_UA':{if(!MM.S.fuseMA){R.num='0.0';R.unit='μA';break}Object.assign(R,rng(acSel?st.iac:st.im,[[4e-4,1,1e-6,'μA'],[4e-3,0,1e-6,'μA']]));break}
    case'I_MA':{if(!MM.S.fuseMA){R.num='0.00';R.unit='mA';break}Object.assign(R,rng(acSel?st.iac:st.im,[[0.04,2,1e-3,'mA'],[0.4,1,1e-3,'mA']]));break}
    case'I_A':{if(MM.S.jack!=='10A'||!MM.S.fuseA){R.num='0.00';R.unit='A';break}Object.assign(R,rng(acSel?st.iac:st.im,[[10,2,1,'A'],[20,1,1,'A']]));break}}
  return R}
function render(){const j=redJack();if(j!==MM.S.jack){MM.S.jack=j;DCX.need()}
  const R=reading(),k=JSON.stringify(R);if(k!==lastMeter){lastMeter=k;MM.render(R)}}
const genV=(i,t)=>GEN.sample(i,t)*(GEN.G.load==='50Ω'?2:1);
function instruments(){
  const holder=$('#instHold');
  for(const[k,t,w,hh,hid]of INST){const c=mkCard(k,t,w,hh,'inst');c.hid=!!hid;
    if(k==='basic'){const d=$('#dock');c.inn.append(d);d.classList.add('indock');continue}
    const sv=$(k==='scope'?'#scopeSvg':k==='gen'?'#genSvg':'#mmSvg');sv.setAttribute('width',w);sv.setAttribute('height',hh);c.inn.append(sv)}
  holder.remove();
  Scope.init(Object.assign({root:$('#scopeRoot'),say,info},scopeHost));
  MM.init({svg:$('#mmSvg'),info,say,change:()=>{DCX.need();lastMeter=''}});
  GEN.setOnChange&&GEN.setOnChange(()=>{});
  // soketler (gerçek konnektörlerin üzerine)
  const G=C.gen,Sc=C.scope,Mm=C.mm;
  [0,1].forEach(i=>{const o=GEN.outEl(i);placeJack(G,'gen.o'+(i+1),'Jeneratör CH'+(i+1)+' çıkış','gen.o'+(i+1),o);placeJack(G,'gen.g'+(i+1),'Jeneratör CH'+(i+1)+' toprak (şase)','gnd',o,18)});
  [1,2].forEach(i=>{const o=$(`#scopeRoot [data-si="bnc${i}"] circle`);placeJack(Sc,'sc.ch'+i,'Osiloskop CH'+i+' girişi','sc.ch'+i,o)});
  placeJack(Sc,'sc.g','Osiloskop prob toprağı (şase)','gnd',$('#scopeRoot #scGnd circle')||$('#scopeRoot [data-si="bnc1"] circle'),$('#scopeRoot #scGnd circle')?0:24);
  placeJack(Mm,'mm.com','Multimetre COM (siyah)','mm.com',$('#jk-COM circle'));placeJack(Mm,'mm.vo','Multimetre VΩmA (kırmızı)','mm.vo',$('#jk-vo circle'));placeJack(Mm,'mm.10a','Multimetre 10A (kırmızı)','mm.10a',$('#jk-10A circle'));
  // jeneratör çıkışı: dijital modda kaynak çıkışı, DC modülde 50 Ω iç dirençli kaynak
  const o1=O(J_['gen.o1'],1),o2=O(J_['gen.o2'],1);
  comps.push({outs:[o1,o2],step(){[o1,o2].forEach((o,i)=>{o.v=GEN.CH[i].on?genV(i,ST.t):null})}});
  [0,1].forEach(i=>{fast.push({j:J_['gen.o'+(i+1)],f:()=>{const c=GEN.CH[i];return c.on?(c.wave==='dc'?0:c.wave==='noise'?2000:Math.min(c.freq||0,2e5)):0}});DCX.addSrc('gen.o'+(i+1),50)});
  DCX.hook(meterHook)}

/* ---------- hazır bağlantı yardımcıları ---------- */
const DIAL=n=>MM.MODES.indexOf(n);
function meter(mode,p,n){
  const map={VDC:['VDC',0],VAC:['VAC',0],ADC:['I_MA',0],AAC:['I_MA',1],OHM:['R',0],DIODE:['R',2],CAP:['CAP',0]}[mode];if(!map)return false;
  let d=DIAL(map[0]);if(d<0&&map[0]==='R')d=MM.MODES.indexOf('OHM');if(d>=0){MM.S.dial=d}MM.S.sel=map[1];MM.S.hold=false;MM.S.fuseMA=true;MM.S.fuseA=true;MM.S.jack='vo';mRi=1;
  addWire(J_['mm.vo'],ji(p),'red');addWire(J_['mm.com'],ji(n||'ttl.g1'),'black');show('mm');lastMeter='';DCX.need();return true}
function probeTo(ch,jk){addWire(J_['sc.ch'+ch],ji(jk),ch===1?'yellow':'blue');Scope.S.ch[ch-1].on=true;show('scope');Scope.mark()}
function scopeSet(o){const S=Scope.S;const near=(arr,v)=>{let b=0;arr.forEach((x,i)=>{if(Math.abs(Math.log(x/v))<Math.abs(Math.log(arr[b]/v)))b=i});return b};
  if(o.T)S.ti=near(Scope.TD,o.T);if(o.V){S.ch[0].fine=false;S.ch[0].vi=near(Scope.VD,o.V)}if(o.V2){S.ch[1].fine=false;S.ch[1].vi=near(Scope.VD,o.V2)}
  if(o.ac!=null){S.ch[0].coup=S.ch[1].coup=o.ac?'AC':'DC'}S.trig.level=0;S.run=true;S.mode='auto';Scope.mark()}
function show(k){const c=C[k];if(c&&c.hid){c.hid=false;place(c);save();menuSync();bounds(false)}}
function ensureVisible(){for(const w of wires)for(const j of[w.a,w.b]){const c=cardOf(j);if(c&&c.hid){c.hid=false;place(c)}}save();menuSync();bounds(false)}
function resetInst(){GEN.reset();Scope.reset();MM.S.sel=0;MM.S.hold=false;MM.S.fuseMA=true;MM.S.fuseA=true;MM.S.jack='vo';RING.n=0;MR.n=0;lastMeter=''}

/* ---------- başlat ---------- */
splitTrainer();instruments();
const L=load();layoutDefault();
if(L)for(const k in L){const c=C[k];if(!c)continue;Object.assign(c,{x:L[k].x,y:L[k].y,r:L[k].r||0,hid:!!L[k].hid})}
if(L&&L.power&&L.power.x===50&&L.power.y===42)C.power.y=46; // eski varsayılan: güç kartı diğerlerinden 4 px uzundu
for(const k in C){place(C[k]);counter(C[k])}
buildMenu();bounds(true);requestAnimationFrame(()=>focusReg('all',false));
return{C,reading:()=>reading(),sub,render,meter,probeTo,scopeSet,show,ensureVisible,resetInst,reset,pack,RING,J_}})();