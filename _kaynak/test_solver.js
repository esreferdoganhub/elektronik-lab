const S=require('./sim_solver.js');
function run(name,N,els,dt,T,probe){const sim=new S.Sim();sim.setup(N,els,dt);let acc=0,n=0,mx=-1e9,mn=1e9;const t0=Date.now();const steps=Math.round(T/dt);for(let k=0;k<steps;k++){sim.step();if(sim.t>T*0.6){const v=probe(sim.x);acc+=v;n++;mx=Math.max(mx,v);mn=Math.min(mn,v);}}
console.log(name,'avg',(acc/n).toFixed(4),'max',mx.toFixed(3),'min',mn.toFixed(3),'fails',sim.fails,'ms',Date.now()-t0,'steps',steps);return sim;}
// 1) pil + 680 + LED (Rs 8): nodes 1:+ 2:R/LED 3:ic(LED) 0:-
{const st={};const led=S.Diode(3,0,S.P.led('red'),st);
const els=[S.Vsrc(1,0,()=>9,1.5),S.R(1,2,680),S.R(2,3,8),led];
const sim=run('LED',3,els,1e-4,0.05,x=>x[2]);console.log(' I(mA)=',((sim.x[2]-sim.x[3])/8*1000).toFixed(2),'Vled',sim.x[2].toFixed(3));}
// 2) yarım dalga: trafo 12Vrms
{const st={};const els=[S.Vsrc(1,0,t=>12*Math.SQRT2*Math.sin(2*Math.PI*50*t),0.8),S.Diode(1,2,S.P.d1n4007,st),S.R(2,0,1000)];
run('Yarim dalga out',2,els,1e-4,0.2,x=>x[2]);}
// 3) yarım dalga + 100uF
{const els=[S.Vsrc(1,0,t=>12*Math.SQRT2*Math.sin(2*Math.PI*50*t),0.8),S.Diode(1,2,S.P.d1n4007,{}),S.R(2,0,1000),S.Cap(2,0,100e-6,{})];
run('Yarim dalga+C',2,els,1e-4,0.5,x=>x[2]);}
// 4) buck (ters): 1:Vin+ 0:gnd 2:X 3:drain 4:gate 5:gen
{const f=10000,D=0.5;const gen=t=>{const p=(t*f)%1;return p<D?10:0;};
const els=[S.Vlim(1,0,()=>12,0.05,1,{}),S.R(1,2,220),S.Cap(1,2,100e-6,{}),S.Ind(2,3,1e-3,1.5,{}),S.Diode(3,1,S.P.d1n5819,{}),S.Mos(4,3,0,S.P.irfz44n,{}),S.Diode(0,3,S.P.body,{}),S.Vsrc(5,0,gen,50),S.R(5,4,0.01),S.R(4,0,10000)];
run('Buck Vout',5,els,0.5e-6,0.08,x=>x[1]-x[2]);}
// 5) zener çift kırpıcı
{const els=[S.Vsrc(1,0,t=>8*Math.sin(2*Math.PI*1000*t),50),S.R(1,2,1000),S.Diode(3,2,S.P.zener(5.1),{}),S.Diode(3,0,S.P.zener(5.1),{})];
run('Zener kirpici',3,els,5e-6,0.01,x=>x[2]);}
