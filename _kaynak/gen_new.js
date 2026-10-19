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
return {CH,G,shape,mark,reset:resetGen,setOnChange:f=>{onChange=f;},outEl:i=>document.querySelector('#gOut'+i),showInfo:()=>setInfo('screen')};
