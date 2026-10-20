#!/usr/bin/env python3
"""Sayısal/DC simülatörü (sayisal-elektronik/) için devre çözücüyü kopyalar.
   _kaynak/sim_solver.js  →  sayisal-elektronik/dc-cozucu.js"""
import os
here=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(here,'sim_solver.js'),encoding='utf-8').read()
out=os.path.join(here,'..','sayisal-elektronik','dc-cozucu.js')
open(out,'w',encoding='utf-8').write('/* Otomatik üretildi: _kaynak/build_sayisal.py — düzenlemeyin, _kaynak/sim_solver.js dosyasını düzenleyin. */\n'+src)
print('ok',len(src))
import sys
sys.path.insert(0, here)
import cihazlar
# Yalnız sayısal tezgâh için osiloskop ön paneli düzeltmeleri (diğer sayfalar scope_core.js'i olduğu gibi kullanır):
# ayrı ⏚ ŞASE soketi; CH1/CH2 prob (1X/10X) düğmeleri BNC'lerin üstüne taşınır, halolar buna göre güncellenir.
SCOPE_SAYISAL = [
    ("""<text x="${BNCX[i]}" y="${BNCY-30}" font-size="9" font-weight="800" fill="${i<2?COL[i]:'#777'}""",
     """<text x="${i<2?BNCX[i]-20:BNCX[i]}" y="${BNCY-33}" font-size="9" font-weight="800" fill="${i<2?COL[i]:'#777'}"""),
    ("""  ${[0,1].map(i=>`<g data-sc="probe${i+1}" data-si="probe${i+1}" class="scb"><rect x="${BNCX[i]-22}" y="428" width="44" height="18" rx="9" fill="#fff" stroke="#8e8b80" stroke-width="1.5"/><text id="pbt${i}" x="${BNCX[i]}" y="441" font-size="9" font-weight="800" fill="#444""",
     """  <g id="scGnd" data-si="bnc1"><circle cx="576" cy="438" r="11" fill="#d6d3c9" stroke="#6e6b62" stroke-width="1.8"/><text x="576" y="462" font-size="8" font-weight="800" fill="#555" text-anchor="middle">⏚ ŞASE</text></g>
  ${[0,1].map(i=>`<g data-sc="probe${i+1}" data-si="probe${i+1}" class="scb"><rect x="${BNCX[i]-4}" y="343" width="42" height="18" rx="9" fill="#fff" stroke="${COL[i]}" stroke-width="1.8"/><text id="pbt${i}" x="${BNCX[i]+17}" y="356" font-size="9" font-weight="800" fill="#333"""),
    ("""<rect class="halo" data-h="probe1" x="607" y="424" width="52" height="26" rx="10"/><rect class="halo" data-h="probe2" x="709" y="424" width="52" height="26" rx="10"/>""",
     """<rect class="halo" data-h="probe1" x="625" y="339" width="50" height="26" rx="10"/><rect class="halo" data-h="probe2" x="727" y="339" width="50" height="26" rx="10"/>"""),
]
def scope_js_sayisal():
    s = cihazlar.scope_js()
    for a, b in SCOPE_SAYISAL:
        assert s.count(a) == 1, 'scope_core.js eşleşmedi: ' + a[:60]
        s = s.replace(a, b)
    return s
cz = ('/* Otomatik üretildi: _kaynak/build_sayisal.py — RIGOL osiloskop çekirdeği, UTG932E jeneratör, UT136B+ multimetre.\n'
      '   Kaynaklar: _kaynak/scope_core.js, Fonksiyon_Jeneratoru_Egitimi.html, Multimetre_Egitimi.html */\n'
      + scope_js_sayisal() + '\n' + cihazlar.gen_js() + '\n' + cihazlar.mm_js())
open(os.path.join(here,'..','sayisal-elektronik','cihazlar.js'),'w',encoding='utf-8').write(cz)
print('cihazlar.js',len(cz))
