/* ================= Devre çözücü: MNA + Newton-Raphson + Gear-2 (BDF2, ilk adım geri Euler) + seyrek LU ================= */
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
/* ---- Eleman fabrikaları: her eleman {nodes, lin(c), pre(t), dyn(c,x,t), accept(x,t,dt), nl} ----
   Entegrasyon Gear-2 (BDF2): L-kararlıdır, anahtarlamada trapez gibi adım-adım çınlamaz,
   kayıpsız LC'yi periyot başına 200 adımda 20 periyotta %0.1 sönümler. Geçmiş olmadığı için
   kurulumdan (setup) sonraki ilk adım geri Euler'dir (c.be=true).
   pre(t): adım başında kaynak değerini bir kez hesaplar. */
function R(a,b,r){return {a,b,r,nodes:[a,b],lin(c){c.G(a,b,1/r);},cur(x){return (x[a]-x[b])/r;}};}
function Vsrc(a,b,fn,rint){ // a:+ b:- Norton
  return {a,b,rint,fn,v:0,nodes:[a,b],lin(c){c.G(a,b,1/rint);},
    pre(t){this.v=fn(t);},dyn(c){c.I(b,a,this.v/rint);},cur(x){return (this.v-(x[a]-x[b]))/rint;}};
}
function Vlim(a,b,fnV,rint,ilim,st){ // CV/CC laboratuvar kaynağı: mod her adımda seçilir
  if(!st.mode)st.mode='cv';
  return {a,b,st,v:0,nodes:[a,b],mdyn:true,
    pre(t){this.v=fnV(t);},
    dyn(c){
      const V=this.v;
      if(st.mode==='cv'){c.G(a,b,1/rint);c.I(b,a,V/rint);}else{c.G(a,b,1e-6);c.I(b,a,ilim);}
    },accept(x){
      const v=x[a]-x[b];const i=st.mode==='cv'?(this.v-v)/rint:ilim-1e-6*v;st.i=i;st.vout=v;
      if(st.mode==='cv'&&i>ilim)st.mode='cc';else if(st.mode==='cc'&&v>=this.v)st.mode='cv';
    },cur(){return st.i||0;}};
}
/* Kondansatör: BE  i = C/dt·(v−v1);  BDF2  i = C/dt·(1.5v − 2v1 + 0.5v2)   (v1, v2: önceki iki adım) */
function Cap(a,b,C,st){
  if(st.v===undefined)st.v=0;
  return {a,b,C,st,g:0,be:true,nodes:[a,b],
    lin(c){c.G(a,b,(c.be?1:1.5)*C/c.dt);},
    dyn(c){const k=C/c.dt;this.be=c.be;
      if(c.be){this.g=k;c.I(b,a,k*st.v);}
      else{this.g=1.5*k;c.I(b,a,k*(2*st.v-0.5*(st.v2===undefined?st.v:st.v2)));}},
    accept(x,t,dt){const v=x[a]-x[b];st.i=this.be?this.g*(v-st.v):C/dt*(1.5*v-2*st.v+0.5*(st.v2===undefined?st.v:st.v2));st.v2=st.v;st.v=v;},cur(){return st.i||0;}};
}
/* Bobin (seri Rdc ile), v = L·di/dt + Rdc·i:
   BE  i=(dt·v+L·i1)/(L+R·dt);  BDF2  i=(dt·v+L·(2i1−0.5i2))/(1.5L+R·dt) */
