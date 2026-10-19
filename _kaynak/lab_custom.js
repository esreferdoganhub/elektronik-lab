/* ================= Birleşik laboratuvar: jeneratör + osiloskop ================= */
const SS=Scope.S,STD=Scope.TD,SVD=Scope.VD;
const CONN=[0,1];
const SCALE_S=0.93,SCOPE_Y=620;
const sBNC=d=>[BNCXs[d]*SCALE_S,SCOPE_Y+390*SCALE_S];
const BNCXs=[633,735,836];
const GOUT=[820,860];
function getSignals(){
  const out=[null,null];
  [0,1].forEach(i=>{const d=CONN[i];if(d>=0&&CH[i].on&&!out[d])out[d]=Object.assign({},CH[i],{on:true,factor:G.load==='50Ω'?2:1,fn:CH[i].mod?(t=>chSample(CH[i],t)):null});});
  return out;
}
/* ---------- Kablolar ---------- */
function buildBench(){
  let s='';
  s+=GOUT.map((x,i)=>`<rect x="${x-9}" y="510" width="18" height="28" fill="#c9c6bb" stroke="#8d8a80"/><circle cx="${x}" cy="552" r="12" fill="#bbb" stroke="#555" stroke-width="3"/><circle cx="${x}" cy="552" r="5" fill="#222"/><text x="${x}" y="578" text-anchor="middle" font-size="9" font-weight="700" fill="${CHCOL[i]==='#ffd23f'?'#b98a00':'#0f87b3'}">CH${i+1} OUT</text>`).join('');
  $('#benchG').innerHTML=s;
  $('#labHalos').innerHTML=`<circle class="halo" data-h="gbnc" cx="840" cy="552" r="42"/><rect class="halo" data-h="cables" x="560" y="580" width="370" height="540" rx="12"/>`;
}
function cablePath(i){
  const x=GOUT[i],d=CONN[i],mx=[900,916][i],by=[1105,1122][i],cy=[608,596][i];
  if(d<0)return `M${x} 552 L${x} ${cy-12} Q${x} ${cy} ${x+14} ${cy} L${mx-14} ${cy} Q${mx} ${cy} ${mx} ${cy+14} L${mx} 700`;
  const [ex,ey]=sBNC(d);
  return `M${x} 552 L${x} ${cy-12} Q${x} ${cy} ${x+14} ${cy} L${mx-14} ${cy} Q${mx} ${cy} ${mx} ${cy+14} L${mx} ${by-14} Q${mx} ${by} ${mx-14} ${by} L${ex+14} ${by} Q${ex} ${by} ${ex} ${by-14} L${ex} ${ey+24}`;
}
function drawCables(){
  let s='';
  [0,1].forEach(i=>{
    const p=cablePath(i);
    s+=`<path d="${p}" fill="none" stroke="#222" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="${p}" fill="none" stroke="${i?'#2b5f73':'#6b5a12'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
    if(CONN[i]>=0&&CH[i].on)s+=`<path class="flow" d="${p}" stroke="${CHCOL[i]}"/>`;
    if(CONN[i]<0)s+=`<circle cx="${[900,916][i]}" cy="700" r="7" fill="#999" stroke="#444" stroke-width="2"/>`;
  });
  $('#cableG').innerHTML=s;
}
function buildConnCard(){
  $('#connCard').innerHTML=`<div class="stepno">Kablo bağlantısı</div>`+[0,1].map(i=>`<div class="srcrow"><b style="color:${i?'#0f87b3':'#b98a00'}">Üreteç CH${i+1} OUT →</b> <select id="cn${i}"><option value="0">Osiloskop CH1</option><option value="1">Osiloskop CH2</option><option value="-1">Bağlı değil</option></select></div>`).join('')+
  `<div class="row"><button class="b sm" id="muteBtn">🔊 Ses açık</button></div>`;
  [0,1].forEach(i=>{$('#cn'+i).value=String(CONN[i]);$('#cn'+i).onchange=()=>{CONN[i]=+$('#cn'+i).value;mark();Scope.mark();say(CONN[i]<0?`CH${i+1} kablosu söküldü.`:`Üreteç CH${i+1} → osiloskop CH${CONN[i]+1}`);};});
}

/* ---------- Bilgi birleşimi ---------- */
Scope.init({root:$('#scopeRoot'),getSignals,say:(m,t)=>say(m,t),info:(t,b)=>{G.custom=[t,b];renderInfo();}});
buildBench();buildConnCard();
$('#muteBtn').onclick=()=>{G.mute=!G.mute;$('#muteBtn').textContent=G.mute?'🔇 Ses kapalı':'🔊 Ses açık';};

/* ---------- Animasyon döngüsü ---------- */
function frame(){
  kV=(kV+(kT-kA)*0.18)*0.78;kA+=kV;
  if(Math.abs(kT-kA)<0.05&&Math.abs(kV)<0.05){kA=kT;kV=0;}
  const kr=$('#knobRot');if(kr)kr.setAttribute('transform',`rotate(${kA} 685 92)`);
  if(dirty){
    dirty=false;
    $('#lcdG').innerHTML=lcdSvg();
    ['ch1','ch2'].forEach((b,i)=>{const r=document.querySelector(`[data-btn="${b}"] rect`);if(r){r.setAttribute('fill',CH[i].on?'#4ade80':'#8fb0d6');r.style.filter=CH[i].on?'drop-shadow(0 0 5px #22c55e)':'';}});
    drawCables();renderInfo();
  }
  requestAnimationFrame(frame);
}
setInterval(()=>{if(CH.some(c=>c.on&&c.wave==='noise'))mark();},300);
function showHalos(list){
  document.querySelectorAll('.halo').forEach(h=>h.style.display='none');
  const sc=[];
  (list||[]).forEach(n=>{
    if(n.startsWith('s:'))sc.push(n.slice(2));
    else{const q=n.startsWith('g:')?n.slice(2):n;document.querySelectorAll(`#genG .halo[data-h="${q}"],#labHalos .halo[data-h="${q}"]`).forEach(h=>h.style.display='block');}
  });
  Scope.halo(sc);
}

