# Testbericht – GitHub-Pages-Version

Datum: 2026-09-13

## Durchgeführte Prüfungen

### Statische Prüfungen

- `app.js`, `solver-worker.js` und `sw.js` mit `node --check`: **bestanden**
- `manifest.webmanifest` als JSON eingelesen: **bestanden**
- Manifest: `start_url: ./`, `scope: ./`, `display: standalone`: **bestanden**
- Home-Screen-Icons: 180×180, 192×192, 512×512: **bestanden**
- doppelte HTML-IDs: **keine**
- JavaScript-Verweise auf fehlende HTML-IDs: **keine**
- lokale HTML/CSS/JS/Manifest/Icon-Pfade: **alle vorhanden**
- `.nojekyll`: **vorhanden**

### Würfel-Logik

- interne Würfelzug-Engine: **bestanden**
  - `R` erzeugt exakt den gespeicherten Schnelltestzustand
  - der bekannte 18-Züge-Mix erzeugt exakt den gespeicherten großen Testwürfel
  - die inverse Folge führt wieder exakt zum gelösten Würfel
  - der Schnelltest wird intern als `R'` in genau einem Zug erkannt
  - der absichtlich unmögliche Testwürfel enthält trotzdem jede Farbe genau neunmal

### Automatisierte Browser-Regression

Die App wurde mit Chromium automatisiert in folgenden Viewports geprüft:

- Desktop: 1440×900
- iPhone Hochformat: 390×844
- iPhone Querformat: 844×390
- iPad Hochformat: 820×1180
- iPad Querformat: 1180×820

Geprüft wurden dabei:

- keine horizontale oder vertikale Seitenscrollbar
- zentrale Eingabebedienelemente vollständig im sichtbaren Bereich
- Schnelltest findet genau `R'`
- Lösungsanzeige enthält genau einen Zug
- die animierte Schicht enthält genau 9 Cubies
- Bestätigen des Zuges führt zum Fertig-Zustand
- zentrale Bedienelemente der Lösungsansicht bleiben sichtbar
- keine JavaScript-Fehler im automatisierten Test

Ergebnis nach Korrektur: **alle fünf Viewports bestanden**.

## Korrigierte Punkte während der Prüfung

- Solver-Fallback prüft zuerst Lösungen bis Tiefe 4 exakt, bevor die Zwei-Phasen-Suche gestartet wird.
- `Array.prototype.at(-1)` wurde durch eine ältere-Safari-kompatiblere Indexabfrage ersetzt.
- Service-Worker-Pfade werden aus dem tatsächlichen Scope berechnet; dadurch funktionieren sie auch unter `https://NAME.github.io/REPOSITORY/`.
- Für kleine Viewports wurde ein `tight`-Darstellungsmodus ergänzt.
- Service Worker cached lokale App-Dateien und versucht zusätzlich, den Solver für spätere Nutzung zwischenzuspeichern.
- Bei der Regression wurde ein echter Layoutfehler im iPhone-Querformat gefunden: Farbpalette und Navigation lagen teilweise unterhalb des sichtbaren Bereichs. Die Querformatdarstellung wurde auf ein kompaktes Zwei-Spalten-Layout umgestellt und danach erneut erfolgreich getestet.
- doppelte Icon-Dateien im Repository-Stamm wurden entfernt; die gültigen Icons liegen ausschließlich unter `icons/`.

## GitHub Pages

Ein offizieller Pages-Workflow (`.github/workflows/pages.yml`) ist eingerichtet. Der Workflow selbst startet korrekt, kann die Site aber noch nicht veröffentlichen, solange GitHub Pages in den Repository-Einstellungen nicht einmalig mit **Source = GitHub Actions** aktiviert wurde. Der aktuelle Fehler tritt ausschließlich im Schritt `actions/configure-pages` auf, weil für das Repository noch keine Pages-Site existiert.

## Einschränkung des Tests

Ein echter iPhone-/iPad-Safari-Gerätetest wurde nicht durchgeführt. Die Browser-Regression verwendet Chromium mit iPhone-/iPad-typischen Viewports. Safari-spezifische Kompatibilität wurde zusätzlich per Code-Review abgesichert: klassische Skripte, klassischer Web Worker, WebKit-3D-Fallbacks, `visualViewport`, Safe-Area-Insets, Web-App-Manifest und Service Worker.

Ein Live-Test der veröffentlichten GitHub-Pages-URL ist erst möglich, nachdem GitHub Pages einmalig in den Repository-Einstellungen aktiviert wurde.