function Ind(a,b,L,Rdc,st){
  if(st.i===undefined)st.i=0;
  return {a,b,L,st,g:0,k:0,be:true,nodes:[a,b],
    lin(c){c.G(a,b,c.be?c.dt/(L+Rdc*c.dt):c.dt/(1.5*L+Rdc*c.dt));},
    dyn(c){
      const dt=c.dt;
      if(c.be){const d=L+Rdc*dt;this.g=dt/d;this.h=L*st.i/d;}
      else{const d=1.5*L+Rdc*dt;this.g=dt/d;this.h=L*(2*st.i-0.5*(st.i2===undefined?st.i:st.i2))/d;}
      c.I(a,b,this.h);
    },
    accept(x){const i=this.g*(x[a]-x[b])+this.h;st.i2=st.i;st.i=i;},cur(){return st.i;}};
}
/* Diyot: Is, n, (isteğe bağlı) Vz zener kırılması */
function Diode(a,k,p,st){
  const nvt=p.n*VT,vcrit=nvt*Math.log(nvt/(Math.SQRT2*p.Is));
  if(st.vd===undefined)st.vd=0;
  return {a,k,nl:true,st,vd:st.vd,i:0,nodes:[a,k],
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
  return {nl:true,st,vgs:st.vgs,id:0,nodes:[g,d,s],
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
/* ---- Seyrek LU: minimum derece sıralaması + sembolik dolgu, yoğun dizide yalnız dokunulan konumlar işlenir ---- */
function symbolic(n,adj){ // adj: Set dizisi (0 tabanlı, simetrik desen). Dönüş: {ord, nb[k]: Int32Array, touch}
  const alive=new Uint8Array(n).fill(1),ord=new Int32Array(n),nb=new Array(n);
  const deg=new Int32Array(n);for(let i=0;i<n;i++)deg[i]=adj[i].size;
  for(let k=0;k<n;k++){
    let p=-1,md=1e9;
    for(let i=0;i<n;i++)if(alive[i]&&deg[i]<md){md=deg[i];p=i;}
    ord[k]=p;alive[p]=0;
    const L=[...adj[p]];nb[k]=Int32Array.from(L);
    for(const u of L){adj[u].delete(p);for(const w of L)if(w!==u)adj[u].add(w);deg[u]=adj[u].size;}
  }
  const T=new Set();
  for(let k=0;k<n;k++){const p=ord[k],L=nb[k];T.add(p*n+p);for(const r of L){T.add(r*n+p);T.add(p*n+r);for(const c of L)T.add(r*n+c);}}
  return {ord,nb,touch:Int32Array.from([...T].sort((x,y)=>x-y))};
}
function spFactor(A,n,sy){ // yerinde LU (çarpanlar A[r,p]'de); eşik pivot sağlanamazsa false
  const {ord,nb}=sy;
  for(let k=0;k<n;k++){
    const p=ord[k],L=nb[k],pn=p*n,piv=A[pn+p];
    let cm=0;for(let j=0;j<L.length;j++){const v=Math.abs(A[L[j]*n+p]);if(v>cm)cm=v;}
    if(!(Math.abs(piv)>1e-300)||Math.abs(piv)<1e-3*cm)return false;
    for(let j=0;j<L.length;j++){
      const rn=L[j]*n,f=A[rn+p]/piv;A[rn+p]=f;if(f===0)continue;
      for(let q=0;q<L.length;q++){const c=L[q];A[rn+c]-=f*A[pn+c];}
    }
  }
  return true;
}
function spSolve(A,n,sy,b){
  const {ord,nb}=sy;
  for(let k=0;k<n;k++){const p=ord[k],L=nb[k],bp=b[p];if(bp===0)continue;for(let j=0;j<L.length;j++)b[L[j]]-=A[L[j]*n+p]*bp;}
  for(let k=n-1;k>=0;k--){const p=ord[k],L=nb[k],pn=p*n;let s=b[p];for(let j=0;j<L.length;j++)s-=A[pn+L[j]]*b[L[j]];b[p]=s/A[pn+p];}
}
/* ---- Çözücü ---- */
class Sim{
  constructor(){this.N=0;this.els=[];this.t=0;this.dt=1e-5;this.x=new Float64Array(1);this.iters=0;this.fails=0;this.beLeft=0;this.nBE=0;this.nBD=0;this.nDense=0;}
  setup(N,els,dt){
    this.N=N;this.els=els;this.dt=dt;
    const n=N;this.A=new Float64Array(n*n);this.Ab=null;this.b=new Float64Array(n);
    const old=this.x;this.x=new Float64Array(N+1);if(this.keep&&old.length===N+1)this.x.set(old);
    const mk=be=>{
      const M=new Float64Array(n*n);
      const ctx={dt,be,G:(a,b,g)=>{if(a)M[(a-1)*n+a-1]+=g;if(b)M[(b-1)*n+b-1]+=g;if(a&&b){M[(a-1)*n+b-1]-=g;M[(b-1)*n+a-1]-=g;}}};
      for(let k=1;k<=n;k++)M[(k-1)*n+k-1]+=GMIN;
      els.forEach(e=>e.lin&&e.lin(ctx));
      return M;
    };
    this.A0be=mk(true);this.A0bd=mk(false);
    this.nl=els.some(e=>e.nl);
    this.constMat=!els.some(e=>e.nl||e.mdyn);
    this.LU={be:null,bd:null};
    // desen: her elemanın düğümleri arasında tam bağlantı (Mos da dahil)
    this.sy=null;this.dense=false;
    if(n>0&&els.every(e=>e.nodes)){
      const adj=[];for(let i=0;i<n;i++)adj.push(new Set());
      for(const e of els){const nd=e.nodes.filter(v=>v>0);for(const u of nd)for(const w of nd)if(u!==w)adj[u-1].add(w-1);}
      this.sy=symbolic(n,adj);this.Ab=new Float64Array(this.sy.touch.length);
    }else this.dense=true;
    this.beLeft=1; // BDF2 iki adım geçmişi ister: kurulumdan sonraki ilk adım geri Euler
  }
  /* Ab'ye yedeklenen matrisle ya da yoğun kısmi pivotlu çözümle doğrusal sistemi çöz; çözüm b'de */
  lin(be){
    const n=this.N,A=this.A,b=this.b;
    if(this.dense)return solve(A,b,n);
    const sy=this.sy;
    if(this.constMat){
      const key=be?'be':'bd';let LU=this.LU[key];
      if(!LU){LU=new Float64Array(n*n);const A0=be?this.A0be:this.A0bd,T=sy.touch;for(let j=0;j<T.length;j++)LU[T[j]]=A0[T[j]];
        if(!spFactor(LU,n,sy)){this.dense=true;this.nDense++;A.set(be?this.A0be:this.A0bd);return solve(A,b,n);}this.LU[key]=LU;}
      spSolve(LU,n,sy,b);return true;
    }
    const T=sy.touch,Ab=this.Ab;for(let j=0;j<T.length;j++)Ab[j]=A[T[j]];
    if(spFactor(A,n,sy)){spSolve(A,n,sy,b);return true;}
    // eşik pivot sağlanamadı (ör. yüzen kapılı MOSFET): bu kurulum için yoğun çözüme geç
    for(let j=0;j<T.length;j++)A[T[j]]=Ab[j];
    this.dense=true;this.nDense++;
    return solve(A,b,n);
  }
  newton(t,be){
    const n=this.N,dt=this.dt,A=this.A,b=this.b,x=this.x,els=this.els;
    const ctx={dt,be,
      G:(a,c,g)=>{if(a)A[(a-1)*n+a-1]+=g;if(c)A[(c-1)*n+c-1]+=g;if(a&&c){A[(a-1)*n+c-1]-=g;A[(c-1)*n+a-1]-=g;}},
      A:(r,c,v)=>{if(r&&c)A[(r-1)*n+c-1]+=v;},
      I:(a,c,i)=>{if(a)b[a-1]-=i;if(c)b[c-1]+=i;}};
    const A0=be?this.A0be:this.A0bd;
    for(let it=0;it<120;it++){
      if(!this.constMat){
        if(this.dense)A.set(A0);else{const T=this.sy.touch;for(let j=0;j<T.length;j++)A[T[j]]=A0[T[j]];}
      }
      b.fill(0);
      for(let e=0;e<els.length;e++){const el=els[e];if(el.dyn)el.dyn(ctx,x,t);}
      if(!this.lin(be))return false;
      let conv=true;
      for(let k=0;k<n;k++){const xn=b[k],d=Math.abs(xn-x[k+1]);if(d>1e-6+1e-4*Math.abs(xn))conv=false;x[k+1]=xn;}
      this.iters=it+1;
      if(conv&&this.nl){for(let e=0;e<els.length;e++){if(els[e].lim){conv=false;break;}}}
      if(conv||!this.nl)return true;
    }
    return false;
  }
  step(){
    const n=this.N,dt=this.dt,t=this.t+dt;
    if(n===0){this.t=t;return true;}
    const x=this.x,els=this.els;
    for(let e=0;e<els.length;e++){const el=els[e];if(el.pre)el.pre(t);}
    const be=this.beLeft>0;
    const ok=this.newton(t,be);
    if(be){this.beLeft--;this.nBE++;}else this.nBD++;
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
/* ---- SI önekli değer ayrıştırıcı: "4.7k", "2.2µ"/"2u2", "470n", "1M", "10m", "1e-6" ---- */
const SIP={T:1e12,G:1e9,M:1e6,k:1e3,K:1e3,m:1e-3,u:1e-6,'µ':1e-6,'μ':1e-6,n:1e-9,p:1e-12,f:1e-15};
function parseSI(s,unit){
  if(typeof s==='number')return isFinite(s)?s:NaN;
  s=String(s).trim().replace(',','.').replace(/\s+/g,'');
  const US={F:/F$/,H:/[Hh]$/,V:/[Vv]$/,A:/A$/,'Ω':/(Ω|ohm)$/i};
  if(unit&&US[unit])s=s.replace(US[unit],'');
  s=s.replace(/meg$/i,'M');
  let m=s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([TGMkKmuµμnpf]?)$/);
  const r12=v=>+v.toPrecision(12); // 220u → 0.00022 (kayan nokta artığı olmadan)
  if(m)return r12(parseFloat(m[1])*(m[2]?SIP[m[2]]:1));
  m=s.match(/^(\d+)([TGMkKmuµμnpfR])(\d+)$/); // 4k7, 2u2, 4R7 gösterimi
  if(m)return r12(parseFloat(m[1]+'.'+m[3])*(m[2]==='R'?1:SIP[m[2]]));
  return NaN;
}
return {Sim,R,Vsrc,Vlim,Cap,Ind,Diode,Mos,P,LEDV,VT,parseSI};
})();
if(typeof module!=='undefined')module.exports=Solver;
