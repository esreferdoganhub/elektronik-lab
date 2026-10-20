import re, os
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sp = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(p, encoding="utf-8").read()
import sys
sys.path.insert(0, sp)
import cihazlar
core = cihazlar.scope_js()
solver = rd(sp + "/sim_solver.js").replace("if(typeof module!=='undefined')module.exports=Solver;", "")
GEN = cihazlar.gen_js()
MMJ = cihazlar.mm_js()

css = r"""
  :root{--bg:#eef1f5;--panel:#fff;--ink:#1f2933;--sub:#52606d;--accent:#1d6fa5;--accent2:#c0392b;--line:#d9e2ec;
    --ok:#1f7a45;--okbg:#eaf7ec;--warn:#8a5a00;--warnbg:#fff6e5;--bad:#9b1c1c;--badbg:#fdeaea;--info:#1d4e75;--infobg:#eaf2f8;}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;line-height:1.5;}
  .app{max-width:1560px;margin:0 auto;padding:16px 16px 50px;}
  header.cover{background:linear-gradient(135deg,#1d6fa5,#0d3b57);color:#fff;border-radius:14px;padding:16px 24px;margin-bottom:12px;}
  header.cover h1{margin:0 0 2px;font-size:1.4rem;}header.cover p{margin:0;opacity:.9;font-size:.9rem;}
  nav#chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px;}
  nav#chips button{border:1px solid var(--line);background:#fff;padding:6px 12px;border-radius:18px;cursor:pointer;font-size:.86rem;}
  nav#chips button.on{background:var(--accent);color:#fff;border-color:var(--accent);}
  #bench{position:relative;}
  .row1{display:grid;grid-template-columns:minmax(0,.84fr) minmax(0,1fr);gap:12px;margin-bottom:12px;}
  .row2{display:grid;grid-template-columns:180px minmax(0,1fr) 236px 310px;gap:12px;align-items:start;}
  .row2.pcol{grid-template-columns:180px minmax(0,1fr) 44px 310px;}
  .parts{background:#eef1f5;border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 24px);position:sticky;top:12px;}
  .parts .phead{display:flex;align-items:stretch;border-bottom:1px solid var(--line);background:#f7f8fa;}
  .parts .psel{flex:1;padding:6px 10px;min-width:0;}
  .parts .psel span{display:block;font-size:.7rem;color:var(--sub);}
  .parts .psel select{width:100%;border:none;background:transparent;font-size:.95rem;font-weight:600;color:var(--ink);padding:0;cursor:pointer;}
  .parts .ptog{width:40px;border:none;border-left:1px solid var(--line);background:#f7f8fa;cursor:pointer;font-size:1.1rem;color:#334e68;}
  .parts .ptog:hover{background:#e9eef4;}
  .parts .psearch{position:relative;margin:10px;}
  .parts .psearch input{width:100%;border:1px solid var(--line);border-radius:6px;padding:7px 30px 7px 10px;font-size:.9rem;background:#fff;}
  .parts .psearch svg{position:absolute;right:9px;top:8px;width:16px;height:16px;stroke:#9aa5b1;fill:none;stroke-width:2.2;}
  .parts .plist{overflow-y:auto;padding:0 10px 12px;}
  .parts h4{margin:10px 2px 6px;font-size:.95rem;font-weight:600;color:#1d8fd1;border-bottom:1px solid #d5dde6;padding-bottom:3px;}
  .parts .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
  .parts .pc{background:#fff;border:1px solid transparent;border-radius:8px;padding:6px 2px 5px;text-align:center;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;transition:border-color .12s,box-shadow .12s;}
  .parts .pc:hover{border-color:#8fc6ea;box-shadow:0 2px 6px rgba(29,111,165,.12);}
  .parts .pc.on{border-color:#1d8fd1;box-shadow:0 0 0 2px #cfe7f7;}
  .parts .pc.on span{color:#1d8fd1;}
  .parts .pc svg{width:44px;height:44px;display:block;margin:0 auto 2px;pointer-events:none;}
  .parts .pc span{font-size:.68rem;line-height:1.15;color:#333;display:block;min-height:2.3em;pointer-events:none;}
  .parts .phint{font-size:.72rem;color:var(--sub);margin:8px 2px 0;}
  .parts .pempty{font-size:.8rem;color:var(--sub);padding:10px 2px;}
  .row2.pcol .parts .psel,.row2.pcol .parts .psearch,.row2.pcol .parts .plist{display:none;}
  .row2.pcol .parts .ptog{width:100%;border-left:none;height:44px;}
  .row2.pcol .parts .pvert{display:block;}
  .parts .pvert{display:none;writing-mode:vertical-rl;transform:rotate(180deg);font-size:.8rem;font-weight:600;color:#334e68;margin:10px auto;cursor:pointer;}
  #dragImg{position:fixed;left:0;top:0;width:52px;height:52px;pointer-events:none;z-index:50;display:none;opacity:.85;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25));}
  .inst,.boardWrap{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:6px;}
  .ilabel{font-size:.74rem;color:var(--sub);text-transform:uppercase;letter-spacing:.05em;margin:2px 6px 4px;}
  .inst svg,#board{width:100%;height:auto;display:block;user-select:none;touch-action:none;}
  #overlay{position:absolute;left:0;top:0;pointer-events:none;z-index:5;}
  #tools{display:flex;flex-wrap:wrap;gap:4px;padding:4px 4px 8px;align-items:center;}
  .tb{border:1px solid var(--line);background:#f8fafc;border-radius:6px;padding:4px 8px;font-size:.78rem;cursor:pointer;}
  .tb:hover{border-color:var(--accent);} .tb.on{background:var(--accent);color:#fff;border-color:var(--accent);} .tb:disabled{opacity:.4;cursor:default;}
  #tools select{font-size:.78rem;padding:3px;border-radius:6px;border:1px solid var(--line);}
  .sep{width:1px;height:20px;background:var(--line);margin:0 4px;}
  .side{display:flex;flex-direction:column;gap:10px;}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;}
  .card h2{margin:0 0 4px;font-size:1.02rem;color:var(--accent);}
  .card .stepno{font-size:.74rem;color:var(--sub);text-transform:uppercase;letter-spacing:.04em;}
  .card p{margin:6px 0;font-size:.9rem;}
  .card details{font-size:.85rem;margin:4px 0;} .card details summary{cursor:pointer;color:var(--accent);}
  .card .intro{background:#f4f8fc;border-radius:8px;padding:6px 8px;font-size:.84rem;}
  .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center;}
  button.b{border:1px solid var(--line);background:#fff;color:var(--ink);padding:6px 11px;border-radius:8px;cursor:pointer;font-size:.86rem;}
  button.b:hover{border-color:var(--accent);} button.b.pri{background:var(--accent);color:#fff;border-color:var(--accent);}
  button.b.sm{padding:4px 9px;font-size:.8rem;} button.b:disabled{opacity:.45;cursor:default;}
  .steps{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;}
  .steps .dot{width:22px;height:22px;border-radius:50%;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:.72rem;cursor:pointer;background:#fff;}
  .steps .dot.cur{border-color:var(--accent);color:var(--accent);font-weight:700;} .steps .dot.ok{background:var(--okbg);border-color:var(--ok);color:var(--ok);}
  .chk{font-size:.84rem;margin-top:4px;} .okc{color:var(--ok);font-weight:600;} .wait{color:var(--sub);}
  #fb{border-radius:10px;padding:9px 12px;font-size:.88rem;border-left:5px solid var(--info);background:var(--infobg);color:var(--info);min-height:40px;}
  #fb.ok{border-color:var(--ok);background:var(--okbg);color:var(--ok);} #fb.warn{border-color:#e0a11a;background:var(--warnbg);color:var(--warn);} #fb.bad{border-color:var(--accent2);background:var(--badbg);color:var(--bad);}
  .props label{display:block;font-size:.85rem;margin:5px 0;} .props select,.props input[type=range]{margin-left:6px;vertical-align:middle;}
  .props .vin{display:inline-flex;gap:4px;align-items:center;margin-left:6px;vertical-align:middle;} .props .vin select{margin-left:0;max-width:7.5em;}
  .props .vtxt{width:6.5em;padding:2px 5px;font:inherit;font-family:Menlo,Consolas,monospace;font-size:.82rem;border:1px solid var(--line);border-radius:5px;}
  .vpop{position:fixed;z-index:60;width:258px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 10px 7px;
    box-shadow:0 10px 30px rgba(15,30,50,.22),0 2px 6px rgba(15,30,50,.12);font-size:.84rem;color:var(--ink);animation:vpIn .26s cubic-bezier(.34,1.56,.64,1) both;}
  .vpop.out{animation:vpOut .16s ease-in both;pointer-events:none;}
  .vpop .vparr{position:absolute;left:var(--ax);bottom:-7px;width:12px;height:12px;margin-left:-6px;background:var(--panel);border-right:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg);}
  .vpop.below .vparr{bottom:auto;top:-7px;transform:rotate(225deg);}
  .vpop .vph{display:flex;justify-content:space-between;align-items:center;font-weight:700;color:var(--accent);margin-bottom:6px;}
  .vpop .vpx{border:0;background:none;color:var(--sub);cursor:pointer;font-size:.85rem;padding:0 2px;border-radius:4px;} .vpop .vpx:hover{background:var(--line);}
  .vpop .vpr{display:flex;gap:6px;align-items:center;} .vpop .vpl{color:var(--sub);font-size:.8rem;}
  .vpop .vpi{flex:1;min-width:0;padding:5px 8px;font-family:Menlo,Consolas,monospace;font-size:.95rem;border:1.5px solid var(--accent);border-radius:7px;outline:none;transition:border-color .15s,background .15s,box-shadow .15s;}
  .vpop .vpi:focus{box-shadow:0 0 0 3px rgba(29,111,165,.18);}
  .vpop .vpok{border:0;background:var(--accent);color:#fff;border-radius:7px;width:32px;height:30px;cursor:pointer;font-size:1rem;transition:transform .12s;} .vpop .vpok:active{transform:scale(.9);}
  .vpop .vpc{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px;}
  .vpop .vpc button{border:1px solid var(--line);background:#f6f8fb;border-radius:999px;padding:2px 8px;font-size:.74rem;cursor:pointer;color:var(--ink);transition:background .12s,transform .12s;}
  .vpop .vpc button:hover{background:#e3edf6;transform:translateY(-1px);} .vpop .vpc button.on{background:var(--accent);border-color:var(--accent);color:#fff;}
  .vpop .vpe{color:var(--bad);font-size:.76rem;margin-top:5px;min-height:0;} .vpop .vpe:empty{display:none;}
  .vpop .vpt{color:var(--sub);font-size:.68rem;margin-top:6px;}
  .vpop.bad .vpi{border-color:var(--accent2);background:var(--badbg);}
  .vpop.shake{animation:vpShake .32s ease;}
  .vpop.done .vpi{border-color:var(--ok);background:var(--okbg);} .vpop.done .vpok{background:var(--ok);}
  .vpop .vpi.tick{animation:vpTick .18s ease;}
  .vpop .vps{margin-top:8px;} .vpop .vps>.vpl{display:block;margin-bottom:3px;}
  .vpop .vps .vpc{margin-top:0;}
  .vpop .vsw{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);}
  .vpop .vpc button.on .vsw{box-shadow:0 0 0 2px #fff,inset 0 0 0 1px rgba(0,0,0,.25);}
  .vpop .vprg{display:flex;align-items:center;gap:8px;flex-wrap:wrap;} .vpop .vprg>.vpl{display:inline;margin:0;} .vpop .vprg input{flex:1;min-width:100px;accent-color:var(--accent);} .vpop .vprg b{font-family:Menlo,Consolas,monospace;font-size:.8rem;min-width:4.2em;text-align:right;}
  .vpop .vtg{display:inline-flex;align-items:center;gap:8px;border:0;background:none;padding:0;cursor:pointer;font:inherit;color:var(--ink);}
  .vpop .vtg i{position:relative;width:34px;height:19px;border-radius:999px;background:#c9d2dc;transition:background .2s;flex:none;}
  .vpop .vtg i::after{content:'';position:absolute;left:2px;top:2px;width:15px;height:15px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .22s cubic-bezier(.34,1.56,.64,1);}
  .vpop .vtg.on i{background:var(--ok);} .vpop .vtg.on i::after{transform:translateX(15px);}
  .vpop .vpinfo{margin-top:7px;color:var(--sub);font-size:.78rem;line-height:1.45;}
  .vpop .vplive{margin-top:7px;padding:4px 7px;border-radius:6px;background:#eef5fb;color:var(--info);font-family:Menlo,Consolas,monospace;font-size:.74rem;}
  .vpop .vplive[hidden]{display:none;}
  .vpop .vpburn{margin:2px 0 4px;padding:5px 7px;border-radius:6px;background:var(--badbg);color:var(--bad);font-size:.8rem;}
  .vpop .vpburn button{margin-left:6px;border:0;border-radius:6px;background:var(--accent2);color:#fff;padding:2px 9px;cursor:pointer;}
  .vpop .pulse{animation:vpPulse .3s ease;}
  @keyframes vpPulse{40%{transform:scale(1.12);}}
  @keyframes vpIn{from{opacity:0;transform:scale(.6) translateY(6px);}to{opacity:1;transform:none;}}
  @keyframes vpOut{to{opacity:0;transform:scale(.85) translateY(4px);}}
  @keyframes vpShake{0%,100%{transform:none;}20%{transform:translateX(-6px);}40%{transform:translateX(5px);}60%{transform:translateX(-3px);}80%{transform:translateX(2px);}}
  @keyframes vpTick{50%{transform:scale(1.05);}}
  @media (prefers-reduced-motion:reduce){.vpop,.vpop.out,.vpop.shake,.vpop .vpi.tick,.vpop .pulse{animation-duration:1ms;} .vpop .vtg i,.vpop .vtg i::after{transition:none;}}
  .props .vtxt.bad{border-color:var(--accent2);background:var(--badbg);} .props .verr{font-size:.78rem;color:var(--bad);margin:2px 0 4px;}
  .simline{font-size:.82rem;color:var(--sub);margin-top:4px;}
  .cablab{font-size:.78rem;color:var(--sub);margin-right:2px;} .seg{display:inline-flex;gap:2px;}
  #monCard .mhead{display:flex;justify-content:space-between;align-items:center;}
  #monCard .mstat{font-size:.72rem;font-weight:700;background:#e8f7ee;color:#1f7a45;border-radius:6px;padding:1px 6px;}
  #monCard .mblk{border-top:1px solid var(--line);padding-top:8px;margin-top:8px;}
  #monCard .mt{font-size:.78rem;font-weight:700;color:var(--accent);margin-bottom:3px;}
  #monCard .mbig{font-family:Menlo,Consolas,monospace;font-size:1.5rem;font-weight:700;background:#c4ebe4;color:#12302c;border-radius:6px;padding:2px 10px;display:inline-block;margin:2px 0;}
  #monCard .msub{font-size:.76rem;color:var(--sub);}
  #monCard .off{color:#c0392b;font-weight:600;} #monCard .onb{color:#1f7a45;font-weight:700;}
  #monCard .mini{width:100%;height:auto;border-radius:6px;display:block;margin:4px 0;}
  #monCard .mempty{font-size:.8rem;color:var(--sub);background:#f2f4f7;border-radius:6px;padding:14px;text-align:center;margin:4px 0;}
  #monCard .mch{font-size:.82rem;margin:5px 0;}
  #monCard .dotc{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;}
  #monCard .mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px 8px;font-size:.76rem;color:var(--sub);margin-top:2px;}
  #monCard .mgrid b{color:var(--ink);font-family:Menlo,Consolas,monospace;font-weight:600;}
  #infoCard h2{font-size:.95rem;} #infoCard p{font-size:.84rem;}
  .el.sel{filter:drop-shadow(0 0 3px #1d6fa5);}
  .halo{display:none;}
  [data-btn],[data-row],[data-chsel]{cursor:pointer;} [data-btn]{transition:transform .08s,filter .08s;} [data-btn].pressed{transform:translate(0,2.5px);filter:brightness(.78);}
  .blink{animation:bl 1s steps(2,start) infinite;} @keyframes bl{50%{opacity:0}}
  .knobwrap{cursor:grab;} .scb{cursor:pointer;transition:transform .08s,filter .08s;} .scb.scp{transform:translate(0,2px);filter:brightness(.8);} .scknob{cursor:grab;}
  .meter-label{font:700 12px "Segoe UI",Arial,sans-serif;fill:#e8e8e8;}
  .clickable{cursor:pointer;} .knob{cursor:grab;} .beepicon{animation:bp .25s infinite alternate;} @keyframes bp{to{opacity:.25}}
  @media (max-width:1440px){.row2{grid-template-columns:170px minmax(0,1fr) 224px;} .row2.pcol{grid-template-columns:170px minmax(0,1fr) 44px;} .side{grid-column:1 / -1;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));align-items:start;}}
  @media (max-width:1000px){.row2,.row2.pcol{grid-template-columns:150px minmax(0,1fr);} .parts{grid-column:1 / -1;position:static;max-height:none;}}
  @media (max-width:800px){.row1{grid-template-columns:1fr;} .row2,.row2.pcol{grid-template-columns:1fr;} .parts{position:static;max-height:none;}}
"""

