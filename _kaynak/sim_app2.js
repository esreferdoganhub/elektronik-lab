/* ================= Düzenleyici, döngü, deneyler ================= */
let DRAG=null,PLACE=null,WIRE0=null,WIRECOL='#e63946',TOOL=null;
function bpt(e){const pt=board.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(board.getScreenCTM().inverse());}
function holeAt(x,y,tol=9){const c=Math.round((x-X0)/P),r=Math.round((y-Y0)/P);if(!validHole(c,r))return null;if(Math.hypot(hx(c)-x,hy(r)-y)>tol)return null;return [c,r];}
const elById=id=>ELS.find(e=>e.id===+id);
function select(el){SEL=el;VER++;renderProps();if(el)info(TYPES[el.type].name+valueText(el),TYPES[el.type].info);}
function valueText(el){const p=el.props;switch(el.type){case 'res':return ' · '+fmtSI(p.R,'Ω');case 'led':return ' · '+LEDCOL[p.color][1];case 'zener':return ' · '+p.Vz+' V';case 'ccap':case 'ecap':return ' · '+fmtSI(p.C,'F');case 'ind':return ' · '+fmtSI(p.L,'H');case 'pot':return ' · '+fmtSI(p.R,'Ω');case 'dcs':return ' · '+p.V.toFixed(1)+' V';default:return '';}}
function hlNet(h){
  const g=$('#hl');if(!g)return;if(!h){g.innerHTML='';return;}
  const n=netOf(h);let s='';for(let c=0;c<NC;c++)ROWS.forEach(r=>{if(netOf([c,r])===n)s+=`<circle cx="${hx(c)}" cy="${hy(r)}" r="5" fill="#2bdc4a" opacity=".45"/>`;});
  g.innerHTML=s;
}
function ghost(svg){const g=$('#ghost');if(g)g.innerHTML=svg||'';}
board.addEventListener('pointerdown',e=>{
  const p=bpt(e),t=e.target;
  const act=t.closest('[data-act]');
  if(act){const el=elById(act.dataset.id),a=act.dataset.act;
    if(a==='btn'){el.pressed=true;needBuild=true;VER++;DRAG={kind:'btn',el};board.setPointerCapture(e.pointerId);return;}
    if(a==='pot'){DRAG={kind:'pot',el,y0:p.y,x0:p.x,pos0:el.props.pos};board.setPointerCapture(e.pointerId);select(el);return;}
    if(a==='btnlock'){el.props.latch=!el.props.latch;el.pressed=el.props.latch;needBuild=true;VER++;renderProps();say(el.props.latch?'Buton basılı kilitlendi: devre kapalı kalır, bu sırada cihazlarda rahatça ayar yapabilirsin. Kilidi açmak için kilit simgesine tekrar tıkla.':'Buton kilidi açıldı: artık sadece basılı tutarken kapanır.',el.props.latch?'ok':'info');return;}
    if(a==='sw'){el.props.on=!el.props.on;needBuild=true;VER++;return;}
    if(a==='dcs+'||a==='dcs-'){const d=e.shiftKey?0.1:0.5;el.props.V=Math.max(0,Math.min(30,+(el.props.V+(a==='dcs+'?d:-d)).toFixed(2)));needBuild=true;VER++;renderProps();return;}
  }
  const cl=t.closest('[data-clip]');
  if(cl){DRAG={kind:'clip',k:cl.dataset.clip};board.setPointerCapture(e.pointerId);info(...CLIPINFO[cl.dataset.clip]);return;}
  const pn=t.closest('[data-pin]');
  if(pn){const [id,i]=pn.dataset.pin.split(':');DRAG={kind:'pin',el:elById(id),i:+i};board.setPointerCapture(e.pointerId);return;}
  const eg=t.closest('[data-el]');
  if(eg&&!PLACE&&TOOL!=='wire'){const el=elById(eg.dataset.el);select(el);
    if(TYPES[el.type].rigid){const c=Math.round((p.x-X0)/P),r=Math.round((p.y-Y0)/P);DRAG={kind:'move',el,off:[c-el.at[0],r-el.at[1]],moved:false,orig:el.at.slice()};}
    else if(el.body){DRAG={kind:'body',el,dx:p.x-el.body[0],dy:p.y-el.body[1]};}
    board.setPointerCapture(e.pointerId);return;}
  const h=holeAt(p.x,p.y,10);
  if(PLACE){if(h){const el=addEl(PLACE.type,{at:h,rot:PLACE.rot});needBuild=true;select(el);say(`${TYPES[PLACE.type].name} yerleştirildi. Yeni bir tane için tekrar tıkla; bitirmek için Esc.`,'ok');}return;}
  if(TOOL==='wire'){if(!h)return;if(!WIRE0){WIRE0=h;say('Kablonun ikinci ucu için bir deliğe tıkla (Esc: iptal).');}else{if(h[0]!==WIRE0[0]||h[1]!==WIRE0[1]){addEl('wire',{pins:[WIRE0,h],props:{color:WIRECOL}});needBuild=true;say(`Kablo eklendi: ${holeName(WIRE0)} → ${holeName(h)}`,'ok');}WIRE0=null;ghost('');}return;}
  select(null);
});
board.addEventListener('pointermove',e=>{
  const p=bpt(e);
  if(DRAG){
    const d=DRAG;
    if(d.kind==='clip'){CLIPS[d.k].h=null;CLIPS[d.k].px=p.x;CLIPS[d.k].py=p.y;d.moved=true;VER++;hlNet(holeAt(p.x,p.y,12));return;}
    if(d.kind==='pin'){const pp=d.el.pins[d.i];pp.h=null;pp.x=p.x;pp.y=p.y;VER++;hlNet(holeAt(p.x,p.y,12));return;}
    if(d.kind==='move'){const c=Math.round((p.x-X0)/P),r=Math.round((p.y-Y0)/P),na=[c-d.off[0],r-d.off[1]];if(na[0]!==d.el.at[0]||na[1]!==d.el.at[1]){d.el.at=na;d.moved=true;VER++;}return;}
    if(d.kind==='body'){d.el.body=[Math.max(0,Math.min(780,p.x-d.dx)),Math.max(100,Math.min(380,p.y-d.dy))];VER++;return;}
    if(d.kind==='pot'){const np=Math.max(0,Math.min(1,d.pos0+((p.x-d.x0)-(p.y-d.y0))/160));if(Math.abs(np-d.el.props.pos)>0.002){d.el.props.pos=np;needBuild=true;VER++;}return;}
    return;
  }
  const h=holeAt(p.x,p.y,8);hlNet(h);
  if(PLACE&&h){const tmp={id:0,type:PLACE.type,props:Object.assign({},TYPES[PLACE.type].props),rot:PLACE.rot,at:h,st:{}};ghost(`<g opacity=".55" pointer-events="none">${drawEl(tmp)}</g>`);}
  else if(TOOL==='wire'&&WIRE0){ghost(`<line x1="${hx(WIRE0[0])}" y1="${hy(WIRE0[1])}" x2="${p.x}" y2="${p.y}" stroke="${WIRECOL}" stroke-width="4" stroke-linecap="round" opacity=".7" pointer-events="none"/>`);}
  const t=e.target;
  const eg=t.closest&&t.closest('[data-el]'),cl=t.closest&&t.closest('[data-clip]');
  if(cl){if(hoverKey!==cl.dataset.clip){hoverKey=cl.dataset.clip;info(...CLIPINFO[hoverKey]);}}
  else if(eg){const el=elById(eg.dataset.el);if(el&&hoverKey!=='e'+el.id){hoverKey='e'+el.id;info(TYPES[el.type].name+valueText(el),TYPES[el.type].info+(el.burnt?' <b style="color:#c0392b">Bu eleman yanmış: seçip "Yenile" de.</b>':''));}}
  else if(h){const k='h'+h;if(hoverKey!==k){hoverKey=k;const n=netOf(h);info('Delik '+holeName(h),n.startsWith('R')?'Güç rayı: bu satırdaki tüm delikler birbirine bağlıdır (yeşil).':(n[0]==='T'?`${h[0]+1}. sütunun a–e delikleri birbirine bağlıdır (yeşil). Orta kanal üst ve alt yarıyı ayırır.`:`${h[0]+1}. sütunun f–j delikleri birbirine bağlıdır (yeşil).`));}}
});
let hoverKey=null;
board.addEventListener('pointerup',e=>{
  const d=DRAG;DRAG=null;if(!d)return;const p=bpt(e);
  if(d.kind==='btn'){if(!d.el.props.latch){d.el.pressed=false;needBuild=true;VER++;}return;}
  if(d.kind==='clip'){const h=holeAt(p.x,p.y,12);if(h)CLIPS[d.k].h=h;else parkClip(d.k);VER++;needBuild=true;if(h){say(`${CLIPINFO[d.k][0]} → ${holeName(h)}`,'ok');probeHint(d.k);}hlNet(null);return;}
  if(d.kind==='pin'){const h=holeAt(p.x,p.y,12);const pp=d.el.pins[d.i];if(h)pp.h=h;VER++;needBuild=true;hlNet(null);return;}
  if(d.kind==='move'){if(d.moved){const ok=pinHoles(d.el).every(h=>netOf(h));if(!ok)say('Bazı bacaklar deliğe oturmadı (kırmızı nokta): elemanı biraz kaydır.','warn');needBuild=true;VER++;}return;}
  if(d.kind==='body'||d.kind==='pot'){needBuild=true;VER++;return;}
});
board.addEventListener('dblclick',e=>{const a=e.target.closest('[data-act="btn"]');if(a){const el=elById(a.dataset.id);el.props.latch=!el.props.latch;el.pressed=el.props.latch;needBuild=true;VER++;say(el.props.latch?'Buton basılı kilitlendi (tekrar çift tıkla: bırak).':'Buton serbest bırakıldı.');}});
board.addEventListener('pointerleave',()=>{hlNet(null);});
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  const mod=e.metaKey||e.ctrlKey,k=e.key.toLowerCase();
  if(mod&&k==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return;}
  if(mod&&k==='y'){e.preventDefault();redo();return;}
  if(e.key==='Escape'){PLACE=null;WIRE0=null;TOOL=null;ghost('');renderTools();}
  if((e.key==='Delete'||e.key==='Backspace')&&SEL&&GEN.G.entry===null){delEl(SEL);needBuild=true;e.preventDefault();}
  if((e.key==='r'||e.key==='R')){if(PLACE){PLACE.rot=(PLACE.rot+1)&3;}else if(SEL&&TYPES[SEL.type].rigid){SEL.rot=(SEL.rot+1)&3;needBuild=true;VER++;}}
});

