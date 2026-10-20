/* =====================================================================
   Y-0016-DC  DC Devreler Uygulama Modülleri (14 modül)
   - Paneller vektör olarak çizilir; devre bağlantıları ÇİZİMDEN çıkarılır
     (aynı noktada biten tel / eleman ucu / soket aynı düğümdür, telin
     üzerine düşen nokta T-bağlantısıdır). Çizimde ne varsa simülasyonda o vardır.
   - Analog çözüm: dc-cozucu.js (MNA + Newton + Gear-2). Eğitim setinin
     kaynakları (±12 V, ±5 V, AC 12 V orta uçlu, ayarlı kaynak CV/CC,
     fonksiyon jeneratörü 50 Ω) iç dirençli kaynak olarak bağlanır.
   - Ana betikten (index.html) önce yüklenir; ana betiğin globallerini
     yalnız çağrı anında kullanır.
   ===================================================================== */
'use strict';
const DCX=(()=>{
const S=Solver;
const INK='#1c1d1f',PANEL='#f4f4ef';

/* ---------------- ölçü aleti durumu ---------------- */
const DM={mode:'VDC',ohmR:3000,ammI:NaN,ohmV:NaN};
const MODES=[['VDC','V ⎓ DC gerilim'],['VAC','V ∿ AC gerilim (RMS)'],['ADC','A ⎓ DC akım'],['AAC','A ∿ AC akım (RMS)'],['OHM','Ω direnç'],['DIODE','→| diyot testi'],['CAP','C kapasite'],['IND','L endüktans (LCR)']];

/* ---------------- analog motor ---------------- */
const E={M:null,sim:new S.Sim(),key:'',netOf:null,need:true,nets:[],N:0,els:[],dt:0,gnet:-1,nmax:300,psu:false,amm:null,ohm:null,spk:null,fails:0};
const PSU={mode:'cv',i:0,v:0};
const HOOKS=[];
const SRC=[['ttl.p51',.05],['ttl.m51',.05],['s12.p1',.1],['s12.n1',.1],['ac.a1',.6],['ac.b1',.6],['fg.st1',50],['fg.ttl1',50],
  ['osc.100k',100],['osc.10k',100],['osc.1k',100],['osc.100',100],['osc.10',100],['osc.1',100],
  ['pulse.p',100],['pulse.n',100],['one.p',100],['one.n',100],['sr.a',100],['sr.b',100],
  ...'ABCDEFGHIJKL'.split('').map(c=>['bin.'+c,1000])];
function activeM(){for(const M of MODS)if(M.mounted&&M.fam==='dc')return M;return null}
const quant=dt=>{const e=Math.floor(Math.log10(dt)),b=dt/Math.pow(10,e);return(b>=5?5:b>=2?2:1)*Math.pow(10,e)};
function plan(dtReal,fmax){
  const M=activeM();E.M=M;ST.analog=!!M;if(!M)return null;
  const fh=typeof M.fh==='function'?M.fh():M.fh;
  const f=Math.max(fh||0,fmax||0);let dt=f>0?1/(f*40):1e-4;dt=quant(Math.min(dt,1e-4));
  let N=Math.ceil(dtReal/dt);if(N>E.nmax)N=E.nmax;return{N:Math.max(1,N),dts:dt}}
function tune(N,ms){if(!E.M)return;if(ms>11)E.nmax=Math.max(20,Math.floor(N*10/ms));else if(ms<7&&N>=E.nmax)E.nmax=Math.min(8000,Math.ceil(E.nmax*1.25))}
function trainerPassives(){
  const L=[];
  [['pot1',1e3],['pot2',1e4],['pot3',1e5]].forEach(([p,R])=>L.push({js:[ji(p+'.l'),ji(p+'.w'),ji(p+'.r')],mk:n=>[S.Rdyn(n[0],n[1],()=>Math.max(1,R*K[p])),S.Rdyn(n[1],n[2],()=>Math.max(1,R*(1-K[p])))]}));
  [['lp1',48],['lp2',48],['lp3',48]].forEach(([l,R])=>L.push({js:[ji(l+'.a1'),ji(l+'.b1')],mk:n=>[S.R(n[0],n[1],R)]}));
  L.push({js:[ji('buz.p'),ji('buz.n')],mk:n=>[S.R(n[0],n[1],300)]},{js:[ji('spk.p'),ji('spk.n')],mk:n=>[S.R(n[0],n[1],8)]},{js:[ji('rl.cp'),ji('rl.cn')],mk:n=>[S.R(n[0],n[1],360)]});
  return L}
let TP=null;
function build(M){
  TP=TP||trainerPassives();
  const used=new Set(),add=j=>used.add(netOf[j]);
  for(const e of M.an)for(const j of e.ji)add(j);
  const inc=[];let ch=true;while(ch){ch=false;for(const p of TP){if(inc.includes(p))continue;if(p.js.some(j=>used.has(netOf[j]))){inc.push(p);p.js.forEach(add);ch=true}}}
  const md=DM.mode,pP=probe.dmmP,pN=probe.dmmN,needI=pP>=0&&['ADC','AAC','OHM','DIODE'].includes(md);
  if(needI){add(pP);if(pN>=0)add(pN)}
  /* dış ölçü aletleri (gerçek multimetre vb.): {js:[soketler], mk:n=>[elemanlar], seed} */
  const HK=HOOKS.map(f=>f()).filter(Boolean);for(const hk of HK)hk.js.forEach(add);
  const g=netOf[ji('ttl.g0')];E.gnet=g;
  /* beslenmeyen devre parçalarını çıkar: toprak dışındaki bir kaynağa (ya da ölçü aletinin test kaynağına) ulaşmayan elemanlar hesaba katılmaz */
  const seeds=new Set();for(const[id]of SRC)seeds.add(netOf[ji(id)]);for(const hk of HK)if(hk.seed)hk.js.forEach(j=>seeds.add(netOf[j]));seeds.add(netOf[ji('psu.p1')]);if(needI){seeds.add(netOf[pP]);if(pN>=0)seeds.add(netOf[pN])}
  const items=[...M.an.map(e=>({e,ns:e.ji.map(j=>netOf[j])})),...inc.map(p=>({p,ns:p.js.map(j=>netOf[j])})),...HK.map(k=>({k,ns:k.js.map(j=>netOf[j])}))];
  const adjN=new Map();for(const it of items)for(const a of it.ns)if(a!==g){if(!adjN.has(a))adjN.set(a,new Set());for(const b of it.ns)if(b!==g&&b!==a)adjN.get(a).add(b)}
  const reach=new Set(),q=[];for(const s0 of seeds)if(s0!==g&&adjN.has(s0)){reach.add(s0);q.push(s0)}
  while(q.length){const a=q.pop();for(const b of adjN.get(a)||[])if(!reach.has(b)){reach.add(b);q.push(b)}}
  const live=it=>it.ns.some(a=>reach.has(a));
  const anL=items.filter(it=>it.e&&live(it)).map(it=>it.e),incL=items.filter(it=>it.p&&live(it)).map(it=>it.p),hkL=items.filter(it=>it.k&&live(it)).map(it=>it.k);
  used.clear();for(const e of anL)for(const j of e.ji)add(j);for(const p of incL)p.js.forEach(add);for(const k of hkL)k.js.forEach(add);if(needI){add(pP);if(pN>=0)add(pN)}
  E.nets=[...used].filter(n=>n!==g);const nd=new Map();E.nets.forEach((n,i)=>nd.set(n,i+1));nd.set(g,0);
  const nj=j=>nd.get(netOf[j]);E.N=E.nets.length;const els=[];
  for(const e of anL){const n=e.ji.map(nj),st=e.st||(e.st={});
    switch(e.t){
      case'R':els.push(S.R(n[0],n[1],e.v));break;
      case'C':els.push(S.Cap(n[0],n[1],typeof e.v==='function'?e.v():e.v,st));break;
      case'L':els.push(S.Ind(n[0],n[1],e.v,e.rdc||1,st));break;
      case'D':els.push(e.el=S.Diode(n[0],n[1],e.p,st));break;
      case'Q':els.push(e.el=S.Bjt(n[0],n[1],n[2],e.p,st));break;
      case'J':els.push(S.Mos(n[0],n[1],n[2],e.p,st),S.Diode(n[0],n[2],{Is:1e-14,n:1},e.s2||(e.s2={})),S.Diode(n[0],n[1],{Is:1e-14,n:1},e.s3||(e.s3={})));break;
      case'M':els.push(S.Mos(n[0],n[1],n[2],e.p,st),S.Diode(n[2],n[1],S.P.body,e.s2||(e.s2={})),S.R(n[0],n[2],1e9));break;
      case'POT':{const k=clamp(K[e.key],0.002,0.998);els.push(S.R(n[0],n[1],e.v*k),S.R(n[1],n[2],e.v*(1-k)));break}
      case'OA':els.push(S.OpAmp(n[0],n[1],n[2],n[3],n[4],e.p));break;
      case'X':els.push(S.Xfmr(n[0],n[1],n[2],n[3],e.l1,e.l2,e.k,st));break;
      case'LAMP':els.push(S.R(n[0],n[1],e.v));break;
      case'SPK':els.push(S.R(n[0],n[1],8));break}}
  for(const p of incL)els.push(...p.mk(p.js.map(nj)));
  for(const k of hkL)els.push(...k.mk(k.js.map(nj)));
  for(const[id,r]of SRC){const j=ji(id),nt=netOf[j];if(!used.has(nt)||nt===g)continue;
    els.push(S.Vdyn(nd.get(nt),0,()=>{const v=netV[nt];return netK[nt]>=0&&v===v?{v,r}:null}))}
  const pn=netOf[ji('psu.p1')];E.psu=used.has(pn)&&pn!==g;
  if(E.psu){const a=nd.get(pn);els.push({nodes:[a,0],mdyn:true,v:0,il:0,on:false,
    pre(){this.on=ST.power;this.v=adj.vset;this.il=Math.max(K.current,1e-4)},
    dyn(c){if(!this.on){c.G(a,0,1e-12);return}if(PSU.mode==='cv'){c.G(a,0,50);c.I(0,a,this.v*50)}else{c.G(a,0,1e-6);c.I(0,a,this.il)}},
    accept(x){const v=x[a];if(!this.on){PSU.i=0;PSU.v=0;PSU.mode='cv';return}const i=PSU.mode==='cv'?(this.v-v)*50:this.il;PSU.i=i;PSU.v=v;
      if(PSU.mode==='cv'&&i>this.il)PSU.mode='cc';else if(PSU.mode==='cc'&&v>=this.v)PSU.mode='cv'}})}
  E.amm=E.ohm=null;
  if(needI){const a=nj(pP),b=pN>=0?nj(pN):0;
    if(md==='ADC'||md==='AAC'){E.amm=S.R(a,b,0.5);els.push(E.amm)}
    else{E.ohm=S.Vdyn(a,b,()=>({v:3,r:md==='DIODE'?3000:DM.ohmR}));els.push(E.ohm)}}
  E.spk=M.an.find(e=>e.t==='SPK')||null;
  E.els=els}
function step(dts){
  const M=E.M;if(!M)return;
  const key=M.id+'|'+DM.mode+'|'+probe.dmmP+'|'+probe.dmmN;
  if(E.netOf!==netOf||E.key!==key||E.need){build(M);E.key=key;E.netOf=netOf;E.need=false;E.dt=0}
  if(E.dt!==dts){E.sim.keep=true;E.sim.setup(E.N,E.els,dts);E.dt=dts}
  if(!E.sim.step())E.fails++;
  const x=E.sim.x;for(let k=0;k<E.nets.length;k++){const v=x[k+1];netV[E.nets[k]]=v===v&&Math.abs(v)<1e4?v:0}
  if(E.gnet>=0)netV[E.gnet]=0;
  if(E.psu){adj.vout=Math.max(0,PSU.v);adj.I=Math.max(0,PSU.i);adj.cc=PSU.mode==='cc'||K.current<0.03}
  DM.ammI=E.amm?(x[E.amm.a]-x[E.amm.b])/0.5:NaN}
const psu=()=>!!(E.M&&E.psu);
function spkV(){const s=E.M&&E.spk;if(!s)return NaN;const a=rdV(s.ji[0]),b=rdV(s.ji[1]);return a-b}

/* ---------------- DMM ---------------- */
function dmmSample(dP,dN){
  const md=DM.mode;
  if(md==='ADC'||md==='AAC')return DM.ammI;
  if(md==='CAP'||md==='IND')return NaN;
  const a=rdV(dP);let b=dN>=0?rdV(dN):0;if(b!==b)b=0;return a===a?a-b:NaN}
const fmt=(v,u,d=3)=>{const a=Math.abs(v);const P=[[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']];
  for(const[s,p]of P)if(a>=s*0.9995||s===1e-12){const x=v/s;return x.toFixed(Math.max(0,d-Math.floor(Math.log10(Math.max(Math.abs(x),1)))))+' '+p+u}return v.toFixed(d)+' '+u};
function eqCL(type){if(probe.dmmP<0)return NaN;return eqCLj(type,probe.dmmP,probe.dmmN>=0?probe.dmmN:ji('ttl.g0'))}
function eqCLj(type,ja,jb){
  const M=E.M||activeM();if(!M)return NaN;
  const els=M.an.filter(e=>e.t===type);const nP=netOf[ja],nN=netOf[jb];
  if(nP===nN)return 0;
  const ids=new Map();const id=n=>{if(!ids.has(n))ids.set(n,ids.size);return ids.get(n)};id(nN);id(nP);
  for(const e of els){id(netOf[e.ji[0]]);id(netOf[e.ji[1]])}
  const n=ids.size-1;if(n<1)return NaN;const A=new Float64Array(n*n),b=new Float64Array(n);
  const G=(p,q,g)=>{p=ids.get(p)-1;q=ids.get(q)-1;if(p>=0)A[p*n+p]+=g;if(q>=0)A[q*n+q]+=g;if(p>=0&&q>=0){A[p*n+q]-=g;A[q*n+p]-=g}};
  const val=e=>typeof e.v==='function'?e.v():e.v;
  for(const e of els){const g=type==='C'?val(e)*1e9:1e-3/val(e);G(netOf[e.ji[0]],netOf[e.ji[1]],g)}
  for(let i=0;i<n;i++)A[i*n+i]+=1e-12;
  b[ids.get(nP)-1]=1;
  // Gauss
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r*n+c])>Math.abs(A[p*n+c]))p=r;
    if(p!==c){for(let k=0;k<n;k++){const t=A[c*n+k];A[c*n+k]=A[p*n+k];A[p*n+k]=t}const t=b[c];b[c]=b[p];b[p]=t}
    for(let r=c+1;r<n;r++){const f=A[r*n+c]/A[c*n+c];if(!f)continue;for(let k=c;k<n;k++)A[r*n+k]-=f*A[c*n+k];b[r]-=f*b[c]}}
  for(let r=n-1;r>=0;r--){let s=b[r];for(let k=r+1;k<n;k++)s-=A[r*n+k]*b[k];b[r]=s/A[r*n+r]}
  const V=b[ids.get(nP)-1];if(!(V>0)||V>1e9)return NaN;
  return type==='C'?1e-9/V:V*1e-3}