/* ---------- Demo ---------- */
let demoId=0;
function runDemo(seq){
  const id=++demoId;let i=0;G.busy=1;renderLessonBtns();
  const next=()=>{
    if(id!==demoId)return;
    if(i>=seq.length){G.busy=0;renderLessonBtns();return;}
    const tk=seq[i++];let fast=false;
    if(tk==='g:knob+'||tk==='g:knob-'){const d=tk==='g:knob+'?1:-1;if(knobStep(d)){kT+=18*d;tick(700);}fast=true;}
    else if(tk.startsWith('g:'))press(tk.slice(2));
    else if(tk.startsWith('s:kn:')){const [, ,k,d]=tk.split(':');Scope.knobStep(k,+d);fast=true;}
    else if(tk.startsWith('s:kp:'))Scope.knobPress(tk.slice(5));
    else if(tk.startsWith('s:'))Scope.press(tk.slice(2));
    setTimeout(next,fast?430:800);
  };
  setTimeout(next,300);
}
function stopDemo(){demoId++;G.busy=0;}
function renderLessonBtns(){const b=$('#dm');if(b)b.disabled=!!G.busy;}

/* ---------- Ders yardımcıları ---------- */
function cfg(i,o){Object.assign(CH[i],o);}
function toParam(p,i=0){G.ch=i;G.menu='param';G.param=p;G.edit=true;}
const sti=v=>STD.indexOf(v),svi=v=>SVD.indexOf(v);
function sAuto(){Scope.refresh();Scope.autoset();}
function resetAll(){
  stopDemo();CH[0]=newCh();CH[1]=newCh();
  Object.assign(G,{ch:0,load:'HighZ',menu:'wave',page:0,param:'freq',entry:null,edit:false,custom:null});
  CONN[0]=0;CONN[1]=1;$('#cn0').value='0';$('#cn1').value='1';
  Scope.reset();
}
function sine2(f,a){return {on:true,wave:'sine',freq:f,amp:a,off:0,phase:0,duty:50};}

