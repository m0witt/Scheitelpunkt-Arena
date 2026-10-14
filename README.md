# Scheitelpunkt-Arena

Lern-App zur Scheitelpunktform für die 11. Klasse (Fachoberschule, Technik). Rein statische Seite ohne Build-Schritt, Formelsatz mit KaTeX (lokal in `vendor/`).

Schreibweise: `f(x) = a(x − x_S)² + y_S`, Scheitelpunkt `S(x_S | y_S)`.

## Spiele (je 3 Stufen, Freischaltung nach 5 richtigen Aufgaben)
- **Ablesen:** Scheitelpunkt, Öffnungsrichtung, Wertemenge, weiter/enger als die Normalparabel
- **Parabel erkennen:** Funktionsterm aus dem Graphen im Koordinatengitter
- **Term zum Graph:** passenden von vier Graphen wählen
- **Punkte-Jagd:** Streckfaktor `a` aus Scheitelpunkt und einem Punkt
- **Parabel-Bauer:** Zielparabel mit drei Reglern nachbauen
- **Ausmultiplizieren:** Scheitelpunktform → allgemeine Form (nur diese Richtung)

Gestufte Tipps, XP, Ränge, Serien, Abzeichen, Tagesziel (20 Aufgaben). Der Fortschritt liegt nur im Browser (`localStorage`), es gibt keine Konten und keine Datenübertragung.

## Lokal starten
`index.html` im Browser öffnen oder einen beliebigen statischen Server nutzen, z. B. `python -m http.server`.

## Tests
```
node tests/test.js
```
Prüft Formelsatz, Eingabe-Parser und für jedes Spiel und jede Stufe, dass die richtige Lösung akzeptiert und eine falsche abgelehnt wird.

## Veröffentlichen (GitHub Pages)
Alle Dateien liegen relativ, der Ordner kann unverändert als Pages-Quelle (Branch `main`, Ordner `/`) dienen.

KaTeX steht unter MIT-Lizenz (`vendor/katex/LICENSE`).