function dmmText(acc){
  const md=DM.mode;
  if(probe.dmmP<0)return md==='CAP'?'— F':md==='IND'?'— H':md==='OHM'?'— Ω':md[0]==='A'?'— A':'— V';
  if(md==='CAP'||md==='IND'){const v=eqCL(md==='CAP'?'C':'L');return v===v?fmt(v,md==='CAP'?'F':'H'):'OL'}
  if((md==='ADC'||md==='AAC'||md==='OHM'||md==='DIODE')&&!E.M)return 'yalnız DC modülü';
  if(acc.n===0)return md[0]==='V'?'boşta':'—';
  const m=acc.s/acc.n,r=Math.sqrt(Math.max(0,acc.q/acc.n-m*m));
  if(md==='VDC')return(Math.abs(m)<0.0005?0:m).toFixed(Math.abs(m)<10?3:2)+' V';
  if(md==='VAC')return r.toFixed(r<10?3:2)+' V~';
  if(md==='ADC'){if(Math.abs(m)>10)return 'SİGORTA!';return fmt(Math.abs(m)<1e-7?0:m,'A')}
  if(md==='AAC')return fmt(r,'A')+'~';
  if(md==='DIODE')return m>2.8?'OL':m.toFixed(3)+' V';
  if(md==='OHM'){const R=DM.ohmR;let txt;
    if(m>2.85)txt='OL';else if(m<0)txt='—';else txt=fmt(m*R/(3-m),'Ω');
    // otomatik kademe: ölçülen gerilim 0.3…2.7 V arasında kalsın
    const L=[300,3e3,3e4,3e5,3e6,3e7];let i=L.indexOf(R);
    if(m>2.7&&i<L.length-1)DM.ohmR=L[i+1];else if(m<0.3&&i>0)DM.ohmR=L[i-1];
    return txt}
  return '—'}