html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deney Simülatörü</title>
<style>{css}</style>
<script src="site-nav.js"></script>
</head>
<body>
<div class="app">
  <header class="cover">
    <h1>Elektronik Deney Simülatörü – Breadboard + Multimetre + Jeneratör + Osiloskop</h1>
    <p>Gerçek devre çözücüyle (düğüm analizi, Newton-Raphson, zaman adımı) çalışır. Elemanları breadboard'a yerleştir, probları ve klipsleri deliklere tak, cihazlarla ölç. Gerçekteki gibi: LED, direnç ve sigorta yanabilir; toprak klipsleri şebeke toprağına bağlıdır.</p>
  </header>
  <nav id="chips"></nav>
  <div id="bench">
    <div class="row1">
      <div class="inst"><div class="ilabel">Fonksiyon jeneratörü · UNI-T UTG932E</div>
        <svg id="genSvg" viewBox="0 0 900 605" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="redglow"><stop offset="0" stop-color="#ff2b2b" stop-opacity=".95"/><stop offset="1" stop-color="#ff2b2b" stop-opacity="0"/></radialGradient>
            <radialGradient id="knobg" cx="45%" cy="40%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfcdc6"/></radialGradient>
            <radialGradient id="knobin" cx="45%" cy="40%"><stop offset="0" stop-color="#9aa0a8"/><stop offset="1" stop-color="#d7d9dc"/></radialGradient>
          </defs>
          <g id="genG" transform="translate(12 10) scale(1.14)"></g><g id="genBench"></g>
        </svg></div>
      <div class="inst"><div class="ilabel">Osiloskop · RIGOL DS1202Z-E</div>
        <svg id="scopeSvg" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg"><g id="scopeRoot"></g></svg></div>
    </div>
    <div class="row2">
      <div class="inst"><div class="ilabel">Multimetre · UT136B+</div>
        <svg id="mmSvg" viewBox="22 0 336 612" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="lcdbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeee8"/><stop offset="1" stop-color="#b3e0d9"/></linearGradient></defs>
          <g id="meterG" transform="translate(30 5)"></g>
        </svg></div>
      <div class="boardWrap"><div id="tools"></div><svg id="board" viewBox="0 0 930 455" xmlns="http://www.w3.org/2000/svg"></svg></div>
      <aside class="parts" id="parts"></aside>
      <aside class="side">
        <div class="card" id="lessonCard"></div>
        <div id="fb"></div>
        <div class="card" id="monCard"></div>
        <div class="card" id="propCard"></div>
        <div class="card" id="infoCard"></div>
        <div class="card" id="simCard"></div>
      </aside>
    </div>
    <svg id="overlay" xmlns="http://www.w3.org/2000/svg"></svg>
    <div id="dragImg"></div>
  </div>
</div>
<script>
{core}
{solver}
{GEN}
{MMJ}
{rd(sp + "/sim_app.js")}
{rd(sp + "/sim_app2.js")}
</script>
</body>
</html>
"""
open(base + "/Deney_Simulatoru.html", "w", encoding="utf-8").write(html)
print("ok", len(html))
