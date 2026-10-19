// Çözücü doğruluk ve ölçek testleri: node test_accuracy.js
const S=require('./sim_solver.js');
let bad=0;const chk=(ok,msg)=>{console.log((ok?'  ✓ ':'  ✗ ')+msg);if(!ok)bad++;};
// 1) Kayıpsız LC: 1 mH, 1 µF (~5.03 kHz), periyot başına 200 adım, 20 periyot
{const L=1e-3,C=1e-6,f=1/(2*Math.PI*Math.sqrt(L*C)),T=1/f,dt=T/200;
 const sim=new S.Sim();sim.setup(1,[S.Cap(1,0,C,{v:1}),S.Ind(1,0,L,0,{})],dt);sim.x[1]=1;
 let a0=0,a20=0;for(let k=0;k<200*20;k++){sim.step();const v=Math.abs(sim.x[1]);if(k<200)a0=Math.max(a0,v);if(k>=200*19)a20=Math.max(a20,v);}
 console.log('LC f0',f.toFixed(1),'Hz  ilk periyot genlik',a0.toFixed(4),' 20. periyot',a20.toFixed(4));
 chk(a20/a0>=0.95,'LC 20 periyot sonra genlik ≥%95 ('+(100*a20/a0).toFixed(2)+'%)');}
// 2) RC alçak geçiren 1k/1µF: 16 Hz, 159 Hz, 1.59 kHz kazançları
for(const f of [15.9155,159.155,1591.55]){
  const R=1e3,C=1e-6,dt=1/(f*200),sim=new S.Sim();
  sim.setup(2,[S.Vsrc(1,0,t=>Math.sin(2*Math.PI*f*t),1e-3),S.R(1,2,R),S.Cap(2,0,C,{})],dt);
  const n=Math.round(30/f/dt);let mx=0;for(let k=0;k<n;k++){sim.step();if(k>n*0.7)mx=Math.max(mx,Math.abs(sim.x[2]));}
  const ideal=1/Math.sqrt(1+(2*Math.PI*f*R*C)**2);
  chk(Math.abs(mx/ideal-1)<0.01,'RC '+f.toFixed(1)+' Hz kazanç '+mx.toFixed(4)+' ideal '+ideal.toFixed(4)+' ('+(100*(mx/ideal-1)).toFixed(2)+'%)');
}
// 3) Çınlama: kare dalga → 0.05 Ω kaynak → 0.01 Ω → 1 µF (τ ≪ dt) ve kaynakta bobin;
// saf trapez burada kenardan sonra yüzlerce adım süren ±0.5 A zikzak yapar; BDF2'de kenardan 5 adım sonra zikzak kalmamalı
{const sim=new S.Sim(),C=1e-6,dt=1e-5;
 const els=[S.Vsrc(1,0,t=>((t*1000)%1)<0.5?5:0,0.05),S.R(1,2,0.01),S.Cap(2,0,C,{}),S.Ind(1,0,10e-3,0.5,{})];
 sim.setup(2,els,dt);
 const ic=[];for(let k=0;k<3000;k++){sim.step();ic.push(els[2].cur());}
 let z=0,zm=0;for(let k=3;k<ic.length;k++){if((k+1)%50<6)continue;const d1=ic[k]-ic[k-1],d2=ic[k-1]-ic[k-2],d3=ic[k-2]-ic[k-3];if(d1*d2<0&&d2*d3<0&&Math.abs(d2)>1e-4){z++;zm=Math.max(zm,Math.abs(d2));}}
 chk(z===0,'sert devrede kare dalga kenarlarında çınlama yok (zikzak '+z+', en büyük '+zm.toExponential(1)+' A)');}
// 4) Ölçek: 80 düğümlü RC merdiveni + diyot yükleri, kare dalga
for(const NS of [20,80,200]){
  const els=[S.Vsrc(1,0,t=>((t*1000)%1)<0.5?5:-5,50)];
  for(let i=1;i<NS;i++){els.push(S.R(i,i+1,100));els.push(S.Cap(i+1,0,1e-7,{}));if(i%4===0)els.push(S.Diode(i+1,0,S.P.d1n4007,{}));}
  const sim=new S.Sim();sim.setup(NS,els,2e-6);
  const t0=Date.now();const steps=5000;for(let k=0;k<steps;k++)sim.step();const ms=Date.now()-t0;
  const sim2=new S.Sim();sim2.setup(NS,els.map(e=>e),2e-6);sim2.dense=true;
  console.log('  ',NS,'düğüm: seyrek',(ms/steps*1000).toFixed(1),'µs/adım; fails',sim.fails,'dense yedek',sim.nDense,'BE/BDF2 adım',sim.nBE+'/'+sim.nBD);
  if(NS<=80){const t1=Date.now();for(let k=0;k<1000;k++)sim2.step();const ms2=(Date.now()-t1)/1000*1000;console.log('     yoğun LU',ms2.toFixed(1),'µs/adım');}
  if(NS===80)chk(ms/steps<0.5,'80 düğüm adım süresi < 0.5 ms');
}
// 5) Seyrek ve yoğun çözüm aynı sonucu vermeli (MOSFET'li kıyıcı)
{const mk=()=>{const f=20000,gen=t=>((t*f)%1)<0.5?10:0;return [S.Vlim(1,0,()=>12,0.05,1,{}),S.R(1,2,220),S.Cap(1,2,47e-6,{}),S.Ind(2,3,10e-3,3,{}),S.Diode(3,1,S.P.d1n5819,{}),S.Mos(4,3,0,S.P.irfz44n,{}),S.Diode(0,3,S.P.body,{}),S.Vsrc(5,0,gen,50),S.R(5,4,0.01),S.R(4,0,10000)];};
 const a=new S.Sim();a.setup(5,mk(),0.25e-6);const b=new S.Sim();b.setup(5,mk(),0.25e-6);b.dense=true;
 for(let k=0;k<40000;k++){a.step();b.step();}
 chk(Math.abs((a.x[1]-a.x[2])-(b.x[1]-b.x[2]))<1e-6,'seyrek = yoğun (Vout '+(a.x[1]-a.x[2]).toFixed(4)+' / '+(b.x[1]-b.x[2]).toFixed(4)+')');}
console.log(bad?bad+' test BAŞARISIZ':'tüm testler geçti');process.exitCode=bad?1:0;
