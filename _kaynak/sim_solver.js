/* ================= Devre çözücü: MNA + Newton-Raphson + geri Euler ================= */
const Solver=(function(){
'use strict';
const VT=0.025852,GMIN=1e-9;
function pnjlim(vnew,vold,nvt,vcrit){
  if(vnew>vcrit&&Math.abs(vnew-vold)>2*nvt){
    if(vold>0){const arg=1+(vnew-vold)/nvt;vnew=arg>0?vold+nvt*Math.log(arg):vcrit;}
    else vnew=nvt*Math.log(vnew/nvt);
  }
  return vnew;
}
/* ---- Eleman fabrikaları: her eleman {lin(c), dyn(c,x,t), accept(x,t,dt), nl} ---- */
function R(a,b,r){return {a,b,r,lin(c){c.G(a,b,1/r);},cur(x){return (x[a]-x[b])/r;}};}
function Vsrc(a,b,fn,rint){ // a:+ b:- Norton
  return {a,b,rint,fn,v:0,lin(c){c.G(a,b,1/rint);},dyn(c,x,t){this.v=fn(t);c.I(b,a,this.v/rint);},cur(x){return (this.v-(x[a]-x[b]))/rint;}};
}
function Vlim(a,b,fnV,rint,ilim,st){ // CV/CC laboratuvar kaynağı: mod her adımda seçilir
  if(!st.mode)st.mode='cv';
  return {a,b,st,v:0,dyn(c,x,t){
    const V=fnV(t);this.v=V;
    if(st.mode==='cv'){c.G(a,b,1/rint);c.I(b,a,V/rint);}else{c.G(a,b,1e-6);c.I(b,a,ilim);}
  },accept(x){
    const v=x[a]-x[b];const i=st.mode==='cv'?(this.v-v)/rint:ilim-1e-6*v;st.i=i;st.vout=v;
    if(st.mode==='cv'&&i>ilim)st.mode='cc';else if(st.mode==='cc'&&v>=this.v)st.mode='cv';
  },cur(){return st.i||0;}};
}
function Cap(a,b,C,st){
  if(st.v===undefined)st.v=0;
  return {a,b,C,st,g:0,lin(c){this.g=C/c.dt;c.G(a,b,this.g);},dyn(c){c.I(b,a,this.g*st.v);},
    accept(x){const v=x[a]-x[b];st.i=this.g*(v-st.v);st.v=v;},cur(){return st.i||0;}};
}
function Ind(a,b,L,Rdc,st){
  if(st.i===undefined)st.i=0;
  return {a,b,L,st,g:0,k:0,lin(c){this.g=c.dt/(L+Rdc*c.dt);this.k=L/(L+Rdc*c.dt);c.G(a,b,this.g);},
    dyn(c){c.I(a,b,this.k*st.i);},accept(x){st.i=this.g*(x[a]-x[b])+this.k*st.i;},cur(){return st.i;}};
}
/* Diyot: Is, n, (isteğe bağlı) Vz zener kırılması */
function Diode(a,k,p,st){
  const nvt=p.n*VT,vcrit=nvt*Math.log(nvt/(Math.SQRT2*p.Is));
  if(st.vd===undefined)st.vd=0;
  return {a,k,nl:true,st,vd:st.vd,i:0,
    dyn(c,x){
      const vr=x[a]-x[k];let v=vr;
      if(v>=0||!p.Vz)v=pnjlim(v,this.vd,nvt,vcrit);
      if(p.Vz&&v<-p.Vz+0.2){const vo=this.vd;if(v<vo-0.3)v=vo-0.3;}
      if(v<-1e3)v=-1e3;
      this.lim=Math.abs(v-vr)>1e-4;this.vd=v;
      const e=Math.exp(Math.min(v/nvt,80));
      let i=p.Is*(e-1),g=p.Is*e/nvt;
      if(p.Vz){const nz=VT*(p.nz||1),ez=Math.exp(Math.min((-v-p.Vz)/nz,80));i-=p.Ib*ez;g+=p.Ib*ez/nz;}
      g+=GMIN;
      c.G(a,k,g);c.I(a,k,i-g*v);
    },
    accept(x){const v=this.vd;st.vd=v;const e=Math.exp(Math.min(v/nvt,80));let i=p.Is*(e-1);if(p.Vz){const nz=VT*(p.nz||1);i-=p.Ib*Math.exp(Math.min((-v-p.Vz)/nz,80));}this.i=i;st.i=i;},
    cur(){return this.i;}};
}
/* N-kanal MOSFET (seviye 1) */
function Mos(g,d,s,p,st){
  if(st.vgs===undefined){st.vgs=0;}
  return {nl:true,st,vgs:st.vgs,id:0,
    dyn(c,x){
      let vd=x[d],vs=x[s],dd=d,ss=s;
      if(vd<vs){[vd,vs]=[vs,vd];dd=s;ss=d;}
      const vgr=x[g]-vs;let vgs=vgr;const vo=this.vgs;if(vgs>vo+1)vgs=vo+1;if(vgs<vo-1)vgs=vo-1;this.lim=Math.abs(vgs-vgr)>1e-4;this.vgs=vgs;
      const vds=vd-vs,vov=vgs-p.Vth;let id=0,gm=0,gds=0;
      if(vov>0){
        if(vds<vov){id=p.K*(vov*vds-vds*vds/2);gm=p.K*vds;gds=p.K*(vov-vds);}
        else{id=p.K/2*vov*vov*(1+p.lam*vds);gm=p.K*vov*(1+p.lam*vds);gds=p.K/2*vov*vov*p.lam;}
      }
      gds+=GMIN;
      // dd satırı: dd'den ss'ye akım
      c.A(dd,dd,gds);c.A(dd,ss,-gds-gm);c.A(dd,g,gm);
      c.A(ss,dd,-gds);c.A(ss,ss,gds+gm);c.A(ss,g,-gm);
      const ieq=id-gds*vds-gm*vgs;c.I(dd,ss,ieq);
    },
    accept(x){st.vgs=this.vgs;const vgs=x[g]-Math.min(x[d],x[s]),vds=Math.abs(x[d]-x[s]),vov=vgs-p.Vth;let id=0;if(vov>0)id=vds<vov?p.K*(vov*vds-vds*vds/2):p.K/2*vov*vov;this.id=id;}};
}
/* ---- Çözücü ---- */
class Sim{
  constructor(){this.N=0;this.els=[];this.t=0;this.dt=1e-5;this.x=new Float64Array(1);this.iters=0;this.fails=0;}
  setup(N,els,dt){
    this.N=N;this.els=els;this.dt=dt;
    const n=N;this.A0=new Float64Array(n*n);this.A=new Float64Array(n*n);this.b=new Float64Array(n);this.xs=new Float64Array(n);
    const old=this.x;this.x=new Float64Array(N+1);if(this.keep&&old.length===N+1)this.x.set(old);
    const A0=this.A0;
    const ctx={dt,G:(a,b,g)=>{if(a)A0[(a-1)*n+a-1]+=g;if(b)A0[(b-1)*n+b-1]+=g;if(a&&b){A0[(a-1)*n+b-1]-=g;A0[(b-1)*n+a-1]-=g;}}};
    for(let k=1;k<=n;k++)A0[(k-1)*n+k-1]+=GMIN;
    els.forEach(e=>e.lin&&e.lin(ctx));
    this.nl=els.some(e=>e.nl);
  }
  step(){
    const n=this.N,dt=this.dt,t=this.t+dt;
    if(n===0){this.t=t;return true;}
    const A=this.A,b=this.b,x=this.x,els=this.els;
    const ctx={dt,
      G:(a,c,g)=>{if(a)A[(a-1)*n+a-1]+=g;if(c)A[(c-1)*n+c-1]+=g;if(a&&c){A[(a-1)*n+c-1]-=g;A[(c-1)*n+a-1]-=g;}},
      A:(r,c,v)=>{if(r&&c)A[(r-1)*n+c-1]+=v;},
      I:(a,c,i)=>{if(a)b[a-1]-=i;if(c)b[c-1]+=i;}};
    let ok=false;
    for(let it=0;it<120;it++){
      A.set(this.A0);b.fill(0);
      for(let e=0;e<els.length;e++){const el=els[e];if(el.dyn)el.dyn(ctx,x,t);}
      if(!solve(A,b,n)){this.fails++;break;}
      let conv=true;
      for(let k=0;k<n;k++){const xn=b[k],d=Math.abs(xn-x[k+1]);if(d>1e-6+1e-4*Math.abs(xn))conv=false;x[k+1]=xn;}
      this.iters=it+1;
      if(conv&&this.nl){for(let e=0;e<els.length;e++){if(els[e].lim){conv=false;break;}}}
      if(conv||!this.nl){ok=true;break;}
    }
    if(!ok)this.fails++;
    for(let e=0;e<els.length;e++){const el=els[e];if(el.accept)el.accept(x,t,dt);}
    this.t=t;return ok;
  }
}
function solve(A,b,n){
  for(let c=0;c<n;c++){
    let p=c,mx=Math.abs(A[c*n+c]);
    for(let r=c+1;r<n;r++){const v=Math.abs(A[r*n+c]);if(v>mx){mx=v;p=r;}}
    if(mx<1e-300)return false;
    if(p!==c){for(let k=c;k<n;k++){const tmp=A[c*n+k];A[c*n+k]=A[p*n+k];A[p*n+k]=tmp;}const tb=b[c];b[c]=b[p];b[p]=tb;}
    const piv=A[c*n+c];
    for(let r=c+1;r<n;r++){const f=A[r*n+c]/piv;if(f===0)continue;for(let k=c;k<n;k++)A[r*n+k]-=f*A[c*n+k];b[r]-=f*b[c];}
  }
  for(let r=n-1;r>=0;r--){let s=b[r];for(let k=r+1;k<n;k++)s-=A[r*n+k]*b[k];b[r]=s/A[r*n+r];}
  return true;
}
/* ---- Model parametreleri ---- */
const LEDV={red:1.9,yellow:2.0,green:2.1,blue:3.0,white:3.1};
const P={
  d1n4007:{Is:7.02e-9,n:1.808},
  d1n5819:{Is:3e-5,n:1.04},
  zener:(vz)=>({Is:2.5e-9,n:1.75,Vz:vz,Ib:5e-3,nz:1}),
  led:(col)=>({Is:0.01/Math.exp(LEDV[col]/(2*VT)),n:2}),
  irfz44n:{Vth:3.0,K:20,lam:0.01},
  body:{Is:1e-12,n:1.0}
};
return {Sim,R,Vsrc,Vlim,Cap,Ind,Diode,Mos,P,LEDV,VT};
})();
if(typeof module!=='undefined')module.exports=Solver;
