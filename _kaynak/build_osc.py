import os
sp = os.path.dirname(os.path.abspath(__file__))
base = os.path.dirname(sp)
core = open(sp + "/scope_core.js", encoding="utf-8").read()
t = open(sp + "/osc_template.html", encoding="utf-8").read()
open(base + "/Osiloskop_Egitimi.html", "w", encoding="utf-8").write(t.replace("/*__SCOPE__*/", core))
print("ok")