/* ---------- Geri al / ileri al ---------- */
const HIST={undo:[],redo:[],cur:null,lastVer:-1,max:150};
function snapState(){return JSON.stringify({els:ELS.map(e=>({id:e.id,type:e.type,props:e.props,rot:e.rot,at:e.at,pins:e.pins?e.pins.map(p=>p.h?{h:p.h}:{h:null,x:p.x,y:p.y}):null,body:e.body,burnt:!!e.burnt,tag:e.tag||null})),clips:CLIP_ORDER.map(k=>CLIPS[k].h),next:NEXT});}
function histTrack(){
  if(DRAG||HIST.lastVer===VER)return;HIST.lastVer=VER;
  const cur=snapState();if(cur===HIST.cur)return;
  if(HIST.cur!==null){HIST.undo.push(HIST.cur);if(HIST.undo.length>HIST.max)HIST.undo.shift();HIST.redo=[];}
  HIST.cur=cur;renderHistBtns();
}
function histReset(){HIST.undo=[];HIST.redo=[];HIST.cur=snapState();HIST.lastVer=VER;renderHistBtns();}
function applySnap(str){
  const d=JSON.parse(str),old=new Map(ELS.map(e=>[e.id,e]));
  ELS=d.els.map(o=>{const e=old.get(o.id)||GRAVE.get(o.id)||{st:{}};
    Object.assign(e,{id:o.id,type:o.type,props:JSON.parse(JSON.stringify(o.props)),rot:o.rot,at:o.at?o.at.slice():o.at,body:o.body?o.body.slice():o.body,burnt:o.burnt,tag:o.tag||undefined,pins:o.pins?o.pins.map(p=>Object.assign({},p,p.h?{h:p.h.slice()}:{})):undefined});
    e.pressed=!!(e.props&&e.props.latch);if(!e.burnt){e._f=0;}return e;});
  CLIP_ORDER.forEach((k,i)=>{const h=d.clips[i];if(h)CLIPS[k].h=h.slice();else parkClip(k);});
  NEXT=Math.max(NEXT,d.next);
  if(SEL&&!ELS.includes(SEL))SEL=null;
  PLACE=null;WIRE0=null;ghost('');
  HIST.cur=str;VER++;HIST.lastVer=VER;needBuild=true;renderProps();renderHistBtns();
}
function undo(){histTrack();if(!HIST.undo.length){say('Geri alınacak işlem yok.');return;}HIST.redo.push(HIST.cur);applySnap(HIST.undo.pop());say(`Geri alındı (${HIST.undo.length} adım daha geri alınabilir).`);}
function redo(){histTrack();if(!HIST.redo.length){say('İleri alınacak işlem yok.');return;}HIST.undo.push(HIST.cur);applySnap(HIST.redo.pop());say('İleri alındı.');}
document.addEventListener('pointerdown',()=>{if(!DRAG)histTrack();},true);
document.addEventListener('keydown',()=>{if(!DRAG)histTrack();},true);
function renderHistBtns(){const u=$('#tUndo'),r=$('#tRedo');if(u)u.disabled=!HIST.undo.length;if(r)r.disabled=!HIST.redo.length;}

