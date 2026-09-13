# Testbericht – GitHub-Pages-Version

Datum: 2026-09-13

## Durchgeführte Prüfungen

- `app.js`, `solver-worker.js` und `sw.js` mit `node --check`: **bestanden**
- `manifest.webmanifest` als JSON eingelesen: **bestanden**
- Manifest: `start_url: ./`, `scope: ./`, `display: standalone`: **bestanden**
- Home-Screen-Icons: 180×180, 192×192, 512×512: **bestanden**
- doppelte HTML-IDs: **keine**
- JavaScript-Verweise auf fehlende HTML-IDs: **keine**
- lokale HTML/CSS/JS/Manifest/Icon-Pfade: **alle vorhanden**
- lokaler HTTP-Test aller App-Dateien: **HTTP 200**
- Unterpfad-Test `/rubik-pages/` als Simulation einer GitHub-Pages-Projektseite: **bestanden**
- MIME-Typ des Manifests im lokalen Testserver: `application/manifest+json`
- interne Würfelzug-Engine: **bestanden**
  - `R` erzeugt exakt den gespeicherten Schnelltestzustand
  - der bekannte 18-Züge-Mix erzeugt exakt den gespeicherten großen Testwürfel
  - die inverse Folge führt wieder exakt zum gelösten Würfel
  - der Schnelltest wird intern als `R'` in genau einem Zug erkannt
  - der absichtlich unmögliche Testwürfel enthält trotzdem jede Farbe genau neunmal

## Korrigierte Punkte während der Prüfung

- Solver-Fallback prüft jetzt zuerst Lösungen bis Tiefe 4 exakt, bevor die Zwei-Phasen-Suche gestartet wird.
- `Array.prototype.at(-1)` wurde durch eine ältere-Safari-kompatiblere Indexabfrage ersetzt.
- Service-Worker-Pfade werden jetzt aus dem tatsächlichen Scope berechnet; dadurch funktionieren sie auch unter `https://NAME.github.io/REPOSITORY/`.
- Für sehr kleine Viewports wurde ein zusätzlicher `tight`-Darstellungsmodus ergänzt.
- Service Worker cached lokale App-Dateien und versucht zusätzlich, den Solver für spätere Nutzung zwischenzuspeichern.

## Einschränkung des Tests

Ein echter iPhone-/iPad-Safari-Gerätetest kann in dieser Ausführungsumgebung nicht automatisiert werden. Die App verwendet deshalb bewusst Safari-kompatible Standardtechniken: klassische Skripte, einen klassischen Web Worker, WebKit-3D-Fallbacks, `visualViewport`, Safe-Area-Insets, Web-App-Manifest und Service Worker. GitHub Pages liefert die dafür notwendige HTTPS-Umgebung.
