import re, sys, os
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sp = os.path.dirname(os.path.abspath(__file__))
gen = open(base + "/Fonksiyon_Jeneratoru_Egitimi.html", encoding="utf-8").read()
core = open(sp + "/scope_core.js", encoding="utf-8").read()
lab = open(sp + "/lab_custom.js", encoding="utf-8").read()

# --- CSS from generator + extras
css = re.search(r"<style>(.*?)</style>", gen, re.S).group(1)
css += """
  .scb{cursor:pointer;transition:transform .08s,filter .08s;}
  .scb.scp{transform:translate(0,2px);filter:brightness(.8);}
  .scknob{cursor:grab;}
  .srcrow{margin:8px 0;font-size:.88rem;}
  .srcrow select{border:1px solid var(--line);border-radius:6px;padding:4px 6px;font-size:.85rem;max-width:100%;}
"""
css = css.replace("max-width:1320px", "max-width:1380px")
css = css.replace("grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr)", "grid-template-columns:minmax(0,1.9fr) minmax(300px,1fr)")

# --- script parts from generator
js = re.search(r"<script>\n(.*?)</script>", gen, re.S).group(1)
def cut(a, b):
    i = js.index(a); j = js.index(b)
    return js[i:j]
part0 = js[:js.index("/* ---------- Dalga şekilleri ---------- */")]
partA = cut("/* ---------- Dalga şekilleri ---------- */", "/* ---------- Osiloskop ---------- */")
partB = cut("/* ---------- Tuş mantığı ---------- */", "/* ---------- Animasyon döngüsü ---------- */")

# patches
a_old = "function setInfo(k){if(!INFO[k])return;G.info=k;renderInfo();}"
assert a_old in partA
partA = partA.replace(a_old, "function setInfo(k){if(!INFO[k])return;G.info=k;G.custom=null;renderInfo();}")
a_old = "const i=INFO[G.info]||INFO.screen,c=CH[G.ch];"
assert a_old in partA
partA = partA.replace(a_old, "const i=G.custom||INFO[G.info]||INFO.screen,c=CH[G.ch];")
b_old = "if(el&&el.dataset.info!==G.info&&!G.hoverLock){setInfo(el.dataset.info);}"
assert b_old in partB
partB = partB.replace(b_old, "if(el&&(el.dataset.info!==G.info||G.custom)&&!G.hoverLock){setInfo(el.dataset.info);}")
for sel in ["#tdm", "#tdp", "#vdm", "#vdp", "#autoBtn"]:
    partB = re.sub(r"\$\('" + re.escape(sel) + r"'\)[^\n]*\n", "", partB)
partB = re.sub(r"\$\('#muteBtn'\)\.onclick[^\n]*\n", "", partB)
assert "#tdm" not in partB and "#autoBtn" not in partB and "muteBtn" not in partB

html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laboratuvar: Jeneratör + Osiloskop</title>
<style>{css}</style>
<script src="site-nav.js"></script>
</head>
<body>
<div class="app">
  <header class="cover">
    <h1>Laboratuvar: Fonksiyon Jeneratörü + Osiloskop</h1>
    <p>UNI-T UTG932E ile üretilen sinyal BNC kabloyla RIGOL DS1202Z-E osiloskoba bağlı. Üretecin tuşlarını ve düğmesini kullan, osiloskopta ölçüp doğrula. İmleci bir parçanın üzerine getirince sağda açıklaması çıkar.</p>
  </header>
  <nav id="chips"></nav>
  <main>
    <div class="stage-wrap">
      <svg id="stage" viewBox="0 0 930 1140" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="redglow"><stop offset="0" stop-color="#ff2b2b" stop-opacity=".95"/><stop offset="1" stop-color="#ff2b2b" stop-opacity="0"/></radialGradient>
          <radialGradient id="knobg" cx="45%" cy="40%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfcdc6"/></radialGradient>
          <radialGradient id="knobin" cx="45%" cy="40%"><stop offset="0" stop-color="#9aa0a8"/><stop offset="1" stop-color="#d7d9dc"/></radialGradient>
        </defs>
        <g id="genG" transform="translate(12 10) scale(1.14)"></g>
        <g id="benchG"></g>
        <g id="scopeRoot" transform="translate(0 620) scale(0.93)"></g>
        <g id="cableG"></g>
        <g id="labHalos"></g>
      </svg>
    </div>
    <aside class="side">
      <div class="card" id="lessonCard"></div>
      <div class="card" id="infoCard"></div>
      <div id="fb"></div>
      <div class="card" id="connCard"></div>
      <div class="card" id="presetCard" style="display:none"></div>
    </aside>
  </main>
</div>
<script>
{core}
</script>
<script>
{part0}
{partA}
{partB}
{lab}
</script>
</body>
</html>
"""
open(base + "/Lab_Jenerator_Osiloskop.html", "w", encoding="utf-8").write(html)
print("ok", len(html))