/* ---------- Araç çubuğu ve özellikler ---------- */
const PALETTE=['res','led','diode','schottky','zener','ccap','ecap','ind','pot','btn','sw','mos','bat','dcs','trafo'];
function renderTools(){
  $('#tools').innerHTML=PALETTE.map(t=>`<button class="tb${PLACE&&PLACE.type===t?' on':''}" data-t="${t}" title="${TYPES[t].info}">${TYPES[t].name}</button>`).join('')+
   `<span class="sep"></span><button class="tb${TOOL==='wire'?' on':''}" id="tWire">✎ Kablo</button><select id="tCol">${WIRECOLS.map(c=>`<option value="${c}" ${c===WIRECOL?'selected':''} style="background:${c}">${{'#e63946':'kırmızı','#1d4ed8':'mavi','#111':'siyah','#2a9d3a':'yeşil','#f4a300':'turuncu','#ffffff':'beyaz','#8338ec':'mor'}[c]}</option>`).join('')}</select>
   <button class="tb" id="tUndo" title="Geri al (Cmd/Ctrl+Z)">↶ Geri al</button><button class="tb" id="tRedo" title="İleri al (Cmd/Ctrl+Shift+Z veya Ctrl+Y)">↷ İleri al</button>
   <button class="tb" id="tRot">⟳ Döndür (R)</button><button class="tb" id="tDel">🗑 Sil (Del)</button><button class="tb" id="tClr">Tahtayı temizle</button>
   <span class="sep"></span><span class="cablab">Cihaz kabloları:</span><span class="seg">${[['normal','Normal'],['trans','Şeffaf'],['hide','Gizli']].map(([k,t])=>`<button class="tb${CABLEMODE===k?' on':''}" data-cab="${k}" title="${k==='hide'?'Kablolar görünmez ama bağlantı ve ölçüm sürer':k==='trans'?'Kablolar soluk görünür':'Kablolar normal görünür'}">${t}</button>`).join('')}</span>`;
  $('#tools').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{
    const t=b.dataset.t;TOOL=null;WIRE0=null;
    if(!TYPES[t].rigid){const k=ELS.filter(e=>e.body).length;const el=addEl(t,{body:[10+(k%2)*0,140+(k%3)*100]});el.body=[10,130+(k%3)*104];el.pins.forEach((p,i)=>{p.x=el.body[0]+20+i*40;p.y=el.body[1]-14;});needBuild=true;select(el);PLACE=null;say(`${TYPES[t].name} eklendi. Uçlarındaki gri tutamakları sürükleyip deliklere tak.`,'ok');}
    else{PLACE=PLACE&&PLACE.type===t?null:{type:t,rot:0};say(PLACE?`${TYPES[t].name}: breadboard'a tıklayarak yerleştir (R: döndür, Esc: bitir).`:'');}
    renderTools();
  });
  $('#tools').querySelectorAll('[data-cab]').forEach(b=>b.onclick=()=>{CABLEMODE=b.dataset.cab;try{localStorage.setItem('simCableMode',CABLEMODE);}catch(e){}VER++;renderTools();say({normal:'Cihaz kabloları normal görünümde.',trans:'Cihaz kabloları şeffaf: altlarındaki elemanlar görünür. Bağlantılar ve ölçümler aynen sürüyor.',hide:'Cihaz kabloları gizlendi: bağlantılar ve ölçümler aynen sürüyor. Prob ve klips uçları breadboard\'da görünmeye devam eder; değerleri sağdaki "Ölçüm izleme" panelinden takip edebilirsin.'}[CABLEMODE]);});
  $('#tUndo').onclick=undo;$('#tRedo').onclick=redo;renderHistBtns();
  $('#tWire').onclick=()=>{TOOL=TOOL==='wire'?null:'wire';PLACE=null;WIRE0=null;ghost('');renderTools();if(TOOL)say('Kablo: önce bir deliğe, sonra diğer deliğe tıkla. Renk listeden seçilir. Esc: çık.');};
  $('#tCol').onchange=()=>{WIRECOL=$('#tCol').value;};
  $('#tRot').onclick=()=>{if(SEL&&TYPES[SEL.type].rigid){SEL.rot=(SEL.rot+1)&3;needBuild=true;VER++;}else if(PLACE)PLACE.rot=(PLACE.rot+1)&3;};
  $('#tDel').onclick=()=>{if(SEL){delEl(SEL);needBuild=true;}};
  $('#tClr').onclick=()=>{if(confirm('Breadboard\'daki tüm elemanlar ve kablolar silinsin mi?')){clearBoard();needBuild=true;}};
}
function opt(list,val,fmt){return list.map(v=>`<option value="${v}" ${Math.abs(v-val)<1e-15||v===val?'selected':''}>${fmt(v)}</option>`).join('');}
function renderProps(){
  const el=SEL,c=$('#propCard');
  if(!el){c.innerHTML=`<div class="stepno">Seçili eleman</div><p style="margin:4px 0;color:var(--sub);font-size:.88rem">Bir elemana tıkla: değerini değiştir, döndür, sil. Sürükleyerek taşı.</p>`;return;}
  const T=TYPES[el.type],p=el.props;let f='';
  if(el.type==='res')f=`<label>Direnç <select data-p="R">${opt(RVALS,p.R,v=>fmtSI(v,'Ω'))}</select></label>`;
  if(el.type==='led')f=`<label>Renk <select data-p="color" data-s="1">${Object.keys(LEDCOL).map(k=>`<option value="${k}" ${k===p.color?'selected':''}>${LEDCOL[k][1]}</option>`).join('')}</select></label>`;
  if(el.type==='zener')f=`<label>Vz <select data-p="Vz">${opt([3.3,5.1,6.2,9.1,12],p.Vz,v=>v+' V')}</select></label>`;
  if(el.type==='ccap')f=`<label>Kapasite <select data-p="C">${opt(CVALS_C,p.C,v=>fmtSI(v,'F'))}</select></label>`;
  if(el.type==='ecap')f=`<label>Kapasite <select data-p="C">${opt(CVALS_E,p.C,v=>fmtSI(v,'F'))}</select></label><label>Gerilim sınırı <select data-p="Vmax">${opt([16,25,50],p.Vmax,v=>v+' V')}</select></label>`;
  if(el.type==='ind')f=`<label>Endüktans <select data-p="L">${opt(LVALS,p.L,v=>fmtSI(v,'H'))}</select></label>`;
  if(el.type==='pot')f=`<label>Değer <select data-p="R">${opt([1000,10000,100000],p.R,v=>fmtSI(v,'Ω'))}</select></label><label>Konum <input type="range" min="0" max="1" step="0.01" value="${p.pos}" data-p="pos"></label>`;
  if(el.type==='sw')f=`<label><input type="checkbox" data-p="on" ${p.on?'checked':''}> Açık (kapalı devre)</label>`;
  if(el.type==='btn')f=`<label><input type="checkbox" data-p="latch" ${p.latch?'checked':''}> Basılı kilitle</label>`;
  if(el.type==='dcs')f=`<label>Gerilim <input type="range" min="0" max="30" step="0.1" value="${p.V}" data-p="V"> <b>${p.V.toFixed(1)} V</b></label><label>Akım sınırı <select data-p="I">${opt([0.1,0.5,1,3],p.I,v=>v+' A')}</select></label>`;
  if(el.type==='trafo')f=`<label>Sekonder <select data-p="Vrms">${opt([6,9,12,24],p.Vrms,v=>v+'-0-'+v+' V')}</select></label>`;
  if(el.type==='wire')f=`<label>Renk <select data-p="color" data-s="1">${WIRECOLS.map(c=>`<option value="${c}" ${c===p.color?'selected':''}>${c}</option>`).join('')}</select></label>`;
  c.innerHTML=`<div class="stepno">Seçili eleman</div><h2>${T.name}${el.burnt?' <span style="color:#c0392b">(yanmış)</span>':''}</h2><div class="props">${f}</div>
   <div class="row">${T.rigid?'<button class="b sm" id="pRot">⟳ Döndür</button>':''}<button class="b sm" id="pDel">🗑 Sil</button>${el.burnt?'<button class="b sm pri" id="pFix">Yenile</button>':''}</div>`;
  c.querySelectorAll('[data-p]').forEach(inp=>{inp.oninput=inp.onchange=()=>{const k=inp.dataset.p;let v=inp.type==='checkbox'?inp.checked:(inp.dataset.s?inp.value:+inp.value);el.props[k]=v;if(k==='latch')el.pressed=v;needBuild=true;VER++;if(inp.type!=='range')renderProps();else{const b=inp.parentNode.querySelector('b');if(b)b.textContent=(+v).toFixed(1)+' V';}};});
  if($('#pRot'))$('#pRot').onclick=()=>{el.rot=(el.rot+1)&3;needBuild=true;VER++;};
  $('#pDel').onclick=()=>{delEl(el);needBuild=true;};
  if($('#pFix'))$('#pFix').onclick=()=>{el.burnt=false;el._f=0;el.st={};needBuild=true;VER++;renderProps();say('Eleman yenilendi.','ok');};
}

/* ---------- Simülasyon kartı ---------- */
let paused=false,lastWall=performance.now(),speedRatio=1,sigKey='',lastMeterT=0;
function resetSim(){ELS.forEach(e=>{const keep=e.st&&e.st.body?{}:{};e.st=keep;});RING.n=0;RING.head=0;MRING.n=0;MRING.head=0;sim.t=0;needBuild=true;Scope.S.frame=null;}
function updateSimCard(){
  const fuse=!MM.S.fuseMA||!MM.S.fuseA;
  $('#simCard').innerHTML=`<div class="stepno">Simülasyon</div><div class="simline"><b>${paused?'⏸ Duraklatıldı':'▶ Çalışıyor'}</b> · t = ${sim.t.toFixed(3)} s · hız ×${Math.min(1,speedRatio).toFixed(2)}${speedRatio<0.95?' (ağır çekim)':' (gerçek zaman)'} · adım ${fmtSI(sim.dt,'s',2)} · ${NNODES} düğüm</div>
   <div class="row"><button class="b sm" id="sPause">${paused?'▶ Devam':'⏸ Duraklat'}</button><button class="b sm" id="sReset">↺ Sıfırla (kondansatörleri boşalt)</button>${fuse?'<button class="b sm pri" id="sFuse">Sigortayı değiştir</button>':''}</div>`;
  $('#sPause').onclick=()=>{paused=!paused;lastWall=performance.now();updateSimCard();};
  $('#sReset').onclick=()=>{resetSim();say('Simülasyon sıfırlandı.');};
  if(fuse)$('#sFuse').onclick=()=>{MM.S.fuseMA=true;MM.S.fuseA=true;needBuild=true;say('Multimetre sigortaları yenilendi.','ok');updateSimCard();};
}