/* ---------------- panel çizimi + netlist çıkarımı ---------------- */
const BC=['#111','#7b4a1e','#d32f2f','#f57c00','#fdd835','#2e7d32','#1565c0','#7b1fa2','#8d8d8d','#fafafa'],GOLD='#c9a227',SILV='#b9bcc0';
function bands(v,five){const nd=five?3:2;let e=Math.floor(Math.log10(v)+1e-9);let m=Math.round(v/Math.pow(10,e-nd+1));if(m>=Math.pow(10,nd)){m=Math.round(m/10);e++}
  const dg=String(m).padStart(nd,'0').split('').map(Number),x=e-nd+1;
  return[...dg.map(d=>BC[d]),x>=0?BC[x]:x===-1?GOLD:SILV,five?BC[1]:GOLD]}
const vlab=(v,u='')=>{const a=Math.abs(v);const P=[[1e6,'M'],[1e3,'K'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']];
  for(const[s,p]of P)if(a>=s*0.999){let x=+(v/s).toPrecision(3);let t=String(x);if(u===''&&p==='')return t+'R';if(u===''&&t.includes('.'))return t.replace('.',p);return t+p+u}return v+u};
const fmtVal=vlab;
function makeDC(n,title,build){
  const el=h('div',{class:'modp dcp',style:`left:${MX}px;top:${MY}px;width:${MW}px;height:${MH}px;display:none`});TR.append(el);
  const code='Y-0016/'+String(n).padStart(3,'0');
  const M={id:100+n,fam:'dc',dcn:n,title,code,comps:[],an:[],el,mounted:false,on:true,fh:0,thr:2,hi:5,lo:0,
    opts:h('div',{class:'mopt',style:'display:none'})};MODS.push(M);
  const P=[],pts=[],segs=[],jk=[],ann=[],ties=[];
  const key=(x,y)=>Math.round(x*2)+':'+Math.round(y*2);
  const pt=(x,y)=>{pts.push([x,y]);return[x,y]};
  const D={M,el,P,
    raw:s=>P.push(s),
    t:(x,y,s,sz=5.6,a='middle',ex='')=>P.push(`<text x="${x}" y="${y}" font-size="${sz}" text-anchor="${a}" ${/fill=/.test(ex)?'':`fill="${INK}"`} ${ex}>${s}</text>`),
    ln:(x1,y1,x2,y2,w=.9,ex='')=>P.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w}" ${ex}/>`),
    rect:(x,y,w,hh,ex='')=>P.push(`<rect x="${x}" y="${y}" width="${w}" height="${hh}" ${ex}/>`),
    /* tel: [x,y, x,y, ...] kırık çizgi */
    w:(...c)=>{let d='';for(let i=0;i<c.length;i+=2){pt(c[i],c[i+1]);d+=(i?'L':'M')+c[i]+' '+c[i+1];if(i)segs.push([c[i-2],c[i-1],c[i],c[i+1]])}
      P.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>`)},
    dot:(x,y)=>P.push(`<circle cx="${x}" cy="${y}" r="1.7" fill="${INK}"/>`),
    /* soket */
    j:(x,y,lab,pos='t',name)=>{pt(x,y);jk.push({x,y,lab,pos,name});
      if(lab){const o={t:[x,y-8,'middle'],b:[x,y+13,'middle'],l:[x-8,y+2,'end'],r:[x+8,y+2,'start']}[pos];if(o)D.t(o[0],o[1],lab,5.4,o[2])}return[x,y]},
    sub:(x,y,w,hh,exp,ttl)=>{P.push(`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="2" fill="none" stroke="${INK}" stroke-width="1.1"/>`);
      if(exp)D.t(x+5,y+hh-5,exp,5,'start');if(ttl)D.t(x+w-5,y+hh-5,ttl,5,'end')},
    lab:(x,y,s,a='middle')=>D.t(x,y,s,5.4,a),
    gnd:(x,y,ref)=>{D.ln(x-6,y,x+6,y,1.2);D.ln(x-3.5,y+2.5,x+3.5,y+2.5,1);D.ln(x-1.5,y+5,x+1.5,y+5,1);if(ref){pt(x,y);ties.push([[x,y],ref])}},
    /* görünmez bağlantı (toprak / besleme etiketi): çizimde tel yok, devrede var */
    tie:(a,b)=>{pt(...a);pt(...b);ties.push([a,b])},
    /* yalnız çizim: bobin sembolü (kuplajlı bobin için) */
    Lsym:(x1,y1,x2,y2,lab,lp)=>{let d='M-10 0';for(let i=0;i<4;i++)d+='a2.5 2.5 0 0 1 5 0';two(x1,y1,x2,y2,`<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.2"/>`,20,lab||'',lp)}
  };
  /* iki uçlu eleman: yerel çizim (x ekseni boyunca, -L/2..L/2) döndürülür */
  const two=(x1,y1,x2,y2,body,bl,lab,lp)=>{pt(x1,y1);pt(x2,y2);const L=Math.hypot(x2-x1,y2-y1),a=Math.atan2(y2-y1,x2-x1)*180/Math.PI,mx=(x1+x2)/2,my=(y1+y2)/2;
    P.push(`<g transform="translate(${mx} ${my}) rotate(${a})"><line x1="${-L/2}" y1="0" x2="${-bl/2}" y2="0" stroke="${INK}" stroke-width="1"/><line x1="${bl/2}" y1="0" x2="${L/2}" y2="0" stroke="${INK}" stroke-width="1"/>${body}</g>`);
    if(lab){const vert=Math.abs(x2-x1)<Math.abs(y2-y1);const side=lp||(vert?'r':'t');const o={t:[mx,my-6.5,'middle'],b:[mx,my+11,'middle'],r:[mx+7,my+2,'start'],l:[mx-7,my+2,'end']}[side];
      lab.split('\n').forEach((s,i)=>D.t(o[0],o[1]+i*6,s,5.2,o[2]))}};
  const add=(t,points,o={})=>{const e={t,pts:points,...o};M.an.push(e);return e};
  D.R=(x1,y1,x2,y2,v,name,o={})=>{const five=!!o.five,c=bands(o.nom||v,five),bl=o.bl||18;
    let b=`<rect x="${-bl/2}" y="-3.2" width="${bl}" height="6.4" rx="2.6" fill="${five?'#8fc3e6':'#e2cf9e'}" stroke="#6b5a3a" stroke-width=".5"/>`;
    const xs=five?[-6,-3.4,-0.8,1.8,6]:[-5.5,-2.6,0.3,5.6];xs.forEach((x,i)=>b+=`<rect x="${x*bl/18-0.8}" y="-3.1" width="1.6" height="6.2" fill="${c[i]}"/>`);
    two(x1,y1,x2,y2,b,bl,o.lab===undefined?(name?name+(o.nolab?'':' '+vlab(o.nom||v)):''):o.lab,o.lp);return add('R',[[x1,y1],[x2,y2]],{v,name})};
  D.C=(x1,y1,x2,y2,v,name,o={})=>{const pol=v>=1e-6&&o.pol!==false;
    const b=pol?`<line x1="-1.8" y1="-6" x2="-1.8" y2="6" stroke="${INK}" stroke-width="1.4"/><path d="M2.6 -6Q0.8 0 2.6 6" fill="none" stroke="${INK}" stroke-width="1.4"/><text x="-5" y="-3" font-size="5" fill="${INK}" text-anchor="middle" transform="rotate(${0})">+</text>`
      :`<line x1="-1.6" y1="-6" x2="-1.6" y2="6" stroke="${INK}" stroke-width="1.4"/><line x1="1.6" y1="-6" x2="1.6" y2="6" stroke="${INK}" stroke-width="1.4"/>`;
    two(x1,y1,x2,y2,b,pol?5.2:3.2,o.lab===undefined?(name?name+' '+(typeof v==='function'?'':vlab(v,'F')):''):o.lab,o.lp);return add('C',[[x1,y1],[x2,y2]],{v:o.f||v,name})};
  D.L=(x1,y1,x2,y2,v,name,o={})=>{let d='M-10 0';for(let i=0;i<4;i++)d+='a2.5 2.5 0 0 1 5 0';
    two(x1,y1,x2,y2,`<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.2"/>`+(o.core?`<line x1="-10" y1="-4.5" x2="10" y2="-4.5" stroke="${INK}" stroke-width=".8"/><line x1="-10" y1="-6" x2="10" y2="-6" stroke="${INK}" stroke-width=".8"/>`:''),20,o.lab===undefined?(name?name+' '+vlab(v,'H'):''):o.lab,o.lp);
    return add('L',[[x1,y1],[x2,y2]],{v,rdc:o.rdc||Math.max(1,v*1000),name})};
  /* diyot: (x1,y1)=anot, (x2,y2)=katot. kind: d | z | led */
  D.D=(x1,y1,x2,y2,name,o={})=>{const k=o.kind||'d';
    let b=`<path d="M-3.5 -4.2L3.5 0L-3.5 4.2Z" fill="${INK}"/>`;
    if(k==='z')b+=`<path d="M1.6 -5.6L3.5 -4.2L3.5 4.2L5.4 5.6" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
    else b+=`<line x1="3.5" y1="-4.4" x2="3.5" y2="4.4" stroke="${INK}" stroke-width="1.3"/>`;
    if(k==='led')b+=`<path d="M0 -6l3 -4M2 -10l1 0l0 1.3M3 -6l3 -4M5 -10l1 0l0 1.3" stroke="${INK}" stroke-width=".7" fill="none"/>`;
    two(x1,y1,x2,y2,b,7.6,o.lab===undefined?(name||''):o.lab,o.lp);
    const p=o.p||(k==='z'?S.P.zener(o.vz||6.2):k==='led'?S.P.led(o.col||'red'):S.P.d1n4007);
    const e=add('D',[[x1,y1],[x2,y2]],{p,name});
    if(k==='led'){const mx=(x1+x2)/2,my=(y1+y2)/2,l=mkLed(el,mx+(o.lx||0),my+(o.ly||0),(o.col==='green'?'g':o.col==='yellow'?'y':'')+' sm');ann.push(()=>obs.push({acc:0,fn:()=>{const i=e.el?e.el.i:0;return clamp(i/0.012,0,1)},set:b=>l.set(b)}))}
    return e};
  /* BJT: (x,y) gövde merkezi; uçlar B (sol), C (üst), E (alt); rot: 0 | 90 | -90 | 180; mir: aynala */
  D.Q=(x,y,model,name,o={})=>{const rot=o.rot||0,sx=o.mir?-1:1,pnp=(model.pol||1)<0;const cs=Math.cos(rot*Math.PI/180),sn=Math.sin(rot*Math.PI/180);
    const R=(dx,dy)=>[x+(dx*sx)*cs-dy*sn,y+(dx*sx)*sn+dy*cs];
    const B=R(-14,0),C=R(6,-14),Em=R(6,14);
    const ar=pnp?`<path d="M-1.6 4.8L-4.6 2.6L-1.2 1.6Z" fill="${INK}" transform="translate(${0} 0)"/>`:`<path d="M5.2 8.6L1.6 8.1L3.4 5.3Z" fill="${INK}"/>`;
    P.push(`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sx} 1)"><circle cx="1.5" cy="0" r="10" fill="#fff" stroke="${INK}" stroke-width="1"/><line x1="-14" y1="0" x2="-5" y2="0" stroke="${INK}" stroke-width="1"/><line x1="-5" y1="-6" x2="-5" y2="6" stroke="${INK}" stroke-width="1.8"/><path d="M-5 -2.6L6 -9V-14M-5 2.6L6 9V14" fill="none" stroke="${INK}" stroke-width="1"/>${ar}</g>`);
    if(name){const lp=o.lp||[x+13,y-2];name.split('\n').forEach((s,i)=>D.t(lp[0],lp[1]+i*6,s,5.2,o.la||'start'))}
    pt(...B);pt(...C);pt(...Em);add('Q',[C,B,Em],{p:model,name});return{b:B,c:C,e:Em}};
  /* FET: J (N-kanal JFET) | M (N-kanal E-MOSFET); uçlar G (sol), D (üst), S (alt) */
  D.F=(x,y,kind,model,name,o={})=>{const G=[x-14,y+(kind==='J'?4:0)],Dd=[x+6,y-14],Ss=[x+6,y+14];
    let b=`<circle cx="1.5" cy="0" r="10" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
    if(kind==='J')b+=`<line x1="-2" y1="-7" x2="-2" y2="7" stroke="${INK}" stroke-width="1.8"/><path d="M-14 4H-2M-2 -4H6V-14M-2 4H6V14" fill="none" stroke="${INK}" stroke-width="1"/><path d="M-3 4L-7 2L-7 6Z" fill="${INK}"/>`;
    else b+=`<line x1="-6" y1="-6" x2="-6" y2="6" stroke="${INK}" stroke-width="1.2"/><line x1="-14" y1="0" x2="-6" y2="0" stroke="${INK}" stroke-width="1"/><path d="M-3 -7V-3M-3 -1.8V1.8M-3 3V7" stroke="${INK}" stroke-width="1.6"/><path d="M-3 -5H6V-14M-3 5H6V14M-3 0H6V5" fill="none" stroke="${INK}" stroke-width="1"/><path d="M-2.6 0L1.4 -2L1.4 2Z" fill="${INK}"/>`;
    P.push(`<g transform="translate(${x} ${y})">${b}</g>`);
    if(name)name.split('\n').forEach((s,i)=>D.t(x+13,y-2+i*6,s,5.2,'start'));
    pt(...G);pt(...Dd);pt(...Ss);add(kind,[G,Dd,Ss],{p:model,name});return{g:G,d:Dd,s:Ss}};
  /* potansiyometre: uçlar (x1,y1)…(x2,y2); orta uç ortadan 'side' yönünde 11 px; düğme (kx,ky) */
  D.POT=(x1,y1,x2,y2,v,name,kkey,o={})=>{const mx=(x1+x2)/2,my=(y1+y2)/2,L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L;
    const sd=o.side||1,px=-uy*sd,py=ux*sd,W=[mx+px*11,my+py*11];
    two(x1,y1,x2,y2,`<rect x="-9" y="-3.2" width="18" height="6.4" fill="#fff" stroke="${INK}" stroke-width="1"/>`,18,'');
    P.push(`<path d="M${W[0]} ${W[1]}L${mx+px*4} ${my+py*4}" stroke="${INK}" stroke-width="1"/><path d="M${mx+px*3.4} ${my+py*3.4}l${(px*3-py*1.8).toFixed(2)} ${(py*3+px*1.8).toFixed(2)}l${(py*3.6).toFixed(2)} ${(-px*3.6).toFixed(2)}Z" fill="${INK}"/>`);
    pt(...W);if(K[kkey]===undefined)K[kkey]=o.k0??.5;
    if(o.kx!=null){const kr=o.kr||12;mkKnob(kkey,o.kx,o.ky,kr,{parent:el,title:(name||'')+' '+vlab(v)+' – sürükleyin / tekerlek',onch:()=>{E.need=true}});
      if(name)D.t(o.kx,o.ky+kr+7,name+' '+vlab(v),5.4)}
    else if(name)D.t(mx-px*12,my-py*12+2,name+' '+vlab(v),5.2,px>0?'end':px<0?'start':'middle');
    add('POT',[[x1,y1],W,[x2,y2]],{v,key:kkey,name});return W};
  /* işlemsel kuvvetlendirici: − giriş üstte, + giriş altta; V+ üst, V− alt */
  D.OA=(x,y,name,o={})=>{const m=[x-20,y-6],p=[x-20,y+6],out=[x+20,y],vp=[x,y-16],vn=[x,y+16];
    P.push(`<g transform="translate(${x} ${y})"><path d="M-12 -14L-12 14L14 0Z" fill="#fff" stroke="${INK}" stroke-width="1.1"/><path d="M-20 -6H-12M-20 6H-12M14 0H20M0 -7.4V-16M0 7.4V16" stroke="${INK}" stroke-width="1"/><text x="-9.5" y="-3.6" font-size="6" fill="${INK}">−</text><text x="-9.5" y="8.4" font-size="6" fill="${INK}">+</text></g>`);
    if(name)D.t(x+4,y+24,name,5.4);pt(...m);pt(...p);pt(...out);pt(...vp);pt(...vn);add('OA',[p,m,out,vp,vn],{p:o.p||{A:2e5,Ro:75,head:1.5}});return{m,p,o:out,vp,vn}};
  D.LAMP=(x1,y1,x2,y2,name,o={})=>{const mx=(x1+x2)/2,my=(y1+y2)/2;two(x1,y1,x2,y2,`<circle r="6" fill="#fff" stroke="${INK}" stroke-width="1"/><path d="M-4.2 -4.2L4.2 4.2M-4.2 4.2L4.2 -4.2" stroke="${INK}" stroke-width="1"/>`,12,name||'',o.lp);
    const R=o.r||200,Pn=o.pw||0.6;const e=add('LAMP',[[x1,y1],[x2,y2]],{v:R,name});
    const d=h('div',{class:'lamp',style:`left:${mx}px;top:${my}px;width:22px;height:22px;margin:-11px 0 0 -11px`});el.append(d);
    ann.push(()=>obs.push({acc:0,fn:()=>{const v=rdV(e.ji[0])-rdV(e.ji[1]);return v===v?v*v/R/Pn:0},set(k){k=clamp(k,0,1.6);d.style.background=k<.03?'transparent':`radial-gradient(circle,#fffbe0 0,#ffe27a ${20+k*15}%,#ffa600 55%,transparent 75%)`;d.style.opacity=clamp(.2+k,0,1)}}));return e};
  D.SPK=(x1,y1,x2,y2,name)=>{two(x1,y1,x2,y2,`<rect x="-4" y="-4" width="5" height="8" fill="#fff" stroke="${INK}" stroke-width="1"/><path d="M1 -4L7 -9V9L1 4Z" fill="#fff" stroke="${INK}" stroke-width="1"/>`,12,name||'LS 8Ω');return add('SPK',[[x1,y1],[x2,y2]],{name})};
  /* kristal: seri RLC (hareket kolu) + paralel C0 — iç düğümler çizimde görünmez */
  D.XT=(x1,y1,x2,y2,f,name)=>{two(x1,y1,x2,y2,`<line x1="-5" y1="-6" x2="-5" y2="6" stroke="${INK}" stroke-width="1.2"/><line x1="5" y1="-6" x2="5" y2="6" stroke="${INK}" stroke-width="1.2"/><rect x="-3" y="-7" width="6" height="14" fill="#fff" stroke="${INK}" stroke-width="1"/>`,10,name||'');
    const Lm=0.1,Cm=1/(Math.pow(2*Math.PI*f,2)*Lm);const a=[x1,y1],b=[x2,y2],i1=[x1+.01,y1+3e3],i2=[x1+.02,y1+3e3];
    add('L',[a,i1],{v:Lm,rdc:2*Math.PI*f*Lm/300});add('C',[i1,i2],{v:Cm});add('R',[i2,b],{v:1});add('C',[a,b],{v:5e-12});return{f}};
  /* kuplajlı bobin çifti (Hartley orta uçlu bobini): a1-b1 ve a2-b2 */
  D.X=(a1,b1,a2,b2,l1,l2,k,name,o={})=>{add('X',[a1,b1,a2,b2],{l1,l2,k,name})};
  /* yerleşik DC voltmetre göstergesi (M4) */
  D.VMETER=(x,y,pa,pb)=>{D.raw(`<rect x="${x}" y="${y}" width="62" height="34" rx="2" fill="#222" stroke="${INK}"/>`);D.t(x+31,y+8,'DC VOLTMETER',4.8,'middle','fill="#ddd"');
    const g=cvIn(el,x+5,y+11,52,19);M.vmeter={g,pa,pb,last:''};pt(...pa);pt(...pb);return M.vmeter};
  /* ses kuvvetlendirici entegresi (TBA820M benzeri): vo = Vcc/2 + A·vin, raylarda kırpılır */
  D.amp=(pi,po,pv,pg,p)=>{[pi,po,pv,pg].forEach(q=>pt(...q));add('OA',[pi,pg,po,pv,pg],{p})};
  /* görünmez eleman (ör. bobin kayıp direnci) */
  D.add_=(t,points,o)=>{points.forEach(q=>pt(...q));return add(t,points,o)};
  D.knob=(kkey,x,y,r,title,k0=.5)=>{if(K[kkey]===undefined)K[kkey]=k0;return mkKnob(kkey,x,y,r,{parent:el,title,onch:()=>{E.need=true}})};

  /* panel çerçevesi */
  P.push(`<rect x="0" y="0" width="${MW}" height="${MH}" rx="6" fill="${PANEL}" stroke="#9a9a92" stroke-width="2"/>`);
  for(const[x,y]of[[6,6],[336,6],[6,344],[336,344],[171,344],[171,6]])P.push(`<circle cx="${x}" cy="${y}" r="2.4" fill="#c9c9c2" stroke="#8a8a84" stroke-width=".6"/>`);
  D.raw('<rect x="12" y="8" width="16" height="12" rx="3" fill="#0d3b57"/><path d="M14 14Q16.5 9 19 14T24 14T26 14" fill="none" stroke="#ffd23f" stroke-width="1.6" stroke-linecap="round"/>');D.t(32,13,'EĞİTİM MODÜLÜ',6.4,'start','font-weight="800"');D.t(32,20,'DC DEVRELER',4.6,'start');
  D.t(330,18,code,8,'end');
  build(D);
  /* --- netlist çıkarımı --- */
  const par=new Map();const f=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k)}return k};
  const u=(a,b)=>{a=f(a);b=f(b);if(a!==b)par.set(a,b)};
  for(const[x,y]of pts){const k=key(x,y);if(!par.has(k))par.set(k,k)}
  for(const[x1,y1,x2,y2]of segs){u(key(x1,y1),key(x2,y2));
    const L2=(x2-x1)**2+(y2-y1)**2;if(L2<1e-6)continue;
    for(const[x,y]of pts){const t=((x-x1)*(x2-x1)+(y-y1)*(y2-y1))/L2;if(t<=1e-6||t>=1-1e-6)continue;
      const dx=x1+t*(x2-x1)-x,dy=y1+t*(y2-y1)-y;if(dx*dx+dy*dy<0.36)u(key(x,y),key(x1,y1))}}
  for(const[a,b]of ties)u(key(...a),key(...b));
  const nodeName=k=>`d${n}:${f(k)}`;
  const rep=new Map();
  jk.forEach((q,i)=>{const k=key(q.x,q.y),id=`dc${n}:${q.name||('j'+i)}`;const lab=(q.lab||'').replace(/<[^>]+>/g,'');
    const ix=mkJack(el,'jack s',id,`DC${n} ${lab||q.name||'soket'}`,nodeName(k),`left:${q.x}px;top:${q.y}px`);if(!rep.has(f(k)))rep.set(f(k),ix);q.ix=ix});
  const jOf=([x,y])=>{const k0=key(x,y);if(!par.has(k0))par.set(k0,k0);const r=f(k0);if(rep.has(r))return rep.get(r);const i=J.length,id=`dc${n}:n${i}`;jid[id]=i;J.push({i,id,el:null,node:nodeName(key(x,y)),label:'iç düğüm',wired:0});rep.set(r,i);return i};
  for(const e of M.an)e.ji=e.pts.map(jOf);
  if(M.vmeter){M.vmeter.ja=jOf(M.vmeter.pa);M.vmeter.jb=jOf(M.vmeter.pb)}
  const sv_=document.createElementNS('http://www.w3.org/2000/svg','svg');sv_.setAttribute('width',MW);sv_.setAttribute('height',MH);sv_.setAttribute('viewBox',`0 0 ${MW} ${MH}`);
  sv_.setAttribute('style','position:absolute;left:0;top:0;pointer-events:none');sv_.setAttribute('font-family','Arial Narrow,Helvetica Neue,Arial,sans-serif');sv_.setAttribute('font-weight','700');
  sv_.innerHTML=P.join('');el.prepend(sv_);
  ann.forEach(a=>a());
  M.render=()=>{const vm=M.vmeter;if(vm&&frameN%4===0){const a=rdV(vm.ja),b=rdV(vm.jb);let v=a===a&&b===b?a-b:0;const t=ST.power||Math.abs(v)>0.001?(v<0?'-':'')+Math.abs(v).toFixed(2).padStart(5,'0'):'';
      if(t!==vm.last){vm.last=t;drawNum(vm.g,52,19,t||'    ',!!t)}}
    if(M.extra)M.extra()};
  $('#mods').append(M.opts);
  return M}

/* ---------------- modül tanımları: dc-moduller-liste.js ---------------- */
const DEFS=[];
function def(n,title,cat,build,info){DEFS.push({n,title,cat,build,info})}
function buildAll(){
  for(const d of DEFS){const M=makeDC(d.n,d.title,d.build);M.cat=d.cat;
    if(d.info)M.opts.append(h('div',{class:'orow dcinfo',html:d.info}))}}
return{DM,MODES,eqCLj,hook:f=>HOOKS.push(f),addSrc:(id,r)=>SRC.push([id,r]),plan,step,tune,psu,spkV,dmmSample,dmmText,def,buildAll,activeM,E,fmtVal:vlab,need:()=>{E.need=true}}})();
