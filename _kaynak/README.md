# Kaynak dosyalar

Yayındaki HTML sayfalarının bir kısmı buradaki parçalardan derlenir:

- `python3 build_sim.py` → `Deney_Simulatoru.html` (osiloskop çekirdeği + devre çözücü + jeneratör/multimetre parçaları + `sim_app*.js`)
- `python3 build_lab.py` → `Lab_Jenerator_Osiloskop.html`
- `python3 build_osc.py` → `Osiloskop_Egitimi.html`

Jeneratör ve multimetre çizimleri derleme sırasında `Fonksiyon_Jeneratoru_Egitimi.html` ve `Multimetre_Egitimi.html` dosyalarından alınır.
`node test_solver.js` devre çözücüyü tarayıcı olmadan test eder.
