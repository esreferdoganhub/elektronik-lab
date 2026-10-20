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
cz = ('/* Otomatik üretildi: _kaynak/build_sayisal.py — RIGOL osiloskop çekirdeği, UTG932E jeneratör, UT136B+ multimetre.\n'
      '   Kaynaklar: _kaynak/scope_core.js, Fonksiyon_Jeneratoru_Egitimi.html, Multimetre_Egitimi.html */\n'
      + cihazlar.scope_js() + '\n' + cihazlar.gen_js() + '\n' + cihazlar.mm_js())
open(os.path.join(here,'..','sayisal-elektronik','cihazlar.js'),'w',encoding='utf-8').write(cz)
print('cihazlar.js',len(cz))