/* ---------- Ana döngü ---------- */
function loop(now){
  const key=JSON.stringify([VER,MM.S.dial,MM.S.sel,MM.S.jack,MM.S.fuseMA,MM.S.fuseA,Scope.S.phys,GEN.CH.map(c=>[c.on,c.wave==='dc'||c.wave==='noise'?0:Math.round(Math.log10(c.freq)*4)]),GEN.G.load]);
  if(key!==sigKey){sigKey=key;needBuild=true;}
  if(needBuild)build();
  if(drawnVer!==VER)renderBoard();
  histTrack();
  const wall=Math.min(0.05,(now-lastWall)/1000);lastWall=now;
  if(!paused&&wall>0){const target=sim.t+wall,c0=performance.now(),t0=sim.t;
    while(sim.t<target-1e-12&&performance.now()-c0<12){for(let k=0;k<64&&sim.t<target-1e-12;k++){sim.step();record();}}
    RING.ver++;speedRatio=speedRatio*0.9+0.1*((sim.t-t0)/wall);}
  handleEvents();liveUpdate();drawOverlay();
  if(now-lastMeterT>300){lastMeterT=now;lastMeter=meterReading();MM.render(lastMeter);updateSimCard();checkStep();renderMonitor();}
  if(shortWarn&&shortWarn!==loop.lastShort){say('⚠ '+shortWarn,'bad');}loop.lastShort=shortWarn;
  requestAnimationFrame(loop);
}

