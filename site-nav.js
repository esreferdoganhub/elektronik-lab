/* Elektronik Laboratuvarı — ortak gezinme çubuğu ve sayfa altı geçişleri.
   Her sayfanın <head> bölümüne senkron olarak eklenir: <script src="site-nav.js"></script> */
(function(){
'use strict';
var cs=document.currentScript,base=cs?cs.src.replace(/site-nav\.js[^/]*$/,''):'';
var FILE=location.protocol==='file:';
var DIG=FILE?'sayisal-elektronik/index.html':'sayisal-elektronik/';
var MCU=FILE?'mikrodenetleyiciler/index.html':'mikrodenetleyiciler/';
var NAV=[
  {k:'home',href:'index.html',t:'Ana sayfa'},
  {k:'sim',href:'Deney_Simulatoru.html',t:'Deney Simülatörü'},
  {k:'dev',t:'Cihaz eğitimleri',items:[
    {k:'mm',href:'Multimetre_Egitimi.html',t:'Multimetre',d:'UNI-T UT136B+ · ölçüm türleri, AC/DC',ic:'M3 4h10v16H3zM5 6h6v4H5zM8 14a2 2 0 1 0 0 .01'},
    {k:'gen',href:'Fonksiyon_Jeneratoru_Egitimi.html',t:'Fonksiyon jeneratörü',d:'UNI-T UTG932E · dalga, PWM, modülasyon',ic:'M2 12q3-8 6 0t6 0t6 0'},
    {k:'osc',href:'Osiloskop_Egitimi.html',t:'Osiloskop',d:'RIGOL DS1202Z-E · tetikleme, ölçüm',ic:'M2 4h20v14H2zM4 13l3-5 3 7 3-6 3 4 3-3'},
    {k:'lab',href:'Lab_Jenerator_Osiloskop.html',t:'Jeneratör + Osiloskop',d:'İki cihaz birlikte, kabloyla bağlı',ic:'M3 6h7v6H3zM14 12h7v6h-7zM10 9c4 0 4 6 4 6'}
  ]},
  {k:'dig',href:DIG,t:'Sayısal Elektronik'},
  {k:'mcu',href:MCU,t:'Mikrodenetleyiciler'}
];
var SEQ=[
  {k:'mm',href:'Multimetre_Egitimi.html',t:'Multimetre eğitimi'},
  {k:'gen',href:'Fonksiyon_Jeneratoru_Egitimi.html',t:'Fonksiyon jeneratörü eğitimi'},
  {k:'osc',href:'Osiloskop_Egitimi.html',t:'Osiloskop eğitimi'},
  {k:'lab',href:'Lab_Jenerator_Osiloskop.html',t:'Jeneratör + osiloskop laboratuvarı'},
  {k:'sim',href:'Deney_Simulatoru.html',t:'Deney simülatörü'},
  {k:'dig',href:DIG,t:'Sayısal tasarım laboratuvarı'},
  {k:'mcu',href:MCU,t:'Mikrodenetleyiciler'}
];
var path=decodeURIComponent(location.pathname);
var cur='home';
if(/sayisal-elektronik(\/|\/index\.html)?$/.test(path))cur='dig';
else if(/\/mikrodenetleyiciler(\/|$)/.test(path))cur='mcu';
else{var f=path.split('/').pop();SEQ.forEach(function(p){if(p.href===f)cur=p.k;});}
var DARK=false,APP=cur==='dig';

/* ---- stiller (ilk boyamadan önce) ---- */
var css=''+
'@view-transition{navigation:auto}'+
'::view-transition-old(root),::view-transition-new(root){animation-duration:.22s}'+
':root{--sn-h:56px}'+
'.sn{position:sticky;top:0;z-index:1000;height:var(--sn-h);background:rgba(255,255,255,.86);-webkit-backdrop-filter:saturate(1.6) blur(12px);backdrop-filter:saturate(1.6) blur(12px);border-bottom:1px solid rgba(20,40,60,.1);font-family:"Inter","Segoe UI","Helvetica Neue",Arial,sans-serif;view-transition-name:sitenav}'+
'.sn *{box-sizing:border-box}'+
'.sn-in{max-width:1560px;margin:0 auto;height:100%;padding:0 18px;display:flex;align-items:center;gap:22px}'+
'.sn-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#14212e;font-weight:700;font-size:15px;white-space:nowrap}'+
'.sn-brand svg{width:30px;height:30px;flex:none}'+
'.sn-links{display:flex;align-items:center;gap:4px;margin-left:auto}'+
'.sn-l{position:relative;display:inline-flex;align-items:center;gap:5px;padding:8px 12px;border-radius:8px;font-size:14px;color:#3d4f61;text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit;transition:background .15s,color .15s}'+
'.sn-l:hover{background:rgba(29,111,165,.08);color:#14212e}'+
'.sn-l.on{color:#1d6fa5;font-weight:600}'+
'.sn-l.on::after{content:"";position:absolute;left:12px;right:12px;bottom:-9px;height:2px;border-radius:2px;background:#1d6fa5}'+
'.sn-l svg{width:12px;height:12px;transition:transform .2s}'+
'.sn-dd{position:relative}'+
'.sn-dd.open>.sn-l svg{transform:rotate(180deg)}'+
'.sn-menu{position:absolute;right:0;top:calc(100% + 10px);width:330px;background:#fff;border:1px solid rgba(20,40,60,.1);border-radius:14px;box-shadow:0 18px 40px rgba(13,40,64,.16);padding:8px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .16s,transform .16s,visibility .16s}'+
'.sn-dd.open .sn-menu{opacity:1;visibility:visible;transform:none}'+
'.sn-mi{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:10px;text-decoration:none;color:#14212e}'+
'.sn-mi:hover{background:#f1f6fb}'+
'.sn-mi.on{background:#e9f2f9}'+
'.sn-mi i{flex:none;width:34px;height:34px;border-radius:9px;background:#e9f2f9;display:flex;align-items:center;justify-content:center}'+
'.sn-mi i svg{width:20px;height:20px;fill:none;stroke:#1d6fa5;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'+
'.sn-mi b{display:block;font-size:14px;font-weight:600}'+
'.sn-mi span{display:block;font-size:12px;color:#647587;margin-top:1px}'+
'.sn-cta{margin-left:8px;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;background:#ffb703;color:#1b1300;font-weight:600;font-size:13.5px;text-decoration:none;white-space:nowrap;box-shadow:0 4px 14px rgba(255,183,3,.28);transition:transform .15s}'+
'.sn-cta:hover{transform:translateY(-1px)}'+
'.sn-burger{display:none;margin-left:auto;width:40px;height:40px;border-radius:9px;border:1px solid rgba(20,40,60,.14);background:transparent;cursor:pointer;align-items:center;justify-content:center}'+
'.sn-burger svg{width:20px;height:20px;stroke:#14212e;stroke-width:2;stroke-linecap:round}'+
'.sn.dark{background:rgba(13,17,23,.9);border-bottom-color:#2d3744}'+
'.sn.dark .sn-brand{color:#e6edf3}.sn.dark .sn-l{color:#a9b6c5}.sn.dark .sn-l:hover{background:rgba(255,255,255,.07);color:#fff}.sn.dark .sn-l.on{color:#f2b705}.sn.dark .sn-l.on::after{background:#f2b705}'+
'.sn.dark .sn-burger{border-color:#2d3744}.sn.dark .sn-burger svg{stroke:#e6edf3}'+
'@media (max-width:900px){'+
' .sn-links{position:absolute;left:0;right:0;top:var(--sn-h);flex-direction:column;align-items:stretch;gap:2px;padding:10px 14px 16px;background:#fff;border-bottom:1px solid rgba(20,40,60,.1);box-shadow:0 18px 30px rgba(13,40,64,.12);display:none;margin:0}'+
' .sn.open .sn-links{display:flex}'+
' .sn-burger{display:inline-flex}'+
' .sn-l{padding:12px;font-size:15px}.sn-l.on::after{display:none}.sn-l.on{background:#e9f2f9}'+
' .sn-menu{position:static;width:auto;box-shadow:none;border:none;padding:0 0 0 8px;opacity:1;visibility:visible;transform:none;display:none}'+
' .sn-dd.open .sn-menu{display:block}'+
' .sn-cta{margin:8px 0 0;justify-content:center}'+
' .sn.dark .sn-links{background:#0d1117;border-bottom-color:#2d3744}'+
'}'+
'.sn-foot{margin:48px auto 0;max-width:1180px;padding:0 20px 40px;font-family:"Inter","Segoe UI","Helvetica Neue",Arial,sans-serif}'+
'.sn-pn{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:stretch;border-top:1px solid rgba(20,40,60,.1);padding-top:22px}'+
'.sn-pn a{text-decoration:none;color:#14212e;border:1px solid rgba(20,40,60,.12);border-radius:14px;padding:14px 18px;background:#fff;transition:border-color .15s,transform .15s,box-shadow .15s}'+
'.sn-pn a:hover{border-color:#1d6fa5;transform:translateY(-2px);box-shadow:0 10px 24px rgba(13,40,64,.08)}'+
'.sn-pn small{display:block;font-size:12px;color:#647587;margin-bottom:2px}'+
'.sn-pn b{font-size:15px;font-weight:600}'+
'.sn-pn .nx{text-align:right}'+
'.sn-pn .hm{display:flex;align-items:center;justify-content:center;font-size:13.5px;color:#1d6fa5;font-weight:600;white-space:nowrap}'+
'.sn-pn .ph{visibility:hidden}'+
'@media (max-width:700px){.sn-pn{grid-template-columns:1fr}.sn-pn .nx{text-align:left}.sn-pn .ph{display:none}}'+
'@media (prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none}.sn-menu{transition:none}}';
var DK='.sn.dark .sn-menu{background:#161f2a;border-color:#2d3744}.sn.dark .sn-mi{color:#e6edf3}.sn.dark .sn-mi:hover,.sn.dark .sn-mi.on{background:#1f2b38}.sn.dark .sn-mi span{color:#98a9ba}.sn.dark .sn-mi i{background:#1f2b38}.sn.dark .sn-mi i svg{stroke:#5aa9e6}';
css+=DK;
if(cur==='home'){var D=DK+'.sn{background:rgba(12,20,28,.86);border-bottom-color:#243445}.sn .sn-brand{color:#e6edf3}.sn .sn-l{color:#a9b6c5}.sn .sn-l:hover{background:rgba(255,255,255,.07);color:#fff}.sn .sn-l.on{color:#5aa9e6}.sn .sn-l.on::after{background:#5aa9e6}.sn .sn-burger{border-color:#243445}.sn .sn-burger svg{stroke:#e6edf3}@media (max-width:900px){.sn .sn-links{background:#0c141c;border-bottom-color:#243445}.sn .sn-l.on{background:#16283a}}';
  D=D.replace(/\.sn\.dark /g,'.sn ');
  css+='@media (prefers-color-scheme:dark){'+D.replace(/(^|[{}])([^{}@]+)\{/g,function(m,a,sel){return a+sel.split(',').map(function(x){return ':root:not([data-theme="light"]) '+x;}).join(',')+'{';})+'}';
  css+=D.replace(/(^|[{}])([^{}@]+)\{/g,function(m,a,sel){return a+sel.split(',').map(function(x){return ':root[data-theme="dark"] '+x;}).join(',')+'{';});}
if(APP)css+='html,body{height:100%}#main{height:calc(100% - 50px - var(--sn-h))!important}';
if(cur==='sim')css+='.parts{top:calc(var(--sn-h) + 12px)!important;max-height:calc(100vh - var(--sn-h) - 24px)!important}';
var st=document.createElement('style');st.id='site-nav-css';st.textContent=css;(document.head||document.documentElement).appendChild(st);

/* ---- işaretleme ---- */
function u(h){return base+h;}
var LOGO='<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0d3b57"/><path d="M4 17 Q8 6 12 17 T20 17 T28 17" fill="none" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/></svg>';
var CHEV='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function build(){
  if(document.querySelector('.sn'))return;
  var h='<header class="sn'+(DARK?' dark':'')+'"><div class="sn-in">'+
    '<a class="sn-brand" href="'+u('index.html')+'" aria-label="Elektronik Laboratuvarı ana sayfa">'+LOGO+'<span>Elektronik Laboratuvarı</span></a>'+
    '<button class="sn-burger" aria-label="Menüyü aç" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>'+
    '<nav class="sn-links" aria-label="Site menüsü">';
  NAV.forEach(function(n){
    if(n.items){
      var on=n.items.some(function(i){return i.k===cur;});
      h+='<div class="sn-dd"><button class="sn-l'+(on?' on':'')+'" aria-haspopup="true" aria-expanded="false">'+n.t+CHEV+'</button><div class="sn-menu" role="menu">';
      n.items.forEach(function(i){h+='<a class="sn-mi'+(i.k===cur?' on':'')+'" role="menuitem" href="'+u(i.href)+'"><i><svg viewBox="0 0 24 24"><path d="'+i.ic+'"/></svg></i><div><b>'+i.t+'</b><span>'+i.d+'</span></div></a>';});
      h+='</div></div>';
    }else h+='<a class="sn-l'+(n.k===cur?' on':'')+'" href="'+u(n.href)+'"'+(n.k===cur?' aria-current="page"':'')+'>'+n.t+'</a>';
  });
  if(cur!=='sim')h+='<a class="sn-cta" href="'+u('Deney_Simulatoru.html')+'">Simülatörü aç →</a>';
  h+='</nav></div></header>';
  document.body.insertAdjacentHTML('afterbegin',h);
  var nav=document.querySelector('.sn'),dd=nav.querySelector('.sn-dd'),btn=dd.querySelector('button'),bur=nav.querySelector('.sn-burger');
  var hoverOK=window.matchMedia('(hover:hover) and (min-width:901px)');
  function setDD(o){dd.classList.toggle('open',o);btn.setAttribute('aria-expanded',o?'true':'false');}
  btn.addEventListener('click',function(e){e.stopPropagation();setDD(!dd.classList.contains('open'));});
  dd.addEventListener('mouseenter',function(){if(hoverOK.matches)setDD(true);});
  dd.addEventListener('mouseleave',function(){if(hoverOK.matches)setDD(false);});
  bur.addEventListener('click',function(e){e.stopPropagation();var o=!nav.classList.contains('open');nav.classList.toggle('open',o);bur.setAttribute('aria-expanded',o?'true':'false');});
  document.addEventListener('click',function(e){if(!nav.contains(e.target)){setDD(false);nav.classList.remove('open');}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){setDD(false);nav.classList.remove('open');}});

  /* sayfa altı: önceki / sonraki */
  var i=-1;SEQ.forEach(function(p,j){if(p.k===cur)i=j;});
  if(i>=0&&!APP){
    var pv=SEQ[i-1],nx=SEQ[i+1];
    var f='<footer class="sn-foot"><div class="sn-pn">'+
      (pv?'<a href="'+u(pv.href)+'"><small>← Önceki</small><b>'+pv.t+'</b></a>':'<a class="ph" aria-hidden="true"></a>')+
      '<a class="hm" href="'+u('index.html')+'">Tüm içerik</a>'+
      (nx?'<a class="nx" href="'+u(nx.href)+'"><small>Sonraki →</small><b>'+nx.t+'</b></a>':'<a class="ph" aria-hidden="true"></a>')+
      '</div></footer>';
    document.body.insertAdjacentHTML('beforeend',f);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
