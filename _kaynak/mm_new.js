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
