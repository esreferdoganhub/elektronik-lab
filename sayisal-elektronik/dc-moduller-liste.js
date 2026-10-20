/* =====================================================================
   Y-0016-DC modül panelleri (koordinatlar: modül paneli 342×350)
   Her modül: def(no, başlık, deneyler[{t, pre}], çizim(D), bilgi-html)
   pre: hazır bağlantı — w: kablolar, dmm: [mod, +soket, −soket], sc/sc2: osiloskop probları,
        T: zaman/böl, V/V2: V/böl, psu: ayarlı kaynak gerilimi, fg: {f, a, w}, k: düğme değerleri
   ===================================================================== */
'use strict';
(()=>{
const {def}=DCX;
const S=Solver;
/* hazır bağlantı yardımcıları */
const FGM_=[1,10,100,1e3,1e4];
function PR(o){return{n:o.n,w:o.w||[],after(){
  /* gerçek cihazlar: multimetre (UT136B+) ve osiloskop (RIGOL) kablolarla bağlanır; endüktans için basit LCR metre */
  if(o.dmm){if(o.dmm[0]==='IND'||!(typeof TZ==='object')||!TZ.meter(o.dmm[0],o.dmm[1],o.dmm[2])){DCX.DM.mode=o.dmm[0];probe.dmmP=o.dmm[1]?ji(o.dmm[1]):-1;probe.dmmN=o.dmm[2]?ji(o.dmm[2]):-1;if((typeof TZ==='object'))TZ.show('basic')}}
  if(o.sc)TZ.probeTo(1,o.sc);if(o.sc2)TZ.probeTo(2,o.sc2);
  if(o.T||o.V||o.V2)TZ.scopeSet({T:o.T,V:o.V,V2:o.V2,ac:false});
  if(o.psu!=null){K.coarse=Math.min(1,o.psu/34);K.fine=0;K.current=o.ilim||0.5}
  if(o.fg){const f=o.fg.f||1e3;let r=0;while(r<4&&f>=FGM_[r]*10)r++;SW.fgr=r;K.fgf=clamp((f/FGM_[r]-1)/9,0,1);K.fga=clamp((o.fg.a||1)/10,0,1);SW.fgwave=o.fg.w==='tri'?1:0;SW.fgon=1}
  if(o.k)Object.assign(K,o.k);if(o.after)o.after();DCX.need()}}}
/* sık kullanılan eğitim seti soketleri */
const G0='ttl.g0',P12='s12.p1',N12='s12.n1',Z12='s12.01',ACA='ac.a1',AC0='ac.01',ACB='ac.b1',PSU='psu.p1',PSU0='psu.n1',FG='fg.st1',FG0='fg.g1';
/* rasgele ama her açılışta aynı tolerans sapması */
let seed=12345;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
const tol=(v,t)=>v*(1+t*(rnd()*1.6-0.8));

/* =========================== MODÜL 1 =========================== */
def(1,'Direnç renk kodları',[
  {t:'Direnç renk kodları ve ölçümü',pre:PR({dmm:['OHM','dc1:r3a','dc1:r3b'],n:'Multimetre Ω konumunda R3\'ün uçlarına bağlı. Renk bantlarını tablodan okuyup hesapladığınız değeri ölçümle karşılaştırın; probları (sağ tık: çıkar, tıkla: tak) diğer dirençlere taşıyın. Ölçülen değer toleransın içinde mi?'})}],
D=>{
  D.sub(8,24,326,318,'EXPERIMENT 1','RESISTOR COLOR CODES AND MEASUREMENT');
  // örnek 4 bantlı direnç
  D.j(30,42,'R1','l','r1a');D.w(30,42,62,42);D.R(62,42,112,42,tol(4700,0.05),'',{nom:4700,lab:''});D.w(112,42,140,42);D.j(140,42,'4K7 ±%5','r','r1b');
  // renk tablosu
  const X=[18,62,92,122,152,192,228],Y0=62,RH=18.4;
  const rows=[['BLACK','#111','0','0','0','×1','—'],['BROWN','#7b4a1e','1','1','1','×10','±%1'],['RED','#d32f2f','2','2','2','×100','±%2'],['ORANGE','#f57c00','3','3','3','×1K','—'],
    ['YELLOW','#fdd835','4','4','4','×10K','—'],['GREEN','#2e7d32','5','5','5','×100K','±%0.5'],['BLUE','#1565c0','6','6','6','×1M','±%0.25'],['VIOLET','#7b1fa2','7','7','7','×10M','±%0.1'],
    ['GREY','#8d8d8d','8','8','8','—','±%0.05'],['WHITE','#fafafa','9','9','9','—','—'],['GOLD','#c9a227','—','—','—','×0.1','±%5'],['SILVER','#b9bcc0','—','—','—','×0.01','±%10']];
  D.raw(`<rect x="${X[0]}" y="${Y0-14}" width="${X[6]-X[0]}" height="${14+RH*12}" fill="#fff" stroke="#1c1d1f" stroke-width="1"/>`);
  ['COLOR','1st BAND','2nd BAND','3rd BAND','MULTIPLIER','TOLERANCE'].forEach((t,i)=>D.t((X[i]+X[i+1])/2,Y0-4.5,t,4.6));
  rows.forEach((r,k)=>{const y=Y0+RH*k;D.raw(`<rect x="${X[0]+1}" y="${y+1}" width="${X[1]-X[0]-2}" height="${RH-2}" fill="${r[1]}" opacity=".9"/>`);
    D.t((X[0]+X[1])/2,y+RH/2+2,r[0],5,'middle',`fill="${['#111','#7b4a1e','#d32f2f','#2e7d32','#1565c0','#7b1fa2'].includes(r[1])?'#fff':'#111'}"`);
    for(let c=2;c<7;c++)D.t((X[c-1]+X[c])/2,y+RH/2+2,r[c],5.4);D.ln(X[0],y,X[6],y,.6)});
  for(let i=1;i<6;i++)D.ln(X[i],Y0-14,X[i],Y0+RH*12,.6);
  // örnek 5 bantlı direnç
  D.j(30,318,'R2','l','r2a');D.w(30,318,62,318);D.R(62,318,112,318,tol(330,0.01),'',{nom:330,five:true,lab:''});D.w(112,318,140,318);D.j(140,318,'330R ±%1','r','r2b');
  // sağ sütun: 4 ve 5 bantlı dirençler (değerleri yazmaz — renklerden okunur)
  D.sub(236,30,92,140,'','');D.t(282,40,'4 BAND RESISTORS',5);
  [[100,'R3'],[1000,'R4'],[2200,'R5'],[47000,'R6']].forEach(([v,nm],i)=>{const y=58+i*28,k=nm.toLowerCase();D.j(246,y,'','t',k+'a');D.w(246,y,258,y);D.R(258,y,306,y,tol(v,0.05),'',{nom:v,lab:''});D.w(306,y,318,y);D.j(318,y,'','t',k+'b');D.t(282,y+12,nm,5.4)});
  D.sub(236,178,92,150,'','');D.t(282,322,'5 BAND RESISTORS',5);
  [[150,'R7'],[10000,'R8'],[68000,'R9'],[1e6,'R10']].forEach(([v,nm],i)=>{const y=192+i*30,k=nm.toLowerCase();D.j(246,y,'','t',k+'a');D.w(246,y,258,y);D.R(258,y,306,y,tol(v,0.01),'',{nom:v,five:true,lab:''});D.w(306,y,318,y);D.j(318,y,'','t',k+'b');D.t(282,y+12,nm,5.4)});
},`<b>Direnç renk kodu.</b> 4 bantlı dirençte 1. ve 2. bant rakam, 3. bant çarpan, 4. bant toleranstır. 5 bantlıda ilk üç bant rakamdır.
Örnek: sarı-mor-kırmızı-altın = 47 × 100 = 4,7 kΩ ±%5. Multimetreyi <b>Ω</b> konumuna alıp direncin iki soketine bağlayın (devre enerjisiz olmalı).`);

/* =========================== MODÜL 2 =========================== */
def(2,'Ohm ve Kirşof kanunları',[
  {t:'OHM kanununun incelenmesi',pre:PR({psu:5,w:[[PSU,'dc2:in1p','red'],[PSU0,'dc2:in1n','black'],['dc2:j1a','dc2:j1b','yellow']],dmm:['ADC','dc2:ma1p','dc2:ma1n'],
    n:'Ayarlı kaynak 5 V, R1 = 100 Ω (J1 köprülü). Multimetre ampermetre olarak mA soketlerine seri bağlı: I = V/R = 50 mA. COARSE düğmesiyle gerilimi değiştirip akımı not edin; J1 yerine J2 ile R2\'yi deneyin. Gerilimi görmek için soketlerin üzerine gelin.'})},
  {t:'Kirşof gerilim kanunu',pre:PR({psu:6,w:[[PSU,'dc2:in2p','red'],[PSU0,'dc2:in2n','black']],dmm:['VDC','dc2:vm1p','dc2:vm1n'],
    n:'Seri devre: R1 200 Ω + R2 100 Ω + R3 300 Ω, E = 6 V. Voltmetre VM1\'de. Probları VM2 ve VM3\'e taşıyın: V1 + V2 + V3 = E olmalı (2 V + 1 V + 3 V).'})},
  {t:'Kirşof akım kanunu',pre:PR({psu:6,w:[[PSU,'dc2:in3p','red'],[PSU0,'dc2:in3n','black'],['dc2:ma3p','dc2:ma3n','yellow'],['dc2:ma32p','dc2:ma32n','yellow']],dmm:['ADC','dc2:ma31p','dc2:ma31n'],
    n:'Paralel kollar: R1 100 Ω (I1 = 60 mA), R2 200 Ω (I2 = 30 mA). Ampermetre I1 kolunda. Kabloları ve ampermetreyi yer değiştirerek I, I1, I2\'yi ölçün: I = I1 + I2.'})}],
D=>{
  D.sub(8,24,326,102,'EXPERIMENT 1','INVESTIGATION OF OHM\'S LAW');
  D.j(22,42,'+','l','in1p');D.j(22,106,'−','l','in1n');D.lab(30,76,'0-6V','start');
  D.w(22,42,120,42);D.j(120,42,'mA','t','ma1p');D.lab(120,54,'+');D.j(150,42,'','t','ma1n');D.lab(150,54,'−');D.w(150,42,290,42);
  D.w(70,42,70,60);D.j(70,60,'+','r','vmp');D.j(70,90,'−','r','vmn');D.w(70,90,70,106);D.lab(82,78,'VM','start');
  D.w(22,106,290,106);
  [['j1',210,100,'R1'],['j2',265,220,'R2']].forEach(([k,x,v,nm])=>{D.w(x,42,x,52);D.j(x,52,k.toUpperCase(),'r',k+'a');D.j(x,64,'','r',k+'b');D.w(x,64,x,70);D.R(x,70,x,100,v,nm);D.w(x,100,x,106)});
  D.raw('<path d="M306 52L326 88H286Z" fill="none" stroke="#1c1d1f" stroke-width="1"/><line x1="292" y1="76" x2="320" y2="76" stroke="#1c1d1f" stroke-width=".8"/><line x1="306" y1="76" x2="306" y2="88" stroke="#1c1d1f" stroke-width=".8"/>');
  D.t(306,72,'E',6);D.t(298,85,'I',6);D.t(314,85,'R',6);
  D.sub(8,128,326,102,'EXPERIMENT 2','INVESTIGATION OF KIRCHHOFF VOLTAGE LAW');
  D.j(140,146,'−','b','in2n');D.j(190,146,'+','b','in2p');D.lab(165,140,'0-6V');
  D.w(140,146,24,146,24,180,40,180);D.w(190,146,318,146,318,180,290,180);
  D.R(40,180,90,180,200,'R1');D.w(90,180,130,180);D.R(130,180,180,180,100,'R2');D.w(180,180,240,180);D.R(240,180,290,180,300,'R3');
  [[40,90,'1'],[130,180,'2'],[240,290,'3']].forEach(([a,b,k])=>{D.w(a,180,a,206);D.j(a,206,'−','b','vm'+k+'n');D.w(b,180,b,206);D.j(b,206,'+','b','vm'+k+'p');D.lab((a+b)/2,206,'VM'+k)});
  D.sub(8,232,326,110,'EXPERIMENT 3','INVESTIGATION OF KIRCHHOFF CURRENT LAW');
  D.j(22,250,'+','l','in3p');D.j(22,322,'−','l','in3n');D.lab(30,288,'0-6V','start');
  D.w(22,250,70,250);D.j(70,250,'mA','t','ma3p');D.j(100,250,'','t','ma3n');D.lab(70,262,'+');D.lab(100,262,'−');D.w(100,250,170,250);D.dot(140,250);
  D.j(170,250,'mA1','t','ma31p');D.j(200,250,'','t','ma31n');D.lab(170,262,'+');D.lab(200,262,'−');D.w(200,250,220,250);D.R(220,250,280,250,100,'R1');D.w(280,250,310,250,310,322);
  D.w(140,250,140,292,170,292);D.j(170,292,'mA2','t','ma32p');D.j(200,292,'','t','ma32n');D.lab(170,304,'+');D.lab(200,304,'−');D.w(200,292,220,292);D.R(220,292,280,292,200,'R2');D.w(280,292,310,292);D.dot(310,292);
  D.w(22,322,310,322);
},`<b>Ohm kanunu:</b> I = V / R. <b>Kirşof gerilim kanunu:</b> kapalı bir göz boyunca gerilimlerin toplamı sıfırdır (V1+V2+V3 = E).
<b>Kirşof akım kanunu:</b> bir düğüme giren akımların toplamı çıkanlara eşittir (I = I1 + I2).<br>Ampermetre devreye <b>seri</b> bağlanır: multimetreyi “A ⎓” konumuna alıp + ucu mA(+), − ucu mA(−) soketine takın. Ölçmediğiniz mA soket çiftlerini kabloyla köprüleyin.`);

/* =========================== MODÜL 3 =========================== */
const m3=(k,a,b,mode,n)=>({t:k,pre:PR({w:a,dmm:[mode,b[0],b[1]],n})});
def(3,'Seri / paralel R, L, C',[
  m3('Seri bağlı dirençler',[['dc3:r1b','dc3:r2a','yellow']],['dc3:r1a','dc3:r2b'],'OHM','R1 (1 kΩ) ile R2 (2,2 kΩ) seri: Rt = R1 + R2 = 3,2 kΩ.'),
  m3('Paralel bağlı dirençler',[['dc3:r1a','dc3:r2a','yellow'],['dc3:r1b','dc3:r2b','green']],['dc3:r1a','dc3:r1b'],'OHM','R1 ∥ R2 = R1·R2/(R1+R2) = 688 Ω.'),
  m3('Karışık bağlı dirençler',[['dc3:r1b','dc3:r3a','yellow'],['dc3:r3a','dc3:r4a','green'],['dc3:r3b','dc3:r4b','blue']],['dc3:r1a','dc3:r3b'],'OHM','R1 + (R3 ∥ R4) = 1 kΩ + 500 Ω = 1,5 kΩ.'),
  m3('Seri bağlı bobinler',[['dc3:l1b','dc3:l2a','yellow']],['dc3:l1a','dc3:l2b'],'IND','L1 (10 mH) + L2 (100 mH) = 110 mH. Multimetre LCR (L) konumunda.'),
  m3('Paralel bağlı bobinler',[['dc3:l2a','dc3:l4a','yellow'],['dc3:l2b','dc3:l4b','green']],['dc3:l2a','dc3:l2b'],'IND','L2 ∥ L4 = 100 mH ∥ 100 mH = 50 mH.'),
  m3('Karışık bağlı bobinler',[['dc3:l1b','dc3:l2a','yellow'],['dc3:l2a','dc3:l4a','green'],['dc3:l2b','dc3:l4b','blue']],['dc3:l1a','dc3:l2b'],'IND','L1 + (L2 ∥ L4) = 10 + 50 = 60 mH.'),
  m3('Seri bağlı kondansatörler',[['dc3:c2b','dc3:c5a','yellow']],['dc3:c2a','dc3:c5b'],'CAP','C2 ve C5 (100 nF) seri: Ct = C/2 = 50 nF — seri kondansatörlerde toplam, en küçükten de küçüktür.'),
  m3('Paralel bağlı kondansatörler',[['dc3:c1a','dc3:c3a','yellow'],['dc3:c1b','dc3:c3b','green']],['dc3:c1a','dc3:c1b'],'CAP','C1 ∥ C3 = 10 nF + 150 nF = 160 nF.'),
  m3('Karışık bağlı kondansatörler',[['dc3:c1b','dc3:c2a','yellow'],['dc3:c2a','dc3:c3a','green'],['dc3:c2b','dc3:c3b','blue']],['dc3:c1a','dc3:c2b'],'CAP','C1 seri (C2 ∥ C3): 10 nF ile 250 nF seri ≈ 9,6 nF.')],
D=>{
  D.sub(8,24,326,104,'EXPERIMENT 1/2/3','CONNECTED RESISTORS');
  const hr=(k,x1,x2,y,v,nm)=>{D.j(x1,y,'','t',k+'a');D.w(x1,y,x1+18,y);D.R(x1+18,y,x2-18,y,tol(v,0.05),nm,{nom:v});D.w(x2-18,y,x2,y);D.j(x2,y,'','t',k+'b')};
  const vr=(k,x,y1,y2,v,nm)=>{D.j(x,y1,'','l',k+'a');D.w(x,y1,x,y1+12);D.R(x,y1+12,x,y2-12,tol(v,0.05),nm,{nom:v});D.w(x,y2-12,x,y2);D.j(x,y2,'','l',k+'b')};
  hr('r1',26,116,48,1000,'R1');hr('r2',26,116,98,2200,'R2');vr('r3',150,40,108,1000,'R3');vr('r4',196,40,108,1000,'R4');hr('r5',228,318,48,4700,'R5');hr('r6',228,318,98,10000,'R6');
  D.sub(8,130,326,104,'EXPERIMENT 4/5/6','CONNECTED INDUCTANCES');
  const hl=(k,x1,x2,y,v,nm)=>{D.j(x1,y,'','t',k+'a');D.w(x1,y,x1+30,y);D.L(x1+30,y,x2-30,y,v,nm,{rdc:v>0.05?60:12});D.w(x2-30,y,x2,y);D.j(x2,y,'','t',k+'b')};
  hl('l1',30,140,154,0.01,'L1');hl('l2',190,310,154,0.1,'L2');hl('l3',30,140,204,0.01,'L3');hl('l4',190,310,204,0.1,'L4');
  D.sub(8,236,326,106,'EXPERIMENT 7/8/9','CONNECTED CAPACITANCES');
  const hc=(k,x1,y,v,nm)=>{D.j(x1,y,'','t',k+'a');D.w(x1,y,x1+28,y);D.C(x1+28,y,x1+52,y,v,nm,{pol:false});D.w(x1+52,y,x1+80,y);D.j(x1+80,y,'','t',k+'b')};
  hc('c1',22,262,10e-9,'C1');hc('c2',124,262,100e-9,'C2');hc('c3',226,262,150e-9,'C3');hc('c4',22,310,10e-9,'C4');hc('c5',124,310,100e-9,'C5');hc('c6',226,310,150e-9,'C6');
},`<b>Seri:</b> Rt = R1+R2, Lt = L1+L2, 1/Ct = 1/C1+1/C2. <b>Paralel:</b> 1/Rt = 1/R1+1/R2, 1/Lt = 1/L1+1/L2, Ct = C1+C2.<br>
Elemanları kablolarla birleştirin, multimetreyi <b>Ω</b>, <b>L</b> veya <b>C</b> konumunda devrenin iki ucuna bağlayın.`);

/* =========================== MODÜL 4 =========================== */
def(4,'Süperpozisyon, Thevenin, Norton',[
  {t:'Süperpozisyon teoremi',pre:PR({w:[[P12,'dc4:e1p','red'],[Z12,'dc4:e1n','black'],['ttl.p51','dc4:e2p','orange'],['ttl.g1','dc4:e2n','black']],dmm:['ADC','dc4:map','dc4:man'],
    n:'E1 = 12 V, E2 = 5 V birlikte: I(R3) ve gösterge gerilimini not edin. Sonra E2 kablolarını çıkarıp E2 soketlerini kabloyla kısa devre edin (yalnız E1), ardından tersini yapın (yalnız E2). İki ayrı sonucun toplamı birlikte ölçülen değere eşittir.'})},
  {t:'Thevenin teoremi',pre:PR({psu:10,w:[[PSU,'dc4:tep','red'],[PSU0,'dc4:ten','black'],['dc4:tmap','dc4:tman','yellow']],dmm:['VDC','dc4:ta','dc4:tb'],
    n:'E = 10 V. RL bağlıyken A-B gerilimi ölçülüyor. ETH için sarı köprüyü (RL) çıkarın: ETH = 10·50/150 = 3,33 V. RTH = R1∥R2 = 33,3 Ω. IL = ETH/(RTH+RL) = 55 mA — ampermetreyle doğrulayın.'})},
  {t:'Norton teoremi',pre:PR({psu:10,w:[[PSU,'dc4:nep','red'],[PSU0,'dc4:nen','black']],dmm:['ADC','dc4:na','dc4:nb'],
    n:'Ampermetre A-B arasına bağlı (kısa devre akımı): IN = E/R1 = 100 mA. RN = R1∥R2 = 33,3 Ω. RL bağlanınca IL = IN·RN/(RN+RL) = 55 mA.'})}],
D=>{
  D.sub(8,24,326,160,'EXPERIMENT 1','EXAMINATION OF SUPERPOSITION THEOREM');
  const cell=(x,y,lab)=>{D.ln(x-3,y-7,x-3,y+7,1.3);D.ln(x+3,y-4,x+3,y+4,2.2);D.t(x,y-10,lab,5.6)};
  D.j(60,44,'−','b','e1n');cell(85,44,'E1');D.j(110,44,'+','b','e1p');D.j(60,140,'−','b','e2n');cell(85,140,'E2');D.j(110,140,'+','b','e2p');
  D.w(60,44,30,44,30,166,240,166);D.w(60,140,30,140);D.dot(30,140);
  D.w(110,44,150,44,150,50);D.R(150,50,150,84,2200,'R1');D.w(150,84,150,96);D.R(150,96,150,130,1000,'R2');D.w(150,130,150,140,110,140);
  D.w(150,90,185,90);D.dot(150,90);D.j(185,90,'mA','t','map');D.j(215,90,'','t','man');D.lab(185,102,'+');D.lab(215,102,'−');D.w(215,90,240,90,240,96);D.R(240,96,240,150,1000,'R3');D.w(240,150,240,166);
  D.VMETER(262,96,[240,90],[240,166]);D.w(240,90,262,90);D.j(200,166,'0','b','gnd');
  const tn=(ox,p,nm)=>{
    D.j(ox+16,206,'+','r',p+'ep');D.j(ox+16,318,'−','r',p+'en');D.t(ox+24,262,'E',6,'start');
    D.w(ox+16,206,ox+50,206);D.R(ox+50,206,ox+50,250,100,'R1');D.R(ox+50,250,ox+50,318,50,'R2');D.w(ox+50,250,ox+100,250);
    D.j(ox+75,250,'A','t',p+'a');D.j(ox+100,250,nm,'t',p+'map');D.j(ox+125,250,'','t',p+'man');D.w(ox+125,250,ox+142,250);D.R(ox+142,250,ox+142,318,27,'RL',{lp:'l'});
    D.w(ox+16,318,ox+142,318);D.j(ox+75,318,'B','b',p+'b');D.t(ox+84,288,nm==='IN'?'RN':'ETH',5,'start');D.t(ox+84,295,nm==='IN'?'':'RTH',5,'start')};
  D.sub(8,186,162,156,'EXPERIMENT 2','THEVENIN THEOREM');tn(8,'t','mA');
  D.sub(172,186,162,156,'EXPERIMENT 3','NORTON THEOREM');tn(172,'n','IN');
},`<b>Süperpozisyon:</b> doğrusal devrede bir koldaki akım, her kaynağın tek başına (diğerleri kısa devre) oluşturduğu akımların toplamıdır.
<b>Thevenin:</b> devre, ETH kaynağı + RTH seri direnci olarak görülür. <b>Norton:</b> IN akım kaynağı + RN paralel direnci. RTH = RN = kaynaklar kısa devre edilince A-B'den görülen direnç.`);

/* =========================== MODÜL 5 =========================== */
def(5,'Diyot ve doğrultmaçlar',[
  {t:'Diyotun incelenmesi',pre:PR({w:[[P12,'dc5:d0p','red'],[Z12,'dc5:d0n','black'],[P12,'dc5:d1p','red'],[Z12,'dc5:d1n','black']],
    n:'Soldaki diyot doğru yönde: lamba yanar. Sağdaki ters yönde: lamba yanmaz. Diyot akımı yalnız anottan katoda geçirir.'})},
  {t:'Diyot karakteristiği',pre:PR({psu:5,w:[[PSU,'dc5:fip','red'],[PSU0,'dc5:fin','black']],dmm:['ADC','dc5:fmap','dc5:fman'],
    n:'Doğru polarma. Ayarlı kaynağı 0…12 V arasında değiştirip ID akımını ve diyot gerilimini (VM soketlerine fareyle gelerek ya da multimetreyi taşıyarak) tabloya yazın: ~0,6 V\'tan sonra akım hızla artar.'})},
  {t:'Yarım dalga doğrultmaç',pre:PR({w:[[ACA,'dc5:hwa','red'],[AC0,'dc5:hw0','black'],['dc5:hj2a','dc5:hj2b','yellow'],['dc5:hj4a','dc5:hj4b','yellow']],sc:'dc5:hsc1',sc2:'dc5:hsc2',T:0.005,V:10,V2:10,dmm:['VDC','dc5:hsc2'],
    n:'AC 12 V (tepe ≈ 17 V) girişi CH1\'de, RL1 üzerindeki çıkış CH2\'de: yalnız pozitif yarım dalgalar geçer. Ortalama (DC) çıkış ≈ Vtepe/π.'})},
  {t:'Tam dalga doğrultmaç (orta uçlu)',pre:PR({w:[[ACA,'dc5:fwa','red'],[AC0,'dc5:fw0','black'],[ACB,'dc5:fwb','blue']],sc:'dc5:fsc1',sc2:'dc5:fsc2',T:0.005,V:10,V2:10,dmm:['VDC','dc5:fsc2'],
    n:'Orta uçlu trafo: D1 ve D2 sırayla iletir, çıkış frekansı 100 Hz. DC çıkış ≈ 2·Vtepe/π.'})},
  {t:'Köprü tipi tam dalga doğrultmaç',pre:PR({w:[[ACA,'dc5:bra','red'],[AC0,'dc5:brb','black']],sc:'dc5:bsc1',sc2:'dc5:bsc2',T:0.005,V:10,V2:10,dmm:['VDC','dc5:bsc2','dc5:bsc2n'],
    n:'Köprü çıkışı topraktan yalıtılmıştır: multimetre RL\'nin iki ucunda (tam dalga, iki diyot düşümü kadar eksik). CH2 toprağa göre + ucunu gösterir.'})},
  {t:'Kondansatörlü filtre',pre:PR({w:[[ACA,'dc5:hwa','red'],[AC0,'dc5:hw0','black'],['dc5:hj1a','dc5:hj1b','yellow'],['dc5:hj2a','dc5:hj2b','yellow'],['dc5:hj4a','dc5:hj4b','yellow']],sc:'dc5:hsc1',sc2:'dc5:hsc2',T:0.005,V:10,V2:5,dmm:['VDC','dc5:hsc2'],
    n:'J1 ile C1 (470 µF) bağlı: kondansatör tepe değerine dolar, çıkış neredeyse düz DC olur. Osiloskobu AC kuplaja alıp dalgalanmaya (ripple) bakın.'})},
  {t:'Yük akımının filtreye etkisi',pre:PR({w:[[ACA,'dc5:hwa','red'],[AC0,'dc5:hw0','black'],['dc5:hj1a','dc5:hj1b','yellow'],['dc5:hj2a','dc5:hj2b','yellow'],['dc5:hj4a','dc5:hj4b','yellow'],['dc5:hj5a','dc5:hj5b','orange']],sc:'dc5:hsc2',T:0.005,V:2,dmm:['VDC','dc5:hsc2'],after(){TZ.scopeSet({ac:true})},
    n:'RL2 (330 Ω) da bağlanınca yük akımı artar: dalgalanma büyür, DC çıkış düşer. J5 köprüsünü çıkarıp takarak karşılaştırın (osiloskop AC kuplajda).'})},
  {t:'π tipi filtre',pre:PR({w:[[ACA,'dc5:hwa','red'],[AC0,'dc5:hw0','black'],['dc5:hj1a','dc5:hj1b','yellow'],['dc5:hj3a','dc5:hj3b','yellow'],['dc5:hj4a','dc5:hj4b','yellow'],['dc5:hj5a','dc5:hj5b','orange']],sc:'dc5:hsc2',T:0.005,V:0.5,dmm:['VDC','dc5:hsc2'],after(){TZ.scopeSet({ac:true})},
    n:'C1 – L (200 mH) – C2: π filtre. J2 köprüsü yok, akım bobinden geçer. Aynı yükte dalgalanma kondansatörlü filtreye göre çok daha küçük.'})}],
D=>{
  D.sub(8,24,130,98,'EXPERIMENT 1','DIODES');
  [0,1].forEach(k=>{const ox=8+k*62;D.j(ox+16,38,'+12V','r','d'+k+'p');D.j(ox+16,108,'0','r','d'+k+'n');
    D.w(ox+16,38,ox+40,38,ox+40,46);if(k)D.D(ox+40,64,ox+40,46,'D',{lp:'r'});else D.D(ox+40,46,ox+40,64,'D',{lp:'r'});
    D.w(ox+40,64,ox+40,70);D.LAMP(ox+40,70,ox+40,94,'',{r:240,pw:0.6});D.w(ox+40,94,ox+40,108,ox+16,108);D.t(ox+52,84,'LAMP',4.8,'start')});
  D.sub(140,24,194,98,'EXPERIMENT 2','DIODE CHARACTERISTICS');
  [['f',140,0],['r',237,1]].forEach(([p,ox,rev])=>{D.j(ox+12,38,'+','r',p+'ip');D.j(ox+12,104,'−','r',p+'in');D.t(ox+16,74,'0-12V',4.8,'start');
    D.w(ox+12,38,ox+25,38);D.R(ox+25,38,ox+60,38,1000,'R');D.w(ox+60,38,ox+82,38);D.j(ox+82,38,'+','l',p+'map');D.j(ox+82,56,'−','l',p+'man');D.t(ox+88,50,rev?'µA':'mA',5,'start');
    D.w(ox+82,56,ox+82,64);if(rev)D.D(ox+82,90,ox+82,64,'D');else D.D(ox+82,64,ox+82,90,'D');D.w(ox+82,90,ox+82,104,ox+12,104);
    D.w(ox+57,64,ox+82,64);D.j(ox+57,64,'+','l',p+'vp');D.j(ox+57,92,'−','l',p+'vn');D.w(ox+57,92,ox+57,104);D.t(ox+46,80,'VM',5,'middle')});
  D.sub(8,124,326,108,'EXPERIMENT 3/6/7/8','HALF WAVE RECTIFIER - FILTERS');
  D.j(22,140,'AC','r','hwa');D.t(28,152,'12V',4.8,'start');D.j(22,214,'0','r','hw0');
  D.w(22,140,46,140);D.D(46,140,70,140,'D');D.w(70,140,120,140);D.w(34,140,34,174);D.j(34,174,'SCOPE1','r','hsc1');
  const jp=(k,x,nm)=>{D.w(x,140,x,148);D.j(x,148,'J'+k,'r','hj'+k+'a');D.j(x,160,'','r','hj'+k+'b');D.w(x,160,x,168)};
  jp(1,92);D.C(92,168,92,206,470e-6,'C1');D.w(92,206,92,214);
  D.w(120,140,130,140);D.L(130,140,170,140,0.2,'L',{core:true,rdc:20,lp:'b'});D.w(170,140,190,140);
  D.w(124,140,124,128,142,128);D.j(142,128,'','r','hj2a');D.j(162,128,'','l','hj2b');D.w(162,128,180,128,180,140);D.t(152,124,'J2',5);
  D.w(190,140,318,140);jp(3,210);D.C(210,168,210,206,470e-6,'C2');D.w(210,206,210,214);
  jp(4,250);D.R(250,168,250,206,1000,'RL1');D.w(250,206,250,214);jp(5,286);D.R(286,168,286,206,330,'RL2');D.w(286,206,286,214);
  D.w(318,140,318,160);D.j(318,160,'SCOPE2','l','hsc2');D.j(318,214,'','l','hsc2n');D.w(22,214,318,214);
  D.sub(8,234,162,108,'EXPERIMENT 4','FULL WAVE RECTIFIER');
  D.j(22,252,'AC','r','fwa');D.j(22,288,'0','r','fw0');D.j(22,324,'AC','r','fwb');
  D.w(22,252,50,252);D.D(50,252,80,252,'D1');D.w(80,252,132,252);D.w(22,324,50,324);D.D(50,324,80,324,'D2',{lp:'b'});D.w(80,324,132,324,132,252);
  D.w(22,288,100,288);D.R(100,288,132,288,1000,'RL',{bl:16});D.w(36,252,36,268);D.j(36,268,'SCOPE1','r','fsc1');D.w(132,270,152,270);D.j(152,270,'SCOPE2','b','fsc2');
  D.sub(172,234,162,108,'EXPERIMENT 5','BRIDGE RECTIFIER');
  D.j(186,256,'AC','r','bra');D.j(186,322,'AC','r','brb');
  D.D(224,290,250,264,'D1',{lab:''});D.D(276,290,250,264,'D2',{lab:''});D.D(250,316,224,290,'D3',{lab:''});D.D(250,316,276,290,'D4',{lab:''});
  D.t(232,272,'D1',4.6,'end');D.t(268,272,'D2',4.6,'start');D.t(232,312,'D3',4.6,'end');D.t(268,312,'D4',4.6,'start');
  D.w(186,256,206,256,206,290,224,290);D.w(186,322,200,322,200,330,290,330,290,290,276,290);
  D.w(250,264,250,250,318,250,318,256);D.R(318,256,318,300,1000,'RL',{lp:'l'});D.w(318,300,318,316,250,316);
  D.j(206,274,'','r','bsc1');D.t(202,274,'S1',4.4,'end');D.j(290,250,'SCOPE2','t','bsc2');D.j(300,316,'−','b','bsc2n');
},`<b>Diyot</b> tek yönde iletir (≈0,6 V eşik). <b>Yarım dalga</b> doğrultmaç VDC ≈ Vm/π, <b>tam dalga</b> VDC ≈ 2Vm/π (Vm = 17 V tepe).
<b>Filtre:</b> kondansatör tepe değerine dolar; dalgalanma ≈ I/(f·C). π filtrede bobin dalgalanmayı ayrıca bastırır. J soketleri kabloyla köprülenerek devre seçilir.`);

/* =========================== MODÜL 6 =========================== */
def(6,'Gerilim çoklayıcılar',[
  {t:'Gerilim ikileyici',pre:PR({w:[[ACA,'dc6:d2a','red'],[AC0,'dc6:d20','black']],dmm:['VDC','dc6:d2p','dc6:d2n'],sc:'dc6:d2a',sc2:'dc6:d2p',T:0.01,V:10,V2:10,
    n:'C1 tepe gerilime dolar, D2 kenetleyici, D1–C2 tepe dedektörü: çıkış ≈ 2·Vm ≈ 33 V. Kondansatörlerin dolmasını izleyin.'})},
  {t:'Gerilim üçleyici',pre:PR({w:[[ACA,'dc6:t3a','red'],[AC0,'dc6:t30','black']],dmm:['VDC','dc6:t3p','dc6:t3n'],T:0.01,
    n:'Çıkış (VM4) C1 + C3 uçlarından alınır: ≈ 3·Vm ≈ 49 V. VM2 = C2 gerilimi ≈ 2·Vm.'})},
  {t:'Gerilim dörtleyici',pre:PR({w:[[ACA,'dc6:q4a','red'],[AC0,'dc6:q40','black']],dmm:['VDC','dc6:q4p','dc6:q4n'],T:0.01,
    n:'C2 + C4 uçlarından çıkış ≈ 4·Vm ≈ 66 V. Yük direnci (47 kΩ) çıkışı biraz düşürür; dolma birkaç saniye sürer.'})}],
D=>{
  D.sub(8,24,326,100,'EXPERIMENT 1','VOLTAGE DOUBLER');D.t(320,34,'C1=C2=100µF/50V',4.8,'end');
  D.j(22,40,'AC','r','d2a');D.j(22,104,'0','r','d20');D.w(22,40,50,40);D.C(80,40,50,40,100e-6,'C1');D.w(80,40,120,40);
  D.D(110,104,110,40,'D1',{lp:'l'});D.D(120,40,170,40,'D2');D.w(170,40,300,40);D.C(200,40,200,104,100e-6,'C2');D.R(250,40,250,104,47e3,'RL');
  D.w(300,40,300,56);D.j(300,56,'+','l','d2p');D.j(300,96,'−','l','d2n');D.w(300,96,300,104);D.t(312,78,'DC OUT',4.8,'start');D.w(22,104,300,104);
  D.sub(8,126,326,106,'EXPERIMENT 2','VOLTAGE TRIPLER');D.t(320,226,'C1=C2=C3=100µF/50V',4.8,'end');
  D.j(22,150,'AC','r','t3a');D.j(22,222,'0','r','t30');D.w(22,150,40,150);D.C(70,150,40,150,100e-6,'C1',{lp:'b'});D.w(70,150,130,150);
  D.D(85,222,85,150,'D1',{lp:'l'});D.D(100,150,130,190,'D2',{lp:'r'});D.C(130,190,130,222,100e-6,'C2',{lp:'l'});D.w(130,190,170,190);
  D.C(170,150,130,150,100e-6,'C3');D.w(170,150,240,150);D.D(170,190,200,150,'D3');D.w(22,222,200,222);
  D.w(150,190,150,200);D.j(150,200,'+','r','t3c2p');D.j(150,214,'−','r','t3c2n');D.w(150,214,150,222);D.t(164,208,'VM2',4.8,'start');
  D.w(30,150,30,134,280,134);D.R(280,134,280,170,47e3,'RL',{lp:'l'});D.w(240,150,260,150,260,170,280,170);
  D.w(280,134,305,134);D.j(305,134,'−','r','t3n');D.w(280,170,305,170);D.j(305,170,'+','r','t3p');D.t(300,154,'VM4',4.8,'start');
  D.sub(8,234,326,108,'EXPERIMENT 3','VOLTAGE QUADRUPLER');D.t(320,244,'C1…C4=100µF/50V',4.8,'end');
  D.j(22,256,'AC','r','q4a');D.j(22,330,'0','r','q40');D.w(22,256,40,256);D.C(70,256,40,256,100e-6,'C1',{lp:'b'});D.w(70,256,140,256);
  D.D(85,330,85,256,'D1',{lp:'l'});D.D(100,256,130,296,'D2',{lp:'r'});D.C(130,296,130,330,100e-6,'C2',{lp:'l'});D.w(130,296,190,296);
  D.C(180,256,140,256,100e-6,'C3');D.w(180,256,240,256);D.D(170,296,200,256,'D3');D.D(230,256,260,296,'D4');
  D.C(220,296,190,296,100e-6,'C4',{lp:'b'});D.w(220,296,300,296);D.R(285,296,285,330,47e3,'RL',{lp:'l'});
  D.w(300,296,310,296);D.j(310,296,'+','l','q4p');D.j(310,330,'−','l','q4n');D.t(318,316,'VM5',4.8,'start');D.w(22,330,310,330);
},`<b>Gerilim çoklayıcılar</b> kondansatör–diyot merdiveniyle AC tepe gerilimini (Vm ≈ 17 V) katlar: ikileyici 2Vm, üçleyici 3Vm, dörtleyici 4Vm.
Akım çekildikçe çıkış düşer; bu devreler küçük akımlı yüksek gerilim için kullanılır.`);

/* =========================== MODÜL 7 =========================== */
const m7w=(p,b)=>[[PSU,`dc7:${p}bbp`,'red'],[PSU0,`dc7:${p}bbn`,'black'],[P12,`dc7:${p}ccp`,'orange'],[Z12,`dc7:${p}ccn`,'black'],...(b.includes('b')?[[`dc7:${p}ibp`,`dc7:${p}ibn`,'yellow']]:[]),...(b.includes('c')?[[`dc7:${p}icp`,`dc7:${p}icn`,'yellow']]:[])];
def(7,'Transistör bölge karakteristikleri',[
  {t:'I. bölge (IC – VCE, IB sabit)',pre:PR({psu:5,w:m7w('a','b'),dmm:['ADC','dc7:aicp','dc7:aicn'],k:{m7p1a:.2,m7p2a:.6},
    n:'Çıkış karakteristiği: P1 sabit (IB sabit), P2 ile VCE\'yi değiştirin; IC\'yi okuyun. Soldaki grafik çalışma noktalarını çizer: VCE ≈ 0,3 V\'tan sonra IC neredeyse sabit kalır.'})},
  {t:'II. bölge (IC – IB, VCE sabit)',pre:PR({psu:5,w:m7w('a','b'),dmm:['ADC','dc7:aicp','dc7:aicn'],k:{m7p1a:.2,m7p2a:.8},
    n:'Akım kazancı: P2 sabit, P1 ile IB\'yi değiştirin (IB soketlerine ampermetreyi taşıyarak ölçün). β = IC / IB ≈ 250.'})},
  {t:'III. bölge (IB – VBE, VCE sabit)',pre:PR({psu:5,w:m7w('b','c'),dmm:['ADC','dc7:bibp','dc7:bibn'],k:{m7p1b:.3,m7p2b:.8},
    n:'Giriş karakteristiği: P1 ile VBE\'yi artırın, IB\'yi okuyun (B soketine fareyle gelince VBE görünür). ~0,6 V\'a kadar IB çok küçüktür, sonra üstel artar.'})},
  {t:'IV. bölge (VBE – VCE, IB sabit)',pre:PR({psu:5,w:m7w('b','bc'),dmm:['VDC','dc7:bb'],k:{m7p1b:.35,m7p2b:.5},
    n:'Geri besleme karakteristiği: IB sabitken P2 ile VCE\'yi değiştirin; VBE çok az değişir (Early etkisi).'})}],
D=>{
  const plot=(oy,q,mode)=>{D.sub(8,oy,160,158,'','');D.t(88,oy+11,'REGION CHARACTERISTICS',5.4);D.t(88,oy+18,'OF TRANSISTOR',5.4);
    const W=146,H=118,g=cvIn(D.el,15,oy+24,W,H),pts=[];let last='';
    const draw=()=>{g.clearRect(0,0,W,H);g.fillStyle='#fff';g.fillRect(0,0,W,H);g.strokeStyle='#1c1d1f';g.lineWidth=.8;g.beginPath();g.moveTo(14,4);g.lineTo(14,H-12);g.lineTo(W-4,H-12);g.stroke();
      g.fillStyle='#1c1d1f';g.font='bold 6px Arial';
      const xm=mode?1:12;let ym=mode?50e-6:5e-3;for(const p of pts)ym=Math.max(ym,p[1]*1.15);
      g.fillText(mode?'IB':'IC',2,10);g.fillText(mode?'VBE':'VCE',W-22,H-3);g.fillText(mode?(ym*1e6).toFixed(0)+'µA':(ym*1e3).toFixed(1)+'mA',16,10);g.fillText(xm+'V',W-14,H-14);
      g.fillStyle='#d32f2f';for(const[x,y]of pts){const px=14+(W-18)*clamp(x/xm,0,1),py=H-12-(H-16)*clamp(y/ym,0,1);g.fillRect(px-1.2,py-1.2,2.4,2.4)}
      if(!pts.length){g.fillStyle='#888';g.fillText('düğmeleri çevirin:',30,H/2-4);g.fillText('ölçülen noktalar çizilir',30,H/2+4)}};
    draw();
    return()=>{if(!q.el||frameN%6)return;const vb=rdV(q.ji[1]),ve=rdV(q.ji[2]),vc=rdV(q.ji[0]);if(vb!==vb||ve!==ve||vc!==vc)return;
      const x=mode?vb-ve:vc-ve,y=mode?q.el.ib:q.el.ic;if(!(y>=0))return;const k=x.toFixed(2)+'|'+(y*1e6).toFixed(mode?1:0);if(k===last)return;last=k;pts.push([x,y]);if(pts.length>500)pts.shift();draw()}};
  const circ=(oy,p,exp,ttl)=>{D.sub(170,oy,164,158,exp,ttl);const R=oy+124;
    D.POT(185,oy+66,185,oy+114,1e4,'',`m7p1${p}`,{side:-1,kx:222,ky:oy+108,kr:10});D.t(240,oy+111,'P1 10K',5,'start');
    D.w(185,oy+114,185,R);D.w(185,oy+66,178,oy+66,178,oy+138);D.j(178,oy+138,'+','l',p+'bbp');D.j(205,oy+138,'−','r',p+'bbn');D.w(205,R,205,oy+138);D.t(192,oy+148,'VBB ADJ',4.6);
    D.w(196,oy+90,204,oy+90);D.R(204,oy+90,232,oy+90,47e3,'RB',{bl:14,lp:'b'});D.w(232,oy+90,240,oy+90);D.j(240,oy+90,'+','r',p+'ibp');D.j(240,oy+70,'−','r',p+'ibn');D.t(234,oy+82,'IB',5,'end');
    D.w(240,oy+70,240,oy+56,258,oy+56);D.j(249,oy+56,'B','t',p+'b');
    const q=D.Q(272,oy+56,S.P.bc238,'TR BC238',{lp:[262,oy+80]});const qs=D.M.an[D.M.an.length-1];
    D.w(278,oy+70,278,R);D.w(278,oy+42,278,oy+30,296,oy+30);D.j(296,oy+30,'−','b',p+'icn');D.j(321,oy+30,'+','b',p+'icp');D.t(308,oy+20,'IC mA',5);
    D.POT(310,oy+66,310,oy+114,1e3,'',`m7p2${p}`,{side:-1,kx:294,ky:oy+102,kr:10});D.t(300,oy+120,'P2 1K',5,'end');
    D.w(310,oy+114,310,R);D.w(310,oy+66,330,oy+66,330,oy+138,321,oy+138);D.w(321,oy+90,321,oy+30);
    D.j(321,oy+138,'+','l',p+'ccp');D.j(296,oy+138,'−','l',p+'ccn');D.w(296,R,296,oy+138);D.t(308,oy+148,'VCC 12V',4.6);D.w(185,R,310,R);
    return qs};
  const qa=circ(24,'a','EXPERIMENT 1/2','1/2. REGION'),qb=circ(184,'b','EXPERIMENT 3/4','3/4. REGION');
  const pa=plot(24,qa,0),pb=plot(184,qb,1);D.M.extra=()=>{pa();pb()};
},`<b>Transistör karakteristikleri (BC238, NPN):</b> I. bölge çıkış (IC–VCE), II. bölge akım kazancı (IC–IB, β), III. bölge giriş (IB–VBE), IV. bölge geri besleme (VBE–VCE).
P1 taban akımını, P2 kollektör gerilimini ayarlar (düğmeleri sürükleyin ya da tekerleği çevirin). Soldaki grafikler ölçülen noktaları canlı olarak çizer.`);

/* =========================== MODÜL 8 =========================== */
def(8,'Zener diyot ve regülatörler',[
  {t:'Zener diyotun incelenmesi',pre:PR({psu:10,w:[[PSU,'dc8:zip','red'],[PSU0,'dc8:zin','black'],['dc8:zmap','dc8:zman','yellow'],['dc8:zm2p','dc8:zm2n','yellow']],dmm:['VDC','dc8:zvp','dc8:zvn'],
    n:'Zener (6,2 V) ters polarmada. Kaynağı 0 → 15 V artırın: gerilim 6,2 V\'ta sabitlenir, fazlası RS üzerinde düşer.'})},
  {t:'Zener ile regüle devre',pre:PR({psu:15,w:[[PSU,'dc8:zip','red'],[PSU0,'dc8:zin','black'],['dc8:zm2p','dc8:zm2n','yellow'],['dc8:zm3p','dc8:zm3n','yellow']],dmm:['ADC','dc8:zmap','dc8:zman'],
    n:'RL (1 kΩ) bağlı. Giriş 10…20 V arasında değişirken çıkış (VML) ≈ 6,2 V\'ta kalır; giriş akımı değişir. mA2 / mA3 köprülerini ampermetreyle değiştirip zener ve yük akımlarını bulun.'})},
  {t:'Paralel regüleli doğrultmaç',pre:PR({psu:12,w:[[PSU,'dc8:pip','red'],[PSU0,'dc8:pin','black']],dmm:['VDC','dc8:pvp','dc8:pvn'],
    n:'Şönt regülatör: çıkış ≈ VZ + VBE ≈ 6,2 V. Fazla akımı BD139 toprağa akıtır. Girişi 9…15 V arasında değiştirin.'})},
  {t:'Seri regüleli doğrultmaç',pre:PR({psu:12,w:[[PSU,'dc8:sip','red'],[PSU0,'dc8:sin','black']],dmm:['VDC','dc8:svp','dc8:svn'],
    n:'Seri regülatör: çıkış ≈ VZ − VBE ≈ 5,6 V. Seri transistör (BD139) gerilim farkını üstlenir; VMZ soketlerinde zener gerilimini ölçün.'})},
  {t:'İdeal seri regüleli doğrultmaç',pre:PR({w:[[ACA,'dc8:ra','red'],[AC0,'dc8:r0','black'],[ACB,'dc8:rb','blue']],dmm:['VDC','dc8:rvp','dc8:rvn'],sc:'dc8:rvp',T:0.005,V:2,after(){TZ.scopeSet({ac:true})},
    n:'Orta uçlu tam dalga doğrultmaç + C3 filtresi + zener referanslı seri regülatör: çıkış ≈ 5,6 V, dalgalanma (osiloskop AC kuplajda) çok küçük.'})}],
D=>{
  D.sub(8,24,326,100,'EXPERIMENT 1/2','EXAMINATION OF ZENER DIODE');
  D.j(22,40,'+','r','zip');D.j(22,108,'−','r','zin');D.t(30,76,'0-30V',4.8,'start');
  D.w(22,40,40,40);D.R(40,40,80,40,470,'RS');D.w(80,40,110,40);D.j(110,40,'mA','t','zmap');D.j(135,40,'','t','zman');D.lab(110,52,'+');D.lab(135,52,'−');D.w(135,40,300,40);
  const br=(x,k)=>{D.w(x,40,x,50);D.j(x,50,'mA'+k,'r','zm'+k+'p');D.j(x,64,'','r','zm'+k+'n');D.w(x,64,x,70)};
  br(190,2);D.D(190,100,190,70,'ZD 6V2',{kind:'z',vz:6.2,lp:'l'});D.w(190,100,190,108);
  br(250,3);D.R(250,70,250,100,1000,'RL',{lp:'l'});D.w(250,100,250,108);
  D.w(300,40,300,54);D.j(300,54,'+','l','zvp');D.j(300,96,'−','l','zvn');D.w(300,96,300,108);D.t(312,78,'VML',4.8,'start');D.w(22,108,300,108);
  D.sub(8,126,162,106,'EXPERIMENT 3','PARALLEL REGULATED');
  D.j(22,142,'+','r','pip');D.j(22,222,'−','r','pin');D.t(28,184,'0-15V',4.8,'start');D.w(22,142,40,142);D.R(40,142,75,142,100,'RS',{bl:16});D.w(75,142,160,142);
  D.Q(120,182,S.P.bd139,'TR\nBD139',{lp:[128,206]});D.w(126,168,126,142);D.w(126,196,126,222);
  D.D(95,176,95,152,'ZD',{kind:'z',vz:5.6,lp:'l'});D.w(95,152,95,142);D.w(95,176,95,186);D.w(95,182,106,182);D.R(95,186,95,216,1000,'RZ',{lp:'l',bl:16});D.w(95,216,95,222);
  D.w(145,142,145,150);D.R(145,150,145,214,470,'RL',{lp:'r'});D.w(145,214,145,222);D.j(160,142,'+','b','pvp');D.j(160,222,'−','t','pvn');D.w(22,222,160,222);D.t(160,184,'VML',4.6,'middle');
  D.sub(172,126,162,106,'EXPERIMENT 4','SERIAL REGULATED');
  D.j(186,142,'+','r','sip');D.j(186,222,'−','r','sin');D.t(192,184,'0-15V',4.8,'start');D.w(186,142,230,142,230,149,241,149);
  D.Q(255,155,S.P.bd139,'TR BD139',{rot:-90,lp:[262,140]});
  D.w(215,142,215,150);D.R(215,150,215,184,1000,'RZ',{lp:'l',bl:16});D.w(215,184,215,190,255,190);D.w(255,169,255,190);
  D.D(235,216,235,190,'ZD',{kind:'z',vz:6.2,lp:'r'});D.w(235,216,235,222);D.j(248,190,'VMZ','b','svzp');
  D.w(269,149,320,149);D.w(295,149,295,156);D.R(295,156,295,214,1000,'RL',{lp:'l'});D.w(295,214,295,222);D.j(320,149,'+','b','svp');D.j(320,222,'−','t','svn');D.w(186,222,320,222);D.t(320,186,'VML',4.6);
  D.sub(8,234,326,108,'EXPERIMENT 5','IDEAL SERIAL REGULATED RECTIFIER');
  D.j(22,248,'AC','r','ra');D.j(22,284,'0','r','r0');D.j(22,320,'AC','r','rb');
  D.w(22,248,50,248);D.D(50,248,80,248,'D1');D.w(50,248,50,258);D.C(50,258,80,258,1e-7,'C1',{lab:''});D.w(80,258,80,248);
  D.w(22,320,50,320);D.D(50,320,80,320,'D2',{lp:'b'});D.w(50,320,50,310);D.C(50,310,80,310,1e-7,'C2',{lab:''});D.w(80,310,80,320);
  D.w(80,248,100,248);D.w(80,320,100,320,100,248);D.w(22,284,40,284,40,330);
  D.w(100,268,118,268);D.C(118,268,118,322,1e-3,'C3',{lp:'r'});D.w(118,322,118,330);
  D.w(100,248,201,248);D.Q(215,254,S.P.bd139,'TR BD139',{rot:-90,lp:[205,240]});
  D.w(150,248,150,256);D.R(150,256,150,284,1000,'RZ',{lp:'l',bl:16});D.w(150,284,150,290,215,290);D.w(215,268,215,290);
  D.D(172,322,172,290,'ZD',{kind:'z',vz:6.2,lp:'r'});D.w(172,322,172,330);D.w(195,290,195,296);D.C(195,296,195,324,1e-4,'C4',{lp:'r'});D.w(195,324,195,330);
  D.w(229,248,318,248);D.w(262,248,262,256);D.C(262,256,262,322,1e-4,'C5',{lp:'r'});D.w(262,322,262,330);D.w(292,248,292,256);D.R(292,256,292,322,1000,'RL',{lp:'r'});D.w(292,322,292,330);
  D.j(318,248,'+','b','rvp');D.j(318,330,'−','t','rvn');D.w(40,330,318,330);D.t(318,292,'VML',4.6);
},`<b>Zener diyot</b> ters yönde, kırılma geriliminde (VZ) gerilimi sabit tutar. <b>Paralel (şönt) regülatörde</b> fazla akım transistörden toprağa akar;
<b>seri regülatörde</b> transistör yükle seri bağlıdır ve çıkış ≈ VZ − VBE olur. Ayarlı kaynağı değiştirerek çıkışın ne kadar sabit kaldığını inceleyin.`);

/* =========================== MODÜL 9 =========================== */
def(9,'Transistörlü kuvvetlendiriciler',[
  {t:'Emiteri topraklı kuvvetlendirici',pre:PR({w:[[P12,'dc9:cev','red'],[Z12,'dc9:ceg','black'],[FG,'dc9:cefg','yellow']],fg:{f:1000,a:1},sc:'dc9:ces1',sc2:'dc9:ces2',T:0.0005,V:0.01,V2:1,
    n:'FG 1 V tepe → 100:1 bölücü → girişte ≈ 10 mV (CH1). Çıkış (CH2) ≈ 2 V ve ters fazlı: kazanç ≈ 200, faz farkı 180°.'})},
  {t:'Beyzi topraklı kuvvetlendirici',pre:PR({w:[[P12,'dc9:cbv','red'],[Z12,'dc9:cbg','black'],[FG,'dc9:cbfg','yellow']],fg:{f:1000,a:1},sc:'dc9:cbs1',sc2:'dc9:cbs2',T:0.0005,V:0.5,V2:1,
    n:'Giriş emiterden: giriş direnci çok küçük (≈ 20 Ω), gerilim kazancı yüksek, giriş ve çıkış aynı fazda.'})},
  {t:'Kollektörü topraklı kuvvetlendirici',pre:PR({w:[[P12,'dc9:ccv','red'],[Z12,'dc9:ccg','black'],[FG,'dc9:ccfg','yellow']],fg:{f:1000,a:2},sc:'dc9:ccs1',sc2:'dc9:ccs2',T:0.0005,V:1,V2:1,
    n:'Emiter izleyici: kazanç ≈ 1, giriş ve çıkış aynı fazda; giriş direnci yüksek, çıkış direnci düşük (empedans uydurucu).'})}],
D=>{
  const rails=(oy,p,ve,ge)=>{D.j(20,oy+12,'+12V','r',p+'v');D.w(20,oy+12,ve,oy+12);D.j(20,oy+88,'0','r',p+'g');D.w(20,oy+88,ge,oy+88)};
  let oy=24;D.sub(8,oy,326,104,'EXPERIMENT 1','COMMON EMITTER AMPLIFIER');rails(oy,'ce',181,270);
  D.j(20,oy+52,'FG','r','cefg');D.w(20,oy+52,32,oy+52);D.R(32,oy+52,62,oy+52,100e3,'RFG',{bl:16});D.w(62,oy+52,90,oy+52);
  D.w(72,oy+52,72,oy+58);D.R(72,oy+58,72,oy+88,1000,'R',{bl:16,lp:'r'});D.w(90,oy+52,90,oy+68);D.j(90,oy+68,'SCOPE1','b','ces1');
  D.C(118,oy+52,90,oy+52,10e-6,'C1');D.w(118,oy+52,161,oy+52);D.R(140,oy+12,140,oy+52,47e3,'RB1',{lp:'l'});D.R(140,oy+52,140,oy+88,10e3,'RB2',{lp:'l'});
  D.Q(175,oy+52,S.P.bc238,'TR\nBC238',{lp:[186,oy+52]});D.R(181,oy+12,181,oy+38,2200,'RC',{bl:16,lp:'l'});D.R(181,oy+66,181,oy+88,470,'RE',{bl:16,lp:'l'});
  D.w(181,oy+66,206,oy+66);D.C(206,oy+66,206,oy+88,47e-6,'CE');
  D.w(181,oy+38,215,oy+38);D.C(215,oy+38,245,oy+38,10e-6,'C2');D.w(245,oy+38,300,oy+38);D.R(270,oy+38,270,oy+88,10e3,'RL');D.j(300,oy+38,'SCOPE2','b','ces2');
  oy=130;D.sub(8,oy,326,104,'EXPERIMENT 2','COMMON BASE AMPLIFIER');rails(oy,'cb',196,280);
  D.j(20,oy+60,'FG','r','cbfg');D.w(20,oy+60,32,oy+60);D.R(32,oy+60,62,oy+60,1000,'RFG',{bl:16});D.w(62,oy+60,96,oy+60);D.w(80,oy+60,80,oy+72);D.j(80,oy+72,'SCOPE1','b','cbs1');
  D.C(118,oy+60,96,oy+60,47e-6,'C1');D.w(118,oy+60,124,oy+60,124,oy+80,205,oy+80,205,oy+64);
  D.Q(190,oy+44,S.P.bc238,'TR BC238',{lp:[200,oy+46]});D.w(196,oy+58,196,oy+64,214,oy+64);D.R(214,oy+64,214,oy+88,1000,'RE',{bl:14});
  D.w(130,oy+44,176,oy+44);D.R(150,oy+12,150,oy+44,47e3,'RB1',{lp:'l'});D.R(150,oy+44,150,oy+88,10e3,'RB2',{lp:'r'});D.C(130,oy+44,130,oy+88,47e-6,'CB',{lp:'l'});
  D.R(196,oy+12,196,oy+30,2200,'RC',{bl:14,lp:'r'});D.w(196,oy+30,230,oy+30);D.C(230,oy+30,258,oy+30,10e-6,'C2');D.w(258,oy+30,300,oy+30);D.R(280,oy+30,280,oy+88,10e3,'RL');D.j(300,oy+30,'SCOPE2','b','cbs2');
  oy=236;D.sub(8,oy,326,106,'EXPERIMENT 3','COMMON COLLECTOR AMPLIFIER');rails(oy,'cc',196,280);
  D.j(20,oy+44,'FG','r','ccfg');D.w(20,oy+44,32,oy+44);D.R(32,oy+44,62,oy+44,1000,'RFG',{bl:16});D.w(62,oy+44,100,oy+44);D.w(82,oy+44,82,oy+60);D.j(82,oy+60,'SCOPE1','b','ccs1');
  D.C(126,oy+44,100,oy+44,10e-6,'C1');D.w(126,oy+44,176,oy+44);D.R(150,oy+12,150,oy+44,100e3,'RB1',{lp:'l'});D.R(150,oy+44,150,oy+88,100e3,'RB2',{lp:'l'});
  D.Q(190,oy+44,S.P.bc238,'TR BC238',{lp:[203,oy+40]});D.w(196,oy+30,196,oy+12);D.R(196,oy+58,196,oy+88,1000,'RE',{bl:16,lp:'l'});
  D.w(196,oy+58,225,oy+58);D.C(225,oy+58,252,oy+58,10e-6,'C2');D.w(252,oy+58,300,oy+58);D.R(280,oy+58,280,oy+88,10e3,'RL');D.j(300,oy+58,'SCOPE2','b','ccs2');
},`<b>Emiteri ortak (CE):</b> yüksek gerilim kazancı, 180° faz farkı. <b>Beyzi ortak (CB):</b> düşük giriş direnci, aynı faz, yüksek gerilim kazancı.
<b>Kollektörü ortak (CC, emiter izleyici):</b> kazanç ≈ 1, yüksek giriş / düşük çıkış direnci. Fonksiyon jeneratörünü (FG) açıp osiloskopla CH1 giriş, CH2 çıkışı izleyin.`);

/* =========================== MODÜL 10 =========================== */
def(10,'A, B, C sınıfı kuvvetlendiriciler',[
  {t:'A sınıfı kuvvetlendirici',pre:PR({w:[[P12,'dc10:av','red'],[Z12,'dc10:ag','black'],[FG,'dc10:afg','yellow']],fg:{f:1000,a:0.3},sc:'dc10:as1',sc2:'dc10:as2',T:0.0005,V:0.2,V2:1,
    n:'Çalışma noktası yük doğrusunun ortasında: transistör 360° iletir, çıkış giriş sinyalinin tam (ters) kopyasıdır. VB, VE, VC soketlerinde DC gerilimleri ölçün.'})},
  {t:'B sınıfı kuvvetlendirici',pre:PR({w:[[P12,'dc10:bv','red'],[Z12,'dc10:bg','black'],[FG,'dc10:bfg','yellow']],fg:{f:1000,a:2},sc:'dc10:bs1',sc2:'dc10:bs2',T:0.0005,V:1,V2:2,
    n:'Taban polarması yok: transistör yalnız giriş ≈ 0,6 V\'u aştığında (yarım periyot, 180°) iletir.'})},
  {t:'C sınıfı kuvvetlendirici',pre:PR({w:[[P12,'dc10:cv','red'],[Z12,'dc10:cg','black'],[N12,'dc10:cn12','blue'],[FG,'dc10:cfg','yellow']],fg:{f:1000,a:5},sc:'dc10:cs1',sc2:'dc10:cs2',T:0.0005,V:2,V2:2,
    n:'Taban, zener (4,7 V) ile negatif polarlanmış: transistör yalnız sinyal tepelerinde (< 180°) iletir; çıkış dar darbelerdir (rezonans devreli vericilerde kullanılır).'})}],
D=>{
  const st=(oy,p,cls,exp,ttl)=>{D.sub(8,oy,326,104,exp,ttl);
    if(cls==='C'){D.j(318,oy+12,'+12V','l',p+'v');D.w(318,oy+12,171,oy+12)}else{D.j(20,oy+12,'+12V','r',p+'v');D.w(20,oy+12,171,oy+12)}
    D.j(20,oy+88,'0','r',p+'g');D.w(20,oy+88,270,oy+88);
    D.j(20,oy+52,'FG','r',p+'fg');D.w(20,oy+52,60,oy+52);D.w(44,oy+52,44,oy+66);D.j(44,oy+66,'SCOPE1','b',p+'s1');
    if(cls==='C')D.C(60,oy+52,88,oy+52,10e-6,'C1');else D.C(88,oy+52,60,oy+52,10e-6,'C1');D.w(88,oy+52,151,oy+52);
    D.Q(165,oy+52,S.P.bd139,'TR\nBD139',{lp:[178,oy+54]});D.R(171,oy+12,171,oy+38,100,'RL',{bl:16,lp:'l'});D.R(171,oy+66,171,oy+88,22,'RE',{bl:16,lp:'l'});
    D.w(171,oy+66,196,oy+66);D.j(196,oy+66,'VE','r',p+'ve');D.w(171,oy+38,210,oy+38);D.j(195,oy+38,'VC','t',p+'vc');
    D.C(210,oy+38,240,oy+38,10e-6,'C2');D.w(240,oy+38,300,oy+38);D.R(270,oy+38,270,oy+88,1000,'R');D.j(300,oy+38,'SCOPE2','b',p+'s2');
    if(cls==='C'){D.j(20,oy+12,'−12V','r',p+'n12');D.w(20,oy+12,34,oy+12);D.R(34,oy+12,66,oy+12,1000,'RZ',{bl:16});D.w(66,oy+12,110,oy+12);
      D.D(90,oy+12,90,oy+32,'ZD 4V7',{kind:'z',vz:4.7,lp:'r'});D.gnd(90,oy+32,[20,oy+88]);
      D.R(110,oy+12,110,oy+52,10e3,'RB1',{lp:'l'});D.R(130,oy+52,130,oy+88,10e3,'RB2',{lp:'r'});D.j(145,oy+52,'VB','b',p+'vb')}
    else{D.R(120,oy+12,120,oy+52,cls==='A'?2200:100e3,'RB1',{lp:'l'});D.R(120,oy+52,120,oy+88,470,'RB2',{lp:'l'});D.j(136,oy+52,'VB','b',p+'vb')}};
  st(24,'a','A','EXPERIMENT 1','A CLASS AMPLIFIER');st(130,'b','B','EXPERIMENT 2','B CLASS AMPLIFIER');st(236,'c','C','EXPERIMENT 3','C CLASS AMPLIFIER');
},`<b>A sınıfı:</b> transistör tüm periyot (360°) boyunca iletir; bozulma az, verim düşük (%25'e kadar). <b>B sınıfı:</b> yarım periyot (180°) iletir; itme-çekme katlarında kullanılır.
<b>C sınıfı:</b> 180°'den az iletir; verim yüksek, çıkış darbelidir — rezonans devresiyle sinüse dönüştürülür.`);

/* =========================== MODÜL 11 =========================== */
const ACK=()=>{TZ.scopeSet({ac:true})};
def(11,'Ses kuvvetlendiricileri',[
  {t:'Transistörlü ses kuvvetlendiricisi (0,25 W)',pre:PR({w:[[P12,'dc11:a1v','red'],[Z12,'dc11:a1g','black'],[FG,'dc11:a1fg','yellow']],fg:{f:500,a:1},k:{m11p1:.5},sc:'dc11:a1s1',sc2:'dc11:a1s2',T:0.001,V:0.5,V2:2,after:ACK,
    n:'Sürücü TR1 + tamamlayıcı simetrik çıkış (BD139/BD140), D1-D2 geçiş bozulmasını önler. P (ses) düğmesiyle seviyeyi değiştirin; hoparlörden sesi duyabilirsiniz (sayfaya bir kez tıklayın). Çok açınca çıkış kırpılır.'})},
  {t:'Entegreli ses kuvvetlendiricisi (1 W)',pre:PR({w:[[P12,'dc11:a2v','red'],[Z12,'dc11:a2g','black'],[FG,'dc11:a2fg','yellow']],fg:{f:500,a:1},k:{m11p2:.15},sc:'dc11:a2s1',sc2:'dc11:a2s2',T:0.001,V:0.1,V2:2,after:ACK,
    n:'TBA820M: kazanç ≈ 50 (34 dB). Girişte 0,1 V tepe → çıkışta 5 V tepe. P düğmesiyle sesi ayarlayın.'})}],
D=>{
  D.sub(8,24,326,158,'EXPERIMENT 1','TRANSISTOR SOUND AMPLIFIER 0.25W');
  D.j(20,40,'+12V','r','a1v');D.w(20,40,196,40);D.j(20,170,'0','r','a1g');D.w(20,170,300,170);
  D.j(20,112,'FG','r','a1fg');D.w(20,112,30,112,30,84,50,84);D.POT(50,84,50,150,1e4,'','m11p1',{side:-1,kx:30,ky:140,kr:9});D.t(30,156,'P',5);D.w(50,150,50,170);
  D.w(61,117,90,117);D.j(74,117,'SCOPE1','t','a1s1');D.C(112,117,90,117,10e-6,'C1',{lp:'b'});D.w(112,117,126,117);
  D.Q(140,117,S.P.bc238,'TR1\nBC238',{lp:[150,128]});D.R(118,117,118,170,15e3,'R2',{lp:'l'});D.R(146,131,146,150,100,'R4',{bl:14,lab:''});D.w(146,150,146,170);
  D.R(146,40,146,58,1000,'R3',{bl:14,lp:'l'});D.D(146,58,146,74,'D1',{lp:'l'});D.w(146,74,146,78);D.D(146,78,146,94,'D2',{lp:'l'});D.w(146,94,146,103);
  D.Q(190,62,S.P.bd139,'TR2 BD139',{lp:[204,52]});D.w(146,58,170,58,170,62,176,62);D.w(196,48,196,40);
  D.Q(190,103,S.P.bd140,'TR3 BD140',{rot:180,mir:true,lp:[204,114]});D.w(146,103,176,103);D.w(196,117,196,170);
  D.w(196,76,205,76);D.R(205,76,230,76,1,'',{bl:12,lab:''});D.w(196,89,205,89);D.R(205,89,230,89,1,'',{bl:12,lab:''});D.w(230,76,230,89);
  D.w(230,82,250,82);D.C(250,82,280,82,470e-6,'C');D.w(280,82,300,82);D.SPK(300,82,300,150,'LS 8Ω');D.w(300,150,300,170);D.w(300,82,318,82);D.j(318,82,'SCOPE2','b','a1s2');
  D.w(240,82,240,158,200,158);D.R(200,158,160,158,47e3,'R1',{lp:'b'});D.w(160,158,122,158,122,117);
  D.sub(8,184,326,158,'EXPERIMENT 2','INTEGRATED SOUND AMPLIFIER 1W');
  D.j(20,200,'+12V','r','a2v');D.w(20,200,180,200,180,252);D.j(20,330,'0','r','a2g');D.w(20,330,300,330);
  D.j(20,272,'FG','r','a2fg');D.w(20,272,30,272,30,244,50,244);D.POT(50,244,50,310,1e4,'','m11p2',{side:-1,kx:30,ky:300,kr:9});D.t(30,316,'P',5);D.w(50,310,50,330);
  D.w(61,277,90,277);D.j(74,277,'SCOPE1','t','a2s1');D.C(90,277,115,277,10e-6,'C1',{pol:false});D.w(115,277,160,277);D.R(135,277,135,330,1e5,'R1',{lp:'l'});
  D.raw('<rect x="160" y="252" width="40" height="50" rx="2" fill="#151515" stroke="#1c1d1f"/><circle cx="166" cy="258" r="2" fill="#555"/>');
  D.t(180,280,'TBA820M',5.4,'middle','fill="#eee"');D.t(164,275,'3',4.4,'start','fill="#eee"');D.t(196,275,'5',4.4,'end','fill="#eee"');D.t(184,259,'6',4.4,'start','fill="#eee"');D.t(184,299,'4',4.4,'start','fill="#eee"');
  D.amp([160,277],[200,277],[180,252],[180,302],{A:50,mid:'rail',Ro:0.5,head:1.2,Gin:2e-7});D.w(180,302,180,330);
  D.w(200,277,215,277);D.C(215,277,245,277,470e-6,'C5');D.w(245,277,300,277);D.SPK(300,277,300,322,'LS 8Ω');D.w(300,322,300,330);D.w(300,277,318,277);D.j(318,277,'SCOPE2','b','a2s2');
  D.w(240,200,260,200);D.C(260,200,260,230,100e-6,'C4',{lp:'r'});D.w(260,230,260,236);D.gnd(260,236,[20,330]);D.w(180,200,240,200);
},`<b>Ses kuvvetlendiricisi:</b> sürücü katı gerilim kazancı sağlar, <b>itme-çekme (push-pull)</b> çıkış katı (NPN + PNP) hoparlörü sürmek için akım kazancı sağlar.
D1-D2 diyotları çıkış transistörlerini hafif iletimde tutarak geçiş (crossover) bozulmasını giderir. Entegreli devrede tüm kat tek bir yongadadır. Fonksiyon jeneratörü açıkken hoparlör sesi tarayıcıdan duyulur.`);

/* =========================== MODÜL 12 =========================== */
def(12,'JFET',[
  {t:'J-FET giriş (geçiş) karakteristiği',pre:PR({w:[[N12,'dc12:an12','blue'],[P12,'dc12:adp','red'],[Z12,'dc12:ag','black']],dmm:['ADC','dc12:aidp','dc12:aidn'],k:{m12a:.85},
    n:'RG ile VGS\'yi 0 V\'tan −4 V\'a doğru değiştirin; ID\'yi okuyun (VGS soketine fareyle gelin). ID = IDSS·(1 − VGS/VP)²: VGS = 0 iken ≈ 40 mA (IDSS), VGS = VP ≈ −4 V\'ta kesim.'})},
  {t:'J-FET çıkış karakteristiği',pre:PR({psu:8,w:[[PSU,'dc12:bdp','red'],[N12,'dc12:bn12','blue'],[PSU0,'dc12:bg','black']],dmm:['ADC','dc12:bidp','dc12:bidn'],k:{m12b:.85},
    n:'VGS sabit (RG), ayarlı kaynakla VDS\'yi 0…20 V değiştirin: önce omik bölge (ID doğrusal artar), VDS > VGS − VP olunca doyum (ID sabit).'})},
  {t:'Source\'u topraklı bağlantı',pre:PR({w:[[P12,'dc12:cvd','red'],[Z12,'dc12:cg','black'],[FG,'dc12:cfg','yellow']],fg:{f:1000,a:0.3},sc:'dc12:cs1',sc2:'dc12:cs2',T:0.0005,V:0.2,V2:0.5,
    n:'Kendinden polarmalı ortak kaynaklı kuvvetlendirici: VGS = −ID·RS ≈ −1,5 V, ID ≈ 15 mA. Kazanç ≈ gm·RD ≈ 4, çıkış ters fazlı.'})}],
D=>{
  const f=(ox,p,exp,ttl,two)=>{D.sub(ox,24,162,166,exp,ttl);
    D.j(ox+18,40,'−12V','r',p+'n12');D.w(ox+18,40,ox+40,40,ox+40,56);D.POT(ox+40,56,ox+40,124,1e4,'','m12'+p,{side:-1,kx:ox+22,ky:104,kr:11});D.t(ox+22,124,'RG',5);
    D.w(ox+40,124,ox+40,150);D.j(ox+18,150,'0','r',p+'g');D.w(ox+18,150,ox+140,150);D.gnd(ox+140,150);
    D.w(ox+51,90,ox+76,90,ox+76,96,ox+86,96);D.F(ox+100,92,'J',S.P.bf246,'BF246');D.w(ox+76,96,ox+76,118);D.j(ox+76,118,'VGS','b',p+'vgs');D.w(ox+106,106,ox+106,150);
    D.j(ox+132,36,two?'0-20V':'+12V','l',p+'dp');D.w(ox+132,36,ox+106,36,ox+106,46);D.j(ox+106,46,'+','l',p+'idp');D.j(ox+106,62,'−','l',p+'idn');D.t(ox+114,56,'ID mA',5,'start');
    D.w(ox+106,62,ox+106,78);D.w(ox+106,70,ox+134,70);D.j(ox+134,70,'VDS','b',p+'vds')};
  f(8,'a','EXPERIMENT 1','INPUT CHARACTERISTIC',0);f(172,'b','EXPERIMENT 2','OUTPUT CHARACTERISTIC',1);
  D.sub(8,192,326,150,'EXPERIMENT 3','SOURCE GROUNDED CONNECTION');
  D.j(20,206,'+12V','r','cvd');D.w(20,206,206,206);D.j(20,326,'0','r','cg');D.w(20,326,300,326);
  D.j(20,270,'FG','r','cfg');D.w(20,270,60,270);D.w(42,270,42,284);D.j(42,284,'SCOPE1','b','cs1');D.C(60,270,90,270,1e-6,'C1',{pol:false});
  D.w(90,270,180,270,180,274,186,274);D.R(120,270,120,326,1e6,'RG',{lp:'l'});D.j(150,270,'VG','t','cvg');
  D.F(200,270,'J',S.P.bf246,'BF246');D.R(206,206,206,244,330,'RD',{lp:'l'});D.w(206,244,206,256);
  D.w(206,284,206,292);D.R(206,292,206,326,100,'RS',{lp:'l'});D.w(206,288,232,288);D.C(232,288,232,326,100e-6,'CS');D.j(220,288,'VS','b','cvs');
  D.w(206,250,250,250);D.j(228,250,'VD','t','cvdd');D.C(250,250,276,250,10e-6,'C2');D.w(276,250,318,250);D.R(300,250,300,326,10e3,'RL');D.j(318,250,'SCOPE2','b','cs2');
},`<b>JFET (BF246, N kanallı)</b> gerilim kontrollü bir elemandır: kapı (G) ters polarmalıdır, kapı akımı ≈ 0. ID = IDSS·(1 − VGS/VP)².
Giriş karakteristiği ID–VGS, çıkış karakteristiği ID–VDS eğrisidir. RG düğmesi kapı gerilimini (−12 V…0) ayarlar.`);

/* =========================== MODÜL 13 =========================== */
def(13,'E-MOSFET',[
  {t:'E-MOSFET giriş karakteristiği',pre:PR({psu:10,w:[[P12,'dc13:av','red'],[PSU,'dc13:adp','orange'],[Z12,'dc13:ag','black']],dmm:['ADC','dc13:aidp','dc13:aidn'],k:{m13a:.55},
    n:'RG ile VGS\'yi artırın: eşik gerilimine (VGS(th) ≈ 3,6 V) kadar ID ≈ 0, sonra karesel artar. RD (100 Ω) akımı sınırlar.'})},
  {t:'E-MOSFET çıkış karakteristiği',pre:PR({psu:5,w:[[P12,'dc13:bv','red'],[PSU,'dc13:bdp','orange'],[Z12,'dc13:bg','black']],dmm:['ADC','dc13:bidp','dc13:bidn'],k:{m13b:.55},
    n:'VGS sabitken ayarlı kaynakla VDS\'yi değiştirin; ID önce artar, sonra doyumda sabitlenir.'})},
  {t:'E-MOSFET\'in çalışması',pre:PR({w:[[P12,'dc13:ov','red'],[Z12,'dc13:og','black'],['dc13:oj1a','dc13:oj1b','yellow']],dmm:['VDC','dc13:ovds'],
    n:'J1 köprüsü kapıya +12 V verir: MOSFET iletir, lamba yanar. J1\'i çıkarın — kapı kapasitesi yükünü tutar, lamba yanmaya devam eder (RG yavaşça boşaltır). J2\'yi köprüleyince kapı boşalır, lamba söner.'})}],
D=>{
  const f=(ox,p,exp,ttl)=>{D.sub(ox,24,162,166,exp,ttl);
    D.j(ox+18,40,'+12V','r',p+'v');D.w(ox+18,40,ox+40,40);D.R(ox+40,40,ox+40,76,4700,'R1',{lp:'l'});D.POT(ox+40,76,ox+40,140,1e4,'','m13'+p,{side:-1,kx:ox+20,ky:112,kr:10});D.t(ox+20,128,'RG',5);
    D.w(ox+40,140,ox+40,150);D.j(ox+18,150,'0','r',p+'g');D.w(ox+18,150,ox+140,150);D.gnd(ox+140,150);
    D.w(ox+51,108,ox+96,108);D.j(ox+76,108,'VGS','b',p+'vgs');D.F(ox+110,108,'M',S.P.irf740,'IRF740');D.w(ox+116,122,ox+116,150);
    D.j(ox+92,36,'0-20V','l',p+'dp');D.w(ox+92,36,ox+116,36);D.R(ox+116,36,ox+116,62,100,'RD',{bl:16,lp:'r'});D.w(ox+116,62,ox+116,66);
    D.j(ox+116,66,'+','l',p+'idp');D.j(ox+116,80,'−','l',p+'idn');D.t(ox+124,76,'ID',5,'start');D.w(ox+116,80,ox+116,94);D.w(ox+116,88,ox+140,88);D.j(ox+140,88,'VDS','b',p+'vds')};
  f(8,'a','EXPERIMENT 1','INPUT CHARACTERISTICS');f(172,'b','EXPERIMENT 2','OUTPUT CHARACTERISTICS');
  D.sub(8,192,326,150,'EXPERIMENT 3','OPERATION OF E-MOSFET');
  D.j(20,206,'+12V','r','ov');D.w(20,206,246,206);D.j(20,326,'0','r','og');D.w(20,326,246,326);
  D.R(120,206,120,240,10e3,'R1',{lp:'l'});D.w(120,240,120,246);D.j(120,246,'J1','r','oj1a');D.j(120,262,'','r','oj1b');D.w(120,262,120,274,226,274);
  D.w(160,274,160,286);D.j(160,286,'J2','r','oj2a');D.j(160,302,'','r','oj2b');D.w(160,302,160,326);D.R(190,274,190,326,1e7,'RG',{lp:'l'});D.j(206,274,'VGS','b','ovgs');
  D.F(240,274,'M',S.P.irf740,'IRF740');D.w(246,206,246,214);D.LAMP(246,214,246,250,'',{r:80,pw:1.8});D.t(258,234,'RD(RL)',5,'start');D.w(246,250,246,260);D.w(246,288,246,326);
  D.w(246,255,275,255);D.j(275,255,'VDS','b','ovds');
},`<b>E-MOSFET (IRF740, N kanallı, kanal oluşturmalı):</b> VGS eşik geriliminin (≈ 3,6 V) altında kanal yoktur, ID ≈ 0. Kapı yalıtılmıştır (kapı akımı yok);
bu yüzden anahtar olarak çok az sürme gücü ister. ID = K/2·(VGS − VT)².`);

/* =========================== MODÜL 14 =========================== */
def(14,'Osilatörler',[
  {t:'RC faz kaymalı osilatör',pre:PR({w:[[P12,'dc14:x1v','red'],[Z12,'dc14:x1g','black']],sc:'dc14:x1s',T:0.0005,V:2,after:ACK,n:'Üç RC hücresi toplam 180° faz kaydırır, transistör 180° daha: geri besleme pozitif olur. f ≈ 1/(2π·R·C·√6) ≈ 650 Hz (yükleme nedeniyle biraz farklı).'})},
  {t:'LC osilatör',pre:PR({w:[[P12,'dc14:x2v','red'],[Z12,'dc14:x2g','black']],sc:'dc14:x2s',T:0.0001,V:5,after:ACK,n:'Kollektör ayarlı (tank devreli) osilatör: geri besleme trafo sargısıyla (L2). f = 1/(2π√(LC)) ≈ 5 kHz. Salınımın büyüyerek oturmasını izleyin.'})},
  {t:'Hartley osilatör',pre:PR({w:[[P12,'dc14:x3v','red'],[Z12,'dc14:x3g','black']],sc:'dc14:x3s',T:0.0001,V:5,after:ACK,n:'Orta uçlu bobin (L1+L2) ve ayarlı kondansatör (CV): düğmeyi çevirince frekans değişir (≈ 4…11 kHz).'})},
  {t:'Colpitts osilatör',pre:PR({w:[[P12,'dc14:x4v','red'],[Z12,'dc14:x4g','black']],sc:'dc14:x4s',T:0.0001,V:2,after:ACK,n:'Kapasitif bölücü (C1, C2) geri besleme sağlar: f = 1/(2π√(L·C1C2/(C1+C2))). C2 düğmesiyle frekansı değiştirin.'})},
  {t:'Kristal osilatör',pre:PR({w:[[P12,'dc14:x5v','red'],[Z12,'dc14:x5g','black']],sc:'dc14:x5s',T:0.00001,V:2,after:ACK,n:'Kuvars kristal çok yüksek Q\'lu bir rezonatördür: frekans (32,768 kHz, saat kristali) çok kararlıdır. Salınımın oturması binlerce periyot sürer — simülasyon yavaşlar.'})},
  {t:'Wien köprü osilatör',pre:PR({w:[[P12,'dc14:x6v','red'],[Z12,'dc14:x6g','black'],[N12,'dc14:x6n','blue']],sc:'dc14:x6s',T:0.0002,V:5,k:{m14rf:.45},after:ACK,n:'741 op-amp: f = 1/(2πRC) ≈ 1,6 kHz. Salınım için kazanç 1 + RF/RG ≥ 3 olmalı. RF düğmesini küçültürseniz salınım söner, büyütürseniz çıkış kırpılır.'})}],
D=>{
  const M=D.M;let ox=8,oy=24;
  /* 1: RC faz kaymalı */
  D.sub(ox,oy,162,104,'EXPERIMENT 1','RC PHASE SHIFT OSC.');
  D.j(ox+150,oy+12,'+12V','l','x1v');D.w(ox+150,oy+12,ox+120,oy+12);D.R(ox+120,oy+12,ox+120,oy+36,4700,'RC',{bl:16,lp:'l'});
  D.Q(ox+114,oy+50,S.P.bc238,'',{});D.R(ox+120,oy+64,ox+120,oy+90,470,'',{bl:16,lab:''});D.w(ox+120,oy+64,ox+138,oy+64);D.C(ox+138,oy+64,ox+138,oy+90,10e-6,'',{lab:''});
  D.j(ox+12,oy+90,'0','r','x1g');D.w(ox+12,oy+90,ox+138,oy+90);D.w(ox+120,oy+36,ox+150,oy+36);D.j(ox+150,oy+36,'SCOPE','b','x1s');
  D.w(ox+120,oy+36,ox+104,oy+36,ox+104,oy+26,ox+16,oy+26,ox+16,oy+50);
  D.C(ox+16,oy+50,ox+34,oy+50,10e-9,'',{lab:''});D.w(ox+34,oy+50,ox+40,oy+50);D.R(ox+40,oy+50,ox+40,oy+90,10e3,'',{lab:''});
  D.C(ox+40,oy+50,ox+58,oy+50,10e-9,'',{lab:''});D.w(ox+58,oy+50,ox+66,oy+50);D.R(ox+66,oy+50,ox+66,oy+90,10e3,'',{lab:''});
  D.C(ox+66,oy+50,ox+84,oy+50,10e-9,'',{lab:''});D.w(ox+84,oy+50,ox+100,oy+50);D.R(ox+88,oy+50,ox+88,oy+90,10e3,'',{lab:''});D.R(ox+96,oy+50,ox+96,oy+32,82e3,'',{bl:12,lab:''});D.tie([ox+96,oy+32],[ox+150,oy+12]);D.t(ox+99,oy+33,'+12V',3.8,'start');
  D.t(ox+50,oy+21,'C=10nF  R=10K',4.6);
  /* 2: LC (trafo geri beslemeli) */
  ox=172;D.sub(ox,oy,162,104,'EXPERIMENT 2','LC OSCILLATOR');
  D.j(ox+12,oy+12,'+12V','r','x2v');D.w(ox+12,oy+12,ox+140,oy+12);D.Q(ox+114,oy+50,S.P.bc238,'',{});
  D.Lsym(ox+120,oy+12,ox+120,oy+36,'L1','l');D.C(ox+140,oy+12,ox+140,oy+36,100e-9,'C',{pol:false,lp:'r'});D.w(ox+120,oy+36,ox+140,oy+36);
  D.R(ox+120,oy+64,ox+120,oy+76,100,'',{bl:8,lab:''});D.R(ox+120,oy+76,ox+120,oy+90,1000,'',{bl:10,lab:''});D.w(ox+120,oy+76,ox+138,oy+76);D.C(ox+138,oy+76,ox+138,oy+90,10e-6,'',{lab:''});
  D.j(ox+12,oy+90,'0','r','x2g');D.w(ox+12,oy+90,ox+138,oy+90);
  D.R(ox+50,oy+12,ox+50,oy+50,47e3,'',{lab:''});D.R(ox+50,oy+50,ox+50,oy+90,10e3,'',{lab:''});D.w(ox+34,oy+50,ox+50,oy+50);D.C(ox+34,oy+50,ox+34,oy+90,1e-6,'',{lab:''});
  D.w(ox+50,oy+50,ox+66,oy+50);D.Lsym(ox+66,oy+50,ox+90,oy+50,'L2','t');D.w(ox+90,oy+50,ox+100,oy+50);
  D.X([ox+120,oy+12],[ox+120,oy+36],[ox+90,oy+50],[ox+66,oy+50],0.01,0.0002,0.9);
  D.add_('R',[[ox+120,oy+12],[ox+120,oy+36]],{v:10e3});  // bobin kayıpları (tank Q'su)
  D.w(ox+140,oy+36,ox+152,oy+36,ox+152,oy+52);D.j(ox+152,oy+52,'SCOPE','b','x2s');
  /* 3: Hartley */
  ox=8;oy=130;D.sub(ox,oy,162,104,'EXPERIMENT 3','HARTLEY OSCILLATOR');
  D.j(ox+12,oy+50,'+12V','r','x3v');D.w(ox+12,oy+50,ox+60,oy+50);D.Lsym(ox+60,oy+24,ox+60,oy+50,'','l');D.Lsym(ox+60,oy+50,ox+60,oy+76,'','l');
  D.X([ox+60,oy+24],[ox+60,oy+50],[ox+60,oy+50],[ox+60,oy+76],0.008,0.002,0.9);
  D.add_('R',[[ox+60,oy+24],[ox+60,oy+76]],{v:10e3});
  D.w(ox+60,oy+24,ox+116,oy+24,ox+116,oy+42);D.w(ox+116,oy+24,ox+150,oy+24);D.j(ox+150,oy+24,'SCOPE','b','x3s');
  D.Q(ox+110,oy+56,S.P.bc238,'',{});D.R(ox+116,oy+70,ox+116,oy+80,100,'',{bl:7,lab:''});D.R(ox+116,oy+80,ox+116,oy+92,1000,'',{bl:9,lab:''});D.w(ox+116,oy+80,ox+134,oy+80);D.C(ox+134,oy+80,ox+134,oy+92,10e-6,'',{lab:''});
  D.j(ox+12,oy+92,'0','r','x3g');D.w(ox+12,oy+92,ox+134,oy+92);
  D.C(ox+72,oy+24,ox+72,oy+76,47e-9,'CV',{pol:false,lab:'',f:()=>10e-9*Math.pow(10,K.m14c3)});D.raw(`<path d="M${ox+66} ${oy+57}L${ox+79} ${oy+44}" stroke="#1c1d1f" stroke-width=".8"/>`);
  D.w(ox+60,oy+76,ox+72,oy+76);D.C(ox+72,oy+76,ox+86,oy+76,10e-9,'',{lab:'',pol:false});D.w(ox+86,oy+76,ox+86,oy+56,ox+96,oy+56);D.R(ox+92,oy+56,ox+92,oy+34,100e3,'',{bl:12,lab:''});D.tie([ox+92,oy+34],[ox+12,oy+50]);D.t(ox+95,oy+35,'+12V',3.8,'start');D.R(ox+92,oy+56,ox+92,oy+92,22e3,'',{bl:12,lab:''});
  D.knob('m14c3',ox+30,oy+30,9,'Ayarlı kondansatör – frekans');D.t(ox+30,oy+16,'CV',4.6);
  /* 4: Colpitts */
  ox=172;D.sub(ox,oy,162,104,'EXPERIMENT 4','COLPITTS OSCILLATOR');
  const colp=(ox,oy,p,xt)=>{D.j(ox+12,oy+12,'+12V','r',p+'v');D.w(ox+12,oy+12,ox+116,oy+12);D.R(ox+116,oy+12,ox+116,oy+42,2200,'',{bl:16,lab:''});
    D.Q(ox+110,oy+56,S.P.bc238,'',{});D.R(ox+116,oy+70,ox+116,oy+80,100,'',{bl:7,lab:''});D.R(ox+116,oy+80,ox+116,oy+92,470,'',{bl:9,lab:''});D.w(ox+116,oy+80,ox+134,oy+80);D.C(ox+134,oy+80,ox+134,oy+92,10e-6,'',{lab:''});
    D.j(ox+12,oy+92,'0','r',p+'g');D.w(ox+12,oy+92,ox+134,oy+92);
    if(xt)D.XT(ox+40,oy+30,ox+40,oy+74,32768,'XTAL 32.768kHz');else D.L(ox+40,oy+30,ox+40,oy+74,0.01,'L',{rdc:10,lp:'r'});
    const cc=xt?2.2e-9:100e-9;D.w(ox+40,oy+30,ox+24,oy+30);D.C(ox+24,oy+30,ox+24,oy+92,cc,'',{pol:false,lab:''});
    D.w(ox+40,oy+74,ox+56,oy+74);D.C(ox+56,oy+74,ox+56,oy+92,cc,'',{pol:false,lab:'',f:xt?undefined:()=>47e-9*Math.pow(10,K.m14c4*0.67)});
    D.w(ox+56,oy+74,ox+70,oy+74);D.C(ox+70,oy+74,ox+86,oy+74,xt?10e-9:100e-9,'',{lab:'',pol:false});D.w(ox+86,oy+74,ox+86,oy+56,ox+96,oy+56);
    D.w(ox+116,oy+42,ox+80,oy+42);D.C(ox+80,oy+42,ox+58,oy+42,xt?10e-9:100e-9,'',{lab:'',pol:false});D.w(ox+58,oy+42,ox+58,oy+30,ox+40,oy+30);
    D.R(ox+90,oy+42,ox+90,oy+56,220e3,'',{bl:9,lab:''});D.w(ox+116,oy+42,ox+150,oy+42);D.j(ox+150,oy+42,'SCOPE','b',p+'s');
    D.t(ox+18,oy+62,'C1',4.6,'end');D.t(ox+62,oy+86,'C2',4.6,'start')};
  colp(ox,oy,'x4',false);D.knob('m14c4',ox+150,oy+76,8,'C2 ayarlı kondansatör – frekans');
  /* 5: kristal */
  ox=8;oy=236;D.sub(ox,oy,162,106,'EXPERIMENT 5','CRYSTAL OSCILLATOR');colp(ox,oy,'x5',true);
  /* 6: Wien köprü */
  ox=172;D.sub(ox,oy,162,106,'EXPERIMENT 6','WIEN BRIDGE OSCILLATOR');
  const o=D.OA(ox+96,oy+46,'741');D.j(ox+12,oy+12,'+12V','r','x6v');D.j(ox+12,oy+54,'0','r','x6g');D.j(ox+12,oy+92,'−12V','r','x6n');
  D.tie(o.vp,[ox+12,oy+12]);D.tie(o.vn,[ox+12,oy+92]);D.t(ox+100,oy+28,'+12V',4.2,'start');D.t(ox+100,oy+68,'−12V',4.2,'start');
  D.w(ox+12,oy+54,ox+24,oy+54);D.gnd(ox+24,oy+54);const G0_=[ox+12,oy+54];
  D.w(ox+116,oy+46,ox+150,oy+46);D.j(ox+150,oy+46,'SCOPE','b','x6s');
  D.w(ox+124,oy+46,ox+124,oy+22);const W=D.POT(ox+124,oy+22,ox+84,oy+22,50e3,'','m14rf',{side:1,k0:.45});D.w(W[0],W[1],ox+84,W[1],ox+84,oy+22);
  D.w(ox+84,oy+22,ox+70,oy+22,ox+70,oy+40,ox+76,oy+40);D.t(ox+104,oy+32,'RF',4.6);
  D.R(ox+70,oy+22,ox+40,oy+22,10e3,'',{lab:''});D.t(ox+55,oy+16,'RG',4.6);D.w(ox+40,oy+22,ox+40,oy+28);D.gnd(ox+40,oy+28,G0_);
  D.w(ox+76,oy+52,ox+60,oy+52);D.R(ox+60,oy+52,ox+60,oy+86,10e3,'',{lab:''});D.gnd(ox+60,oy+86,G0_);D.w(ox+44,oy+52,ox+60,oy+52);D.C(ox+44,oy+52,ox+44,oy+86,10e-9,'',{lab:'',pol:false});D.gnd(ox+44,oy+86,G0_);
  D.w(ox+136,oy+46,ox+136,oy+76);D.R(ox+136,oy+76,ox+106,oy+76,10e3,'',{lab:''});D.w(ox+106,oy+76,ox+100,oy+76);D.C(ox+100,oy+76,ox+78,oy+76,10e-9,'',{lab:'',pol:false});D.w(ox+78,oy+76,ox+70,oy+76,ox+70,oy+52);
  D.knob('m14rf',ox+150,oy+80,8,'RF – kazanç (1 + RF/RG)',.45);
  const wired=id=>J[ji('dc14:'+id)].wired>0;
  M.fh=()=>Math.max(wired('x1v')?700:0,wired('x2v')?5e3:0,wired('x3v')?1.2e4:0,wired('x4v')?8e3:0,wired('x5v')?3.3e4:0,wired('x6v')?1.7e3:0);
},`<b>Osilatör</b> kendi kendine salınım üreten, pozitif geri beslemeli kuvvetlendiricidir (Barkhausen: döngü kazancı ≥ 1, toplam faz 360°).
RC ve Wien köprü osilatörleri ses frekanslarında, LC (Hartley, Colpitts) ve kristal osilatörler yüksek frekanslarda kullanılır. Osiloskobu SCOPE soketine bağlayın; frekans ekranda ölçülür.`);
})();
