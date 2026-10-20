"""Gerçek cihaz kodunu (UTG932E jeneratör, UT136B+ multimetre, RIGOL osiloskop çekirdeği)
kaynak eğitim sayfalarından çıkarır. build_sim.py ve build_sayisal.py ortak kullanır."""
import re, os
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sp = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(p, encoding="utf-8").read()

def cut(s, a, b): return s[s.index(a):s.index(b)]

def gen_js():
    gen = rd(base + "/Fonksiyon_Jeneratoru_Egitimi.html")
    js = re.search(r"<script>\n(.*?)</script>", gen, re.S).group(1)
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
    return "const GEN=(function(){\n" + part0 + partA + partB + rd(sp + "/gen_new.js") + "\n})();\n"

def mm_js():
    mm = rd(base + "/Multimetre_Egitimi.html")
    mjs = re.search(r"<script>\n(.*?)</script>", mm, re.S).group(1)
    consts = mjs[mjs.index("const MX=30"):mjs.index("/* ---------- Sahneler ---------- */")]
    draw = cut(mjs, "/* ---------- Multimetre çizimi ---------- */", "/* ---------- Ölçüm mantığı ---------- */")
    assert '<g id="lcdG"></g>' in draw
    draw = draw.replace('<g id="lcdG"></g>', '<g id="mmLcdG"></g>')
    info = mjs[mjs.index("const INFO=["):mjs.index("function renderInfo(){")]
    return "const MM=(function(){\nconst $=s=>document.querySelector(s);\n" + consts + draw + info + rd(sp + "/mm_new.js") + "\n})();\n"

def scope_js():
    return rd(sp + "/scope_core.js")

GEN_SVG = """<svg id="genSvg" viewBox="0 0 900 605" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="redglow"><stop offset="0" stop-color="#ff2b2b" stop-opacity=".95"/><stop offset="1" stop-color="#ff2b2b" stop-opacity="0"/></radialGradient>
            <radialGradient id="knobg" cx="45%" cy="40%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfcdc6"/></radialGradient>
            <radialGradient id="knobin" cx="45%" cy="40%"><stop offset="0" stop-color="#9aa0a8"/><stop offset="1" stop-color="#d7d9dc"/></radialGradient>
          </defs>
          <g id="genG" transform="translate(12 10) scale(1.14)"></g><g id="genBench"></g>
        </svg>"""
SCOPE_SVG = """<svg id="scopeSvg" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg"><g id="scopeRoot"></g></svg>"""
MM_SVG = """<svg id="mmSvg" viewBox="22 0 336 612" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="lcdbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeee8"/><stop offset="1" stop-color="#b3e0d9"/></linearGradient></defs>
          <g id="meterG" transform="translate(30 5)"></g>
        </svg>"""
