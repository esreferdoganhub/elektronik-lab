import re, os
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sp = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(p, encoding="utf-8").read()
gen = rd(base + "/Fonksiyon_Jeneratoru_Egitimi.html")
mm = rd(base + "/Multimetre_Egitimi.html")
core = rd(sp + "/scope_core.js")
solver = rd(sp + "/sim_solver.js").replace("if(typeof module!=='undefined')module.exports=Solver;", "")

# ---------- Jeneratör (IIFE) ----------
js = re.search(r"<script>\n(.*?)</script>", gen, re.S).group(1)
def cut(s, a, b): return s[s.index(a):s.index(b)]
part0 = js[:js.index("/* ---------- Dalga şekilleri ---------- */")]
partA = cut(js, "/* ---------- Dalga şekilleri ---------- */", "/* ---------- Osiloskop ---------- */")
partB = cut(js, "/* ---------- Tuş mantığı ---------- */", "/* ---------- Animasyon döngüsü ---------- */")
assert "const stage=$('#stage');" in part0
part0 = part0.replace("const stage=$('#stage');", "const stage=$('#genSvg');")
assert '<g id="lcdG"></g>' in partA
partA = partA.replace('<g id="lcdG"></g>', '<g id="genLcdG"></g>')
for sel in ["#tdm", "#tdp", "#vdm", "#vdp", "#autoBtn", "#muteBtn"]:
    partB = re.sub(r"\$\('" + re.escape(sel) + r"'\)\.onclick[^\n]*\n", "", partB)
assert "#tdm" not in partB and "#muteBtn" not in partB
partB = partB.replace("const b=t.closest('[data-btn]');", "const b=t.closest('#genSvg [data-btn]');")
GEN = "const GEN=(function(){\n" + part0 + partA + partB + rd(sp + "/gen_new.js") + "\n})();\n"

# ---------- Multimetre (IIFE) ----------
mjs = re.search(r"<script>\n(.*?)</script>", mm, re.S).group(1)
consts = mjs[mjs.index("const MX=30"):mjs.index("/* ---------- Sahneler ---------- */")]
draw = cut(mjs, "/* ---------- Multimetre çizimi ---------- */", "/* ---------- Ölçüm mantığı ---------- */")
assert '<g id="lcdG"></g>' in draw
draw = draw.replace('<g id="lcdG"></g>', '<g id="mmLcdG"></g>')
info = mjs[mjs.index("const INFO=["):mjs.index("function renderInfo(){")]
MMJ = "const MM=(function(){\nconst $=s=>document.querySelector(s);\n" + consts + draw + info + rd(sp + "/mm_new.js") + "\n})();\n"

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
