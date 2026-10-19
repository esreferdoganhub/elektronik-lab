const S=require('./sim_solver.js');
for(const D of [0.25,0.5,0.75]){const f=20000;const gen=t=>{const p=(t*f)%1;return p<D?10:0;};
const els=[S.Vlim(1,0,()=>12,0.05,1,{}),S.R(1,2,220),S.Cap(1,2,47e-6,{}),S.Ind(2,3,10e-3,3,{}),S.Diode(3,1,S.P.d1n5819,{}),S.Mos(4,3,0,S.P.irfz44n,{}),S.Diode(0,3,S.P.body,{}),S.Vsrc(5,0,gen,50),S.R(5,4,0.01),S.R(4,0,10000)];
const sim=new S.Sim();sim.setup(5,els,0.25e-6);const t0=Date.now();let acc=0,n=0;while(sim.t<0.15){sim.step();if(sim.t>0.12){acc+=sim.x[1]-sim.x[2];n++;}}
console.log('D',D,'Vout',(acc/n).toFixed(3),'beklenen',(D*12).toFixed(2),'ms',Date.now()-t0,'fails',sim.fails);}