/* ---------- Dersler ---------- */
const LESSONS=[
 {tab:'0 Bağlantı',title:'Masayı tanıyalım',steps:[
  {t:'Solda UTG932E fonksiyon üreteci, altta DS1202Z-E osiloskop. Üretecin çıkışları BNC kabloyla osiloskop girişlerine bağlı: CH1 OUT → CH1 girişi, CH2 OUT → CH2 girişi. Her ölçüm bu zincirle yapılır: üretecin ayarını osiloskoptan doğrularsın.',hl:['g:screen','s:screen','cables'],set:()=>{cfg(0,{amp:2});}},
  {t:'Üretecin CH1 tuşuna bas: çıkış açılır, tuş yeşil yanar ve kabloda sinyal akmaya başlar. Şu an osiloskop düz bir çizgi gösterir; çünkü ölçekler sinyale göre ayarlı değil.',hl:['g:ch1','cables'],set:()=>{cfg(0,{amp:2});},demo:['g:ch1']},
  {t:'Osiloskopta AUTO tuşuna bas: dikey ölçek, zaman tabanı ve tetikleme otomatik ayarlanır. Dalga kararlı biçimde görünür.',hl:['s:auto','s:screen'],set:()=>{cfg(0,{on:true,amp:2});Scope.refresh();},demo:['s:auto']},
  {t:'Osiloskop şunu gösteriyor: 1 kHz, tepeden tepeye 2 V sinüs. Bu, üretecin LCD\'sinde ayarlanan değerlerle aynıdır (Freq 1 kHz, Amp 2 Vpp). Doğrulama bu şekilde yapılır.',hl:['s:screen','g:params'],set:()=>{cfg(0,{on:true,amp:2});sAuto();SS.meas=['freq','period','vpp','vmax','vmin'];SS.left=0;SS.menu='meas';}}
 ]},
 {tab:'1 Frekans / periyot',title:'Frekans ve periyot ölçümü',steps:[
  {t:'1 kHz sinüsü osiloskopta inceleyelim. Ekranın altındaki ölçüm kutuları Freq = 1 kHz ve Period = 1 ms gösterir. T = 1/f.',hl:['s:left','s:screen'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.meas=['freq','period','vpp','vmax','vmin'];SS.left=0;SS.menu='meas';}},
  {t:'Üreteçte frekansı 2.5 kHz yap: Wave → Sine → 2 . 5 → kHz soft tuşu. "▶ Göster" ile animasyonu izle.',hl:['g:keypad','g:softkeys'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.meas=['freq','period','vpp','vmax','vmin'];SS.left=0;SS.menu='meas';},demo:['g:wave','g:sk0','g:k2','g:kdot','g:k5','g:sk1','s:auto']},
  {t:'AUTO\'dan sonra osiloskop Freq = 2.5 kHz, Period = 400 μs okur. Ölçek, 3 periyot görünecek şekilde otomatik değişti (zaman tabanı = 100 μs/div).',hl:['s:screen','s:left'],set:()=>{cfg(0,sine2(2500,2));sAuto();SS.meas=['freq','period','vpp','vmax','vmin'];SS.left=0;SS.menu='meas';}},
  {t:'Ekrandan elle okuma: bir periyot kaç bölme (div) tutuyor? Örn. 4 div × 100 μs/div = 400 μs. Zaman tabanını (yatay SCALE) değiştirip tekrar oku. Çok hızlı zaman tabanında Freq "*****" olur (periyot görünmez).',hl:['s:hscale'],set:()=>{cfg(0,sine2(2500,2));sAuto();SS.meas=['freq','period','vpp','vmax','vmin'];SS.left=0;SS.menu='meas';},demo:['s:kn:hscale:1','s:kn:hscale:1','s:kn:hscale:1','s:kn:hscale:-1','s:kn:hscale:-1','s:kn:hscale:-1']},
  {t:'Yüksek frekans: üreteçte 500 kHz yap. AUTO sonrası zaman tabanı 500 ns/div civarına iner. Osiloskop 200 MHz bant genişliğine ve 1 GSa/s örneklemeye sahip, yani MHz sinyallerini rahatça ölçer.',hl:['g:params','s:hscale'],set:()=>{cfg(0,sine2(500000,2));sAuto();SS.meas=['freq','period','vpp','vmax','vmin'];SS.left=0;SS.menu='meas';}}
 ]},
 {tab:'2 Genlik / offset',title:'Genlik, offset ve kuplaj',steps:[
  {t:'Üreteçte Amp = 4 Vpp, Offset = 1.5 V sinüs. Osiloskop DC kuplajda: Vmax = 3.5 V, Vmin = −0.5 V, Vpp = 4 V. Sinyalin merkezi 1.5 V\'ta.',hl:['g:params','s:screen'],set:()=>{cfg(0,{on:true,wave:'sine',freq:1000,amp:4,off:1.5});sAuto();SS.meas=['vpp','vmax','vmin','vavg','vrms'];SS.left=0;SS.menu='meas';}},
  {t:'Offset üretecin DC bileşenidir. Vavg ≈ 1.5 V (ortalama), Vrms ise DC ve AC bileşenin birleşimidir: √(1.5² + (4/2√2)²) ≈ 2.5 V.',hl:['s:left'],set:()=>{cfg(0,{on:true,wave:'sine',freq:1000,amp:4,off:1.5});sAuto();SS.meas=['vpp','vmax','vmin','vavg','vrms'];SS.left=0;SS.menu='meas';}},
  {t:'Osiloskopta CH1 tuşuna (seçiliyken) basıp menüden Coupling\'i AC yap: DC bileşen süzülür, dalga sıfır etrafında ±2 V görünür. Vavg ≈ 0 V olur. Sadece dalgalanmayı (ripple) görmek için AC kuplaj kullanılır.',hl:['s:chs','s:right'],set:()=>{cfg(0,{on:true,wave:'sine',freq:1000,amp:4,off:1.5});sAuto();SS.meas=['vpp','vmax','vmin','vavg','vrms'];SS.left=0;SS.menu='ch';},demo:['s:r0','s:auto']},
  {t:'Genliği düğmeyle artırınca osiloskop ekranında dalga büyür. Dikey ölçeği (V/div) taşan dalgaya göre küçültmeyi unutma; ekranın dışına taşan dalga yanlış ölçülür.',hl:['g:knob','s:vscale'],set:()=>{cfg(0,{on:true,wave:'sine',freq:1000,amp:4,off:0});sAuto();toParam('amp');},demo:['g:knob+','g:knob+','g:knob+']}
 ]},
 {tab:'3 Duty / PWM',title:'Görev oranı ve PWM ölçümü',steps:[
  {t:'Üreteçte 10 kHz, 5 Vpp, offset 2.5 V kare dalga: 0–5 V\'luk PWM. Görev oranı %50. Osiloskop +Duty = %50, +Width = 50 μs gösterir.',hl:['g:params','s:left'],set:()=>{cfg(0,{on:true,wave:'square',freq:10000,amp:5,off:2.5,duty:50});sAuto();SS.meas=['freq','pduty','pwidth','vmax','vmin'];SS.left=0;SS.menu='meas';}},
  {t:'Üreteçte Duty = %30 yap: Duty parametresini seç (5. soft tuş), 3 0 yaz, % soft tuşu. Osiloskopta +Duty = %30, +Width = 30 μs olur.',hl:['g:params','g:keypad'],set:()=>{cfg(0,{on:true,wave:'square',freq:10000,amp:5,off:2.5,duty:50});sAuto();SS.meas=['freq','pduty','pwidth','vmax','vmin'];SS.left=0;SS.menu='meas';},demo:['g:wave','g:sk1','g:sk4','g:k3','g:k0','g:sk0']},
  {t:'Sinyal ayarlandı: +Duty ≈ %30. Ortalama gerilim = Duty × 5 V = 1.5 V (Vavg ile karşılaştır). DC-DC dönüştürücülerde çıkış gerilimi bu orana bağlıdır.',hl:['s:left','s:screen'],set:()=>{cfg(0,{on:true,wave:'square',freq:10000,amp:5,off:2.5,duty:30});sAuto();SS.meas=['freq','pduty','pwidth','vavg','vpp'];SS.left=0;SS.menu='meas';}},
  {t:'Yükselme/düşme süresi (Rise/Fall): kare dalganın kenarları yaklaşık 10 ns sürer. Osiloskop bunu bant genişliği içinde ölçer. Gerçek devrede sürücü ve parazit endüktanslar kenarı yavaşlatır, osiloskopla görürsün.',hl:['s:left'],set:()=>{cfg(0,{on:true,wave:'square',freq:10000,amp:5,off:2.5,duty:30});sAuto();SS.meas=['rise','fall','pduty','freq','vpp'];SS.left=0;SS.menu='meas';}}
 ]},
 {tab:'4 Faz farkı',title:'İki kanal ve faz farkı',steps:[
  {t:'Üreteç CH1 ve CH2 aynı frekansta (1 kHz, 2 Vpp) sinüs üretiyor ve ikisi de açık. CH2 fazı 0°; osiloskopta iki dalga üst üste biner.',hl:['g:ch1','g:ch2','s:screen'],set:()=>{cfg(0,sine2(1000,2));cfg(1,sine2(1000,2));SS.ch[1].on=true;sAuto();SS.sel=1;}},
  {t:'Üreteçte CH2\'yi seç, Phase\'i 90° yap. "▶ Göster" ile animasyonu izle.',hl:['g:params','g:chhead'],set:()=>{cfg(0,sine2(1000,2));cfg(1,sine2(1000,2));SS.ch[1].on=true;sAuto();},demo:['g:wave','g:sk0','g:sk3','g:k9','g:k0','g:sk0']},
  {t:'Şimdi CH2 sinyali CH1\'e göre çeyrek periyot ilerde. Osiloskopta Cursor tuşuna bas, X imleçleriyle iki sıfır geçişi arasındaki ΔX\'i oku: ΔX ≈ 250 μs. Faz = 250 μs / 1 ms × 360° = 90°.',hl:['s:cursor','s:multi'],set:()=>{cfg(0,sine2(1000,2));cfg(1,Object.assign(sine2(1000,2),{phase:90}));SS.ch[1].on=true;sAuto();SS.cur=1;SS.curA=-0.5;SS.curB=0.5;SS.menu='cursor';}},
  {t:'Faz = 180° olursa iki dalga birbirinin tersi olur (yarım köprü kapı sinyalleri). Faz kaydırma, 3 faz sistemlerde 120° ile kontrol edilir.',hl:['s:screen','g:params'],set:()=>{cfg(0,sine2(1000,2));cfg(1,Object.assign(sine2(1000,2),{phase:180}));SS.ch[1].on=true;sAuto();}}
 ]},
 {tab:'5 Tetikleme',title:'Tetikleme ve kararlı görüntü',steps:[
  {t:'1 kHz, 2 Vpp sinüs ekranda duruyor çünkü tetikleme seviyesi sinyalin içinde (0 V). Turuncu T oku bu seviyeyi gösterir.',hl:['s:tlevel','s:screen'],set:()=>{cfg(0,sine2(1000,2));sAuto();}},
  {t:'Tetik seviyesini LEVEL düğmesiyle 3 V\'un üzerine çıkar: sinyal ±1 V olduğundan tetikleme olmaz. Auto modda durum "AUTO" olur ve dalga başlangıcı rastgele olduğundan titreyip kayar.',hl:['s:tlevel','s:screen'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.trig.level=3;}},
  {t:'MODE tuşuyla Normal moda geç: tetikleme olmadığı için ekran güncellenmez ve "WAIT" yazar. Düğmenin ortasına basınca seviye sıfıra döner ve (sinyal 0 V merkezli olduğundan) tetikleme düzelir.',hl:['s:tmode','s:tlevel'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.trig.level=3;},demo:['s:tmode','s:kp:tlevel']},
  {t:'Tetikleme kenarı: Trigger MENU → Slope. Düşen (↓) kenarı seçersen dalga ekranda, sinyalin düşen yarısından başlayacak şekilde kayar. Aynı sinyali farklı görünümlerde incelemek için kullanılır.',hl:['s:tmenu','s:right'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.menu='trig';},demo:['s:r2']}
 ]},
 {tab:'6 Yük ve prob',title:'Sık yapılan ölçüm hataları',steps:[
  {t:'Hata 1: Yük ayarı. Üreteç HighZ iken 2 Vpp ayarlanan sinyal osiloskopta 2 Vpp okunur.',hl:['g:chhead','s:screen'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.meas=['vpp','vmax','vmin','freq','period'];SS.left=0;SS.menu='meas';}},
  {t:'Üreteçte Utility ile yükü 50 Ω yap. Osiloskop girişi yüksek empedanslı (1 MΩ) olduğundan gerilim bölünmez; osiloskopta 4 Vpp okunur. Üreteç yükü 50 Ω varsayar ve çıkışını 2 katına çıkarır.',hl:['g:util','s:left'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.meas=['vpp','vmax','vmin','freq','period'];SS.left=0;SS.menu='meas';},demo:['g:util','s:auto']},
  {t:'Hata 2: Prob uyumsuzluğu. Osiloskopun varsayılan Probe ayarı 10X. Prob anahtarı 1X yapılırsa (BNC altındaki etiket) ama ayar 10X kalırsa gerilim 10 kat büyük okunur. Kırmızı etiket uyumsuzluğu gösterir.',hl:['s:probe1','s:right'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.meas=['vpp','vmax','vmin','freq','period'];SS.left=0;SS.menu='ch';},demo:['s:probe1']},
  {t:'Düzeltme: CH1 menüsünde Probe\'u 1X yap; ayar ve anahtar eşleşince Vpp tekrar doğru okunur. Ölçüm öncesi prob anahtarı + osiloskop ayarı + yük ayarı üçlüsünü kontrol et.',hl:['s:right','s:probe1'],set:()=>{cfg(0,sine2(1000,2));sAuto();SS.phys[0]=1;SS.meas=['vpp','vmax','vmin','freq','period'];SS.left=0;SS.menu='ch';},demo:['s:r2','s:auto']}
 ]},
 {tab:'7 Uygulama',title:'Uygulama: PWM kapı sinyali',steps:[
  {t:'Senaryo: MOSFET kapı sürme devresi için 20 kHz, %30 görev oranlı, 0–5 V PWM test sinyali üretip doğrulayacağız. Üreteçte CH1: Square, 20 kHz, 5 Vpp, Offset 2.5 V, Duty %30.',hl:['g:params'],set:()=>{cfg(0,{on:true,wave:'square',freq:20000,amp:5,off:2.5,duty:30});}},
  {t:'Osiloskopta AUTO. Doğrulama listesi: Freq 20 kHz (Period 50 μs), Vmax 5 V / Vmin 0 V, +Duty %30 (+Width 15 μs). Hepsi beklenen değerle eşleşiyor.',hl:['s:auto','s:left'],set:()=>{cfg(0,{on:true,wave:'square',freq:20000,amp:5,off:2.5,duty:30});sAuto();SS.meas=['freq','pduty','pwidth','vmax','vmin'];SS.left=0;SS.menu='meas';}},
  {t:'AllMeasure açılınca tüm ölçümler tabloda görünür (Vpp, Vavg, Rise, Fall...). Devrenin gerçek kapı sinyalinde, kenar süresi ve taşma gibi değerlerin beklenenle uyumuna bakarsın.',hl:['s:right','s:screen'],set:()=>{cfg(0,{on:true,wave:'square',freq:20000,amp:5,off:2.5,duty:30});sAuto();SS.menu='meas';SS.left=0;SS.allMeas=true;}},
  {t:'Son adım: Duty\'yi %60\'a çıkar ve osiloskopta +Duty\'nin %60 olduğunu doğrula. Ölçüm yaparak ayarı doğrulamak, güç elektroniği deneylerinin temel alışkanlığıdır.',hl:['g:params','s:left'],set:()=>{cfg(0,{on:true,wave:'square',freq:20000,amp:5,off:2.5,duty:30});sAuto();SS.meas=['freq','pduty','pwidth','vmax','vmin'];SS.left=0;SS.menu='meas';},demo:['g:wave','g:sk1','g:sk4','g:k6','g:k0','g:sk0']}
 ]}
];
const TABS=[...LESSONS.map((l,i)=>({tab:l.tab,i})),{tab:'Serbest mod',i:'free'},{tab:'Sınav',i:'quiz'}];
const chips=$('#chips');
TABS.forEach((t,idx)=>{const b=document.createElement('button');b.textContent=t.tab;b.dataset.i=idx;b.onclick=()=>openTab(idx);chips.appendChild(b);});
function openTab(idx){
  chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.i===idx));
  const t=TABS[idx];showHalos([]);
  $('#presetCard').style.display=t.i==='free'?'':'none';
  if(t.i==='free'){G.mode='free';resetAll();cfg(0,{on:true,amp:2});Scope.refresh();Scope.autoset();renderFree();renderPresets();mark();Scope.mark();}
  else if(t.i==='quiz'){G.mode='quiz';startQuiz();}
  else{G.mode='lesson';G.lesson=t.i;enterStep(0);}
}
function enterStep(n){
  const les=LESSONS[G.lesson];G.step=n;resetAll();Scope.refresh();
  for(let i=0;i<=n;i++){const a=les.steps[i].set;if(a)a();}
  showHalos(les.steps[n].hl);renderLesson();say('');mark();Scope.mark();
}
function renderLesson(){
  const les=LESSONS[G.lesson],st=les.steps[G.step],last=G.step===les.steps.length-1;
  $('#lessonCard').innerHTML=`<div class="stepno">${les.tab} · Adım ${G.step+1}/${les.steps.length}</div><h2>${les.title}</h2><p>${st.t}</p>
   <div class="row"><button class="b" id="pv" ${G.step===0?'disabled':''}>◀ Önceki</button>${st.demo?'<button class="b" id="dm">▶ Göster</button>':''}<button class="b pri" id="nx">${last?(G.lesson<LESSONS.length-1?'Sonraki ders ▶':'Serbest moda geç ▶'):'Sonraki ▶'}</button></div>`;
  $('#pv').onclick=()=>enterStep(G.step-1);
  if(st.demo)$('#dm').onclick=()=>{enterStep(G.step);runDemo(st.demo);};
  $('#nx').onclick=()=>{if(!last)enterStep(G.step+1);else openTab(G.lesson<LESSONS.length-1?G.lesson+1:TABS.length-2);};
}
function renderFree(){
  $('#lessonCard').innerHTML=`<div class="stepno">Serbest mod</div><h2>Kendin dene</h2><p>Üretecin tuşlarını ve düğmesini kullanarak sinyal üret; osiloskopta AUTO ile görüntüle, ölçüm ve imleçlerle doğrula. Kabloları sağdaki karttan değiştirebilirsin (örn. üreteç CH2 → osiloskop CH1).</p>
  <p style="font-size:.88rem;color:var(--sub)">Klavye (üreteç): rakamlar, Enter, Esc, ↑ ↓ (düğme), ← → (imleç).</p>`;
}
const PRESETS={
 '1 kHz sinüs 2 Vpp':()=>{cfg(0,sine2(1000,2));},
 'PWM 20 kHz %30':()=>{cfg(0,{on:true,wave:'square',freq:20000,amp:5,off:2.5,duty:30});},
 'Şebeke 50 Hz 6 Vpp':()=>{cfg(0,sine2(50,6));},
 '2 faz 90°':()=>{cfg(0,sine2(1000,2));cfg(1,Object.assign(sine2(1000,2),{phase:90}));SS.ch[1].on=true;},
 'Üçgen 2 kHz':()=>{cfg(0,{on:true,wave:'ramp',freq:2000,amp:4,off:0,duty:50,phase:0});}
};
function renderPresets(){
  $('#presetCard').innerHTML=`<div class="stepno">Hazır ayarlar</div><div class="row">${Object.keys(PRESETS).map(k=>`<button class="b sm" data-p="${k}">${k}</button>`).join('')}<button class="b sm" data-p="__reset">Sıfırla</button></div>`;
  $('#presetCard').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    resetAll();if(b.dataset.p!=='__reset')PRESETS[b.dataset.p]();else cfg(0,{on:true,amp:2});
    G.menu='param';G.param='freq';Scope.refresh();Scope.autoset();mark();say(b.dataset.p==='__reset'?'Sıfırlandı.':'Hazır ayar: '+b.dataset.p+' (osiloskop otomatik ayarlandı).','ok');
  });
}

