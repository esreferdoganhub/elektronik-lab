/* Otomatik üretildi: _kaynak/build_sayisal.py — RIGOL osiloskop çekirdeği, UTG932E jeneratör, UT136B+ multimetre.
   Kaynaklar: _kaynak/scope_core.js, Fonksiyon_Jeneratoru_Egitimi.html, Multimetre_Egitimi.html */
/* ================= RIGOL DS1202Z-E osiloskop çekirdeği ================= */
const Scope=(function(){
'use strict';
const COL=['#ffe14a','#35d6ff'];
const TD=[],VD=[];
[-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1].forEach(e=>[1,2,5].forEach(m=>{const v=+(m*Math.pow(10,e)).toPrecision(3);if(v>=5e-9&&v<=50.01)TD.push(v);}));
[-3,-2,-1,0,1].forEach(e=>[1,2,5].forEach(m=>VD.push(+(m*Math.pow(10,e)).toPrecision(3))));VD.push(100);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function siFmt(x,u){
  const a=Math.abs(x);let sc=1,p='';
  if(a>=1e9){sc=1e9;p='G';}else if(a>=1e6){sc=1e6;p='M';}else if(a>=1e3){sc=1e3;p='k';}else if(a>=1||a===0){sc=1;}else if(a>=1e-3){sc=1e-3;p='m';}else if(a>=1e-6){sc=1e-6;p='μ';}else{sc=1e-9;p='n';}
  return (+(x/sc).toPrecision(3))+p+u;
}
function shape(w,p,d){
  switch(w){
    case 'sine':return Math.sin(2*Math.PI*p);
    case 'square':case 'pulse':return p<d?1:-1;
    case 'ramp':return p<d?-1+2*p/d:1-2*(p-d)/(1-d);
    case 'arb':return 2*(1-Math.exp(-5*p))/(1-Math.exp(-5))-1;
    case 'noise':return Math.random()*2-1;
    default:return 0;
  }
}
let ARBAVG=0;{const N=1000;for(let i=0;i<N;i++)ARBAVG+=shape('arb',i/N,.5);ARBAVG/=N;}
const avgShape=(w,d)=>w==='square'||w==='pulse'?2*d-1:w==='arb'?ARBAVG:0;
const RISE_ARB=(()=>{const f=p=>2*(1-Math.exp(-5*p))/(1-Math.exp(-5))-1;let a=0,b=0;for(let i=0;i<=1000;i++){const p=i/1000,v=f(p);if(!a&&v>=-0.6)a=p;if(!b&&v>=0.6){b=p;}}return b-a;})();

/* ---------- Durum ---------- */
const vdOf=c=>c.fine?c.vv:VD[c.vi];
const newCh=()=>({on:false,fine:false,vv:1,vi:VD.indexOf(1),pos:0,coup:'DC',probe:10,inv:false,bw:false});
const defaults=()=>({power:true,run:true,mode:'auto',armed:false,status:'AUTO',sel:0,
  ch:[Object.assign(newCh(),{on:true}),newCh()],ti:TD.indexOf(1e-3),hpos:0,trig:{src:0,slope:'rise',level:0},
  menu:'ch',left:null,leftPage:0,cur:0,curA:-2,curB:2,curSel:'A',meas:['period','freq','rise','fall','pwidth'],allMeas:false,
  grid:'full',dots:false,bright:60,acq:'normal',phys:[10,10],lvlT:0,frame:null,forced:false,boot:0});
const S=defaults();
let host={getSignals:()=>[null,null],say:()=>{},info:()=>{}};
let root=null,svg=null,sigs=[null,null],dirty=true,lastDraw=0;
const say=(m,t)=>host.say(m,t||'info');
const mark=()=>{dirty=true;};

/* ---------- Konum sabitleri ---------- */
const GX0=44,GY0=18,GW=372,GH=224,DX=GW/12,DY=GH/8,GCX=GX0+GW/2,GCY=GY0+GH/2;
const KN={vpos:[721,177,15],vscale:[722,298,32],hpos:[826,178,15],hscale:[826,298,32],tlevel:[903,230,18],multi:[672,107,18]};
const KSTEP=18;
const kstate={};Object.keys(KN).forEach(k=>kstate[k]={t:0,a:0,v:0});
const BNCX=[633,735,836],BNCY=390;

/* ---------- Bilgi ---------- */
const INFO={
 screen:['Ekran','Üstte durum çubuğu (RUN/STOP, zaman tabanı, tetikleme), ortada 12×8 bölmeli ızgara, altta ölçüm kutuları ve kanal çubuğu (V/div). Sağda menü etiketleri.'],
 clear:['CLEAR','Ekrandaki ölçüm istatistiklerini ve izleri temizler.'],
 auto:['AUTO (Autoset)','Sinyale göre dikey ölçek, zaman tabanı ve tetiklemeyi otomatik ayarlar. İlk bakış için en hızlı yol; sonra elle ince ayar yapılır.'],
 runstop:['RUN/STOP','Yeşil = çalışıyor (RUN), kırmızı = durdurulmuş (STOP). STOP\'ta ekran dondurulur, dikey ölçek hâlâ değiştirilebilir.'],
 single:['SINGLE','Tek seferlik yakalama: tetikleme gelince ekranı bir kez yakalar ve durur. Geçici olayları yakalamak için kullanılır.'],
 ch1:['CH1 tuşu','Kanalı açar ve seçer; seçiliyken menüsünü açar (kuplaj, prob, ters çevirme). Kanal açık ve seçiliyken tekrar basarsan kapanır. Işığı kanal renginde yanar.'],
 ch2:['CH2 tuşu','İkinci kanalı açar/seçer. Dikey ölçek ve pozisyon düğmeleri hep seçili kanala etki eder.'],
 math:['MATH','Matematik işlemleri (A+B, A−B, FFT...). Bu eğitimde kullanılmıyor.'],
 ref:['REF','Referans dalga şekli saklama. Bu eğitimde kullanılmıyor.'],
 hmenu:['Yatay MENU','Gecikmeli tarama (zoom) menüsü. Bu eğitimde kullanılmıyor.'],
 tmode:['Tetikleme MODE','Auto → Normal → Single arasında geçiş yapar. Auto: tetikleme olmasa da ekran güncellenir (görüntü kayabilir). Normal: sadece tetikleme olunca günceller (yoksa WAIT). Single: bir kez yakalar.'],
 tmenu:['Tetikleme MENU','Tetikleme kaynağı (CH1/CH2), kenar (yükselen ↑/düşen ↓) ve çalışma modu menüsünü açar.'],
 force:['FORCE','Tetikleme koşulu olmasa bile bir yakalama zorlar (Normal/Single modda yararlı).'],
 measure:['Measure','Otomatik ölçüm menüsü. Soldaki 6 tuşla ölçüm (Period, Freq, Rise Time...) ekle/çıkar; sağdaki menüden tüm ölçümleri (AllMeasure) aç.'],
 acquire:['Acquire','Örnekleme modu (Normal, Average, Peak, High Res). Average gürültüyü azaltır.'],
 storage:['Storage','Ekran görüntüsü ve dosya saklama. Bu eğitimde sadeleştirilmiştir.'],
 cursor:['Cursor','Manuel imleçler: bir kez bas = zaman (X) imleçleri, iki kez = gerilim (Y) imleçleri, üçüncüde kapanır. İmleçleri çok işlevli düğmeyle hareket ettir; ΔX, 1/ΔX, ΔY ekranda görünür.'],
 display:['Display','Görüntü tipi (vektör/nokta), ızgara tipi ve parlaklık.'],
 utility:['Utility','Sistem ayarları. Bu eğitimde sadeleştirilmiştir.'],
 help:['Help','Yardım. Bu eğitimde kullanılmıyor.'],print:['Print','Ekranı yazdırma/kaydetme. Bu eğitimde kullanılmıyor.'],
 vpos:['Dikey POSITION','Seçili kanalın dalgasını yukarı/aşağı kaydırır (sıfır seviyesi işareti kaymaz değil, o da hareket eder). Düğmeye basarsan sıfıra döner.'],
 vscale:['Dikey SCALE','Seçili kanalın V/div ayarı. Saat yönü: bölme başına gerilim azalır (yakınlaştırma), sinyal büyür. Düğmeye basarsan Kaba (1-2-5 adım) ↔ İnce (küçük adım) ayar arasında geçilir; ince ayarda kanal çubuğunda * görünür.'],
 hpos:['Yatay POSITION','Tetikleme noktasını sağa/sola kaydırır (zaman ofseti). Düğmeye basarsan sıfıra döner.'],
 hscale:['Yatay SCALE','Zaman tabanı (s/div). Saat yönü: daha hızlı tarama (daha az zaman, dalga genişler). Üstte "H" yanında değer görünür.'],
 tlevel:['Tetikleme LEVEL','Tetikleme seviyesini ayarlar (turuncu T oku). Seviye sinyalin genlik aralığının dışındaysa tetikleme olmaz. Basarsan seviye sıfıra (0 V) döner.'],
 multi:['Çok işlevli düğme (Intensity)','İmleç modunda seçili imleci hareket ettirir. Aksi halde dalga parlaklığını (Intensity) ayarlar.'],
 bnc1:['CH1 girişi (BNC)','Prob veya BNC kabloyla gelen sinyalin girdiği konnektör. Sarı etiket kanal rengidir.'],
 bnc2:['CH2 girişi (BNC)','İkinci kanal girişi, camgöbeği etiket.'],
 ext:['EXT TRIG','Harici tetikleme girişi. Bu eğitimde kullanılmıyor.'],
 probe1:['CH1 prob anahtarı','Probun üzerindeki 1X/10X anahtarı (genelde 10X). 10X konumunda sinyal 10 kat zayıflar; osiloskop menüsündeki Probe ayarı (varsayılan 10X) anahtarla aynı olmalı, yoksa ölçüm 10 kat hatalı olur. Tıklayarak değiştir.'],
 probe2:['CH2 prob anahtarı','CH2 probunun 1X/10X anahtarı. Osiloskop Probe ayarıyla eşleşmeli.'],
 comp:['Prob kompanzasyon çıkışı','Ön panelin sağ alt köşesindeki çıkış (üst: sinyal, alt: toprak). Yaklaşık 3 V\'luk 1 kHz kare dalga verir. Yeni probu bağlayıp kompanze etmek ve prob/kanal testi için kullanılır; kalibrasyon için KULLANILMAZ. Probun ucunu bu çıkışa, timsah klipsini toprağa bağlarsın.'],
 power:['Güç düğmesi','Osiloskobu açar/kapatır.'],
 lmenu:['Sol MENU','Soldaki ölçüm menüsü sayfaları arasında geçer: Horizontal, Vertical, Other.'],
 lsoft:['Sol menü tuşları','Ekranın solundaki 6 tuş: Measure açıkken bir ölçümü ekler veya çıkarır.'],
 rsoft:['Sağ menü tuşları','Ekranın sağındaki 6 tuş ekrandaki menü seçeneklerini değiştirir (ör. kanal menüsünde Coupling, Probe).'],
 arrow:['Ok tuşları','Menü sayfalarını gezmek içindir. Bu eğitimde etkisizdir.']
};

/* ---------- SVG kurulum ---------- */
const btn=(id,x,y,w,h,lab,o={})=>{
  const L=Array.isArray(lab)?lab:[lab],fs=o.fs||8.5,cy=y+h/2-(L.length-1)*fs*.55+fs*.35;
  return `<g data-sc="${id}" data-si="${id}" class="scb"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx||6}" fill="${o.fill||'#f5f3ec'}" stroke="${o.stroke||'#9c9a90'}" stroke-width="${o.sw||1.6}"/>${L.map((t,i)=>`<text x="${x+w/2}" y="${cy+i*fs*1.1}" font-size="${fs}" font-weight="700" fill="${o.ink||'#444'}" text-anchor="middle" pointer-events="none">${t}</text>`).join('')}</g>`;
};
const soft=(id,x,y)=>`<g data-sc="${id}" data-si="${id[0]==='l'?'lsoft':'rsoft'}" class="scb"><rect x="${x}" y="${y}" width="46" height="22" rx="9" fill="#a9bfdc" stroke="#6f87a8" stroke-width="1.6"/><rect x="${x+4}" y="${y+3}" width="38" height="7" rx="3" fill="#cfe0f4" pointer-events="none"/></g>`;
function knobSvg(id){
  const [cx,cy,r]=KN[id];
  let t='';if(r>20)for(let k=0;k<20;k++)t+=`<line x1="${cx}" y1="${cy-r+2}" x2="${cx}" y2="${cy-r+6}" stroke="#bdbab0" stroke-width="2" transform="rotate(${k*18} ${cx} ${cy})"/>`;
  return `<g data-knob="${id}" data-si="${id}" class="scknob"><circle cx="${cx+1.5}" cy="${cy+2.5}" r="${r+2}" fill="#00000026"/><g id="kr-${id}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#scKnob)" stroke="#a7a499" stroke-width="2"/>${t}<circle cx="${cx}" cy="${cy-r+5}" r="2.2" fill="#d7263d"/><circle data-kpress="${id}" cx="${cx}" cy="${cy}" r="${r*.52}" fill="#f2f0e9" stroke="#b6b3a8" stroke-width="1.5"/></g></g>`;
}
function build(){
  let s=`<defs><clipPath id="scClip"><rect x="${GX0}" y="${GY0}" width="${GW}" height="${GH}"/></clipPath>
  <radialGradient id="scKnob" cx="45%" cy="38%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d3d0c6"/></radialGradient></defs>
  <rect x="12" y="0" width="936" height="495" rx="26" fill="#ebe8df" stroke="#c4c0b4" stroke-width="3"/>
  <rect x="12" y="372" width="936" height="123" rx="26" fill="#e1ded4"/><rect x="12" y="372" width="936" height="20" fill="#e1ded4"/>
  <text x="112" y="16" font-size="15" font-weight="800" fill="#c1121f">RIGOL</text><text x="180" y="16" font-size="12" font-weight="800" fill="#333">DS1202Z-E</text><text x="250" y="16" font-size="7.5" fill="#444">OSCILLOSCOPE   2 Channel  200MHz  1GSa/s</text>
  <rect x="70" y="34" width="493" height="306" rx="6" fill="#1b1b1d"/>
  <g transform="translate(78 42)" data-si="screen"><g id="scScr"></g></g>
  ${btn('lmenu',16,46,44,24,'MENU',{fill:'#a9bfdc',stroke:'#6f87a8',fs:8,rx:8})}
  ${[88,130,165,200,240,277].map((y,i)=>soft('l'+i,14,y-11)).join('')}
  ${[90,132,166,202,240,275].map((y,i)=>soft('r'+i,584,y-11)).join('')}
  ${btn('lup',14,302,46,20,'▼',{fill:'#a9bfdc',stroke:'#6f87a8',fs:9,rx:8})}
  ${btn('rup',584,46,46,20,'▲',{fill:'#a9bfdc',stroke:'#6f87a8',fs:9,rx:8})}${btn('rdown',584,302,46,20,'▼',{fill:'#a9bfdc',stroke:'#6f87a8',fs:9,rx:8})}
  ${btn('clear',668,30,54,24,'CLEAR',{fs:8})}${btn('auto',727,30,54,24,'AUTO',{fs:8})}${btn('runstop',788,30,54,24,['RUN','STOP'],{fs:7.5})}${btn('single',849,30,54,24,'SINGLE',{fs:8})}
  <rect x="712" y="64" width="148" height="82" rx="12" fill="none" stroke="#a9a69b" stroke-width="2"/><text x="866" y="108" font-size="7" fill="#777" transform="rotate(90 866 108)">MENU</text>
  ${btn('measure',720,70,40,24,'Measure',{fs:7})}${btn('acquire',765,70,40,24,'Acquire',{fs:7})}${btn('storage',810,70,40,24,'Storage',{fs:7})}
  ${btn('cursor',720,106,40,24,'Cursor',{fs:7})}${btn('display',765,106,40,24,'Display',{fs:7})}${btn('utility',810,106,40,24,'Utility',{fs:7})}
  ${btn('help',878,70,40,24,'Help',{fill:'#8fe08f',stroke:'#4a9a4a',fs:8})}${btn('print',878,106,40,24,'⎙',{fill:'#8fe08f',stroke:'#4a9a4a',fs:11})}
  <text x="650" y="76" font-size="7" fill="#666" text-anchor="middle">Intensity</text>
  <rect x="632" y="140" width="144" height="198" rx="14" fill="none" stroke="#a9a69b" stroke-width="2"/><text x="704" y="332" font-size="7" font-weight="700" fill="#777" text-anchor="middle">VERTICAL</text>
  <rect x="782" y="140" width="90" height="198" rx="14" fill="none" stroke="#a9a69b" stroke-width="2"/><text x="827" y="152" font-size="7" font-weight="700" fill="#777" text-anchor="middle">HORIZONTAL</text>
  <rect x="878" y="140" width="68" height="198" rx="14" fill="none" stroke="#a9a69b" stroke-width="2"/><text x="912" y="152" font-size="7" font-weight="700" fill="#777" text-anchor="middle">TRIGGER</text>
  <g data-sc="ch1" data-si="ch1" class="scb" id="chb1"><rect x="640" y="150" width="46" height="26" rx="7" fill="#f5f3ec" stroke="${COL[0]}" stroke-width="3"/><text x="663" y="167" font-size="9" font-weight="800" fill="#444" text-anchor="middle" pointer-events="none">CH1</text></g>
  <g data-sc="ch2" data-si="ch2" class="scb" id="chb2"><rect x="640" y="184" width="46" height="26" rx="7" fill="#f5f3ec" stroke="${COL[1]}" stroke-width="3"/><text x="663" y="201" font-size="9" font-weight="800" fill="#444" text-anchor="middle" pointer-events="none">CH2</text></g>
  ${btn('math',690,222,40,22,'MATH',{fill:'#cfcdc5',fs:7.5})}${btn('ref',736,222,36,22,'REF',{fill:'#cfcdc5',fs:7.5})}
  ${btn('hmenu',806,222,40,22,'MENU',{fs:7.5})}
  ${btn('tmode',886,172,52,22,'MODE',{fs:8})}${btn('tmenu',886,262,52,22,'MENU',{fs:8})}${btn('force',886,296,52,22,'FORCE',{fs:8})}
  <text x="903" y="205" font-size="6.5" fill="#777" text-anchor="middle">LEVEL</text>
  <text x="721" y="199" font-size="6.5" fill="#777" text-anchor="middle">POSITION</text><text x="722" y="270" font-size="6.5" fill="#777" text-anchor="middle">SCALE</text>
  <text x="826" y="199" font-size="6.5" fill="#777" text-anchor="middle">POSITION</text><text x="826" y="270" font-size="6.5" fill="#777" text-anchor="middle">SCALE</text>
  ${Object.keys(KN).map(knobSvg).join('')}
  <g data-sc="power" data-si="power" class="scb"><rect x="60" y="402" width="52" height="38" rx="8" fill="#dcdad1" stroke="#9c9a90" stroke-width="2"/><circle id="pwLed" cx="86" cy="421" r="8" fill="none" stroke="#555" stroke-width="2.5"/><line x1="86" y1="411" x2="86" y2="420" stroke="#555" stroke-width="2.5"/></g>
  <rect x="124" y="404" width="26" height="36" rx="3" fill="#cfcdc5" stroke="#8e8b80" stroke-width="2"/><rect x="130" y="410" width="14" height="14" fill="#444"/>
  ${[0,1,2].map(i=>`<g data-si="${['bnc1','bnc2','ext'][i]}"><circle cx="${BNCX[i]}" cy="${BNCY}" r="25" fill="#d6d3c9" stroke="#8e8b80" stroke-width="2"/><circle cx="${BNCX[i]}" cy="${BNCY}" r="17" fill="#c2c0b8" stroke="#6e6b62" stroke-width="3"/><circle cx="${BNCX[i]}" cy="${BNCY}" r="6" fill="#222"/><text x="${i<2?BNCX[i]-20:BNCX[i]}" y="${BNCY-33}" font-size="9" font-weight="800" fill="${i<2?COL[i]:'#777'}" text-anchor="middle" stroke="#00000030" stroke-width=".5">${['CH1','CH2','EXT'][i]}</text></g>`).join('')}
  <g id="scGnd" data-si="bnc1"><circle cx="576" cy="438" r="11" fill="#d6d3c9" stroke="#6e6b62" stroke-width="1.8"/><text x="576" y="462" font-size="8" font-weight="800" fill="#555" text-anchor="middle">⏚ ŞASE</text></g>
  ${[0,1].map(i=>`<g data-sc="probe${i+1}" data-si="probe${i+1}" class="scb"><rect x="${BNCX[i]-4}" y="343" width="42" height="18" rx="9" fill="#fff" stroke="${COL[i]}" stroke-width="1.8"/><text id="pbt${i}" x="${BNCX[i]+17}" y="356" font-size="9" font-weight="800" fill="#333" text-anchor="middle" pointer-events="none">1X</text></g>`).join('')}
  <text x="780" y="476" font-size="7" fill="#777">CAT I</text>
  <g data-sc="comp" data-si="comp" class="scb"><circle cx="918" cy="352" r="9" fill="#d6d3c9" stroke="#8e8b80" stroke-width="2"/><circle cx="918" cy="352" r="3" fill="#222"/><path d="M906 336 h5 v-7 h6 v7 h6" fill="none" stroke="#666" stroke-width="1.4"/><circle cx="918" cy="400" r="9" fill="#d6d3c9" stroke="#8e8b80" stroke-width="2"/><circle cx="918" cy="400" r="3" fill="#222"/><path d="M910 416 h16 M913 420 h10 M916 424 h4" stroke="#666" stroke-width="1.4"/></g>
  <g id="halos" fill="none">
   <rect class="halo" data-h="screen" x="68" y="32" width="497" height="310" rx="8"/>
   <rect class="halo" data-h="left" x="8" y="38" width="58" height="290" rx="8"/><rect class="halo" data-h="right" x="578" y="38" width="58" height="290" rx="8"/>
   <rect class="halo" data-h="runbtns" x="662" y="24" width="248" height="36" rx="8"/>
   <rect class="halo" data-h="auto" x="722" y="24" width="64" height="36" rx="8"/><rect class="halo" data-h="runstop" x="783" y="24" width="64" height="36" rx="8"/><rect class="halo" data-h="single" x="844" y="24" width="64" height="36" rx="8"/>
   <rect class="halo" data-h="menugrp" x="710" y="62" width="152" height="86" rx="12"/><rect class="halo" data-h="measure" x="716" y="64" width="48" height="34" rx="8"/><rect class="halo" data-h="cursor" x="716" y="100" width="48" height="34" rx="8"/>
   <circle class="halo" data-h="multi" cx="672" cy="107" r="30"/>
   <rect class="halo" data-h="ch1" x="636" y="146" width="54" height="34" rx="8"/><rect class="halo" data-h="ch2" x="636" y="180" width="54" height="34" rx="8"/><rect class="halo" data-h="chs" x="634" y="144" width="58" height="72" rx="8"/>
   <circle class="halo" data-h="vpos" cx="721" cy="177" r="26"/><circle class="halo" data-h="vscale" cx="722" cy="298" r="44"/>
   <circle class="halo" data-h="hpos" cx="826" cy="178" r="26"/><circle class="halo" data-h="hscale" cx="826" cy="298" r="44"/>
   <circle class="halo" data-h="tlevel" cx="903" cy="230" r="28"/>
   <rect class="halo" data-h="tmode" x="882" y="168" width="60" height="30" rx="8"/><rect class="halo" data-h="tmenu" x="882" y="258" width="60" height="30" rx="8"/><rect class="halo" data-h="force" x="882" y="292" width="60" height="30" rx="8"/>
   <circle class="halo" data-h="bnc1" cx="633" cy="390" r="36"/><circle class="halo" data-h="bnc2" cx="735" cy="390" r="36"/>
   <rect class="halo" data-h="probe1" x="625" y="339" width="50" height="26" rx="10"/><rect class="halo" data-h="probe2" x="727" y="339" width="50" height="26" rx="10"/>
   <rect class="halo" data-h="comp" x="900" y="322" width="36" height="112" rx="10"/>
   <rect class="halo" data-h="power" x="56" y="398" width="60" height="46" rx="10"/>
  </g>`;
  return s;
}

/* ---------- Sinyal zinciri ---------- */
function meanOf(s){return s.factor*(s.off+(s.wave==='dc'?0:s.amp/2*avgShape(s.wave,s.duty/100)));}
function gainOf(i){return (S.phys[i]===10?0.1:1)*(S.ch[i].probe===10?10:1);}
function chainV(i,t){
  if(host.sample){const c=S.ch[i];let v=0;if(c.coup!=='GND'){v=host.sample(i,t);if(c.coup==='AC')v-=host.mean(i);}v*=gainOf(i);return c.inv?-v:v;}
  const s=sigs[i],c=S.ch[i];
  let v=0;
  if(s&&s.on&&c.coup!=='GND'){
    const p=(((s.freq*t+s.phase/360)%1)+1)%1;
    if(s.wave==='noise'&&S.acq==='average'){let a=0;for(let k=0;k<16;k++)a+=Math.random()*2-1;v=(s.off+s.amp/2*a/16)*s.factor;}
    else if(s.fn)v=s.fn(t)*s.factor;
    else v=(s.off+(s.wave==='dc'?0:s.amp/2*shape(s.wave,p,s.duty/100)))*s.factor;
    if(c.coup==='AC')v-=meanOf(s);
  }
  v*=gainOf(i);
  return c.inv?-v:v;
}
function findTrig(){
  if(host.sample){
    const src=S.trig.src,c=S.ch[src];if(!c.on||c.coup==='GND')return null;
    const g=gainOf(src)*(c.inv?-1:1);let L=S.trig.level/g;if(c.coup==='AC')L+=host.mean(src);
    const rise=(S.trig.slope==='rise')!==c.inv,td=TD[S.ti],tEnd=host.now(),tMax=tEnd-(6-S.hpos)*td;
    let tMin=Math.max(host.tStart()+(6+S.hpos)*td,tMax-Math.max(24*td,0.004));
    if(S.mode==='single'&&S.armed)tMin=Math.max(tMin,S.armT||0);
    if(tMax<=tMin)return null;
    return host.findCross(src,L,rise,tMin,tMax);
  }
  const src=S.trig.src,s=sigs[src];
  if(!S.ch[src].on||!s||!s.on||S.ch[src].coup==='GND')return null;
  const L=S.trig.level,rise=S.trig.slope==='rise';
  if(s.wave==='dc')return null;
  if(s.wave==='noise'){const g=gainOf(src),h=s.amp/2*s.factor*g;return Math.abs(L-(s.off*s.factor*g))<h?Math.random()*0.01:null;}
  const T=1/s.freq,N=1600;let pv=chainV(src,0)-L;
  for(let k=1;k<=N;k++){
    const t=k*T/N,v=chainV(src,t)-L;
    if(rise?(pv<0&&v>=0):(pv>0&&v<=0)){const f=pv/(pv-v);return (k-1+f)*T/N;}
    pv=v;
  }
  return null;
}
function acquire(){
  const td=TD[S.ti],N=745,dt=12*td/(N-1);
  const tc=findTrig(),forced=S.forced;S.forced=false;
  let t0=null,st=S.status;
  const rnd=()=>host.sample?host.now()-12*td:Math.random()*0.1;
  if(S.mode==='auto'){if(tc!==null){t0=tc-(6+S.hpos)*td;st="T'D";}else{t0=rnd();st='AUTO';}}
  else if(S.mode==='normal'){if(tc!==null){t0=tc-(6+S.hpos)*td;st="T'D";}else if(forced){t0=rnd();st="T'D";}else st='WAIT';}
  else{ // single
    if(S.armed){if(tc!==null||forced){t0=(tc!==null?tc:rnd())-(6+S.hpos)*td;S.armed=false;S.run=false;st='STOP';}else st='WAIT';}
    else st='STOP';
  }
  S.status=st;
  if(t0===null)return;
  const buf=[new Float32Array(N),new Float32Array(N)];
  [0,1].forEach(i=>{if(!S.ch[i].on)return;for(let k=0;k<N;k++)buf[i][k]=chainV(i,t0+k*dt);});
  S.frame={t0,td,dt,buf};
}
/* ---------- Ölçümler ---------- */
function edgesOf(b,mid,t0,dt,vpp){
  const rs=[],fs=[];
  if(vpp>1e-9)for(let k=1;k<b.length;k++){
    if(b[k-1]<mid&&b[k]>=mid)rs.push(t0+(k-1+(mid-b[k-1])/(b[k]-b[k-1]))*dt);
    else if(b[k-1]>mid&&b[k]<=mid)fs.push(t0+(k-1+(b[k-1]-mid)/(b[k-1]-b[k]))*dt);
  }
  return {rs,fs};
}
function chStat(i){
  const fr=S.frame;if(!fr||!S.ch[i].on)return null;
  const b=fr.buf[i];let mx=-1e18,mn=1e18;
  for(let k=0;k<b.length;k++){if(b[k]>mx)mx=b[k];if(b[k]<mn)mn=b[k];}
  const mid=(mx+mn)/2,E=edgesOf(b,mid,fr.t0,fr.dt,mx-mn);
  let period=null;if(E.rs.length>=2){period=(E.rs[E.rs.length-1]-E.rs[0])/(E.rs.length-1);if(period/fr.dt<4)period=null;}
  return {E,period,mid};
}
function measure(i){
  const fr=S.frame;if(!fr||!S.ch[i].on)return null;
  const b=fr.buf[i],N=b.length,dt=fr.dt,s=sigs[i];
  let mx=-1e18,mn=1e18,sum=0,sq=0,imax=0,imin=0;
  for(let k=0;k<N;k++){const v=b[k];if(v>mx){mx=v;imax=k;}if(v<mn){mn=v;imin=k;}sum+=v;sq+=v*v;}
  const M={vmax:mx,vmin:mn,vpp:mx-mn,vavg:sum/N,vrms:Math.sqrt(sq/N)};
  const vpp=M.vpp,mid=(mx+mn)/2;
  const cs=chStat(i),tiny=vpp<0.2*vdOf(S.ch[i]);const period=tiny?null:cs.period;const rs=tiny?[]:cs.E.rs,fs=tiny?[]:cs.E.fs;
  M.period=period;M.freq=period?1/period:null;
  M.pwidth=null;M.nwidth=null;
  if(period&&rs.length&&fs.length){
    const r0=rs[0],f=fs.find(x=>x>r0);if(f)M.pwidth=f-r0;
    const f0=fs[0],r=rs.find(x=>x>f0);if(r)M.nwidth=r-f0;
    if(M.pwidth==null&&M.nwidth!=null)M.pwidth=period-M.nwidth;
    if(M.nwidth==null&&M.pwidth!=null)M.nwidth=period-M.pwidth;
  }
  M.pduty=M.pwidth!=null&&period?M.pwidth/period*100:null;M.nduty=M.nwidth!=null&&period?M.nwidth/period*100:null;
  let top=mx,base=mn;
  if(s&&(s.wave==='square'||s.wave==='pulse')){let a=0,an=0,c=0,cn=0;for(let k=0;k<N;k++){if(b[k]>=mid){a+=b[k];an++;}else{c+=b[k];cn++;}}if(an)top=a/an;if(cn)base=c/cn;}
  else if(!s&&vpp>1e-6){const NB=64,h=new Array(NB).fill(0);for(let k=0;k<N;k++)h[Math.min(NB-1,Math.floor((b[k]-mn)/vpp*NB))]++;let bt=NB/2,bb=0;for(let q=NB/2;q<NB;q++)if(h[q]>=h[bt])bt=q;for(let q=0;q<NB/2;q++)if(h[q]>h[bb])bb=q;if(h[bt]>N*0.08)top=mn+(bt+0.5)/NB*vpp;if(h[bb]>N*0.08)base=mn+(bb+0.5)/NB*vpp;}
  M.vtop=top;M.vbase=base;M.vamp=top-base;
  M.vupper=base+0.9*M.vamp;M.vmid=base+0.5*M.vamp;M.vlower=base+0.1*M.vamp;
  M.overshoot=M.vamp>1e-12?(mx-top)/M.vamp*100:null;M.preshoot=M.vamp>1e-12?(base-mn)/M.vamp*100:null;
  M.rise=null;M.fall=null;
  if(period&&s){
    const d=s.duty/100;
    if(s.wave==='square'||s.wave==='pulse'){M.rise=10.2e-9;M.fall=10.2e-9;}
    else if(s.wave==='sine'){M.rise=0.2048*period;M.fall=0.2048*period;}
    else if(s.wave==='ramp'){M.rise=0.8*d*period;M.fall=0.8*(1-d)*period;}
    else if(s.wave==='arb'){M.rise=RISE_ARB*period;M.fall=10.2e-9;}
  }
  if(!s&&period&&M.vamp>1e-6){const lo=base+0.1*M.vamp,hi=base+0.9*M.vamp;const cr=(th,up)=>{for(let k=1;k<N;k++){if(up?(b[k-1]<th&&b[k]>=th):(b[k-1]>th&&b[k]<=th))return (k-1+(th-b[k-1])/(b[k]-b[k-1]))*dt;}return null;};
    const r1=cr(lo,true);if(r1!=null){let r2=null;for(let k=Math.floor(r1/dt)+1;k<N;k++){if(b[k-1]<hi&&b[k]>=hi){r2=(k-1+(hi-b[k-1])/(b[k]-b[k-1]))*dt;break;}}if(r2!=null)M.rise=Math.max(r2-r1,1.75e-9);}
    const f1=cr(hi,false);if(f1!=null){let f2=null;for(let k=Math.floor(f1/dt)+1;k<N;k++){if(b[k-1]>lo&&b[k]<=lo){f2=(k-1+(b[k-1]-lo)/(b[k-1]-b[k]))*dt;break;}}if(f2!=null)M.fall=Math.max(f2-f1,1.75e-9);}}
  M.prate=M.rise?0.8*M.vamp/M.rise:null;M.nrate=M.fall?-0.8*M.vamp/M.fall:null;
  M.area=sum*dt;
  let ps=0,pq=0,pn=0;
  if(period&&rs.length){const k0=Math.max(0,Math.round((rs[0]-fr.t0)/dt)),k1=Math.min(N-1,Math.round((rs[0]+period-fr.t0)/dt));for(let k=k0;k<=k1;k++){ps+=b[k];pq+=b[k]*b[k];pn++;}}
  M.perarea=pn?ps*dt:null;M.pervrms=pn?Math.sqrt(pq/pn):null;
  let vr=0;for(let k=0;k<N;k++){const d=b[k]-M.vavg;vr+=d*d;}M.variance=vr/N;
  const trig=fr.t0+(6+S.hpos)*fr.td;
  M.tvmax=fr.t0+imax*dt-trig;M.tvmin=fr.t0+imin*dt-trig;
  M.pedges=rs.length;M.nedges=fs.length;
  let pp=0,np=0;rs.forEach(r=>{if(fs.some(f=>f>r&&!rs.some(r2=>r2>r&&r2<f)))pp++;});fs.forEach(f=>{if(rs.some(r=>r>f&&!fs.some(f2=>f2>f&&f2<r)))np++;});
  M.ppulses=pp;M.npulses=np;
  M.dlyr=M.dlyf=M.phar=M.phaf=null;
  const A=chStat(0),B=chStat(1);
  if(A&&B&&A.period){
    const dl=(x,y)=>{if(!x.length||!y.length)return null;const r1=x[0];let best=null;y.forEach(r2=>{if(best===null||Math.abs(r2-r1)<Math.abs(best-r1))best=r2;});const P=A.period;let d=best-r1;d=((d+P/2)%P+P)%P-P/2;return d;};
    M.dlyr=dl(A.E.rs,B.E.rs);M.dlyf=dl(A.E.fs,B.E.fs);
    if(M.dlyr!=null)M.phar=M.dlyr/A.period*360;if(M.dlyf!=null)M.phaf=M.dlyf/A.period*360;
  }
  return M;
}
const MN={period:'Period',freq:'Freq',rise:'Rise Time',fall:'Fall Time',pwidth:'+Width',nwidth:'-Width',pduty:'+Duty',nduty:'-Duty',dlyr:'Delay1→2↑',dlyf:'Delay1→2↓',phar:'Phase1→2↑',phaf:'Phase1→2↓',pedges:'+Edges',nedges:'-Edges',ppulses:'+Pulses',npulses:'-Pulses',tvmax:'tVmax',tvmin:'tVmin',prate:'+Rate',nrate:'-Rate',
 vmax:'Vmax',vmin:'Vmin',vpp:'Vpp',vtop:'Vtop',vbase:'Vbase',vamp:'Vamp',vupper:'Vupper',vmid:'Vmid',vlower:'Vlower',vavg:'Vavg',vrms:'Vrms',pervrms:'Per.Vrms',overshoot:'Overshoot',preshoot:'Preshoot',area:'Area',perarea:'Per.Area',variance:'Variance'};
const MU={period:'s',freq:'Hz',rise:'s',fall:'s',pwidth:'s',nwidth:'s',pduty:'%',nduty:'%',dlyr:'s',dlyf:'s',phar:'°',phaf:'°',pedges:'',nedges:'',ppulses:'',npulses:'',tvmax:'s',tvmin:'s',prate:'V/s',nrate:'V/s',
 vmax:'V',vmin:'V',vpp:'V',vtop:'V',vbase:'V',vamp:'V',vupper:'V',vmid:'V',vlower:'V',vavg:'V',vrms:'V',pervrms:'V',overshoot:'%',preshoot:'%',area:'Vs',perarea:'Vs',variance:'V²'};
const mfmt=(M,k)=>{if(!M)return '*****';const v=M[k];if(v==null||!isFinite(v))return '*****';const u=MU[k];if(u==='%')return v.toFixed(2)+'%';if(u==='°')return v.toFixed(1)+'°';if(u==='')return String(v);return siFmt(v,u);};
const HORIZ=['period','freq','rise','fall','pwidth','nwidth','pduty','nduty','dlyr','dlyf','phar','phaf','pedges','nedges','ppulses','npulses','tvmax','tvmin','prate','nrate'];
const VERT=['vmax','vmin','vpp','vtop','vbase','vamp','vupper','vmid','vlower','vavg','vrms','pervrms','overshoot','preshoot','area','perarea','variance'];
const LEFTPAGES=[];
[['Horizontal',HORIZ],['Vertical',VERT]].forEach(([t,a])=>{for(let k=0;k<a.length;k+=6){const it=a.slice(k,k+6);while(it.length<6)it.push(null);LEFTPAGES.push([t+' '+(k/6+1)+'/'+Math.ceil(a.length/6),it]);}});

/* ---------- Menüler ---------- */
function cyc(arr,v){return arr[(arr.indexOf(v)+1)%arr.length];}
function menuItems(){
  const c=S.ch[S.sel];
  const noop={l:'',v:()=>'',a:()=>{}};
  if(S.menu==='ch')return[
    {l:'Coupling',v:()=>c.coup,a:()=>{c.coup=cyc(['DC','AC','GND'],c.coup);say(c.coup==='DC'?'DC kuplaj: sinyalin DC bileşeni görünür.':c.coup==='AC'?'AC kuplaj: DC bileşen süzülür, sinyal sıfır etrafında görünür.':'GND: giriş topraklanır, sıfır seviyesini gösterir.');}},
    {l:'BW Limit',v:()=>c.bw?'20MHz':'Off',a:()=>{c.bw=!c.bw;say('Bant genişliği sınırı: yüksek frekanslı gürültüyü süzer.');}},
    {l:'Probe',v:()=>c.probe+'X',a:()=>{c.probe=c.probe===1?10:1;say(`Probe ayarı ${c.probe}X. Gerçek prob anahtarı ${S.phys[S.sel]}X: `+(c.probe===S.phys[S.sel]?'eşleşiyor, ölçümler doğru.':'EŞLEŞMİYOR: gerilim '+(c.probe>S.phys[S.sel]?'10 kat büyük':'10 kat küçük')+' okunur!'),c.probe===S.phys[S.sel]?'ok':'warn');}},
    {l:'Invert',v:()=>c.inv?'On':'Off',a:()=>{c.inv=!c.inv;say(c.inv?'Dalga ters çevrildi (ekranda).':'Ters çevirme kapalı.');}},
    {l:'Unit',v:()=>'V',a:()=>{}},noop];
  if(S.menu==='trig')return[
    {l:'Type',v:()=>'Edge',a:()=>say('Bu eğitimde yalnızca kenar (Edge) tetikleme var.')},
    {l:'Source',v:()=>'CH'+(S.trig.src+1),a:()=>{S.trig.src=1-S.trig.src;say(`Tetikleme kaynağı CH${S.trig.src+1}.`);}},
    {l:'Slope',v:()=>S.trig.slope==='rise'?'↑ Rise':'↓ Fall',a:()=>{S.trig.slope=S.trig.slope==='rise'?'fall':'rise';say('Tetikleme kenarı: '+(S.trig.slope==='rise'?'yükselen':'düşen')+'.');}},
    {l:'Sweep',v:()=>S.mode==='auto'?'Auto':S.mode==='normal'?'Normal':'Single',a:()=>setMode(cyc(['auto','normal','single'],S.mode))},
    {l:'Coupling',v:()=>'DC',a:()=>{}},noop];
  if(S.menu==='cursor')return[
    {l:'Mode',v:()=>['Off','Manual X','Manual Y'][S.cur],a:()=>{S.cur=(S.cur+1)%3;if(S.cur===1){S.curA=-2;S.curB=2;}if(S.cur===2){S.curA=-1.5;S.curB=1.5;}say(['İmleçler kapalı.','Zaman (X) imleçleri: çok işlevli düğmeyle hareket ettir.','Gerilim (Y) imleçleri: çok işlevli düğmeyle hareket ettir.'][S.cur]);}},
    {l:'Source',v:()=>'CH'+(S.sel+1),a:()=>{S.sel=1-S.sel;}},
    {l:'CurA',v:()=>S.curSel==='A'?'●':'',a:()=>{S.curSel='A';}},
    {l:'CurB',v:()=>S.curSel==='B'?'●':'',a:()=>{S.curSel='B';}},
    {l:'CurAB',v:()=>S.curSel==='AB'?'●':'',a:()=>{S.curSel='AB';}},
    {l:'Clear',v:()=>'',a:()=>{S.cur=0;}}];
  if(S.menu==='meas')return[
    {l:'Source',v:()=>'CH'+(S.sel+1),a:()=>{S.sel=1-S.sel;}},
    {l:'AllMeasure',v:()=>S.allMeas?'On':'Off',a:()=>{S.allMeas=!S.allMeas;}},
    {l:'Clear All',v:()=>'',a:()=>{S.meas=[];}},
    {l:'Statistic',v:()=>'Off',a:()=>{}},{l:'Threshold',v:()=>'10%-90%',a:()=>{}},noop];
  if(S.menu==='disp')return[
    {l:'Type',v:()=>S.dots?'Dots':'Vectors',a:()=>{S.dots=!S.dots;}},
    {l:'Persist',v:()=>'Min',a:()=>{}},
    {l:'Grid',v:()=>({full:'Full',grid:'Grid',cross:'Cross',none:'None'})[S.grid],a:()=>{S.grid=cyc(['full','grid','cross','none'],S.grid);}},
    {l:'Intensity',v:()=>S.bright+'%',a:()=>{S.bright=S.bright>=100?20:S.bright+20;}},
    {l:'Grid Br.',v:()=>'50%',a:()=>{}},{l:'Screen',v:()=>'Normal',a:()=>{}}];
  if(S.menu==='acq')return[
    {l:'Mode',v:()=>({normal:'Normal',average:'Average',peak:'Peak',hires:'High Res'})[S.acq],a:()=>{S.acq=cyc(['normal','average','peak','hires'],S.acq);say(S.acq==='average'?'Average: ortalama alma gürültüyü azaltır (Noise dalgasında görülür).':'Örnekleme modu: '+S.acq+'.');}},
    {l:'Averages',v:()=>'16',a:()=>{}},{l:'Sinc',v:()=>'On',a:()=>{}},{l:'Mem Depth',v:()=>'Auto',a:()=>{}},noop,noop];
  if(S.menu==='auto')return[
    {l:'Single-period',v:()=>'',a:()=>autoMode('single')},{l:'Multi-period',v:()=>'',a:()=>autoMode('multi')},
    {l:'Rise Time',v:()=>'',a:()=>autoMode('rise')},{l:'Fall Time',v:()=>'',a:()=>autoMode('fall')},
    {l:'Back',v:()=>'',a:()=>{S.menu='ch';}},{l:'Undo',v:()=>'',a:()=>undoAuto()}];
  if(S.menu==='gen')return[{l:'Bu menü',v:()=>'',a:()=>{}},{l:'eğitimde',v:()=>'',a:()=>{}},{l:'sadeleşti-',v:()=>'',a:()=>{}},{l:'rildi.',v:()=>'',a:()=>{}},noop,noop];
  return[noop,noop,noop,noop,noop,noop];
}
function setMode(m){
  S.mode=m;S.run=true;S.armed=m==='single';S.armT=host.now?host.now():0;
  if(m==='auto')S.status='AUTO';
  say({auto:'Auto: tetikleme olmasa da ekran güncellenir (tetiksiz görüntü kayar).',normal:'Normal: yalnızca tetikleme olunca güncellenir; olmazsa WAIT görünür.',single:'Single: tetikleme gelince bir kez yakalar ve durur.'}[m]);
}
function snapshot(){S.undo=JSON.parse(JSON.stringify({ch:S.ch,ti:S.ti,hpos:S.hpos,trig:S.trig,mode:S.mode,meas:S.meas}));}
function undoAuto(){if(!S.undo){say('Geri alınacak ayar yok.','warn');return;}const u=JSON.parse(JSON.stringify(S.undo));S.ch=u.ch;S.ti=u.ti;S.hpos=u.hpos;S.trig=u.trig;S.mode=u.mode;S.meas=u.meas;say('Autoset geri alındı: önceki ayarlar yüklendi.','ok');}
function chInfo(i){
  if(host.stats)return host.stats(i);
  const s=sigs[i];if(!s||!s.on)return null;
  const f=s.factor,amp=s.wave==='dc'?0:s.amp*f,mean=meanOf(s),mid=s.off*f;
  return {vmax:mid+amp/2,vmin:mid-amp/2,mean,freq:(s.wave==='dc'||s.wave==='noise')?null:s.freq,wave:s.wave,duty:s.duty};
}
function autoMode(kind){
  const ref=S.trig.src,q=chInfo(ref);
  if(!q||!q.freq){say('Bu seçenek periyodik bir sinyal gerektirir.','warn');return;}
  const T=1/q.freq;S.hpos=0;S.mode='auto';S.run=true;S.armed=false;
  if(kind==='single'){S.ti=nearest(TD,T/10);S.meas=['period','freq'];say('Tek periyot gösteriliyor; Period ve Freq ölçümü ekranın altında.','ok');}
  else if(kind==='multi'){S.ti=nearest(TD,T*4/12);S.meas=['period','freq'];say('Birkaç periyot gösteriliyor; Period ve Freq ölçümü ekranın altında.','ok');}
  else{S.meas=[kind];acquire();const M=measure(ref),t=M&&M[kind];if(!t){say('Bu sinyalde '+(kind==='rise'?'yükselme':'düşme')+' süresi ölçülemiyor.','warn');return;}S.ti=nearest(TD,Math.max(5e-9,t/2));S.meas=[kind];say((kind==='rise'?'Yükselme':'Düşme')+' kenarı genişletildi; süre ölçümü ekranın altında.','ok');}
}
function autoset(){
  snapshot();
  let on=[0,1].filter(i=>{if(!S.ch[i].on)return false;const q=chInfo(i);return q&&(q.vmax-q.vmin>0.004||Math.abs(q.mean)>0.004);});
  if(!on.length){say('Girişte sinyal yok. Probu devreye bağla ve kanalın açık olduğundan emin ol.','warn');return;}
  const isSq=q=>q.wave==='square'||q.wave==='pulse';
  const bad=on.filter(i=>{const q=chInfo(i);return (q.freq&&q.freq<41&&!isSq(q))||(isSq(q)&&((q.vmax-q.vmin)*gainOf(i)<0.02||q.duty<=1||q.duty>=99));});
  if(bad.length===on.length){say('Autoset başarısız: sinüs frekansı en az 41 Hz, kare dalgada genlik en az 20 mVpp ve görev oranı %1\'den büyük olmalı.','warn');return;}
  on=on.filter(i=>!bad.includes(i));
  on.forEach(i=>{
    const q=chInfo(i),g=gainOf(i),c=S.ch[i];
    const vpp=(q.vmax-q.vmin)*g,mid=(c.coup==='AC'?((q.vmax+q.vmin)/2-q.mean):(q.vmax+q.vmin)/2)*g;
    const span=vpp>0.002?vpp:Math.max(Math.abs(mid)*2,0.05);
    const lo=c.probe===10?VD.indexOf(0.01):0,hi=c.probe===10?VD.length-1:VD.indexOf(10);
    c.vi=clamp(nearest(VD,Math.max(span/5,0.001),true),lo,hi);
    c.fine=false;c.pos=-mid/vdOf(c);if(c.inv)c.pos=-c.pos;
    c.pos=clamp(Math.round(c.pos*4)/4,-8,8);
  });
  const ref=on[0],q0=chInfo(ref),g=gainOf(ref),c0=S.ch[ref];
  S.ti=q0.freq?nearest(TD,(1/q0.freq)*3/12):TD.indexOf(1e-3);
  S.trig.src=ref;S.trig.slope='rise';S.mode='auto';S.run=true;S.armed=false;S.hpos=0;S.sel=ref;
  S.trig.level=(c0.coup==='AC'?((q0.vmax+q0.vmin)/2-q0.mean):(q0.vmax+q0.vmin)/2)*g*(c0.inv?-1:1);
  say('Autoset tamamlandı: dikey ölçek, zaman tabanı ve tetikleme sinyale göre ayarlandı.','ok');
}
function nearest(arr,x,up){
  if(up){for(let i=0;i<arr.length;i++)if(arr[i]>=x*0.999)return i;return arr.length-1;}
  let b=0,bd=1e18;arr.forEach((v,i)=>{const d=Math.abs(Math.log(v/x));if(d<bd){bd=d;b=i;}});return b;
}

/* ---------- Tuşlar ---------- */
function flash(id){const e=root.querySelector(`[data-sc="${id}"]`);if(!e)return;e.classList.add('scp');setTimeout(()=>e.classList.remove('scp'),140);}
function press(id){
  flash(id);
  if(id==='power'){S.power=!S.power;S.boot=S.power?Date.now():0;mark();say(S.power?'Osiloskop açıldı.':'Osiloskop kapatıldı.');return;}
  if(!S.power){say('Osiloskop kapalı. Güç düğmesine bas.','warn');return;}
  if(id==='runstop'){
    if(S.run){S.run=false;S.armed=false;S.status='STOP';say('STOP: ekran donduruldu.');}
    else{S.run=true;S.armed=S.mode==='single';S.armT=host.now?host.now():0;S.status=S.mode==='auto'?'AUTO':'WAIT';say('RUN: çalışıyor.');}
  }else if(id==='single'){S.mode='single';S.run=true;S.armed=true;S.armT=host.now?host.now():0;S.status='WAIT';say('Single: tetikleme bekleniyor (WAIT). Tetikleme gelince bir kez yakalar ve durur.');}
  else if(id==='auto'){autoset();if(S.undo){S.menu='auto';S.left=null;}}
  else if(id==='clear'){S.frame=null;say('Ekran temizlendi.');}
  else if(id==='ch1'||id==='ch2'){
    const i=id==='ch1'?0:1,c=S.ch[i];
    if(!c.on){c.on=true;S.sel=i;S.menu='ch';S.left=null;say(`CH${i+1} açıldı ve seçildi.`,'ok');}
    else if(S.sel!==i){S.sel=i;S.menu='ch';say(`CH${i+1} seçildi: dikey düğmeler artık bu kanala etki eder.`);}
    else{c.on=false;if(S.trig.src===i&&S.ch[1-i].on)S.trig.src=1-i;S.sel=S.ch[1-i].on?1-i:i;say(`CH${i+1} kapatıldı.`);}
  }
  else if(id==='tmode')setMode(cyc(['auto','normal','single'],S.mode));
  else if(id==='tmenu'){S.menu='trig';S.left=null;say('Tetikleme menüsü: sağdaki tuşlarla kaynak ve kenarı seç.');}
  else if(id==='force'){S.forced=true;S.run=true;say('FORCE: tek bir yakalama zorlandı.');}
  else if(id==='measure'){if(S.left!==null&&S.menu==='meas'){S.left=null;S.menu=null;}else{S.left=0;S.leftPage=0;S.menu='meas';say('Measure: soldaki tuşlarla ölçüm ekle/çıkar (en fazla 5).');}}
  else if(id==='cursor'){S.cur=(S.cur+1)%3;if(S.cur===1){S.curA=-2;S.curB=2;}if(S.cur===2){S.curA=-1.5;S.curB=1.5;}S.menu=S.cur?'cursor':null;S.left=null;say(['İmleçler kapalı.','Zaman (X) imleçleri: çok işlevli düğmeyle hareket ettir (CurA/CurB sağ menüden).','Gerilim (Y) imleçleri: çok işlevli düğmeyle hareket ettir.'][S.cur]);}
  else if(id==='display'){S.menu='disp';S.left=null;}
  else if(id==='acquire'){S.menu='acq';S.left=null;}
  else if(id==='utility'||id==='storage'||id==='help'||id==='print'||id==='math'||id==='ref'||id==='hmenu'){S.menu='gen';S.left=null;say('Bu işlev eğitimde sadeleştirilmiştir; gerçek cihazda '+({utility:'sistem ayarları',storage:'dosya saklama',help:'yardım',print:'çıktı alma',math:'matematik işlemleri',ref:'referans dalga',hmenu:'gecikmeli tarama'})[id]+' için kullanılır.');}
  else if(id==='lmenu'){if(S.left===null){S.left=0;S.menu='meas';}else S.leftPage=(S.leftPage+1)%LEFTPAGES.length;}
  else if(/^l\d$/.test(id)){
    const i=+id[1];
    if(S.left!==null){const k=LEFTPAGES[S.leftPage][1][i];if(k){const ix=S.meas.indexOf(k);if(ix>=0)S.meas.splice(ix,1);else{S.meas.push(k);if(S.meas.length>5)S.meas.shift();}say(ix>=0?`${MN[k]} ölçümü kaldırıldı.`:`${MN[k]} ölçümü eklendi (CH${S.sel+1}).`);}}
    else say('Önce Measure tuşuna bas: sol tuşlar ölçüm menüsüdür.');
  }
  else if(/^r\d$/.test(id)){const it=menuItems()[+id[1]];if(it&&it.l)it.a();}
  else if(id==='comp'){if(host.onComp)host.onComp();else say(INFO.comp[1]);}
  else if(id==='probe1'||id==='probe2'){const i=id==='probe1'?0:1;S.phys[i]=S.phys[i]===1?10:1;say(`CH${i+1} prob anahtarı ${S.phys[i]}X. Osiloskop menüsündeki Probe ayarı ${S.ch[i].probe}X: `+(S.phys[i]===S.ch[i].probe?'eşleşiyor.':'EŞLEŞMİYOR, ölçümler hatalı olur!'),S.phys[i]===S.ch[i].probe?'ok':'warn');}
  mark();
}
function knobAct(id,dir){
  if(!S.power)return false;
  const c=S.ch[S.sel];
  if(id==='vpos'){c.pos=clamp(c.pos+dir*0.25,-8,8);say(`CH${S.sel+1} dikey pozisyon: ${c.pos.toFixed(2)} div`);}
  else if(id==='vscale'){const lo=c.probe===10?VD.indexOf(0.01):0,hi=c.probe===10?VD.length-1:VD.indexOf(10);
    if(c.fine){c.vv=+clamp(c.vv*Math.pow(1.05,-dir),VD[lo],VD[hi]).toPrecision(3);}else c.vi=clamp(c.vi-dir,lo,hi);
    say(`CH${S.sel+1}: ${siFmt(vdOf(c),'V')}/div (${c.fine?'ince':'kaba'} ayar)`);}
  else if(id==='hpos'){if(!S.run){say('STOP durumunda yatay konum değişmez; RUN\'a bas.','warn');return false;}S.hpos=clamp(S.hpos+dir*0.5,-50,50);say(`Yatay konum: ${S.hpos.toFixed(1)} div`);}
  else if(id==='hscale'){if(!S.run){say('STOP durumunda zaman tabanı değişmez; RUN\'a bas.','warn');return false;}S.ti=clamp(S.ti-dir,0,TD.length-1);say(`Zaman tabanı: ${siFmt(TD[S.ti],'s')}/div`);}
  else if(id==='tlevel'){const g=S.ch[S.trig.src];S.trig.level+=dir*vdOf(g)*0.1;S.lvlT=Date.now();say(`Tetikleme seviyesi: ${siFmt(S.trig.level,'V')}`);}
  else if(id==='multi'){
    if(S.cur){const d=dir*0.1,lim=S.cur===1?6:4;if(S.curSel!=='B')S.curA=clamp(S.curA+d,-lim,lim);if(S.curSel!=='A')S.curB=clamp(S.curB+d,-lim,lim);}
    else{S.bright=clamp(S.bright+dir*5,10,100);say('Dalga parlaklığı: %'+S.bright);}
  }
  mark();return true;
}
function knobPress(id){
  if(!S.power)return;
  const c=S.ch[S.sel];
  if(id==='vpos'){c.pos=0;say('Dikey pozisyon sıfırlandı.');}
  else if(id==='hpos'){S.hpos=0;say('Yatay konum sıfırlandı.');}
  else if(id==='tlevel'){S.trig.level=0;S.lvlT=Date.now();say('Tetikleme seviyesi sıfıra (0 V) döndü.','ok');}
  else if(id==='multi'){S.bright=60;S.curA=S.cur===2?-1.5:-2;S.curB=S.cur===2?1.5:2;say('Parlaklık %60\'a, imleçler başlangıca döndü.');}
  else if(id==='vscale'){if(!c.fine){c.fine=true;c.vv=VD[c.vi];say('İnce (Fine) ayar: V/div küçük adımlarla değişir; dalgayı ekrana tam sığdırmak için kullanılır.','ok');}else{c.fine=false;c.vi=nearest(VD,c.vv);say('Kaba (Coarse) ayar: 1-2-5 adımlarıyla.');}}
  else say('Yatay SCALE\'e basmak gecikmeli taramayı (zoom) açar; bu eğitimde kullanılmıyor.');
  mark();
}
function knobStep(id,dir){const ok=knobAct(id,dir);if(ok)kstate[id].t+=KSTEP*dir;return ok;}

/* ---------- Çizim ---------- */
function chY(i,v){const c=S.ch[i];return GCY-(v/vdOf(c)+c.pos)*DY;}
function chYs(i,v){return clamp(chY(i,v),GY0+0.8,GY0+GH-0.8);}
function gridSvg(){
  const g=S.grid;let o='';
  if(g==='none')return `<rect x="${GX0}" y="${GY0}" width="${GW}" height="${GH}" fill="none" stroke="#444"/>`;
  if(g==='full')for(let i=1;i<12;i++)o+=`<line x1="${GX0+i*DX}" y1="${GY0}" x2="${GX0+i*DX}" y2="${GY0+GH}" stroke="#4a4a4a" stroke-width=".6" stroke-dasharray="1 3"/>`;
  if(g==='full')for(let j=1;j<8;j++)o+=`<line x1="${GX0}" y1="${GY0+j*DY}" x2="${GX0+GW}" y2="${GY0+j*DY}" stroke="#4a4a4a" stroke-width=".6" stroke-dasharray="1 3"/>`;
  if(g==='grid'){for(let i=1;i<12;i++)o+=`<line x1="${GX0+i*DX}" y1="${GY0}" x2="${GX0+i*DX}" y2="${GY0+GH}" stroke="#3a3a3a" stroke-width=".5"/>`;for(let j=1;j<8;j++)o+=`<line x1="${GX0}" y1="${GY0+j*DY}" x2="${GX0+GW}" y2="${GY0+j*DY}" stroke="#3a3a3a" stroke-width=".5"/>`;}
  o+=`<rect x="${GX0}" y="${GY0}" width="${GW}" height="${GH}" fill="none" stroke="#6a6a6a"/>`;
  o+=`<line x1="${GCX}" y1="${GY0}" x2="${GCX}" y2="${GY0+GH}" stroke="#7a7a7a" stroke-width=".8"/><line x1="${GX0}" y1="${GCY}" x2="${GX0+GW}" y2="${GCY}" stroke="#7a7a7a" stroke-width=".8"/>`;
  for(let i=0;i<60;i++){const x=GX0+i*GW/60;o+=`<line x1="${x}" y1="${GCY-2}" x2="${x}" y2="${GCY+2}" stroke="#8a8a8a" stroke-width=".6"/>`;}
  for(let j=0;j<40;j++){const y=GY0+j*GH/40;o+=`<line x1="${GCX-2}" y1="${y}" x2="${GCX+2}" y2="${y}" stroke="#8a8a8a" stroke-width=".6"/>`;}
  return o;
}
function render(){
  const el=root.querySelector('#scScr');if(!el)return;
  const pw=root.querySelector('#pwLed');if(pw)pw.setAttribute('stroke',S.power?'#2fbf4f':'#555');
  [0,1].forEach(i=>{const r=root.querySelector(`#chb${i+1} rect`);if(r){r.setAttribute('fill',S.ch[i].on?(i?'#c9f2ff':'#fff3a6'):'#f5f3ec');r.setAttribute('stroke-width',S.ch[i].on&&S.sel===i?5:3);r.style.filter=S.ch[i].on?`drop-shadow(0 0 4px ${COL[i]})`:'';}root.querySelector('#pbt'+i).textContent=S.phys[i]+'X';root.querySelector('#pbt'+i).setAttribute('fill',S.phys[i]===S.ch[i].probe?'#444':'#c0392b');});
  const rsb=root.querySelector('[data-sc="runstop"] rect');if(rsb){rsb.setAttribute('fill',!S.power?'#f5f3ec':S.run?'#9ee59e':'#f19b9b');}
  const sgb=root.querySelector('[data-sc="single"] rect');if(sgb)sgb.setAttribute('fill',S.power&&S.armed?'#ffd78a':'#f5f3ec');
  if(!S.power){el.innerHTML='<rect width="477" height="290" fill="#050505"/>';return;}
  if(S.boot&&Date.now()-S.boot<1200){el.innerHTML='<rect width="477" height="290" fill="#05080f"/><text x="238" y="150" font-size="34" font-weight="800" fill="#e03a3a" text-anchor="middle">RIGOL</text><text x="238" y="175" font-size="11" fill="#9aa8c0" text-anchor="middle">DS1202Z-E  başlatılıyor...</text>';return;}
  const td=TD[S.ti],fr=S.frame,nOn=(S.ch[0].on?1:0)+(S.ch[1].on?1:0);
  let o='<rect width="477" height="290" fill="#000"/>';
  // üst çubuk
  const stc={"T'D":'#2ecc71',AUTO:'#2ecc71',WAIT:'#f1c40f',STOP:'#e74c3c'}[S.status]||'#2ecc71';
  const rate=Math.min(nOn>1?5e8:1e9,6e6/(td*12)),mem=rate*td*12;
  const tp=200+50+S.hpos/12*50;
  o+=`<rect x="3" y="2" width="38" height="12" fill="#b3122a"/><text x="22" y="11.3" font-size="8" font-weight="800" fill="#fff" text-anchor="middle">RIGOL</text>
   <rect x="46" y="2" width="30" height="12" fill="${stc}"/><text x="61" y="11.3" font-size="8" font-weight="800" fill="#000" text-anchor="middle">${S.status}</text>
   <text x="84" y="11.3" font-size="8.5" font-weight="700" fill="#fff">H</text><text x="94" y="11.3" font-size="8.5" fill="#fff">${siFmt(td,'s')}</text>
   <text x="140" y="8" font-size="6" fill="#bbb">${siFmt(rate,'Sa/s')}</text><text x="140" y="14" font-size="6" fill="#bbb">${siFmt(mem,'pts')}</text>
   <rect x="200" y="5" width="100" height="6" fill="none" stroke="#777"/><path d="M${clamp(tp,200,300)} 3 l-3 -0 l3 7 l3 -7z" fill="#ff9d2e"/>
   <text x="318" y="11.3" font-size="8" fill="#fff">D ${siFmt(-S.hpos*td,'s')}</text>
   <rect x="376" y="2" width="12" height="12" fill="#ff9d2e"/><text x="382" y="11.3" font-size="8" font-weight="800" fill="#000" text-anchor="middle">T</text>
   <text x="392" y="11.3" font-size="8" fill="#ffb347">${S.trig.slope==='rise'?'↑':'↓'}</text><text x="401" y="11.3" font-size="7.5" fill="#fff">${siFmt(S.trig.level,'V')}</text>`;
  o+=gridSvg();
  // izler
  let tr='';
  const dense=[0,1].map(i=>{const s=sigs[i];return S.ch[i].on&&s&&s.on&&s.wave!=='dc'&&s.freq*td*12>150;});
  if(fr)[0,1].forEach(i=>{
    if(!S.ch[i].on)return;
    const b=fr.buf[i],N=b.length,col=COL[i],op=S.bright/100;
    if(dense[i]){
      let mx=-1e18,mn=1e18;for(const v of b){if(v>mx)mx=v;if(v<mn)mn=v;}
      const y1=chY(i,mx),y2=chY(i,mn);
      tr+=`<rect x="${GX0}" y="${Math.min(y1,y2)}" width="${GW}" height="${Math.abs(y2-y1)||1}" fill="${col}" opacity="${.45*op}"/><line x1="${GX0}" y1="${y1}" x2="${GX0+GW}" y2="${y1}" stroke="${col}" opacity="${op}"/><line x1="${GX0}" y1="${y2}" x2="${GX0+GW}" y2="${y2}" stroke="${col}" opacity="${op}"/>`;
      return;
    }
    let d='';
    if(S.dots){for(let k=0;k<N;k+=2)d+=`M${(GX0+k*GW/(N-1)).toFixed(1)} ${chYs(i,b[k]).toFixed(1)}h.1`;tr+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" opacity="${op}"/>`;}
    else{for(let k=0;k<N;k++)d+=(k?'L':'M')+(GX0+k*GW/(N-1)).toFixed(1)+' '+chYs(i,b[k]).toFixed(1);tr+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.2" stroke-linejoin="round" opacity="${op}"/>`;}
  });
  o+=`<g clip-path="url(#scClip)">${tr}</g>`;
  // yatay ofset işareti
  if(S.run||fr)o+=`<path d="M${clamp(GCX+S.hpos*DX,GX0,GX0+GW)} ${GY0} l-4 -0 l4 6 l4 -6z" fill="#ff9d2e"/>`;
  // sıfır işaretleri + tetik işareti
  [0,1].forEach(i=>{if(!S.ch[i].on)return;const y=clamp(GCY-S.ch[i].pos*DY,GY0,GY0+GH);o+=`<path d="M${GX0} ${y} l-8 -5 v10z" fill="${COL[i]}"/><text x="${GX0-6}" y="${y+2.7}" font-size="6.5" font-weight="800" fill="#000" text-anchor="middle">${i+1}</text>`;});
  {const ts=S.trig.src,y=clamp(chY(ts,S.trig.level),GY0,GY0+GH);o+=`<path d="M${GX0+GW} ${y} l8 -5 v10z" fill="#ff9d2e"/><text x="${GX0+GW+5}" y="${y+2.5}" font-size="6.5" font-weight="800" fill="#000" text-anchor="middle">T</text>`;
   if(Date.now()-S.lvlT<1600)o+=`<line x1="${GX0}" y1="${y}" x2="${GX0+GW}" y2="${y}" stroke="#ff9d2e" stroke-width=".9" stroke-dasharray="4 3"/>`;}
  // imleçler
  if(S.cur&&fr){
    const sc=S.ch[S.sel]?S.sel:0,c=S.ch[sc],vd=vdOf(c);let t='';
    if(S.cur===1){
      const xa=GCX+S.curA*DX,xb=GCX+S.curB*DX;
      o+=`<line x1="${xa}" y1="${GY0}" x2="${xa}" y2="${GY0+GH}" stroke="#ff7ad9" stroke-dasharray="4 2"/><line x1="${xb}" y1="${GY0}" x2="${xb}" y2="${GY0+GH}" stroke="#ff7ad9" stroke-dasharray="4 2"/><text x="${xa+2}" y="${GY0+9}" font-size="7" fill="#ff7ad9">A</text><text x="${xb+2}" y="${GY0+9}" font-size="7" fill="#ff7ad9">B</text>`;
      const dxv=Math.abs(S.curB-S.curA)*td,ia=clamp(Math.round((S.curA+6)/12*744),0,744),ib=clamp(Math.round((S.curB+6)/12*744),0,744);
      const va=fr.buf[sc][ia],vb=fr.buf[sc][ib];
      t=[`ΔX: ${siFmt(dxv,'s')}`,`1/ΔX: ${dxv>0?siFmt(1/dxv,'Hz'):'---'}`,`A Y: ${siFmt(va,'V')}   B Y: ${siFmt(vb,'V')}`,`ΔY: ${siFmt(vb-va,'V')}`];
    }else{
      const ya=GCY-S.curA*DY,yb=GCY-S.curB*DY;
      o+=`<line x1="${GX0}" y1="${ya}" x2="${GX0+GW}" y2="${ya}" stroke="#ff7ad9" stroke-dasharray="4 2"/><line x1="${GX0}" y1="${yb}" x2="${GX0+GW}" y2="${yb}" stroke="#ff7ad9" stroke-dasharray="4 2"/><text x="${GX0+3}" y="${ya-2}" font-size="7" fill="#ff7ad9">A</text><text x="${GX0+3}" y="${yb-2}" font-size="7" fill="#ff7ad9">B</text>`;
      const va=(S.curA-c.pos)*vd,vb=(S.curB-c.pos)*vd;
      t=[`A Y: ${siFmt(va,'V')}`,`B Y: ${siFmt(vb,'V')}`,`ΔY: ${siFmt(vb-va,'V')}`];
    }
    o+=`<rect x="${GX0+4}" y="${GY0+12}" width="108" height="${t.length*10+6}" fill="#000" fill-opacity=".72" stroke="#ff7ad9" stroke-width=".6"/>`+t.map((x,i)=>`<text x="${GX0+8}" y="${GY0+23+i*10}" font-size="7.5" fill="#ffd3f3" font-family="Menlo,Consolas,monospace">${x}</text>`).join('');
  }
  // tüm ölçümler tablosu
  const mc=S.ch[S.sel].on?S.sel:(S.ch[0].on?0:1),M=measure(mc);
  if(S.allMeas){
    const rows=[['vmax','vmin','vpp','vtop','vbase','vamp','vavg','vrms','area','perarea'],['freq','period','pduty','nduty','pwidth','nwidth','prate','nrate','overshoot','preshoot'],['rise','fall','tvmax','tvmin','variance','vupper','vmid','vlower','pervrms','dlyr']];
    o+=`<rect x="${GX0+2}" y="${GY0+2}" width="${GW-4}" height="${rows.length*21+6}" fill="#000" fill-opacity=".8"/>`;
    rows.forEach((r,ri)=>r.forEach((k,ci)=>{const x=GX0+6+ci*36.5;o+=`<text x="${x}" y="${GY0+12+ri*21}" font-size="5.8" fill="#fff">${MN[k].replace('Overshoot','Over').replace('Preshoot','Pre').replace('Variance','Vari').replace('Per.Area','AreaP').replace('Per.Vrms','VrmsP').replace('Delay1→2↑','Dly↑')}</text><text x="${x}" y="${GY0+20+ri*21}" font-size="5.8" font-weight="700" fill="${COL[mc]}">${mfmt(M,k)}</text>`;}));
  }
  // sol menü
  if(S.left!==null){
    const [title,items]=LEFTPAGES[S.leftPage];
    o+=`<text x="2" y="24" font-size="6.5" fill="#cfd8e8">${title}</text>`;
    [46,88,123,158,198,235].forEach((cy,i)=>{const k=items[i];if(!k)return;const on=S.meas.includes(k);
      o+=`<rect x="2" y="${cy-16}" width="40" height="32" rx="2" fill="#10151f" stroke="${on?'#ffd23f':'#5a6a85'}" stroke-width="${on?1.6:.8}"/><text x="22" y="${cy+9}" font-size="6.3" fill="#e8eeff" text-anchor="middle">${MN[k]}</text><text x="22" y="${cy-3}" font-size="9" fill="${on?'#ffd23f':'#8fb4ff'}" text-anchor="middle">${on?'✔':'□'}</text>`;});
  }
  // sağ menü
  if(S.menu){
    const items=menuItems();
    [48,90,124,160,198,233].forEach((cy,i)=>{const it=items[i];if(!it||!it.l)return;
      o+=`<rect x="420" y="${cy-16}" width="56" height="32" rx="2" fill="#10151f" stroke="#5a6a85" stroke-width=".8"/><text x="448" y="${cy-3}" font-size="6.8" fill="#9fb8e8" text-anchor="middle">${it.l}</text><text x="448" y="${cy+9}" font-size="8" font-weight="700" fill="#fff" text-anchor="middle">${it.v()}</text>`;});
  }
  // alt ölçüm kutuları
  S.meas.forEach((k,i)=>{const x=GX0+i*74.4;
    o+=`<rect x="${x}" y="244" width="72" height="23" fill="#0a0e16" stroke="#445" stroke-width=".6"/><text x="${x+3}" y="253" font-size="6.5" fill="${COL[mc]}">${mc+1}</text><text x="${x+10}" y="253" font-size="6.8" fill="#fff">${MN[k]}</text><text x="${x+36}" y="263" font-size="7.5" font-weight="700" fill="#fff" text-anchor="middle">${mfmt(M,k)}</text>`;});
  // kanal çubuğu
  [0,1].forEach(i=>{const c=S.ch[i],x=2+i*86,on=c.on,sel=S.sel===i;
    o+=`<rect x="${x}" y="270" width="82" height="18" fill="${on?(sel?COL[i]:'#111'):'#111'}" stroke="${COL[i]}" stroke-width="${on?1.4:.6}" opacity="${on?1:.45}"/><text x="${x+9}" y="283" font-size="10" font-weight="800" fill="${on&&sel?'#000':COL[i]}" text-anchor="middle">${i+1}</text><text x="${x+18}" y="283" font-size="9" font-weight="700" fill="${on&&sel?'#000':'#fff'}">${siFmt(vdOf(c),'V')}${c.fine?'*':''}</text><text x="${x+62}" y="283" font-size="7" fill="${on&&sel?'#000':'#cfd8e8'}">${c.coup==='DC'?'':c.coup} ${c.probe===10?'10X':''}${c.inv?' ⇅':''}</text>`;});
  if(S.mode!=='auto'||S.armed)o+=`<text x="380" y="282" font-size="7" fill="#ffb347">${S.mode==='normal'?'Normal':'Single'}</text>`;
  el.innerHTML=o;
}

/* ---------- Etkileşim ---------- */
const infoShow=id=>{const i=INFO[id];if(i)host.info(i[0],i[1]);};
let kdrag=null;
function kAng(e,id){const m=root.getScreenCTM().inverse(),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(m);const [cx,cy]=KN[id];return Math.atan2(p.y-cy,p.x-cx)*180/Math.PI;}
function attach(){
  root.addEventListener('pointerdown',e=>{
    const t=e.target;
    const kp=t.closest('[data-kpress]');
    if(kp){const id=kp.dataset.kpress;kdrag={id,a:kAng(e,id),acc:0,inner:true,moved:false,x:e.clientX,y:e.clientY};kp.setPointerCapture&&kp.setPointerCapture(e.pointerId);infoShow(id);return;}
    const kn=t.closest('[data-knob]');
    if(kn){const id=kn.dataset.knob;kdrag={id,a:kAng(e,id),acc:0,inner:false,moved:true};kn.setPointerCapture&&kn.setPointerCapture(e.pointerId);infoShow(id);return;}
    const b=t.closest('[data-sc]');if(b){press(b.dataset.sc);infoShow(b.dataset.si);}
  });
  root.addEventListener('pointermove',e=>{
    if(kdrag){
      const k=kdrag;const a=kAng(e,k.id);let d=a-k.a;if(d>180)d-=360;if(d<-180)d+=360;k.a=a;k.acc+=d;
      if(k.inner&&!k.moved){if(Math.abs(k.acc)<10&&Math.hypot(e.clientX-k.x,e.clientY-k.y)<8)return;k.moved=true;}
      while(Math.abs(k.acc)>=KSTEP){const dir=k.acc>0?1:-1;k.acc-=KSTEP*dir;knobStep(k.id,dir);}
      return;
    }
    const el=e.target.closest&&e.target.closest('[data-si]');if(el&&el.dataset.si!==attach.last){attach.last=el.dataset.si;infoShow(el.dataset.si);}
  });
  const up=()=>{if(kdrag&&kdrag.inner&&!kdrag.moved){knobPress(kdrag.id);}kdrag=null;};
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',()=>{kdrag=null;});
  root.addEventListener('wheel',e=>{const kn=e.target.closest('[data-knob]');if(kn){e.preventDefault();knobStep(kn.dataset.knob,e.deltaY<0?1:-1);}},{passive:false});
}
function loop(now){
  Object.keys(kstate).forEach(id=>{
    const k=kstate[id];k.v=(k.v+(k.t-k.a)*0.18)*0.78;k.a+=k.v;if(Math.abs(k.t-k.a)<0.05&&Math.abs(k.v)<0.05){k.a=k.t;k.v=0;}
    const g=root.querySelector('#kr-'+id);if(g)g.setAttribute('transform',`rotate(${k.a} ${KN[id][0]} ${KN[id][1]})`);
  });
  if(S.power&&now-lastDraw>45){
    lastDraw=now;sigs=host.getSignals();
    if(S.run)acquire();
    render();dirty=false;
  }else if(dirty||!S.power){sigs=host.getSignals();render();dirty=false;}
  requestAnimationFrame(loop);
}
function init(h){
  host=Object.assign(host,h);root=h.root;svg=root.ownerSVGElement;
  root.innerHTML=build();attach();
  requestAnimationFrame(loop);
}
function reset(){
  const d=defaults();Object.keys(d).forEach(k=>{S[k]=d[k];});
  Object.keys(kstate).forEach(k=>{kstate[k].t=0;});
  sigs=host.getSignals();mark();
}
function halo(list){
  root.querySelectorAll('.halo').forEach(h=>h.style.display='none');
  (list||[]).forEach(n=>root.querySelectorAll(`.halo[data-h="${n}"]`).forEach(h=>h.style.display='block'));
}
return {init,S,TD,VD,vdOf,chInfo,gainOf,press,knobStep,knobPress,autoset,reset,halo,mark,measure,siFmt,shape,setMode,COL,mfmt,INFO,
  sigs:()=>sigs,refresh:()=>{sigs=host.getSignals();acquire();render();}};
})();

const GEN=(function(){
const $=s=>document.querySelector(s);
const stage=$('#genSvg');
const CHCOL=['#ffd23f','#3ad1ff'], CHCOL2=['#b98a00','#0f87b3'];
const WAVES=['sine','square','pulse','ramp','arb','noise','dc'];
const WNAME={sine:'Sine',square:'Square',pulse:'Pulse',ramp:'Ramp',arb:'Arb',noise:'Noise',dc:'DC'};
const WICON={sine:'M0 7 C4 -2 8 -2 13 7 S22 16 26 7',square:'M0 12 V2 H9 V12 H18 V2 H26',pulse:'M0 12 H5 V2 H11 V12 H26',ramp:'M0 12 L9 2 L18 12 L26 4',arb:'M0 9 L5 3 L9 11 L14 4 L19 12 L26 6',noise:'M0 7 L2 3 L4 11 L6 5 L8 10 L10 2 L12 9 L14 4 L17 11 L19 3 L22 10 L26 5',dc:'M0 7 H26'};
const FMAX={sine:30e6,square:15e6,pulse:15e6,ramp:1e6,arb:6e6,noise:1e6,dc:1e6};
const LAB={freq:'Freq',amp:'Amp',off:'Offset',phase:'Phase',duty:'Duty',modWave:'ModWave',modFreq:'ModFreq',depth:'Depth',phaseDev:'PhaseDev',freqDev:'FreqDev',hopFreq:'HopFreq',fskRate:'Rate',swStart:'StartFreq',swStop:'StopFreq',swTime:'SwpTime'};
const PUNIT={freq:'Hz',amp:'Vpp',off:'V',phase:'°',duty:'%',modFreq:'Hz',depth:'%',phaseDev:'°',freqDev:'Hz',hopFreq:'Hz',fskRate:'Hz',swStart:'Hz',swStop:'Hz',swTime:'s'};
const FREQLIKE=new Set(['freq','modFreq','freqDev','hopFreq','fskRate','swStart','swStop']);
const MODS=['AM','PM','FM','FSK','LIN','LOG'],MODLBL={AM:'AM',PM:'PM',FM:'FM',FSK:'FSK',LIN:'Line',LOG:'Log'},MWAVES=['sine','square','ramp'];
const modParamList=m=>({AM:['modWave','modFreq','depth'],PM:['modWave','modFreq','phaseDev'],FM:['modWave','modFreq','freqDev'],FSK:['hopFreq','fskRate'],LIN:['swStart','swStop','swTime'],LOG:['swStart','swStop','swTime']})[m]||[];

/* ---------- Dalga şekilleri ---------- */
function shape(w,p,d){
  switch(w){
    case 'sine':return Math.sin(2*Math.PI*p);
    case 'square':case 'pulse':return p<d?1:-1;
    case 'ramp':return p<d?-1+2*p/d:1-2*(p-d)/(1-d);
    case 'arb':return 2*(1-Math.exp(-5*p))/(1-Math.exp(-5))-1;
    case 'noise':return Math.random()*2-1;
    default:return 0;
  }
}
const RMS={};
WAVES.forEach(w=>{let s=0;const N=2000;for(let i=0;i<N;i++){const v=w==='noise'?0.5773:shape(w,i/N,0.5);s+=v*v;}RMS[w]=Math.sqrt(s/N);});
function paramList(w){return w==='dc'?['off']:w==='noise'?['amp','off']:(w==='square'||w==='pulse'||w==='ramp')?['freq','amp','off','phase','duty']:['freq','amp','off','phase'];}
const labOf=(p,w)=>p==='duty'?(w==='ramp'?'Symm':'Duty'):LAB[p];
/* ---------- Modülasyonlu örnekleme (zaman tabanlı) ---------- */
const INTEG={};MWAVES.forEach(w=>{const N=1024,a=new Float64Array(N+1);let s=0;for(let i=0;i<N;i++){a[i]=s;s+=shape(w,(i+0.5)/N,0.5)/N;}a[N]=s;INTEG[w]=a;});
const frac=x=>x-Math.floor(x);
function integ(w,p){const a=INTEG[w],N=1024,x=p*N,i=Math.min(N-1,Math.floor(x));return a[i]+(a[i+1]-a[i])*(x-i);}
function chSample(c,t){
  if(c.wave==='dc')return c.off;
  if(c.wave==='noise')return c.off+c.amp/2*(Math.random()*2-1);
  let ph=c.freq*t+c.phase/360,env=1;
  switch(c.mod){
    case 'AM':{const m=shape(c.modWave,frac(c.modFreq*t),0.5),k=c.depth/100;env=(1+k*m)/(1+k);break;}
    case 'PM':ph+=c.phaseDev/360*shape(c.modWave,frac(c.modFreq*t),0.5);break;
    case 'FM':ph+=c.freqDev/c.modFreq*integ(c.modWave,frac(c.modFreq*t));break;
    case 'FSK':{const Ts=1/(2*c.fskRate),k=Math.floor(t/Ts),r=t-k*Ts;ph=(Math.ceil(k/2)*c.freq+Math.floor(k/2)*c.hopFreq)*Ts+r*(k%2?c.hopFreq:c.freq)+c.phase/360;break;}
    case 'LIN':{const T=c.swTime,n=Math.floor(t/T),tau=t-n*T,f0=c.swStart,f1=c.swStop;ph=frac(n*(f0*T+(f1-f0)*T/2))+f0*tau+(f1-f0)*tau*tau/(2*T)+c.phase/360;break;}
    case 'LOG':{const T=c.swTime,n=Math.floor(t/T),tau=t-n*T,f0=c.swStart,r=c.swStop/c.swStart,L=Math.abs(Math.log(r))<1e-9?1e-9:Math.log(r),F=x=>f0*T/L*(Math.pow(r,x/T)-1);ph=frac(n*F(T))+F(tau)+c.phase/360;break;}
  }
  return c.off+c.amp/2*env*shape(c.wave,frac(ph),c.duty/100);
}
function modPeriod(c){return c.mod==='FSK'?1/c.fskRate:(c.mod==='LIN'||c.mod==='LOG')?c.swTime:1/c.modFreq;}

/* ---------- Durum ---------- */
const newCh=()=>({on:false,wave:'sine',freq:1000,amp:0.1,off:0,phase:0,duty:50,mod:null,modWave:'sine',modFreq:100,depth:100,phaseDev:90,freqDev:1000,hopFreq:2000,fskRate:100,swStart:100,swStop:1000,swTime:1});
const CH=[newCh(),newCh()];
const G={ch:0,load:'HighZ',menu:'wave',page:0,param:'freq',entry:null,edit:false,cur:{freq:3,amp:-2,off:-2,phase:0,duty:0,modFreq:1,depth:0,phaseDev:0,freqDev:2,hopFreq:2,fskRate:1,swStart:1,swStop:2,swTime:-1},info:'screen',mode:'lesson',lesson:0,step:0,busy:0,mute:false};
const CRANGE={freq:[-3,7],amp:[-3,1],off:[-3,1],phase:[-2,2],duty:[-2,1],modFreq:[-3,4],depth:[-1,2],phaseDev:[-2,2],freqDev:[-3,7],hopFreq:[-3,7],fskRate:[-3,5],swStart:[-3,7],swStop:[-3,7],swTime:[-3,2]};
const editable=()=>G.menu==='param'||(G.menu==='mode'&&!!CH[G.ch].mod);
const curList=()=>G.menu==='mode'?modParamList(CH[G.ch].mod):paramList(CH[G.ch].wave);
const defUnit=p=>FREQLIKE.has(p)?2:0;
const TD=[],VD=[];
[-8,-7,-6,-5,-4,-3,-2,-1,0].forEach(e=>[1,2,5].forEach(m=>TD.push(m*Math.pow(10,e))));
TD.push(10);
[-3,-2,-1,0].forEach(e=>[1,2,5].forEach(m=>VD.push(m*Math.pow(10,e))));
VD.push(10);
const SCP={td:TD.indexOf(1e-3),vd:VD.indexOf(1),auto:true};
let dirty=true;
const mark=()=>{dirty=true;};

/* ---------- Biçimleme ---------- */
function siFmt(x,u){
  const a=Math.abs(x);let sc=1,p='';
  if(a>=1e6){sc=1e6;p='M';}else if(a>=1e3){sc=1e3;p='k';}else if(a>=1||a===0){sc=1;}else if(a>=1e-3){sc=1e-3;p='m';}else if(a>=1e-6){sc=1e-6;p='μ';}else{sc=1e-9;p='n';}
  return (+(x/sc).toPrecision(4))+' '+p+u;
}
function fmtP(p,v){
  if(p==='modWave')return{num:WNAME[v]||v,u:'',lg:0,ipl:0,st:0,dec:0,txt:true};
  if(p==='swTime'){const t=v.toFixed(3);return{num:t,u:'s',lg:0,ipl:t.split('.')[0].length,st:0,dec:3};}
  if(FREQLIKE.has(p)){const sc=v>=1e6?1e6:v>=1e3?1e3:1,u=sc===1e6?'MHz':sc===1e3?'kHz':'Hz';const [ip,fp]=(v/sc).toFixed(8).split('.');return{num:ip+'.'+fp.match(/.{1,3}/g).join(','),u,lg:Math.log10(sc),grp:true,ipl:ip.length,st:0,dec:8};}
  if(p==='amp'){if(v>=1)return{num:v.toFixed(3),u:'Vpp',lg:0,ipl:v.toFixed(3).split('.')[0].length,st:0,dec:3};return{num:String(Math.round(v*1000)),u:'mVpp',lg:-3,ipl:String(Math.round(v*1000)).length,st:0,dec:0};}
  if(p==='off'){const a=Math.abs(v),sg=v<0?'-':'';if(a>=1){const t=a.toFixed(3);return{num:sg+t,u:'V',lg:0,ipl:t.split('.')[0].length,st:sg.length,dec:3};}const t=String(Math.round(a*1000));return{num:sg+t,u:'mV',lg:-3,ipl:t.length,st:sg.length,dec:0};}
  const t=v.toFixed(2);return{num:t,u:(p==='phase'||p==='phaseDev')?'°':'%',lg:0,ipl:t.split('.')[0].length,st:0,dec:2};
}
function cidx(f,d){
  if(f.txt)return -1;
  const k=d-f.lg;
  if(k>=0){const i=f.ipl-1-k;return i<0?-1:f.st+i;}
  const fi=-k-1;if(fi>=f.dec)return -1;
  return f.st+f.ipl+1+fi+(f.grp?Math.floor(fi/3):0);
}
const stepTxt=(p,d)=>siFmt(Math.pow(10,d),PUNIT[p]==='°'||PUNIT[p]==='%'?PUNIT[p]:PUNIT[p]);
const ptxt=(p,v)=>{const f=fmtP(p,v);return f.num+' '+f.u;};
const near=(a,b)=>Math.abs(a-b)<=Math.max(1e-6,Math.abs(b)*0.005);

/* ---------- Parametre ayarlama ---------- */
function limits(c,p){
  if(p==='freq')return[1e-6,FMAX[c.wave]];
  if(p==='amp')return[0.001,Math.min(G.load==='50Ω'?10:20,2*(10-Math.abs(c.off)))];
  if(p==='off')return[-(10-c.amp/2),10-c.amp/2];
  if(p==='duty')return[1,99];
  if(p==='modFreq')return[0.002,50000];
  if(p==='depth')return[0,120];
  if(p==='phaseDev')return[0,360];
  if(p==='freqDev')return[0,Math.max(0,Math.min(c.freq,FMAX[c.wave]-c.freq))];
  if(p==='hopFreq'||p==='swStart'||p==='swStop')return[1e-6,FMAX[c.wave]];
  if(p==='fskRate')return[0.002,100000];
  if(p==='swTime')return[0.001,500];
  return[0,359.99];
}
function setP(i,p,v){
  const c=CH[i];let m='';
  if(p==='phase')v=((v%360)+360)%360;
  else{const[lo,hi]=limits(c,p);if(v<lo){v=lo;m=`${LAB[p]} alt sınırı ${ptxt(p,lo)}: değer sınırlandı.`;}else if(v>hi){v=hi;m=`${LAB[p]} üst sınırı ${ptxt(p,hi)}: değer sınırlandı.`;}}
  c[p]=+v.toFixed(9);
  if(p==='amp'||p==='off'){const m2=10-c.amp/2;if(Math.abs(c.off)>m2)c.off=Math.sign(c.off)*m2;}
  if(m)say(m,'warn');
  return m;
}
function nudge(p,dir){
  const c=CH[G.ch];if(p==='modWave'){const L=MWAVES;c.modWave=L[(L.indexOf(c.modWave)+dir+L.length)%L.length];return;}
  const st=Math.pow(10,G.cur[p]);
  const n=Math.round(c[p]/st)+dir;
  setP(G.ch,p,n*st);
}
function unitsFor(p){
  const c=CH[G.ch];
  if(FREQLIKE.has(p))return[['MHz',1e6],['kHz',1e3],['Hz',1],['mHz',1e-3],null,'x'];
  if(p==='swTime')return[['s',1],['ms',1e-3],null,null,null,'x'];
  if(p==='phaseDev')return[['°',1],null,null,null,null,'x'];
  if(p==='amp'){const f=2/RMS[c.wave];return[['Vpp',1],['mVpp',1e-3],['Vrms',f],['mVrms',f*1e-3],null,'x'];}
  if(p==='off')return[['V',1],['mV',1e-3],null,null,null,'x'];
  if(p==='phase')return[['°',1],null,null,null,null,'x'];
  return[['%',1],null,null,null,null,'x'];
}
function ensureParam(){const l=curList();if(l.length&&!l.includes(G.param))G.param=l[0];}

/* ---------- Ses ---------- */
let actx=null;
document.addEventListener('pointerdown',()=>{if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}},{once:true});
function tick(f=900){
  if(!actx||G.mute)return;
  try{const o=actx.createOscillator(),g=actx.createGain();o.type='square';o.frequency.value=f;g.gain.value=.04;o.connect(g);g.connect(actx.destination);o.start();g.gain.setTargetAtTime(0,actx.currentTime,.012);o.stop(actx.currentTime+.07);}catch(e){}
}

/* ---------- Bilgi metinleri ---------- */
const INFO={
 screen:['LCD ekran','Üstte kanal durumu (CH1/CH2), solda seçili dalganın parametreleri, sağda dalga önizlemesi, altta soft (menü) tuşlarının etiketleri bulunur.'],
 chhead:['Kanal başlığı','CH1 / CH2 kutusu hangi kanalı düzenlediğini gösterir (kırmızı ışıma = seçili). "Limit HighZ" yük ayarıdır; sağdaki ON/OFF çıkışın durumudur. Kutuya tıklayarak kanal seç.'],
 params:['Parametre paneli','Seçili dalganın ayarları: Freq (frekans), Amp (tepeden tepeye genlik), Offset (DC kayma), Phase (faz), Duty/Symm (görev oranı/simetri). Satıra tıklayarak ya da soft tuşla seç; mavi satır düzenlenen parametredir.'],
 preview:['Dalga önizlemesi','Seçili kanalın dalga şeklinin küçük bir çizimi. Gerçek çıkışı alttaki osiloskopta görürsün.'],
 softkeys:['Soft (menü) tuşları','Ekranın altındaki 6 tuşun anlamı ekrandaki etikete göre değişir: dalga menüsünde dalga şekli, parametre menüsünde parametre, sayı girerken birim.'],
 sk0:['Soft tuş 1','Etiketine bak: dalga menüsünde Sine, parametre menüsünde Freq, sayı girerken ilk birim (MHz/Vpp/V...).'],
 sk1:['Soft tuş 2','Dalga menüsünde Square, parametre menüsünde Amp, sayı girerken ikinci birim (kHz/mVpp/mV...).'],
 sk2:['Soft tuş 3','Dalga menüsünde Pulse, parametre menüsünde Offset, sayı girerken üçüncü birim (Hz/Vrms...).'],
 sk3:['Soft tuş 4','Dalga menüsünde Ramp, parametre menüsünde Phase, sayı girerken dördüncü birim (mHz/mVrms).'],
 sk4:['Soft tuş 5','Dalga menüsünde Arb (keyfi dalga), parametre menüsünde Duty/Symm (sadece kare, darbe ve rampa dalgalarında).'],
 sk5:['Soft tuş 6','Dalga menüsünde Page Down/Up (2. sayfa: Noise, DC), parametre menüsünde Wave (dalga menüsüne dön), sayı girerken İptal.'],
 mode:['Mode tuşu','Modülasyon ve tarama menüsünü açar: AM, PM, FM, FSK, Line (doğrusal tarama), Log (logaritmik tarama). Bir tür seçilince Mode tuşu yeşil yanar ve çıkış modüle edilir. Mode menüsündeyken tekrar basarsan modülasyon kapanır. Taşıyıcının frekansı ve genliği Wave menüsünden ayarlanır.'],
 m_AM:['AM: genlik modülasyonu','Taşıyıcının genliği modülasyon sinyaline göre değişir (zarf). Depth (derinlik) %100 iken genlik zarfın dibinde sıfıra iner. AM radyo yayını bu yöntemi kullanır.'],
 m_PM:['PM: faz modülasyonu','Taşıyıcının fazı modülasyon sinyaline göre ileri-geri kayar; PhaseDev en büyük faz sapmasıdır. Genlik sabittir.'],
 m_FM:['FM: frekans modülasyonu','Taşıyıcının frekansı modülasyon sinyaline göre artıp azalır; FreqDev en büyük frekans sapmasıdır. Genlik sabit kalır. FM radyo bu yöntemi kullanır.'],
 m_FSK:['FSK: frekans kaydırmalı anahtarlama','Çıkış iki frekans arasında sırayla atlar: taşıyıcı frekansı ve HopFreq. Rate, saniyedeki atlama hızıdır. Dijital veri iletiminde (modem, uzaktan kumanda) kullanılır.'],
 m_LIN:['Line: doğrusal frekans taraması','Frekans StartFreq\'ten StopFreq\'e SwpTime süresinde doğrusal olarak artar ve başa döner. Filtre ve devrelerin frekans tepkisini ölçmek için kullanılır.'],
 m_LOG:['Log: logaritmik frekans taraması','Frekans logaritmik taranır: her on katlık aralıkta (ör. 100 Hz→1 kHz, 1→10 kHz) eşit süre geçer. Ses ve geniş bant ölçümlerinde tercih edilir.'],
 p_modWave:['ModWave: modülasyon dalgası','Taşıyıcıyı değiştiren sinyalin şekli (Sine, Square, Ramp). Düğmeyle değiştirilir.'],
 p_modFreq:['ModFreq: modülasyon frekansı','Modülasyon sinyalinin frekansı: zarfın (AM) ya da frekans salınımının (FM) saniyedeki tekrar sayısı. Taşıyıcı frekansından çok küçük seçilir.'],
 p_depth:['Depth: modülasyon derinliği','AM\'de genliğin ne kadar değiştiği. %0: modülasyon yok, %100: genlik sıfıra kadar iner, %100 üstü aşırı modülasyon.'],
 p_phaseDev:['PhaseDev: faz sapması','PM\'de taşıyıcı fazının en büyük kayma miktarı (derece).'],
 p_freqDev:['FreqDev: frekans sapması','FM\'de taşıyıcı frekansının en fazla ne kadar artıp azalacağı. Frekans f ± FreqDev aralığında salınır.'],
 p_hopFreq:['HopFreq: atlama frekansı','FSK\'de taşıyıcı frekansının yanında kullanılan ikinci frekans.'],
 p_fskRate:['Rate: FSK hızı','İki frekans arasında saniyede kaç kez geçiş yapılacağı.'],
 p_swStart:['StartFreq: başlangıç frekansı','Taramanın başladığı frekans.'],p_swStop:['StopFreq: bitiş frekansı','Taramanın bittiği frekans; sonra başa döner.'],
 p_swTime:['SwpTime: tarama süresi','Başlangıçtan bitiş frekansına bir taramanın süresi (saniye).'],
 wave:['Wave tuşu','Dalga şekli menüsünü açar. Dalga seçince parametre menüsüne geçilir.'],
 util:['Utility tuşu','Sistem ayarları. Burada Limit (çıkış yükü) HighZ ↔ 50 Ω değiştirilir. Üreteç, ayarlanan genliği yük seçimine göre hesaplar: 50 Ω seçip yüksek empedanslı osiloskopa bağlarsan ekrandaki gerilim iki katı olur.'],
 knob:['Döner düğme','İki modu var. GEZİNME modunda (sarı çerçeve) düğmeyi çevirmek Freq → Amp → Offset → Phase arasında gezdirir. DÜZENLEME modunda (mavi) her tık imlecin altındaki basamağı artırır/azaltır. Modlar arası geçiş: düğmenin ortasına bas (Enter). Sürükle ya da fare tekerleğini kullan.'],
 enter:['Enter (düğmenin ortası)','Düğmenin ortasına bas: gezinme modundan düzenlemeye geçer ve geri döner. Sayı yazarken ise girilen değeri varsayılan birimle onaylar (Hz, Vpp, V, °, %).'],
 left:['← tuşu','Düzenlemede imleci büyük basamağa taşır. Gezinme modunda önceki parametreye (Freq ← Amp) geçer. Sayı girerken geri silme (Backspace) görevi görür.'],
 right:['→ tuşu','Düzenlemede imleci küçük basamağa taşır. Gezinme modunda sonraki parametreye (Freq → Amp) geçer.'],
 keypad:['Sayı tuşları','Doğrudan değer yaz, sonra soft tuşlarla birimi seç: değer ancak birim seçince uygulanır. "+/-" işareti değiştirir, "." ondalık ayıracı.'],
 kpm:['+/- tuşu','Girilen sayının işaretini değiştirir (özellikle Offset için).'],kdot:['. tuşu','Ondalık ayırıcı.'],
 ch1:['CH1 tuşu','CH1\'i seçer ve çıkışını açar/kapatır (OFF ↔ ON). Çıkış açıkken tuş YEŞİL yanar ve BNC kablosunda sinyal akar.'],
 ch2:['CH2 tuşu','CH2\'yi seçer ve çıkışını açar/kapatır. Çıkış açıkken tuş YEŞİL yanar. İki kanal bağımsız ayarlanır.'],
 bnc:['BNC çıkışları','Her kanalın sinyali BNC kabloyla osiloskop girişine gider. Kanal OFF ise kablodan sinyal gitmez.'],
 p_freq:['Freq: frekans','Saniyedeki tekrar sayısı. T = 1/f. Güç elektroniğinde: şebeke 50 Hz, SMPS/PWM anahtarlama 20 kHz–200 kHz.'],
 p_amp:['Amp: genlik','Tepeden tepeye gerilim (Vpp). Sinüste Vpp = 2√2·Vrms. Kare dalgada (offset 0) Vrms = Vpp/2. Birimi Vrms yazarsan cihaz dalgaya göre dönüştürür.'],
 p_off:['Offset: DC bileşen','Sinyalin orta noktasını yukarı/aşağı kaydırır. Lojik seviyeler için: 5 Vpp kare + 2.5 V offset = 0–5 V. Sınır: |offset| + Amp/2 ≤ 10 V.'],
 p_phase:['Phase: faz','Dalganın başlangıç açısı (0–360°). İki kanalı aynı frekansta tutup fazı değiştirerek faz kaydırma gösterilir.'],
 p_duty:['Duty: görev oranı','Kare/darbe dalgada yüksek seviyede kalma yüzdesi (PWM duty cycle). Ramp\'te Symm: yükselme süresinin yüzdesi (%50 = üçgen, %100 = testere).'],
 w_sine:['Sine: sinüs','Şebeke, filtre ve trafo testleri, ses ve rezonans devreleri.'],
 w_square:['Square: kare dalga','Dijital saat, PWM, MOSFET/IGBT kapı sürme girişi, RC ve RL geçici durum testleri. Görev oranı ayarlanır.'],
 w_pulse:['Pulse: darbe','Dar/geniş darbeler: tetikleme, sürücü devreleri. Burada görev oranı ayarlanabilir.'],
 w_ramp:['Ramp: rampa/üçgen','Üçgen (%50) ve testere (%100). PWM üretiminde karşılaştırıcıya verilen taşıyıcı (carrier) dalga olarak kullanılır.'],
 w_arb:['Arb: keyfi dalga','Kullanıcı tanımlı dalga. Burada yerleşik üstel yükselen bir dalga gösterilir (kondansatör şarjı gibi).'],
 w_noise:['Noise: gürültü','Rastgele sinyal: sistem/filtre tepki testlerinde.'],
 w_dc:['DC','Sabit gerilim: sadece Offset ayarlanır (bias).']
};
function setInfo(k){if(!INFO[k])return;G.info=k;renderInfo();}
function renderInfo(){
  const i=INFO[G.info]||INFO.screen,c=CH[G.ch];
  $('#infoCard').innerHTML=`<div class="stepno">Bilgi · imleci bir parçanın üzerine getir</div><h2>${i[0]}</h2><p style="margin:2px 0 0">${i[1]}</p>
  <div class="dyn"><b>Seçili: CH${G.ch+1}</b> · ${WNAME[c.wave]} · ${editable()?labOf(G.param,c.wave)+(G.edit?' (düzenleme, adım '+stepTxt(G.param,G.cur[G.param])+')':' (gezinme modu)'):'dalga menüsü'} · Yük: ${G.load}</div>`;
}
function say(msg,tone='info'){const f=$('#fb');f.className=tone==='info'?'':tone;f.textContent=msg;}

/* ---------- Üreteç çizimi ---------- */
const kb=(id,x,y,w,h,lab,fill='#dcd9cf',ink='#2a2a2a',fs=15)=>`<g data-btn="${id}" data-info="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="#9a978c" stroke-width="1.5"/><text x="${x+w/2}" y="${y+h/2+5}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${ink}" pointer-events="none">${lab}</text></g>`;
function buildGen(){
  let s=`<rect x="0" y="0" width="768" height="440" rx="22" fill="#e6e4dc" stroke="#bdbab0" stroke-width="3"/>
  <rect x="45" y="38" width="484" height="346" rx="8" fill="#26262a"/>
  <rect x="62" y="46" width="62" height="18" fill="#d7263d"/><text x="93" y="60" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">UNI-T</text>
  <text x="140" y="62" font-size="17" font-weight="800" font-style="italic" fill="#fff">UTG932E</text>
  <text x="215" y="60" font-size="10.5" fill="#e0e0e0">Function/Arbitrary Waveform Generator</text>
  <text x="515" y="53" text-anchor="end" font-size="8.5" fill="#ccc">30MHz</text><text x="515" y="63" text-anchor="end" font-size="8.5" fill="#ccc">200MSa/s</text>
  <g transform="translate(73 84)" id="lcdRoot" data-info="screen"><g id="genLcdG"></g></g>
  ${[107,178,249,321,392,462].map((cx,i)=>`<g data-btn="sk${i}" data-info="sk${i}"><rect x="${cx-22}" y="345" width="44" height="24" rx="12" fill="#6a6a70" stroke="#111" stroke-width="2"/><rect x="${cx-18}" y="348" width="36" height="9" rx="4" fill="#8a8a92" pointer-events="none"/></g>`).join('')}
  <rect x="536" y="28" width="214" height="384" rx="14" fill="#efede6" stroke="#cfccc2" stroke-width="2"/>
  ${kb('mode',556,58,42,26,'Mode','#8fb0d6','#1b2b3d',11)}${kb('wave',556,104,42,26,'Wave','#8fb0d6','#1b2b3d',11)}${kb('util',552,150,50,26,'Utility','#8fb0d6','#1b2b3d',11)}
  <g class="knobwrap" id="knobHit" data-info="knob"><g id="knobDots">${Array.from({length:30},(_,k)=>{const a=(-60+k*(300/29))*Math.PI/180;return`<circle cx="${685+52*Math.sin(a)}" cy="${92-52*Math.cos(a)}" r="1.6" fill="#8a8a85"/>`;}).join('')}</g>
   <circle cx="686" cy="95" r="38" fill="#00000022"/>
   <g id="knobRot"><circle cx="685" cy="92" r="38" fill="url(#knobg)" stroke="#a9a79f" stroke-width="2"/><circle id="knobBtn" data-btn="enter" data-info="enter" cx="685" cy="92" r="21" fill="url(#knobin)" stroke="#8c9096" stroke-width="2"/><circle cx="685" cy="62" r="3.4" fill="#d7263d" pointer-events="none"/>${Array.from({length:24},(_,k)=>`<line x1="685" y1="55" x2="685" y2="58" stroke="#bbb9b1" stroke-width="1.5" transform="rotate(${k*15} 685 92)"/>`).join('')}</g><path d="M692 86 v8 h-12 M684 89 l-4 5 l4 5" fill="none" stroke="#4b5057" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/></g>
  ${kb('left',633,155,34,26,'←','#dcd9cf','#222',17)}${kb('right',693,155,34,26,'→','#dcd9cf','#222',17)}`;
  const rows=[['7','8','9'],['4','5','6'],['1','2','3'],['.','0','+/-']],ky=[222,266,307,350],kx=[541,592,642];
  rows.forEach((r,ri)=>r.forEach((l,ci)=>{const id=l==='.'?'kdot':l==='+/-'?'kpm':'k'+l;s+=kb(id,kx[ci],ky[ri],38,24,l,'#dcd9cf','#222',14);}));
  s+=kb('ch1',697,224,32,46,'CH1','#8fb0d6','#1b2b3d',9)+kb('ch2',697,306,32,46,'CH2','#8fb0d6','#1b2b3d',9);
  s+=`<g id="halos" fill="none">
    <rect class="halo" data-h="screen" x="70" y="80" width="432" height="246" rx="8"/>
    <rect class="halo" data-h="chhead" x="71" y="82" width="430" height="44" rx="6"/>
    <rect class="halo" data-h="params" x="74" y="127" width="210" height="154" rx="6"/>
    <rect class="halo" data-h="preview" x="286" y="127" width="212" height="154" rx="6"/>
    <rect class="halo" data-h="softkeys" x="74" y="284" width="426" height="90" rx="8"/>
    <rect class="halo" data-h="mode" x="551" y="53" width="52" height="36" rx="6"/>
    <rect class="halo" data-h="wave" x="551" y="99" width="52" height="36" rx="6"/>
    <rect class="halo" data-h="util" x="547" y="145" width="60" height="36" rx="6"/>
    <circle class="halo" data-h="knob" cx="685" cy="92" r="58"/>
    <rect class="halo" data-h="arrows" x="628" y="150" width="106" height="36" rx="6"/>
    <rect class="halo" data-h="keypad" x="534" y="216" width="152" height="164" rx="6"/>
    <rect class="halo" data-h="ch1" x="691" y="218" width="44" height="58" rx="6"/>
    <rect class="halo" data-h="ch2" x="691" y="300" width="44" height="58" rx="6"/>
  </g>`;
  $('#genG').innerHTML=s;
}
buildGen();

/* ---------- Soft tuş etiketleri ---------- */
function softLabels(){
  const c=CH[G.ch];
  if(G.entry!==null){const u=unitsFor(G.param);return u.map((x,i)=>i===5?{t:'İptal'}:x?{t:x[0]}:{t:''});}
  if(G.menu==='wave'){
    if(G.page===0)return['sine','square','pulse','ramp','arb'].map(w=>({t:WNAME[w],w,sel:c.wave===w})).concat([{t:'Page Down'}]);
    return[{t:'Noise',w:'noise',sel:c.wave==='noise'},{t:'DC',w:'dc',sel:c.wave==='dc'},{t:''},{t:''},{t:''},{t:'Page Up'}];
  }
  if(G.menu==='mode')return MODS.map(m=>({t:MODLBL[m],sel:c.mod===m,red:true}));
  const l=paramList(c.wave),a=[];
  for(let i=0;i<5;i++)a.push(i<l.length?{t:labOf(l[i],c.wave),sel:G.param===l[i]}:{t:''});
  a.push({t:'Wave'});return a;
}
/* ---------- LCD ---------- */
function lcdSvg(){
  const c=CH[G.ch];
  {const mb=document.querySelector('[data-btn="mode"] rect');if(mb){mb.setAttribute('fill',c.mod?'#3ee05a':'#8fb0d6');mb.style.filter=c.mod?'drop-shadow(0 0 6px #22c55e)':'';}}let s=`<rect width="424" height="238" fill="#04060b" stroke="#0e1830" stroke-width="2"/><rect width="424" height="38" fill="#0a1428"/><line x1="212" y1="0" x2="212" y2="38" stroke="#2a3a5a"/><line x1="0" y1="38" x2="424" y2="38" stroke="#3f6cb0" stroke-width="1.5"/>`;
  [0,1].forEach(i=>{
    const x0=i*212,ch=CH[i];
    s+=`<g data-chsel="${i}" data-info="chhead"><rect x="${x0}" y="0" width="212" height="38" fill="transparent"/>`;
    if(G.ch===i)s+=`<ellipse cx="${x0+54}" cy="20" rx="56" ry="13" fill="url(#redglow)"/>`;
    s+=`<text x="${x0+12}" y="28" font-size="24" font-weight="800" fill="#fff" pointer-events="none">CH${i+1}</text>
     <text x="${x0+88}" y="15" font-size="10" fill="#cfe0ff" pointer-events="none">Limit</text><text x="${x0+88}" y="31" font-size="11" fill="#8fb4ff" pointer-events="none">${G.load==='HighZ'?'HighZ':'50Ω'}</text>
     <text x="${x0+196}" y="28" text-anchor="end" font-size="14" font-weight="800" fill="${ch.on?'#4ade80':'#fff'}" pointer-events="none">${ch.on?'ON':'OFF'}</text></g>`;
  });
  s+=`<g data-row-group="1" data-info="params"><rect x="3" y="44" width="206" height="150" fill="#070b14" stroke="#b3262f" stroke-width="2"/>`;
  const list=curList(),CW=7.2,VX=G.menu==='mode'?86:64;
  if(G.menu==='mode'&&!c.mod)s+=`<text x="14" y="76" font-size="12" fill="#cfe0ff">Modülasyon kapalı</text><text x="14" y="96" font-size="11" fill="#8fb4ff">(Continuous çıkış)</text><text x="14" y="124" font-size="10.5" fill="#ffd23f">Alttaki soft tuşlardan</text><text x="14" y="140" font-size="10.5" fill="#ffd23f">bir tür seç: AM, PM, FM...</text>`;
  list.forEach((p,idx)=>{
    const y=70+idx*28,sel=editable()&&G.param===p;
    s+=`<g data-row="${p}" data-info="p_${p==='duty'&&c.wave==='ramp'?'duty':p}">`;
    s+=`<rect x="6" y="${y-17}" width="200" height="25" fill="${sel&&(G.edit||G.entry!==null)?'#1a4a9a':'transparent'}" stroke="${sel&&!G.edit&&G.entry===null?'#ffd23f':'none'}" stroke-width="2"/>`;
    s+=`<text x="12" y="${y}" font-size="13" font-weight="700" fill="#cfe0ff" pointer-events="none">${labOf(p,c.wave)}</text>`;
    const f=fmtP(p,c[p]);let numTxt=f.num,txt;
    if(sel&&G.entry!==null){numTxt=G.entry||'_';txt=numTxt+' ';}
    else txt=numTxt+' '+f.u;
    const full=sel&&G.entry!==null?G.entry+'_':numTxt+' '+f.u;
    s+=`<text x="${VX}" y="${y}" font-family="Menlo,Consolas,monospace" font-size="12" fill="${sel&&G.entry!==null?'#ffd23f':'#fff'}" textLength="${(full.length*CW).toFixed(1)}" lengthAdjust="spacing" pointer-events="none" xml:space="preserve">${full}</text>`;
    if(sel&&G.entry===null&&G.edit){const ix=cidx(f,G.cur[p]);if(ix>=0)s+=`<rect class="blink" x="${VX+ix*CW}" y="${y+2}" width="${CW}" height="2" fill="#ffd23f"/>`;}
    s+='</g>';
  });
  if(editable()&&G.entry===null)s+=`<text x="204" y="190" text-anchor="end" font-size="9" fill="${G.edit?'#8fb4ff':'#ffd23f'}">${G.edit?(G.param==='modWave'?'Düğme: dalga seç':'Adım: '+stepTxt(G.param,G.cur[G.param])):'Gezin · Enter: düzenle'}</text>`;
  if(c.mod&&G.menu!=='mode')s+=`<text x="204" y="60" text-anchor="end" font-size="9" font-weight="700" fill="#3ee05a">${MODLBL[c.mod]} açık</text>`;
  if(G.entry!==null)s+=`<text x="204" y="190" text-anchor="end" font-size="9" fill="#ffd23f">Birimi soft tuşla seç</text>`;
  s+=`</g><g data-info="preview"><rect x="213" y="44" width="208" height="150" fill="#04060b" stroke="#b3262f" stroke-width="2"/>`;
  const x1=232,x2=402,cy=128,amp=34;
  s+=`<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="#bbb" stroke-dasharray="2 3"/>`;
  let d='';const N=170,per=c.wave==='dc'?1:2;
  if(c.mod&&c.wave!=='dc'&&c.wave!=='noise'){
    const il=Object.assign({},c,{off:0,amp:2,phase:0});let tw=2;const NN=340;
    if(c.mod==='AM'||c.mod==='PM'||c.mod==='FM'){il.modFreq=1;il.freq=16;il.freqDev=9;}
    else if(c.mod==='FSK'){il.fskRate=1;il.freq=6;il.hopFreq=c.hopFreq>=c.freq?16:3;}
    else{il.swTime=1;tw=1;il.swStart=c.swStop>=c.swStart?2:24;il.swStop=c.swStop>=c.swStart?24:2;}
    for(let i=0;i<=NN;i++){const v=chSample(il,tw*i/NN);d+=(i?'L':'M')+(x1+i*(x2-x1)/NN).toFixed(1)+' '+(cy-v*amp).toFixed(1);}
  }else
  for(let i=0;i<=N;i++){const p0=((per*i/N)%1+1)%1;const v=(per*i/N>=per)?shape(c.wave,0.9999,c.duty/100):shape(c.wave,p0,c.duty/100);d+=(i?'L':'M')+(x1+i*(x2-x1)/N).toFixed(1)+' '+(cy-v*amp).toFixed(1);}
  s+=`<path d="${d}" fill="none" stroke="#ffe27a" stroke-width="${c.mod?1.3:1.8}"/>`;
  if(c.wave!=='dc'&&c.wave!=='noise'&&!c.mod)s+=`<path d="M${x1} 66 H${x1+(x2-x1)/2} M${x1+5} 62 L${x1} 66 L${x1+5} 70 M${x1+(x2-x1)/2-5} 62 L${x1+(x2-x1)/2} 66 L${x1+(x2-x1)/2-5} 70" fill="none" stroke="#fff" stroke-width="1.4"/>`;
  s+='</g>';
  const sk=softLabels();
  s+=`<g data-info="softkeys">`;
  sk.forEach((k,i)=>{
    const x=i*70.67;
    s+=`<rect x="${x+1}" y="198" width="68.7" height="39" fill="${k.sel&&!k.red?'#1a4a9a':'#0c1428'}" stroke="#3f6cb0"/>`;
    if(k.sel&&k.red)s+=`<ellipse cx="${x+35.3}" cy="217" rx="26" ry="13" fill="url(#redglow)"/>`;
    if(k.t)s+=`<text x="${x+35.3}" y="${k.w?213:220}" text-anchor="middle" font-size="11" font-weight="700" fill="#e8eeff">${k.t}</text>`;
    if(k.w)s+=`<path d="${WICON[k.w]}" transform="translate(${x+22} 218)" fill="none" stroke="#e8eeff" stroke-width="1.6"/>`;
  });
  s+='</g>';
  return s;
}

/* ---------- Tuş mantığı ---------- */
function flash(b){const e=document.querySelector(`[data-btn="${b}"]`);if(!e)return;e.classList.add('pressed');setTimeout(()=>e.classList.remove('pressed'),140);}
function press(b,silent){
  flash(b);setInfo(b);tick(b==='knob'?700:1100);
  const c=CH[G.ch];
  if(b==='wave'){G.menu='wave';G.page=0;G.entry=null;say('Dalga menüsü: soft tuşlardan bir dalga şekli seç.');}
  else if(b==='mode'){
    G.entry=null;G.edit=false;
    if(G.menu==='mode'){if(c.mod){say(`${MODLBL[c.mod]} kapatıldı: çıkış yeniden sürekli (Continuous). Mode tuşunun ışığı söndü.`);c.mod=null;}G.menu='param';ensureParam();}
    else{G.menu='mode';if(c.mod)G.param=modParamList(c.mod)[0];say(c.mod?`Mode menüsü: ${MODLBL[c.mod]} açık. Parametreleri düğmeyle gez (Enter: düzenle). Kapatmak için Mode'a tekrar bas.`:'Mode menüsü: alttaki soft tuşlarla AM, PM, FM, FSK modülasyonu ya da Line/Log frekans taraması seç. Seçince Mode tuşu yeşil yanar.');}
  }
  else if(b==='util'){
    G.load=G.load==='HighZ'?'50Ω':'HighZ';
    if(G.load==='50Ω')CH.forEach(x=>{if(x.amp>10)x.amp=10;});
    say(G.load==='50Ω'?'Yük 50 Ω olarak ayarlandı. Osiloskop girişi yüksek empedanslı olduğundan ekranda gerilim 2 kat görünür.':'Yük HighZ (yüksek empedans). Ekrandaki ayar değeri ile osiloskoptaki değer eşleşir.',G.load==='50Ω'?'warn':'ok');
  }else if(b==='ch1'||b==='ch2'){
    const i=b==='ch1'?0:1;G.ch=i;CH[i].on=!CH[i].on;G.entry=null;ensureParam();
    say(`CH${i+1} çıkışı ${CH[i].on?'AÇIK: sinyal BNC kabloda ilerliyor.':'KAPALI.'}`,CH[i].on?'ok':'info');
  }else if(b==='enter')doEnter();
  else if(b==='left'||b==='right'){
    if(G.entry!==null){if(b==='left')G.entry=G.entry.slice(0,-1);}
    else if(!editable())say(G.menu==='mode'?'Önce alttaki soft tuşlardan bir modülasyon türü seç.':'Önce bir parametre seç (Wave → dalga şekli).','warn');
    else if(!G.edit)moveSel(b==='left'?-1:1);
    else{const r=CRANGE[G.param];G.cur[G.param]=Math.max(r[0],Math.min(r[1],G.cur[G.param]+(b==='left'?1:-1)));say('İmleç: adım '+stepTxt(G.param,G.cur[G.param]));}
  }else if(/^k\d$/.test(b)||b==='kdot'||b==='kpm')entryKey(b);
  else if(/^sk\d$/.test(b))softKey(+b[2]);
  mark();
}
function moveSel(dir){
  const l=curList();if(!l.length)return;let i=l.indexOf(G.param);i=(i+dir+l.length)%l.length;G.param=l[i];
  setInfo('p_'+l[i]);say(`Seçim: ${labOf(l[i],CH[G.ch].wave)}. Değiştirmek için Enter'a bas (düğmenin ortası).`);
}
function doEnter(){
  const c=CH[G.ch];
  if(G.entry!==null){softKey(defUnit(G.param));return;}
  if(!editable()){say('Enter bir parametreyi onaylar. Önce Wave tuşuyla bir dalga şekli seç.','warn');return;}
  G.edit=!G.edit;
  say(G.edit?`Düzenleme modu: ${labOf(G.param,c.wave)} değerini düğme ile değiştir (← → basamak). Parametreler arasında gezinmek için tekrar Enter.`:'Gezinme modu: düğmeyi çevirerek Freq, Amp, Offset... arasında gez; Enter ile düzenle.','ok');
}
function entryKey(b){
  const c=CH[G.ch];
  if(G.menu==='wave'){G.menu='param';G.param=paramList(c.wave)[0];}
  if(G.menu==='mode'&&!c.mod){say('Önce alttaki soft tuşlardan bir modülasyon türü seç.','warn');return;}
  if(G.param==='modWave'){say('ModWave sayı ile girilmez: Enter ile düzenlemeye geç ve düğmeyi çevirerek Sine/Square/Ramp seç.','warn');return;}
  if(G.entry===null)G.entry='';
  if(b==='kpm')G.entry=G.entry[0]==='-'?G.entry.slice(1):'-'+G.entry;
  else if(b==='kdot'){if(!G.entry.includes('.'))G.entry+=(G.entry===''||G.entry==='-'?'0.':'.');}
  else if(G.entry.replace('-','').length<9)G.entry+=b[1];
  say(`${labOf(G.param,c.wave)} için sayı yazıyorsun: ${G.entry||'_'}. Birimi soft tuşla seç.`);
}
function softKey(i){
  const c=CH[G.ch];
  if(G.entry!==null){
    const u=unitsFor(G.param);
    if(i===5){G.entry=null;say('Giriş iptal edildi.');return;}
    if(!u[i])return;
    const num=parseFloat(G.entry);
    if(isNaN(num)){G.entry=null;say('Geçersiz sayı.','warn');return;}
    setP(G.ch,G.param,num*u[i][1]);
    G.entry=null;
    if(!$('#fb').className.includes('warn'))say(`${labOf(G.param,c.wave)} = ${ptxt(G.param,c[G.param])} olarak ayarlandı.`,'ok');
    return;
  }
  if(G.menu==='mode'){const m=MODS[i];if(!m)return;c.mod=m;G.param=modParamList(m)[0];G.edit=false;setInfo('m_'+m);say(`${MODLBL[m]} açıldı: Mode tuşu yeşil yanıyor ve çıkış ${m==='LIN'||m==='LOG'?'frekans taraması yapıyor':'modüle ediliyor'}. Parametreleri düğmeyle gez, Enter ile düzenle. Taşıyıcıyı Wave menüsünden ayarla.`,'ok');return;}
  if(G.menu==='wave'){
    const L=softLabels()[i];
    if(L.t==='Page Down'){G.page=1;return;}
    if(L.t==='Page Up'){G.page=0;return;}
    if(L.w){
      c.wave=L.w;c.duty=L.w==='pulse'?20:50;
      if(c.freq>FMAX[L.w])c.freq=FMAX[L.w];
      G.menu='param';G.param=paramList(L.w)[0];G.edit=false;setInfo('w_'+L.w);
      say(`${WNAME[L.w]} seçildi. Düğmeyi çevirerek Freq/Amp/Offset arasında gez, Enter ile düzenle; ya da soft tuşlardan seç.`,'ok');
    }
    return;
  }
  const l=paramList(c.wave);
  if(i<l.length){G.param=l[i];G.edit=true;setInfo('p_'+l[i]);say(`${labOf(l[i],c.wave)} seçildi (düzenleme modu): döner düğme, ← → veya sayı tuşlarıyla değiştir.`);}
  else if(i===5){G.menu='wave';G.page=0;say('Dalga menüsü.');}
}
function knobStep(dir){
  if(G.entry!==null){say('Önce sayı girişini bitir (birim seç) ya da İptal et.','warn');return false;}
  if(!editable()){say(G.menu==='mode'?'Önce alttaki soft tuşlardan bir modülasyon türü seç.':'Döner düğme bir parametreyi değiştirir. Önce Wave → bir dalga seç.','warn');return false;}
  if(!G.edit){moveSel(dir);mark();return true;}
  nudge(G.param,dir);setInfo('knob');mark();
  const c=CH[G.ch];say(`${labOf(G.param,c.wave)} = ${ptxt(G.param,c[G.param])}`);
  return true;
}

/* ---------- Etkileşim ---------- */
const GX=(x)=>(x-12)/1.14,GY=(y)=>(y-10)/1.14;
function svgPt(e){const pt=stage.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(stage.getScreenCTM().inverse());}
let kdrag=null,kT=0,kA=0,kV=0;
function knobAng(e){const p=svgPt(e);return Math.atan2(GY(p.y)-92,GX(p.x)-685)*180/Math.PI;}
stage.addEventListener('pointerdown',e=>{
  const t=e.target;
  if(t.id==='knobBtn'){kdrag={a:knobAng(e),acc:0,inner:true,moved:false,x:e.clientX,y:e.clientY};flash('enter');t.setPointerCapture&&t.setPointerCapture(e.pointerId);setInfo('enter');return;}
  if(t.closest('#knobHit')){kdrag={a:knobAng(e),acc:0};t.setPointerCapture&&t.setPointerCapture(e.pointerId);setInfo('knob');return;}
  const b=t.closest('#genSvg [data-btn]');if(b){press(b.dataset.btn);return;}
  const r=t.closest('[data-row]');if(r){const p=r.dataset.row;const c=CH[G.ch];if(curList().includes(p)){if(G.menu!=='mode')G.menu='param';G.param=p;G.edit=true;G.entry=null;setInfo('p_'+p);mark();say(`${labOf(p,c.wave)} seçildi.`);}return;}
  const h=t.closest('[data-chsel]');if(h){G.ch=+h.dataset.chsel;G.entry=null;ensureParam();setInfo('chhead');mark();say(`CH${G.ch+1} seçildi (çıkışı değiştirmek için CH${G.ch+1} tuşuna bas).`);}
});
stage.addEventListener('pointermove',e=>{
  if(kdrag){
    const a=knobAng(e);let d=a-kdrag.a;if(d>180)d-=360;if(d<-180)d+=360;
    kdrag.a=a;kdrag.acc+=d;
    if(kdrag.inner&&Math.abs(kdrag.acc)<8&&Math.hypot(e.clientX-kdrag.x,e.clientY-kdrag.y)<8)return;
    if(kdrag.inner)kdrag.moved=true;
    while(Math.abs(kdrag.acc)>=18){const dir=kdrag.acc>0?1:-1;kdrag.acc-=18*dir;if(knobStep(dir)){kT+=18*dir;tick(700);}}
    return;
  }
  const el=e.target.closest&&e.target.closest('[data-info]');
  if(el&&el.dataset.info!==G.info&&!G.hoverLock){setInfo(el.dataset.info);}
});
stage.addEventListener('pointerup',()=>{if(kdrag&&kdrag.inner&&!kdrag.moved)press('enter');kdrag=null;});
stage.addEventListener('wheel',e=>{if(e.target.closest('#knobHit')){e.preventDefault();const dir=e.deltaY<0?1:-1;if(knobStep(dir)){kT+=18*dir;tick(700);}}},{passive:false});
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(/^\d$/.test(e.key))press('k'+e.key);
  else if(e.key==='.')press('kdot');
  else if(e.key==='Backspace'){if(G.entry!==null){press('left');e.preventDefault();}}
  else if(e.key==='Escape'){if(G.entry!==null){softKey(5);mark();}}
  else if(e.key==='Enter'){press('enter');}
  else if(e.key==='ArrowUp'){if(knobStep(1))kT+=18;}
  else if(e.key==='ArrowDown'){if(knobStep(-1))kT-=18;}
  else if(e.key==='ArrowLeft')press('left');
  else if(e.key==='ArrowRight')press('right');
});

/* ---- Jeneratör modülü: BNC çıkışları, döngü, dışa aktarım ---- */
function buildBench(){
  $('#genBench').innerHTML=[820,860].map((x,i)=>`<rect x="${x-9}" y="510" width="18" height="28" fill="#c9c6bb" stroke="#8d8a80"/><circle id="gOut${i}" cx="${x}" cy="552" r="12" fill="#bbb" stroke="#555" stroke-width="3"/><circle cx="${x}" cy="552" r="5" fill="#222"/><text x="${x}" y="580" text-anchor="middle" font-size="10" font-weight="700" fill="${i?'#0f87b3':'#b98a00'}">CH${i+1}</text>`).join('')+`<text x="840" y="598" text-anchor="middle" font-size="9" fill="#666">ÇIKIŞLAR</text>`;
}
buildBench();
function frame(){
  kV=(kV+(kT-kA)*0.18)*0.78;kA+=kV;
  if(Math.abs(kT-kA)<0.05&&Math.abs(kV)<0.05){kA=kT;kV=0;}
  const kr=$('#knobRot');if(kr)kr.setAttribute('transform',`rotate(${kA} 685 92)`);
  if(dirty){
    dirty=false;
    $('#genLcdG').innerHTML=lcdSvg();
    ['ch1','ch2'].forEach((b,i)=>{const r=document.querySelector(`#genSvg [data-btn="${b}"] rect`);if(r){r.setAttribute('fill',CH[i].on?'#4ade80':'#8fb0d6');r.style.filter=CH[i].on?'drop-shadow(0 0 5px #22c55e)':'';}});
    if(onChange)onChange();
  }
  requestAnimationFrame(frame);
}
let onChange=null;
setInterval(()=>{if(CH.some(c=>c.on&&c.wave==='noise'))mark();},300);
requestAnimationFrame(frame);
function resetGen(){CH[0]=newCh();CH[1]=newCh();Object.assign(G,{ch:0,load:'HighZ',menu:'wave',page:0,param:'freq',entry:null,edit:false});mark();}
return {CH,G,shape,sample:(i,t)=>chSample(CH[i],t),mark,reset:resetGen,setOnChange:f=>{onChange=f;},outEl:i=>document.querySelector('#gOut'+i),showInfo:()=>setInfo('screen')};

})();

