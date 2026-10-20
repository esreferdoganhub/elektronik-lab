#!/usr/bin/env python3
"""Sayısal/DC simülatörü (sayisal-elektronik/) için devre çözücüyü kopyalar.
   _kaynak/sim_solver.js  →  sayisal-elektronik/dc-cozucu.js"""
import os
here=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(here,'sim_solver.js'),encoding='utf-8').read()
out=os.path.join(here,'..','sayisal-elektronik','dc-cozucu.js')
open(out,'w',encoding='utf-8').write('/* Otomatik üretildi: _kaynak/build_sayisal.py — düzenlemeyin, _kaynak/sim_solver.js dosyasını düzenleyin. */\n'+src)
print('ok',len(src))