/* ---------- Sınav ---------- */
const nr=(a,b,t=0.03)=>Math.abs(a-b)<=Math.abs(b)*t;
const TASKS=[
 {t:'Üreteçte CH1: 1 kHz, 2 Vpp sinüs üret ve çıkışı aç. Osiloskopta AUTO ile görüntüle ve Measure\'dan Vpp ölçümünü ekle.',set:()=>{},c:()=>{const f=[],c=CH[0];if(!c.on)f.push('Üreteç CH1 çıkışı açık olmalı');if(c.wave!=='sine'||!nr(c.freq,1000)||!nr(c.amp,2))f.push('Üreteç: 1 kHz, 2 Vpp sinüs olmalı');if(!SS.meas.includes('vpp'))f.push('Osiloskopta Vpp ölçümü eklenmeli (Measure → soldaki tuş)');const M=Scope.measure(0);if(!M||!nr(M.vpp,2,0.05))f.push('Osiloskopta Vpp ≈ 2 V görünmüyor: AUTO\'ya bas'+(M?' (şimdi '+Scope.siFmt(M.vpp,'V')+')':''));return f;}},
 {t:'PWM üret: CH1 kare dalga, 20 kHz, 5 Vpp, offset 2.5 V, duty %30; çıkışı aç. Osiloskopta +Duty ölçümünü göster; ≈ %30 okunmalı.',set:()=>{},c:()=>{const f=[],c=CH[0];if(!c.on)f.push('CH1 çıkışı açık olmalı');if(c.wave!=='square'||!nr(c.freq,20000)||!nr(c.amp,5)||!nr(c.off,2.5)||!nr(c.duty,30))f.push('Üreteç: Square, 20 kHz, 5 Vpp, 2.5 V offset, %30 olmalı');if(!SS.meas.includes('pduty'))f.push('Osiloskopta +Duty ölçümü eklenmeli');const M=Scope.measure(0);if(!M||M.pduty==null||!nr(M.pduty,30,0.06))f.push('+Duty ≈ %30 okunmuyor (AUTO ve uygun zaman tabanı)');return f;}},
 {t:'İki kanal: CH1 ve CH2 ikisi de 1 kHz, 2 Vpp sinüs, CH2 fazı 90°; ikisi de açık. Osiloskopta CH2\'yi aç, X imleçlerini aç ve ΔX ≈ 250 μs olacak şekilde ayarla.',set:()=>{},c:()=>{const f=[];[0,1].forEach(i=>{if(!CH[i].on)f.push(`Üreteç CH${i+1} açık olmalı`);});if(!nr(CH[1].phase,90))f.push('CH2 fazı 90° olmalı');if(!SS.ch[1].on)f.push('Osiloskopta CH2 açık olmalı');if(SS.cur!==1)f.push('X imleçleri açık olmalı (Cursor tuşu)');else{const dx=Math.abs(SS.curB-SS.curA)*STD[SS.ti];if(!nr(dx,250e-6,0.1))f.push('ΔX = '+Scope.siFmt(dx,'s')+'; hedef ≈ 250 μs');}return f;}},
 {t:'Yük hatası: CH1 1 kHz, 2 Vpp sinüs açık; üreteçte Utility ile yükü 50 Ω yap. Osiloskopta Vpp ölçümünü göster. Okunan değer ≈ 4 V olmalı.',set:()=>{},c:()=>{const f=[];if(!CH[0].on)f.push('CH1 açık olmalı');if(G.load!=='50Ω')f.push('Yük 50 Ω olmalı (Utility)');if(!SS.meas.includes('vpp'))f.push('Vpp ölçümü eklenmeli');const M=Scope.measure(0);if(!M||!nr(M.vpp,4,0.05))f.push('Osiloskopta Vpp ≈ 4 V okunmuyor');return f;}},
 {t:'Tetikleme: CH1 1 kHz, 2 Vpp sinüs açık. Osiloskopta Normal moda geç ve tetik seviyesini sinyalin dışına (> 2 V) çıkar; durum WAIT olmalı.',set:()=>{},c:()=>{const f=[];if(!CH[0].on)f.push('CH1 açık olmalı');if(SS.mode!=='normal')f.push('Mod Normal olmalı (MODE tuşu)');if(SS.trig.level<=1.1)f.push('Tetik seviyesi sinyal dışında (> 1 V) olmalı');if(SS.status!=='WAIT')f.push('Durum şu an '+SS.status+'; WAIT olmalı');return f;}},
 {t:'Ölçüm doğrulama: Üreteçte 2.5 kHz, 3 Vpp sinüs aç; osiloskopta Freq ve Period ölçümlerini göster (400 μs okunmalı).',set:()=>{},c:()=>{const f=[],c=CH[0];if(!c.on)f.push('CH1 açık olmalı');if(c.wave!=='sine'||!nr(c.freq,2500)||!nr(c.amp,3))f.push('Üreteç: 2.5 kHz, 3 Vpp sinüs olmalı');if(!SS.meas.includes('freq')||!SS.meas.includes('period'))f.push('Freq ve Period ölçümleri eklenmeli');const M=Scope.measure(0);if(!M||M.period==null||!nr(M.period,400e-6,0.05))f.push('Period ≈ 400 μs okunmuyor (AUTO)');return f;}}
];
const Q={order:[],i:0,score:0};
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function startQuiz(){Q.order=shuffle(TASKS.map((_,i)=>i));Q.i=0;Q.score=0;loadQ();}
function loadQ(){
  resetAll();Scope.refresh();const t=TASKS[Q.order[Q.i]];t.set();mark();Scope.mark();
  $('#lessonCard').innerHTML=`<div class="stepno">Sınav · Soru ${Q.i+1}/${Q.order.length} · Puan ${Q.score}</div><h2>Görev</h2><p>${t.t}</p><div class="row"><button class="b pri" id="ans">Kontrol et</button></div>`;
  $('#ans').onclick=checkAns;say('Cihazları gerçek tuşlarla ayarla, sonra Kontrol et\'e bas.');
}
function checkAns(){
  const t=TASKS[Q.order[Q.i]],f=t.c(),good=f.length===0;if(good)Q.score++;
  const last=Q.i===Q.order.length-1;
  $('#lessonCard').innerHTML=`<div class="stepno">Sınav · Soru ${Q.i+1}/${Q.order.length} · Puan ${Q.score}</div><h2>${good?'✔ Doğru':'✖ Eksik/yanlış'}</h2><p>${good?'Tebrikler!':f.join('<br>')}</p><div class="row"><button class="b pri" id="nq">${last?'Sonucu gör':'Sonraki görev ▶'}</button></div>`;
  $('#nq').onclick=()=>{if(last)endQuiz();else{Q.i++;loadQ();}};
  say(good?'Doğru!':'Eksikler var.',good?'ok':'bad');
}
function endQuiz(){
  const p=Q.score,n=Q.order.length;
  $('#lessonCard').innerHTML=`<div class="stepno">Sınav bitti</div><h2>Puanın: ${p}/${n}</h2><p>${p===n?'Mükemmel! Üreteç ve osiloskobu birlikte rahatça kullanabilirsin.':p>=n*.7?'İyi! Eksik kalan konuları tekrar et.':'Dersleri tekrar gözden geçirip yeniden dene.'}</p><div class="row"><button class="b pri" id="rq">Tekrar dene</button></div>`;
  $('#rq').onclick=startQuiz;say('');
}

/* ---------- Başlat ---------- */
openTab(0);
requestAnimationFrame(frame);