/* ---------- Deney yardımcıları ---------- */
const mval=()=>lastMeter&&lastMeter.val!=null&&lastMeter.num!=='OL'?lastMeter.val:null;
const inR=(v,a,b)=>v!==null&&v!==undefined&&v>=a&&v<=b;
function cfgGen(i,o){Object.assign(GEN.CH[i],o);GEN.mark();}
function freshAll(){clearBoard();GEN.reset();Scope.reset();MM.S.dial=2;MM.S.sel=0;MM.S.jack='vo';MM.S.hold=false;MM.S.fuseMA=true;MM.S.fuseA=true;PLACE=null;TOOL=null;WIRE0=null;ghost('');resetSim();renderTools();}
const sM=(ch,k)=>{const M=Scope.measure(ch);return M?M[k]:null;};
function sAuto(){if(RING.n<4000||sim.t<0.06)setTimeout(sAuto,250);else Scope.press('auto');}
const X={};
const EXPS=[
 {tab:'1 Buton + LED',title:'Butonla LED yakma',intro:'9 V pil, buton, 680 Ω akım sınırlama direnci ve kırmızı LED seri bağlı. Ohm kanunu: I = (9 − V_LED) / R ≈ (9 − 1.95) / 680 ≈ 10 mA.',
  setup(){X.bat=addEl('bat',{body:[20,150],pins:[H('TP3'),H('TN3')]});wire('TP6','a7');X.btn=part('btn','c7');X.r=part('res','d9',{props:{R:680}});X.led=part('led','b13');X.w=wire('a14','TN14','#111');},
  steps:[
   {t:'Devreyi incele: pil (+) → kırmızı kablo → buton (7–9) → direnç (9–13) → LED (13–14) → siyah kablo → pil (−). Bir deliğin üzerine gelince o deliğe bağlı tüm delikler yeşil yanar.'},
   {t:'Butona bas ve basılı tut: devre kapanır, LED yanar. Ölçüm yaparken butonu basılı tutmak için butonun sağ üstündeki kilit simgesine tıkla (kalıcı bas); kilit kırmızı olur ve buton bırakılana kadar basılı kalır.',act(){X.btn.props.latch=true;X.btn.pressed=true;needBuild=true;VER++;},check:()=>(X.led.st.ia||0)>0.005},
   {t:'LED gerilimi: multimetreyi V⎓ konumuna al. Kırmızı probu LED anoduna (13. sütun), siyah probu katoda (14. sütun) değdir. Buton basılıyken ≈ 1.9–2.0 V okunur.',act(){X.btn.props.latch=true;X.btn.pressed=true;MM.setDial(2);MM.S.jack='vo';clip('mmR','e13');clip('mmB','e14');},check:()=>MM.mtype()==='VDC'&&inR(mval(),1.7,2.3)},
   {t:'Direnç gerilimi: probları direncin uçlarına (9. ve 13. sütun) taşı. ≈ 7 V okunur. Kirchhoff: V_pil ≈ V_R + V_LED.',act(){X.btn.props.latch=true;X.btn.pressed=true;MM.setDial(2);clip('mmR','e9');clip('mmB','e13');},check:()=>MM.mtype()==='VDC'&&inR(mval(),6.5,7.6)},
   {t:'Akım ölçümü (seri): LED katodundaki siyah kabloyu (14 → – rayı) sök. Multimetreyi mA⎓ konumuna al; kırmızı probu 14. sütuna, siyah probu – rayına bağla. Multimetre devreyi tamamlar: ≈ 10 mA.',act(){X.btn.props.latch=true;X.btn.pressed=true;if(X.w){delEl(X.w);X.w=null;}MM.setDial(9);MM.S.jack='vo';clip('mmR','e14');clip('mmB','TN16');needBuild=true;},check:()=>MM.mtype()==='I_MA'&&inR(mval(),0.008,0.0125)},
   {t:'Kendin dene: direnci seçip 330 Ω yap: akım ≈ 21 mA\'e çıkar, LED parlar. Direnci silip LED\'i doğrudan pile bağlarsan LED yanar (gerçekte de!). Yanan elemanı seçip "Yenile" diyebilirsin.'}
  ]},
 {tab:'2 Pot + LED',title:'Potansiyometre ile LED parlaklığı',intro:'10 kΩ potansiyometre ayarlı direnç (reosta) olarak kullanılıyor: uç (7) ile orta uç (8) arası direnç düğmeyle 0–10 kΩ değişir. 330 Ω koruma direnci, pot sıfıra gelince LED\'i korur.',
  setup(){X.bat=addEl('bat',{body:[20,150],pins:[H('TP3'),H('TN3')]});X.w1=wire('TP6','a7');X.pot=part('pot','c7',{props:{R:10000,pos:0.5}});part('res','e8',{props:{R:330}});X.led=part('led','b12');X.w=wire('a13','TN13','#111');X.mn=1;X.mx=0;},
  steps:[
   {t:'Devre: pil (+) → pot ucu (7) → pot sürgüsü (8) → 330 Ω → LED → pil (−). Potun 3. ucu (9) boşta: pot reosta olarak çalışıyor.'},
   {t:'Pot düğmesini fareyle sürükleyerek çevir (sağa/yukarı: artır). LED parlaklığı değişir. Hem çok parlak hem çok sönük konuma getir.',act(){X.pot.props.pos=0.02;needBuild=true;VER++;},check:()=>{const i=X.led.st.ia||0;X.mn=Math.min(X.mn,i);X.mx=Math.max(X.mx,i);return X.mx>0.012&&X.mn<0.004;}},
   {t:'Akımı ölç: LED katodundaki siyah kabloyu (13 → – rayı) sök, multimetreyi mA⎓ konumunda seri bağla (kırmızı: 13. sütun, siyah: – rayı). Potu çevirdikçe akım 0.7 mA ile 21 mA arasında değişir.',act(){if(X.w){delEl(X.w);X.w=null;}MM.setDial(9);MM.S.jack='vo';clip('mmR','e13');clip('mmB','TN15');needBuild=true;},check:()=>MM.mtype()==='I_MA'&&inR(mval(),0.0003,0.03)},
   {t:'Potu sıfır konumuna getir: I ≈ (9 − 1.95) / 330 ≈ 21 mA. Koruma direnci olmasaydı akım sadece LED\'in iç direnciyle sınırlanırdı ve LED yanardı.',act(){X.pot.props.pos=0;needBuild=true;VER++;},check:()=>inR(mval(),0.018,0.024)},
   {t:'Pot direncini ölç: pilin bağlantı kablosunu (+ ray → 7) sök, multimetreyi Ω konumuna al, probları potun 7. ve 8. sütununa değdir. Düğmeyi çevirince değer değişir. Direnç her zaman ENERJİSİZ devrede ölçülür.',act(){if(X.w1){delEl(X.w1);X.w1=null;}MM.setDial(4);MM.S.sel=0;clip('mmR','e7');clip('mmB','d8');X.pot.props.pos=0.5;needBuild=true;VER++;},check:()=>MM.mtype()==='R'&&lastMeter&&lastMeter.num!=='OL'}
  ]},
 {tab:'3 Yarım dalga',title:'Yarım dalga doğrultmaç',intro:'Trafonun 12 V rms çıkışı (tepe ≈ 17 V) bir 1N4007 diyot ve 1 kΩ yükle doğrultuluyor. Diyot sadece pozitif yarım periyotta iletir. Ortalama: V_dc ≈ V_p / π. Filtre kondansatörü dalgalanmayı azaltır: ΔV ≈ I / (f·C).',
  setup(){addEl('trafo',{body:[10,150],pins:[H('a7'),H('BN4'),null]});part('diode','c7');part('res','d11',{props:{R:1000}});wire('e15','BN15','#111');clip('s1T','e7');clip('s1G','BN6');clip('s2T','e11');clip('s2G','BN8');Scope.S.ch[1].on=true;},
  steps:[
   {t:'Trafonun A ucu 7. sütunda, orta ucu (CT) – rayında. Diyot 7→11, yük direnci 11→15. Osiloskop CH1 trafo çıkışını, CH2 yük gerilimini ölçüyor; toprak klipsleri – rayında.'},
   {t:'Osiloskopta AUTO\'ya bas. CH1\'de sinüs, CH2\'de sadece pozitif yarım dalgalar görünür.',act(){sAuto();},check:()=>Scope.S.status==="T'D"},
   {t:'CH2 tepe değeri: Measure ile Vmax\'ı ölç. ≈ 17 − 0.8 ≈ 16.2 V (diyot düşümü). Negatif yarım periyotta çıkış 0 V.',act(){Scope.S.sel=1;Scope.S.meas=['vmax','vmin','vavg','freq','period'];Scope.S.left=0;Scope.S.menu='meas';},check:()=>inR(sM(1,'vmax'),15,17)},
   {t:'Multimetreyi V⎓ konumunda çıkışa bağla (kırmızı: 11. sütun = diyot katodu, siyah: – rayı). Ortalama gerilim ≈ V_p/π ≈ 5.1 V okunur.',act(){MM.setDial(2);MM.S.jack='vo';clip('mmR','b11');clip('mmB','BN12');},check:()=>MM.mtype()==='VDC'&&inR(mval(),4.5,5.8)},
   {t:'Filtre: 100 μF elektrolitik kondansatörü çıkışa bağla (+ ucu 11. sütun, – ucu kabloyla – rayına). Çıkış düzleşir; ortalama ≈ 15 V, dalgalanma ≈ 3 V (osiloskopta gör).',act(){if(!X.cap){X.cap=part('ecap','a11',{props:{C:100e-6,Vmax:25}});X.cw=wire('b12','BN13','#111');}needBuild=true;},check:()=>inR(mval(),12,16.5)},
   {t:'Kondansatörü seçip 1000 μF yap: dalgalanma ≈ 0.3 V\'a düşer. Osiloskopta CH2\'yi AC kuplaja alırsan dalgalanmayı büyütüp görebilirsin.',act(){if(X.cap){X.cap.props.C=1000e-6;needBuild=true;VER++;}},check:()=>X.cap&&X.cap.props.C>=470e-6&&inR(mval(),15,16.8)}
  ]},
 {tab:'4 Orta uçlu tam dalga',title:'Orta uçlu tam dalga doğrultmaç',intro:'Orta uçlu trafonun iki yarısı ters fazlıdır. D1 pozitif, D2 negatif yarım periyotta iletir; yük her iki yarım periyotta da aynı yönde akım alır. Çıkış frekansı 100 Hz, V_dc ≈ 2·V_p/π.',
  setup(){addEl('trafo',{body:[10,150],pins:[H('a7'),H('BN4'),H('f7')]});part('diode','c7');part('diode','h7');wire('e11','f11','#1d4ed8');part('res','b11',{props:{R:1000}});wire('a15','BN15','#111');clip('s1T','e7');clip('s1G','BN6');clip('s2T','d11');clip('s2G','BN9');Scope.S.ch[1].on=true;},
  steps:[
   {t:'A ucu üst yarıda (7), B ucu alt yarıda (7), orta uç – rayında. D1 (üst) ve D2 (alt) katotları 11. sütunda birleşiyor (mavi kablo). Yük 11→15.'},
   {t:'Osiloskopta AUTO: CH2\'de her iki yarım periyot da pozitif. Tepe ≈ 16.2 V.',act(){sAuto();},check:()=>Scope.S.status==="T'D"},
   {t:'Çıkış frekansını ölç: Measure → Freq (CH2). Giriş 50 Hz, çıkış 100 Hz.',act(){Scope.S.sel=1;Scope.S.meas=['freq','period','vmax','vavg'];Scope.S.left=0;Scope.S.menu='meas';},check:()=>inR(sM(1,'freq'),90,110)},
   {t:'Multimetre V⎓ ile ortalama (kırmızı: 11. sütun, siyah: – rayı): ≈ 2·V_p/π ≈ 10.3 V (yarım dalganın iki katı).',act(){MM.setDial(2);MM.S.jack='vo';clip('mmR','a11');clip('mmB','BN13');},check:()=>MM.mtype()==='VDC'&&inR(mval(),9.3,11.3)},
   {t:'100 μF filtre ekle: dalgalanma frekansı 100 Hz olduğu için yarım dalgaya göre yarı yarıya azalır (≈1.5 V).',act(){if(!X.cap){X.cap=part('ecap','i11',{props:{C:100e-6,Vmax:25}});wire('j12','BN17','#111');}needBuild=true;},check:()=>inR(mval(),13,16.8)}
  ]},
 {tab:'5 Köprü doğrultmaç',title:'Köprü (tam dalga) doğrultmaç',intro:'Dört diyotlu köprü orta uç gerektirmez. Her yarım periyotta iki diyot iletir, bu yüzden düşüm ≈ 2 × 0.8 V. DİKKAT: osiloskop toprağı şebeke toprağıdır; köprüde yanlış noktaya takılan toprak klipsi bir diyotu kısa devre eder!',
  setup(){addEl('trafo',{body:[10,150],pins:[H('a7'),H('f7'),null]});part('diode','c7');part('diode','h7');wire('e11','f11','#1d4ed8');part('diode','b3');part('diode','i3');wire('e3','f3','#111');wire('j3','BN3','#111');part('res','a11',{props:{R:1000}});wire('c15','BN15','#111');clip('s1T','d11');clip('s1G','BN6');},
  steps:[
   {t:'Trafonun A ucu üst yarıda (7), orta ucu (CT) alt yarıda (7): 12 V rms. D1 (A→+) ve D2 (CT→+) katotları 11. sütunda (+ çıkış). D3 (–→A) ve D4 (–→CT) anotları 3. sütunda (– çıkış, – rayına bağlı). Trafonun B ucu boşta.'},
   {t:'Osiloskopta AUTO: tam dalga doğrultulmuş çıkış. Tepe ≈ 17 − 1.6 ≈ 15.4 V.',act(){sAuto();Scope.S.meas=['vmax','vavg','freq'];Scope.S.left=0;Scope.S.menu='meas';},check:()=>inR(sM(0,'vmax'),14.3,16.3)},
   {t:'Multimetre V⎓ (kırmızı: 11. sütun = + çıkış, siyah: – rayı): ortalama ≈ 9.6 V (iki diyot düşümü yüzünden orta uçludan biraz düşük).',act(){MM.setDial(2);MM.S.jack='vo';clip('mmR','b11');clip('mmB','BN13');},check:()=>MM.mtype()==='VDC'&&inR(mval(),8.6,10.6)},
   {t:'HATALI ÖLÇÜM DENEMESİ: CH2\'yi açıp ucunu A\'ya (7 üst), toprak klipsini trafonun diğer ucuna (7 alt) takıyoruz. Toprak klipsi – rayıyla aynı şebeke toprağına bağlı olduğu için bu uç toprağa kısa devre olur: D4 kısa devre edilir, her yarım periyotta trafo çok büyük akım verir ve bir diyot yanar!',act(){Scope.S.ch[1].on=true;clip('s2T','d7');clip('s2G','g7');},check:()=>true},
   {t:'Doğrusu: CH2 toprak klipsini çıkar (park yerine geri sürükle) ve yanan diyotu seçip "Yenile" de. Köprüde trafo uçlarını ölçmek için iki kanalla fark ölçümü (CH1 − CH2) ya da yalıtımlı (diferansiyel) prob kullanılır.',act(){clip('s2G',null);clip('s2T',null);Scope.S.ch[1].on=false;ELS.forEach(e=>{if(e.burnt){e.burnt=false;e._f=0;e.st={};}});needBuild=true;VER++;},check:()=>!CLIPS.s2G.h}
  ]},
 {tab:'6 Kırpıcılar',title:'Diyotlu kırpıcı devreler',intro:'Jeneratörden 1 kHz sinüs; 1 kΩ seri direnç ve diyot(lar). Diyot iletime geçtiğinde çıkış o seviyede "kırpılır". Paralel kırpıcıda kırpma seviyesi ≈ 0.7 V (+ polarma), zenerli çift kırpıcıda ±(Vz + 0.7).',
  setup(){cfgGen(0,{on:true,wave:'sine',freq:1000,amp:10,off:0});clip('g1R','c5');clip('g1B','BN3');clip('s1T','e5');clip('s1G','BN6');clip('s2T','e9');clip('s2G','BN8');Scope.S.ch[1].on=true;setVariant('A');},
  steps:[
   {t:'Paralel pozitif kırpıcı: 1 kΩ (5→9) ve diyot (anot 9, katot 13 → – rayı). Pozitif yarım periyotta diyot iletir: çıkış +0.7 V\'ta kırpılır. AUTO\'ya bas.',act(){setVariant('A');sAuto();Scope.S.sel=1;Scope.S.meas=['vmax','vmin','vpp'];Scope.S.left=0;Scope.S.menu='meas';},check:()=>inR(sM(1,'vmax'),0.5,0.95)},
   {t:'Paralel negatif kırpıcı: diyot ters çevrildi (anot – rayında). Bu kez negatif tepeler −0.7 V\'ta kırpılır.',act(){setVariant('B');Scope.S.sel=1;Scope.S.meas=['vmax','vmin','vpp'];},check:()=>inR(sM(1,'vmin'),-0.95,-0.5)},
   {t:'Polarmalı kırpıcı: diyot katodu – rayı yerine 3 V DC kaynağa bağlandı. Kırpma seviyesi = 3 + 0.7 ≈ 3.7 V. DC kaynağın gerilimini değiştir (V+/V−) ve kırpma seviyesinin değiştiğini gör.',act(){setVariant('C');Scope.S.sel=1;Scope.S.meas=['vmax','vmin','vpp'];},check:()=>inR(sM(1,'vmax'),3.3,4.1)},
   {t:'Zenerli çift kırpıcı: sırt sırta iki 5.1 V zener. Jeneratör genliği 16 Vpp. Çıkış ±(5.1 + 0.7) ≈ ±5.8 V\'ta iki yönden kırpılır.',act(){setVariant('D');sAuto();Scope.S.sel=1;Scope.S.meas=['vmax','vmin','vpp'];Scope.S.left=0;Scope.S.menu='meas';},check:()=>inR(sM(1,'vmax'),5.3,6.3)&&inR(sM(1,'vmin'),-6.3,-5.3)},
   {t:'Seri kırpıcı: diyot jeneratör ile çıkış arasında seri, 1 kΩ yük – rayına. Sadece pozitif yarım periyotlar geçer (≈ yarım dalga doğrultmaç); tepe ≈ 5 − 0.7 V.',act(){setVariant('E');sAuto();Scope.S.sel=1;Scope.S.meas=['vmax','vmin','vpp'];Scope.S.left=0;Scope.S.menu='meas';},check:()=>inR(sM(1,'vmin'),-0.3,0.1)&&inR(sM(1,'vmax'),3.8,4.8)}
  ]},
 {tab:'7 DC kıyıcı',title:'DC kıyıcı (R yüklü)',intro:'MOSFET bir anahtar gibi açılıp kapanarak 12 V\'u yüke parça parça uygular. Görev oranı D = t_on / T ise yükteki ortalama gerilim V_ort = D · V_s. MOSFET\'in kapısını jeneratör sürer (0–10 V PWM).',
  setup(){addEl('dcs',{body:[10,140],pins:[H('TP3'),H('TN3')],props:{V:12,I:1}});wire('TN40','BN40','#111');wire('TP8','a8');part('res','b8',{props:{R:1000}});X.led=part('led','c12');wire('e13','f16','#1d4ed8');part('res','TP16',{rot:1,props:{R:1000}});wire('e16','h16','#1d4ed8');part('mos','g15');wire('j17','BN17','#111');part('res','j15',{props:{R:10000}});wire('h19','BN19','#111');
    cfgGen(0,{on:true,wave:'square',freq:1000,amp:10,off:5,duty:50});clip('g1R','i15');clip('g1B','BN12');clip('s1T','h15');clip('s1G','BN10');clip('s2T','i16');clip('s2G','BN14');Scope.S.ch[1].on=true;},
  steps:[
   {t:'Yük: 1 kΩ + LED kolu ve ona paralel 1 kΩ direnç (16. sütun), +12 V ile MOSFET\'in savağı (D, 16. sütun alt) arasında. Paralel direnç, MOSFET kesimdeyken yük gerilimini sıfıra çeker. Kaynak (S) – rayında. Jeneratör CH1: 1 kHz, 0–10 V kare dalga, kapıya (15. sütun alt) bağlı; 10 kΩ kapıyı aşağı çeker.'},
   {t:'Osiloskopta AUTO: CH1 kapı sinyali (PWM), CH2 savak gerilimi. MOSFET iletimdeyken savak ≈ 0 V, kesimdeyken ≈ 12 V (ters fazlı).',act(){sAuto();},check:()=>Scope.S.status==="T'D"},
   {t:'Multimetre V⎓ ile yük gerilimini ölç (kırmızı: 8. sütun = +12 V, siyah: savak). D = %50 → V_ort ≈ 6 V.',act(){MM.setDial(2);MM.S.jack='vo';clip('mmR','c8');clip('mmB','j16');},check:()=>MM.mtype()==='VDC'&&inR(mval(),5.2,6.6)},
   {t:'Jeneratörde Duty\'yi %20 yap (Wave → Square → Duty soft tuşu → 2 0 → %): V_ort ≈ 2.4 V, LED sönükleşir.',act(){cfgGen(0,{duty:20});},check:()=>inR(mval(),1.9,3.0)},
   {t:'Duty %80: V_ort ≈ 9.6 V, LED parlar. Kıyıcı, DC gerilimi kayıpsız denebilecek şekilde ayarlar (direnç ile düşürmekten çok verimli).',act(){cfgGen(0,{duty:80});},check:()=>inR(mval(),9,10.3)},
   {t:'Frekansı 50 Hz\'e indir: LED gözle görülür şekilde titrer. Bu yüzden PWM frekansı yüksek seçilir (LED/motor için genelde kHz mertebesi).',act(){cfgGen(0,{freq:50,duty:50});},check:()=>GEN.CH[0].freq<=100}
  ]},
 {tab:'8 Buck kıyıcı',title:'LC filtreli kıyıcı (buck)',intro:'Kıyıcının çıkışına bobin ve kondansatör eklenince darbeli gerilim düz DC\'ye dönüşür (buck dönüştürücü). Anahtar kapalıyken bobin enerji depolar; açıkken Schottky diyot üzerinden akım devam eder (serbest geçiş). İdeal: V_çıkış = D · V_giriş.',
  setup(){addEl('dcs',{body:[10,140],pins:[H('TP3'),H('TN3')],props:{V:12,I:1}});wire('TN40','BN40','#111');part('res','TP13',{rot:1,props:{R:220}});part('ecap','b14',{rot:2,props:{C:47e-6,Vmax:25}});wire('TP14','a14');part('ind','e13',{props:{L:10e-3}});part('schottky','c17');wire('a21','TP21');part('mos','g16');wire('d17','f17','#1d4ed8');wire('j18','BN18','#111');part('res','j16',{props:{R:10000}});wire('h20','BN20','#111');
    cfgGen(0,{on:true,wave:'square',freq:20000,amp:10,off:5,duty:50});clip('g1R','i16');clip('g1B','BN14');clip('s1T','h16');clip('s1G','BN10');clip('s2T','i17');clip('s2G','BN12');Scope.S.ch[1].on=true;},
  steps:[
   {t:'Çıkış, + rayı (V_giriş) ile 13. sütun (X) arasındadır: 220 Ω yük ve 47 μF kondansatör buraya bağlı. Bobin (10 mH) X\'ten savağa (17), Schottky savaktan + rayına (serbest geçiş). Kapı 20 kHz PWM.'},
   {t:'Osiloskopta AUTO: CH1 kapı PWM, CH2 savak gerilimi (0 ↔ ≈12.4 V; kesimde diyot üzerinden + rayının biraz üstüne çıkar).',act(){sAuto();},check:()=>Scope.S.status==="T'D"},
   {t:'Multimetre V⎓ ile çıkışı ölç (kırmızı: 14. sütun = + ray, siyah: 13. sütun = X). D = %50 → ≈ 5.6 V (ideal 6 V; diyot ve bobin direnci kayıpları). Çıkış artık darbeli değil, düz DC!',act(){MM.setDial(2);MM.S.jack='vo';clip('mmR','d14');clip('mmB','a13');},check:()=>MM.mtype()==='VDC'&&inR(mval(),4.8,6.4)},
   {t:'Duty %25 → ≈ 2.7 V. Çıkış yeni değere birkaç milisaniyede (LC geçici rejimi) oturur.',act(){cfgGen(0,{duty:25});},check:()=>inR(mval(),2,3.4)},
   {t:'Duty %75 → ≈ 8.6 V. Buck dönüştürücü, giriş geriliminden daha düşük ve ayarlanabilir DC üretir.',act(){cfgGen(0,{duty:75});},check:()=>inR(mval(),8,9.4)},
   {t:'Bobini 1 mH yap: bobin akımı her periyotta sıfıra iner (süreksiz iletim, DCM). Çıkış artık D·V_giriş\'ten YÜKSEK olur. Tasarımda bobin, yük akımına göre seçilir.',act(){const L=ELS.find(e=>e.type==='ind');if(L){L.props.L=1e-3;needBuild=true;VER++;}cfgGen(0,{duty:50});},check:()=>inR(mval(),7,11)}
  ]}
];
function setVariant(v){
  ELS.filter(e=>e.tag==='v').forEach(e=>delEl(e));
  const T=el=>{el.tag='v';return el;};
  if(v!=='E'){T(part('res','d5',{props:{R:1000}}));}
  if(v==='A'){T(part('diode','b9'));T(wire('a13','BN13','#111'));}
  if(v==='B'){T(part('diode','b13',{rot:2}));T(wire('a13','BN13','#111'));}
  if(v==='C'){T(part('diode','b9'));T(addEl('dcs',{body:[10,140],pins:[H('c13'),H('BN16')],props:{V:3,I:0.5}}));}
  if(v==='D'){cfgGen(0,{amp:16});T(part('zener','b13',{rot:2,props:{Vz:5.1}}));T(part('zener','c13',{props:{Vz:5.1}}));T(wire('a17','BN17','#111'));}
  else cfgGen(0,{amp:10});
  if(v==='E'){T(part('diode','d5'));T(part('res','b9',{props:{R:1000}}));T(wire('a13','BN13','#111'));}
  needBuild=true;VER++;
}