const MM=(function(){
const $=s=>document.querySelector(s);
const MX=30, MY=5, CX=160, CY=366;
const MODES=['OFF','VAC','VDC','MV','OHM','CAP','HZ','HFE','I_UA','I_MA','I_A','NCV'];
const ANG=[258,275,292,311,336,360,378,396,414,430,446,460];
const JX={'10A':70,'COM':160,'vo':250}, JY=535;
const REST={red:[450,560],blk:[520,575]};
const MODE_NAME=['OFF','V~ (AC gerilim)','V⎓ (DC gerilim)','mV⎓','Ω / süreklilik / diyot','Kapasite','Hz','hFE','μA','mA','A','NCV'];

/* ---------- Multimetre çizimi ---------- */
const SEGS={a:[7,0,20,7],b:[27,5,7,28],c:[27,37,7,28],d:[7,63,20,7],e:[0,37,7,28],f:[0,5,7,28],g:[7,31.5,20,7]};
const CH={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','-':'g','O':'abcdef','L':'def','E':'adefg','F':'aefg'};
function dcSym(x,y,col){return `<line x1="${x}" y1="${y-5}" x2="${x+12}" y2="${y-5}" stroke="${col}" stroke-width="1.6"/><line x1="${x}" y1="${y-1}" x2="${x+12}" y2="${y-1}" stroke="${col}" stroke-width="1.6" stroke-dasharray="2.5 1.5"/>`;}
function labelSvg(i){
  const th=ANG[i]*Math.PI/180,s=Math.sin(th),c=Math.cos(th);
  const lx=CX+108*s,ly=CY-108*c,dx=CX+96*s,dy=CY-96*c;
  const anc=s<-0.3?'end':(s>0.3?'start':'middle');
  const base=Math.abs(c)>0.8?ly-3:ly+4;
  let g=`<circle id="dot${i}" cx="${dx}" cy="${dy}" r="3.2" fill="#cfcfcf"/>`;
  const T=(t,x,a)=>`<text class="meter-label" x="${x}" y="${base}" text-anchor="${a}">${t}</text>`;
  const txt=['OFF','V~','V','mV','','','Hz','hFE','μA','mA','A','NCV'][i];
  const dc=[2,3,8,9,10].includes(i);
  if(i===4){
    g+=T('Ω',lx,'end');
    g+=`<text x="${lx-40}" y="${ly-12}" font-size="10" fill="#f0b429" font-weight="700">•))</text><path d="M${lx-18} ${ly-19} v9 l7 -4.5z M${lx-10} ${ly-19} v9" fill="#f0b429" stroke="#f0b429" stroke-width="1.5"/>`;
  }else if(i===5){
    g+=`<g stroke="#f0b429" stroke-width="2" fill="none"><line x1="${lx-3}" y1="${ly-10}" x2="${lx-3}" y2="${ly+1}"/><line x1="${lx+3}" y1="${ly-10}" x2="${lx+3}" y2="${ly+1}"/><line x1="${lx-9}" y1="${ly-4.5}" x2="${lx-3}" y2="${ly-4.5}"/><line x1="${lx+3}" y1="${ly-4.5}" x2="${lx+9}" y2="${ly-4.5}"/></g>`;
  }else if(dc){
    const w=txt.length*7.4;
    if(anc==='end'){g+=T(txt,lx-16,'end')+dcSym(lx-14,base,'#e8e8e8');}
    else{g+=T(txt,lx,'start')+dcSym(lx+w+3,base,'#e8e8e8');}
  }else{g+=T(txt,lx,anc);}
  g+=`<circle class="clickable" data-dial="${i}" cx="${lx-(anc==='end'?14:anc==='start'?-14:0)}" cy="${ly}" r="20" fill="transparent"><title>${MODE_NAME[i]}</title></circle>`;
  return g;
}
function buildMeter(){
  let m=`<rect x="0" y="0" width="320" height="600" rx="46" fill="#d7263d"/>
  <rect x="4" y="4" width="312" height="592" rx="43" fill="none" stroke="#ff7d8e" stroke-opacity=".5" stroke-width="2"/>
  <rect x="18" y="14" width="284" height="570" rx="30" fill="#1b1b1d"/>
  <rect x="48" y="26" width="58" height="17" rx="2" fill="#d7263d"/><text x="77" y="39" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">UNI-T</text>
  <path d="M160 24 l-7 12 h14z" fill="#fff"/><text x="160" y="50" text-anchor="middle" font-size="9" font-weight="700" fill="#ddd">NCV</text>
  <text x="270" y="39" text-anchor="end" font-size="12" font-style="italic" font-weight="700" fill="#eee">UT136B+</text>
  <g transform="translate(40 60)" id="p-lcd"><rect width="240" height="124" rx="8" fill="url(#lcdbg)" stroke="#0c1f1f" stroke-width="2"/><g id="mmLcdG"></g></g>
  <text x="84" y="202" text-anchor="middle" font-size="11" font-weight="700" fill="#f0b429">SELECT</text>
  <rect id="p-select" class="clickable" x="52" y="208" width="64" height="24" rx="3" fill="#f5a623" stroke="#9a6a10"/>
  <text x="170" y="202" text-anchor="middle" font-size="11" font-weight="700" fill="#ddd">HOLD/☼&gt;2Sec</text>
  <rect id="p-hold" class="clickable" x="138" y="208" width="64" height="24" rx="3" fill="#5aa0e8" stroke="#2a5c99"/>
  <g id="p-hfe"><circle cx="262" cy="222" r="17" fill="#222" stroke="#555" stroke-width="2"/>
   <g fill="#000">${[0,45,90,135,180,225,270,315].map(a=>`<circle cx="${262+9*Math.cos(a*Math.PI/180)}" cy="${222+9*Math.sin(a*Math.PI/180)}" r="2"/>`).join('')}</g>
   <text x="262" y="196" text-anchor="middle" font-size="8" font-weight="700" fill="#ddd">NPN</text><text x="262" y="250" text-anchor="middle" font-size="8" font-weight="700" fill="#f0b429">PNP</text></g>
  <circle cx="${CX}" cy="${CY}" r="100" fill="none"/>
  ${ANG.map((_,i)=>labelSvg(i)).join('')}
  <g id="dial" transform="rotate(${ANG[0]} ${CX} ${CY})">
    <circle cx="${CX}" cy="${CY}" r="82" fill="#0e0e0f" stroke="#3b3b3d" stroke-width="3"/>
    <circle cx="${CX}" cy="${CY}" r="70" fill="none" stroke="#262628" stroke-width="2"/>
    ${Array.from({length:36},(_,k)=>`<line x1="${CX}" y1="${CY-72}" x2="${CX}" y2="${CY-79}" stroke="#2e2e30" stroke-width="2" transform="rotate(${k*10} ${CX} ${CY})"/>`).join('')}
    <path d="M${CX-7} ${CY} L${CX-4} ${CY-76} L${CX+4} ${CY-76} L${CX+7} ${CY}Z" fill="#232325" stroke="#555" stroke-width="1.5"/>
    <line x1="${CX}" y1="${CY-52}" x2="${CX}" y2="${CY-74}" stroke="#eee" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${CX}" cy="${CY}" r="14" fill="#18181a" stroke="#444" stroke-width="2"/>
  </g>
  <circle id="p-dial" class="knob" cx="${CX}" cy="${CY}" r="82" fill="transparent"><title>Kadran: sürükle veya etiketlere tıkla</title></circle>
  <text x="${CX}" y="486" text-anchor="middle" font-size="13" font-style="italic" font-weight="700" fill="#ddd">4000 Count</text>
  <text x="70" y="503" text-anchor="middle" font-size="13" font-weight="800" fill="#eee">10A</text>
  <text x="160" y="503" text-anchor="middle" font-size="13" font-weight="800" fill="#f0b429">COM</text>
  <text x="250" y="491" text-anchor="middle" font-size="10" font-weight="800" fill="#eee">VΩ μA</text><text x="250" y="503" text-anchor="middle" font-size="10" font-weight="800" fill="#eee">mA</text>
  ${['10A','COM','vo'].map(k=>`<g id="jk-${k}" class="clickable" data-jack="${k}"><circle cx="${JX[k]}" cy="${JY}" r="20" fill="#060606" stroke="#5a5a5a" stroke-width="3"/><circle cx="${JX[k]}" cy="${JY}" r="11" fill="#000" stroke="#333"/><title>${k==='COM'?'COM (siyah prob)':k==='10A'?'10A girişi':'VΩ μA mA girişi'}</title></g>`).join('')}
  <path d="M115 548 l9 -15 9 15z M205 548 l9 -15 9 15z" fill="#f0b429" opacity=".85"/>
  <text x="70" y="567" text-anchor="middle" font-size="7" fill="#bbb">FUSED 10A MAX</text><text x="244" y="567" text-anchor="middle" font-size="7" fill="#bbb">FUSED 400mA</text>
  <text x="150" y="578" text-anchor="middle" font-size="7" fill="#bbb">CAT II 1000V  CAT III 600V</text>
  <g id="halos" fill="none">
    <rect class="halo" data-h="lcd" x="36" y="56" width="248" height="132" rx="12"/>
    <rect class="halo" data-h="select" x="46" y="190" width="76" height="48" rx="8"/>
    <rect class="halo" data-h="hold" x="132" y="190" width="76" height="48" rx="8"/>
    <circle class="halo" data-h="dial" cx="${CX}" cy="${CY}" r="104"/>
    <circle class="halo" data-h="j10" cx="70" cy="${JY}" r="29"/>
    <circle class="halo" data-h="jcom" cx="160" cy="${JY}" r="29"/>
    <circle class="halo" data-h="jvo" cx="250" cy="${JY}" r="29"/>
    <circle class="halo" data-h="hfe" cx="262" cy="222" r="28"/>
    <circle class="halo" data-h="ncv" cx="160" cy="36" r="24"/>
  </g>`;
  $('#meterG').innerHTML=m;
}
buildMeter();

/* ---------- Ekran (LCD) ---------- */
function digit(ch,x,y){
  const on=CH[ch]||'';let s=`<g transform="translate(${x} ${y}) skewX(-6)">`;
  for(const k in SEGS){const r=SEGS[k];s+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="1.5" fill="#12302c" opacity="${on.includes(k)?.92:.06}"/>`;}
  return s+'</g>';
}
function lcdSvg(R){
  if(R.off)return '';
  let s='';
  const tx=(t,x,y,sz,a='start',w=700)=>`<text x="${x}" y="${y}" font-size="${sz}" font-weight="${w}" text-anchor="${a}" fill="#12302c">${t}</text>`;
  if(R.ac)s+=tx('AC',10,24,16);
  if(R.tag)s+=tx(R.tag,10,24,16);
  if(R.cont)s+=`<g class="${R.beep?'beepicon':''}">${tx('•)))',76,24,15)}</g>`;
  if(R.diode)s+=`<path d="M78 12 v13 l11 -6.5z M91 12 v13" fill="#12302c" stroke="#12302c" stroke-width="2.5"/>`;
  if(R.unit)s+=tx(R.unit,232,28,20,'end');
  let str=R.num,neg=false;
  if(str[0]==='-'){neg=true;str=str.slice(1);}
  const cells=[];
  for(let i=0;i<str.length;i++){if(str[i]==='.'){if(cells.length)cells[cells.length-1].dp=true;}else cells.push({ch:str[i],dp:false});}
  const used=cells.slice(-4),off=4-used.length;
  used.forEach((c,i)=>{const x=40+(off+i)*44;s+=digit(c.ch,x,34);if(c.dp)s+=`<circle cx="${x+31}" cy="101" r="4.5" fill="#12302c" opacity=".92"/>`;});
  if(neg)s+=`<rect x="12" y="65" width="20" height="7" rx="1.5" fill="#12302c" opacity=".92"/>`;
  if(R.level>=0){for(let i=0;i<4;i++)s+=`<rect x="${92+i*14}" y="${112-(i+1)*3}" width="10" height="${(i+1)*3}" fill="#12302c" opacity="${i<R.level?.9:.1}"/>`;}
  if(R.auto)s+=tx('Auto APO',10,116,13,'start',600);
  if(R.hold)s+=tx('H',232,116,16,'end');
  return s;
}

const INFO=[
 {n:'OFF — Kapalı',w:'Cihaz kapalı, pil harcamaz.',j:'—',c:'—',t:'Ölçüm bitince kadranı OFF\'a al. Probları çıkarmadan ölçüm konumunu değiştirmek de güvenlidir ama akım konumundan çıkarken devreyi önce kes.'},
 {n:'V~ — AC gerilim',w:'Alternatif gerilim (priz, trafo çıkışı).',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'PARALEL',t:'Ekranda AC çıkar. Polarite önemsizdir. 600 V CAT III sınırını aşma.'},
 {n:'V⎓ — DC gerilim',w:'Doğru gerilim (pil, adaptör, devre noktaları).',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'PARALEL',t:'Kırmızı + uca, siyah − uca. Ters bağlarsan ekranda eksi işareti çıkar. Aralık 4 V\'tan 1000 V\'a otomatik.'},
 {n:'mV⎓ — DC milivolt',w:'Çok küçük DC gerilimler (termokupl, şönt direnç düşümü).',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'PARALEL',t:'En çok 400 mV ölçer; daha büyükte "OL" görürsün. Küçük sinyallerde V⎓\'ten daha hassastır.'},
 {n:'Ω / •))) / ▷| — Direnç, süreklilik, diyot',w:'SELECT ile üç işlev arasında geçilir: direnç → süreklilik (bip) → diyot.',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'Enerjisiz elemana, PARALEL',t:'Gerilim altındaki devrede ölçme! Prob boşken "OL" görünür. Diyotta kırmızı prob anotta olmalı.'},
 {n:'⊣⊢ — Kapasite',w:'Kondansatör kapasitesi (nF, μF).',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'Kondansatör uçlarına',t:'Ölçmeden önce kondansatörü boşalt. Büyük değerlerde okuma birkaç saniye sürer.'},
 {n:'Hz — Frekans',w:'Periyodik sinyalin frekansı.',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'PARALEL (sinyal kaynağına)',t:'T = 1/f. Sinyal çok küçükse okuma kararsız olur.'},
 {n:'hFE — Transistör kazancı',w:'Transistörün DC akım kazancı.',j:'Prob kullanılmaz',c:'Transistör hFE soketine takılır',t:'NPN için üst, PNP için alt sıra. B–C–E bacaklarını doğru sıraya tak.'},
 {n:'μA⎓ — Mikroamper',w:'Çok küçük akımlar (en çok ~4000 μA). SELECT: DC ↔ AC.',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'SERİ',t:'Sigorta 400 mA. Büyük akımda "OL" verir. Akım bilinmiyorsa en büyük kademeden başla.'},
 {n:'mA⎓ — Miliamper',w:'Küçük/orta akımlar (~400 mA\'e kadar). SELECT: DC ↔ AC.',j:'Kırmızı: VΩμAmA · Siyah: COM',c:'SERİ',t:'Önce devreyi aç, multimetreyi araya seri bağla. Gerilim kaynağını bu konumda ölçme: sigorta atar!'},
 {n:'A⎓ — Amper (10 A)',w:'Büyük akımlar (10 A\'e kadar). SELECT: DC ↔ AC.',j:'Kırmızı: 10A girişi · Siyah: COM',c:'SERİ',t:'En çok 10 saniye, sonra 15 dakika dinlenme. Küçük akımlarda çözünürlük düşüktür (0.01 A).'},
 {n:'NCV — Temassız gerilim',w:'Temas etmeden elektrik alanı algılar.',j:'Prob kullanılmaz',c:'Cihazın üst ucu (▲) kabloya yaklaştırılır',t:'Bip + çubuklar = alan var. Bip yok ≠ gerilim yok; kesin ölçümü probla yap.'}
];
/* ---- Multimetre modülü: durum, etkileşim, ekran ---- */
const S={dial:2,sel:0,hold:false,frozen:null,jack:'vo',mute:false,fuseMA:true,fuseA:true};
const A={dial:ANG[2],dv:0};
let host={info:()=>{},say:()=>{},change:()=>{}};
let svg=null,lastR=null;
function mtype(){const m=MODES[S.dial];if(m==='OHM')return['R','CONT','DIODE'][S.sel%3];return m;}
function tick(){if(!actx||S.mute)return;try{const o=actx.createOscillator(),g=actx.createGain();o.type='square';o.frequency.value=900;g.gain.value=.05;o.connect(g);g.connect(actx.destination);o.start();g.gain.setTargetAtTime(0,actx.currentTime,.01);o.stop(actx.currentTime+.06);}catch(e){}}
function showInfo(){const i=INFO[S.dial];host.info(i.n,`${i.w} <br><b>Prob girişi:</b> ${i.j} · <b>Bağlantı:</b> ${i.c}<br><span style="color:var(--sub)">${i.t}</span>`);}
function setDial(i){if(i===S.dial)return;tick();S.dial=i;S.sel=0;S.hold=false;S.frozen=null;showInfo();host.change();}
/* ses */
let actx=null,osc=null,gain=null,beepOn=false,beepStep=0;
function audioInit(){if(actx)return;try{actx=new (window.AudioContext||window.webkitAudioContext)();osc=actx.createOscillator();gain=actx.createGain();osc.type='square';osc.frequency.value=2600;gain.gain.value=0;osc.connect(gain);gain.connect(actx.destination);osc.start();}catch(e){actx=null;}}
document.addEventListener('pointerdown',audioInit,{once:true});
setInterval(()=>{if(!gain)return;beepStep++;const on=beepOn&&!S.mute;gain.gain.setTargetAtTime(on?0.04:0,actx.currentTime,0.01);},125);
/* çizim güncellemesi */
function render(R){
  if(S.hold&&S.frozen&&R&&!R.off){R=Object.assign({},R,{num:S.frozen.num,unit:S.frozen.unit,hold:true});}
  lastR=R;
  $('#mmLcdG').innerHTML=lcdSvg(R);
  beepOn=!!(R&&R.beep);
  ANG.forEach((_,i)=>{const d=$('#dot'+i);if(d)d.setAttribute('fill',i===S.dial?'#ffc400':'#cfcfcf');});
  ['10A','vo'].forEach(k=>{const c=document.querySelector('#jk-'+k+' circle');if(c)c.setAttribute('stroke',S.jack===k?'#d62828':'#5a5a5a');});
}
function frame(){
  const f=(ANG[S.dial]-A.dial)*0.16;A.dv=(A.dv+f)*0.80;A.dial+=A.dv;
  if(Math.abs(ANG[S.dial]-A.dial)<0.05&&Math.abs(A.dv)<0.05){A.dial=ANG[S.dial];A.dv=0;}
  const d=$('#dial');if(d)d.setAttribute('transform',`rotate(${A.dial} ${CX} ${CY})`);
  requestAnimationFrame(frame);
}
/* etkileşim */
function svgPt(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse());}
let drag=false;
const cd=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
function turnTo(e){const p=svgPt(e),dx=p.x-(MX+CX),dy=p.y-(MY+CY);const th=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;let best=0,bd=999;ANG.forEach((a,i)=>{const dd=cd(th,a%360);if(dd<bd){bd=dd;best=i;}});setDial(best);}
function doSelect(){
  const m=MODES[S.dial];
  if(m==='OHM'){S.sel=(S.sel+1)%3;host.change();}
  else if(m==='I_UA'||m==='I_MA'||m==='I_A'){S.sel=(S.sel+1)%2;host.change();}
  else host.say('Bu konumda SELECT düğmesinin ikinci bir işlevi yok. Ω konumunda (direnç→süreklilik→diyot) ve akım konumlarında (DC↔AC) kullanılır.','info');
}
function doHold(){if(MODES[S.dial]==='OFF')return;S.hold=!S.hold;S.frozen=S.hold&&lastR?{num:lastR.num,unit:lastR.unit}:null;host.change();}
function init(h){
  host=Object.assign(host,h);svg=h.svg;
  buildMeter();
  svg.addEventListener('pointerdown',e=>{
    const t=e.target;
    if(t.id==='p-dial'){drag=true;t.setPointerCapture(e.pointerId);turnTo(e);return;}
    if(t.dataset&&t.dataset.dial!==undefined){setDial(+t.dataset.dial);return;}
    const j=t.closest&&t.closest('[data-jack]');
    if(j){const k=j.dataset.jack;if(k==='COM')host.say('Siyah prob her zaman COM girişinde kalır.','info');else{S.jack=k;host.say(k==='10A'?'Kırmızı prob 10A girişine takıldı: bu giriş her zaman 0.01 Ω şönttür. Gerilim ölçerken buraya takılı kalırsa kısa devre yapar!':'Kırmızı prob VΩμAmA girişine takıldı.',k==='10A'?'warn':'info');host.change();}return;}
    if(t.id==='p-select'){doSelect();return;}
    if(t.id==='p-hold'){doHold();return;}
  });
  svg.addEventListener('pointermove',e=>{if(drag)turnTo(e);});
  svg.addEventListener('pointerup',()=>{drag=false;});
  svg.addEventListener('pointerenter',showInfo);
  requestAnimationFrame(frame);
}
return {S,init,render,mtype,setDial,MODES,showInfo,jackEl:k=>document.querySelector('#jk-'+k+' circle')};

})();