/* ---------- Deney arayüzü ---------- */
const G2={mode:'exp',exp:0,step:0,done:{}};
const TABS=[...EXPS.map((e,i)=>({tab:e.tab,i})),{tab:'Serbest kurma',i:'free'}];
const chips=$('#chips');
TABS.forEach((t,idx)=>{const b=document.createElement('button');b.textContent=t.tab;b.dataset.i=idx;b.onclick=()=>openTab(idx);chips.appendChild(b);});
function openTab(idx){
  chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.i===idx));
  const t=TABS[idx];freshAll();Object.keys(X).forEach(k=>delete X[k]);
  if(t.i==='free'){G2.mode='free';renderFree();say('Serbest kurma: araç çubuğundan eleman seç ve breadboard\'a yerleştir.');}
  else{G2.mode='exp';G2.exp=t.i;G2.step=0;G2.done={};EXPS[t.i].setup();needBuild=true;VER++;renderLesson();say('');}
  histReset();
}
function goStep(n){G2.step=n;renderLesson();}
function renderLesson(){
  const E=EXPS[G2.exp],st=E.steps[G2.step],last=G2.step===E.steps.length-1;
  $('#lessonCard').innerHTML=`<div class="stepno">Deney ${G2.exp+1} · Adım ${G2.step+1}/${E.steps.length}</div><h2>${E.title}</h2>
   <details${G2.step===0?' open':''}><summary>Teori</summary><p class="intro">${E.intro}</p></details>
   <p>${st.t}</p><div id="chk" class="chk"></div>
   <div class="row"><button class="b" id="pv" ${G2.step===0?'disabled':''}>◀ Önceki</button>${st.act?'<button class="b" id="dm">▶ Göster</button>':''}<button class="b pri" id="nx">${last?(G2.exp<EXPS.length-1?'Sonraki deney ▶':'Serbest kurmaya geç ▶'):'Sonraki ▶'}</button></div>
   <div class="steps">${E.steps.map((s,i)=>`<span class="dot${i===G2.step?' cur':''}${G2.done[i]?' ok':''}" data-s="${i}" title="Adım ${i+1}">${i+1}</span>`).join('')}</div>`;
  $('#pv').onclick=()=>goStep(G2.step-1);
  if(st.act)$('#dm').onclick=()=>{st.act();needBuild=true;VER++;say('Adım uygulandı. Sonucu cihazlarda gözle.','ok');};
  $('#nx').onclick=()=>{if(!last)goStep(G2.step+1);else openTab(G2.exp<EXPS.length-1?G2.exp+1:TABS.length-1);};
  $('#lessonCard').querySelectorAll('[data-s]').forEach(d=>d.onclick=()=>goStep(+d.dataset.s));
  checkStep();
}
function checkStep(){
  if(G2.mode!=='exp')return;const st=EXPS[G2.exp].steps[G2.step],c=$('#chk');if(!c)return;
  if(!st.check){c.innerHTML='';return;}
  let ok=false;try{ok=!!st.check();}catch(e){ok=false;}
  if(ok&&!G2.done[G2.step]){G2.done[G2.step]=true;const d=$(`#lessonCard [data-s="${G2.step}"]`);if(d)d.classList.add('ok');}
  c.innerHTML=G2.done[G2.step]?'<span class="okc">✔ Bu adım tamamlandı</span>':'<span class="wait">○ Bekleniyor: adımı kendin yap ya da "▶ Göster"e bas</span>';
}
function probeHint(k){
  const m=/^s([12])T$/.exec(k);
  if(m){const i=+m[1];if(!CLIPS['s'+i+'G'].h){say(`CH${i} probu takıldı ama toprak klipsi takılı değil! Osiloskop ölçümü toprağa göre yapar; pil gibi yalıtılmış bir devrede referans yoksa anlamlı bir şey göremezsin. Toprak klipsini devrenin eksi (–) noktasına tak.`,'warn');return;}
    if(!Scope.S.ch[i-1].on){say(`CH${i} probu takıldı ama osiloskopta CH${i} kapalı: CH${i} tuşuna bas.`,'warn');return;}
    say(`CH${i} probu ${holeName(CLIPS[k].h)} noktasında. İz ekranın dışında kalabilir (ör. 9 V, 1 V/div'de ekranın üst kenarına yapışır): AUTO'ya bas ya da V/div ve dikey konumu ayarla.`,'ok');return;}
  const g=/^s([12])G$/.exec(k);
  if(g&&CLIPS['s'+g[1]+'T'].h)say(`CH${g[1]} toprak klipsi takıldı. Şimdi ölçüm bu noktaya göre yapılıyor; görüntü için AUTO'ya bas.`,'ok');
}
/* ---------- Ölçüm izleme paneli ---------- */
const MMNAME={OFF:'Kapalı (OFF)',VAC:'AC gerilim (V~)',VDC:'DC gerilim (V⎓)',MV:'DC milivolt',R:'Direnç (Ω)',CONT:'Süreklilik',DIODE:'Diyot testi',CAP:'Kapasite',HZ:'Frekans (Hz)',HFE:'hFE',I_UA:'Akım μA',I_MA:'Akım mA',I_A:'Akım A',NCV:'NCV'};
const where=k=>CLIPS[k].h?holeName(CLIPS[k].h):'<span class="off">takılı değil</span>';
function miniTrace(){
  const S=Scope.S,fr=S.frame,on=[0,1].filter(i=>S.ch[i].on);
  if(!fr||!on.length)return '<div class="mempty">Görüntü yok</div>';
  let mn=1e18,mx=-1e18;on.forEach(i=>{const b=fr.buf[i];for(let k=0;k<b.length;k+=3){if(b[k]<mn)mn=b[k];if(b[k]>mx)mx=b[k];}});
  if(mn>0)mn=Math.min(0,mn);if(mx<0)mx=Math.max(0,mx);if(mx-mn<1e-6){mx+=0.5;mn-=0.5;}
  const pad=(mx-mn)*0.08;mx+=pad;mn-=pad;
  const W=300,Hh=86,y=v=>(Hh-(v-mn)/(mx-mn)*Hh).toFixed(1);
  let s=`<svg viewBox="0 0 ${W} ${Hh}" class="mini"><rect width="${W}" height="${Hh}" fill="#04080b"/>`;
  for(let k=1;k<6;k++)s+=`<line x1="${k*W/6}" y1="0" x2="${k*W/6}" y2="${Hh}" stroke="#1d2a33"/>`;
  s+=`<line x1="0" y1="${y(0)}" x2="${W}" y2="${y(0)}" stroke="#3d4f5c" stroke-dasharray="3 3"/>`;
  on.forEach(i=>{const b=fr.buf[i],N=b.length;let d='';for(let k=0;k<N;k+=3)d+=(k?'L':'M')+(k/(N-1)*W).toFixed(1)+' '+y(b[k]);s+=`<path d="${d}" fill="none" stroke="${Scope.COL[i]}" stroke-width="1.6"/>`;});
  s+=`<text x="4" y="11" font-size="9" fill="#9fb3c8">${Scope.siFmt(mx,'V')}</text><text x="4" y="${Hh-4}" font-size="9" fill="#9fb3c8">${Scope.siFmt(mn,'V')}</text><text x="${W-4}" y="${Hh-4}" font-size="9" fill="#9fb3c8" text-anchor="end">${Scope.siFmt(Scope.TD[S.ti]*12,'s')} pencere</text></svg>`;
  return s;
}
function renderMonitor(){
  const c=$('#monCard');if(!c||c.dataset.closed==='1')return;
  const S=Scope.S,m=MM.mtype(),R=lastMeter;
  const mmVal=!R||R.off?'—':`${R.num} ${R.unit}`;
  let h=`<div class="mhead"><span class="stepno">Ölçüm izleme</span><span class="mstat">${S.status}</span></div>`;
  h+=`<div class="mblk"><div class="mt">Multimetre · ${MMNAME[m]||m}</div><div class="mbig">${mmVal}</div><div class="msub">Kırmızı (${MM.S.jack==='10A'?'10A':'VΩmA'}): ${where('mmR')} · Siyah: ${where('mmB')}${!MM.S.fuseMA||!MM.S.fuseA?' · <b class="off">sigorta atık</b>':''}</div></div>`;
  h+=`<div class="mblk"><div class="mt">Osiloskop · ${Scope.siFmt(Scope.TD[S.ti],'s')}/div · tetik CH${S.trig.src+1}</div>${miniTrace()}`;
  [0,1].forEach(i=>{const ch=S.ch[i],M=ch.on?Scope.measure(i):null,col=Scope.COL[i];
    h+=`<div class="mch"><span class="dotc" style="background:${col}"></span><b>CH${i+1}</b> ${ch.on?'':'<span class="off">kapalı</span>'} <span class="msub">uç: ${where('s'+(i+1)+'T')} · toprak: ${where('s'+(i+1)+'G')}</span>`;
    if(M)h+=`<div class="mgrid"><span>Vmax <b>${Scope.mfmt(M,'vmax')}</b></span><span>Vmin <b>${Scope.mfmt(M,'vmin')}</b></span><span>Vpp <b>${Scope.mfmt(M,'vpp')}</b></span><span>Vort <b>${Scope.mfmt(M,'vavg')}</b></span><span>Frekans <b>${Scope.mfmt(M,'freq')}</b></span><span>+Duty <b>${Scope.mfmt(M,'pduty')}</b></span></div>`;
    h+='</div>';});
  h+='</div>';
  h+=`<div class="mblk"><div class="mt">Jeneratör · yük ${GEN.G.load}</div>`;
  [0,1].forEach(i=>{const g=GEN.CH[i],W={sine:'Sinüs',square:'Kare',pulse:'Darbe',ramp:'Rampa',arb:'Arb',noise:'Gürültü',dc:'DC'}[g.wave];
    h+=`<div class="mch"><b>CH${i+1}</b> <span class="${g.on?'onb':'off'}">${g.on?'AÇIK':'KAPALI'}</span> <span class="msub">${W}${g.wave==='dc'||g.wave==='noise'?'':' · '+Scope.siFmt(g.freq,'Hz')} · ${Scope.siFmt(g.amp,'Vpp')} · ofs ${Scope.siFmt(g.off,'V')}${g.wave==='square'||g.wave==='pulse'?' · %'+g.duty.toFixed(0):''}</span><div class="msub">Kırmızı: ${where('g'+(i+1)+'R')} · Siyah: ${where('g'+(i+1)+'B')}</div></div>`;});
  h+='</div>';
  c.innerHTML=h;
}
function renderFree(){
  $('#lessonCard').innerHTML=`<div class="stepno">Serbest kurma</div><h2>Kendi devreni kur</h2>
   <p>1) Üstteki araç çubuğundan bir eleman seç, breadboard'a tıkla (R ile döndür, Esc ile bitir). 2) "Kablo" ile iki delik arasına atlama kablosu çek. 3) Pil/DC kaynak/trafo uçlarını, cihaz problarını ve klipslerini sürükleyip deliklere tak.</p>
   <p style="font-size:.88rem;color:var(--sub)">İpucu: Bir deliğin üzerine gelince o deliğe bağlı tüm delikler yeşil yanar. Elemanı seçip Del ile silebilirsin. Gerçekteki gibi: seri direnç olmadan LED yanar, aşırı güçte direnç yanar, akım konumunda gerilim ölçersen sigorta atar.</p>`;
}

/* ---------- Başlat ---------- */
buildStatic();
board.innerHTML=`<g id="bstatic">${BOARD_STATIC}</g><g id="hl"></g><g id="bdyn"></g><g id="ghost"></g>`;
Scope.init(Object.assign({root:$('#scopeRoot'),say:(m,t)=>say(m,t),info:(t,b)=>info(t,b)},scopeHost));
MM.init({svg:$('#mmSvg'),info:(t,b)=>info(t,b),say:(m,t)=>say(m,t),change:()=>{needBuild=true;}});
renderTools();renderProps();
openTab(0);
requestAnimationFrame(loop);
