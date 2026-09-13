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

### Regression nach realem iPhone-17-Pro-Safari-Fehlerbild

Auf einem vom Nutzer bereitgestellten Screenshot eines aktuellen iPhone 17 Pro mit Safari waren Eingabe- und Lösungsansicht gleichzeitig sichtbar. Dadurch wurde die Eingabeansicht vertikal abgeschnitten und eine leere Lösungs-/Animationsansicht angezeigt.

Ursache: Die Komponentenregeln `.input-view{display:grid}` und insbesondere `.solve-view{display:block}` konnten den HTML-Zustand `hidden` überschreiben. Zusätzlich konnte der bestehende Service Worker nach einem Deployment zunächst ältere CSS-/JS-Dateien aus dem Cache liefern.

Korrektur:

- globaler browserunabhängiger Schutz `[hidden]{display:none!important}`
- kompaktere iPhone-Hochformatwerte für Eingabepanel, Orientierung, Würfelfläche, Palette und Navigation
- versionierte CSS-/JS-URLs zur Cache-Invalidierung
- Service-Worker-Cache auf `rubik-solver-pwa-v2` erhöht
- lokale App-Ressourcen werden online jetzt network-first geladen und nur offline aus dem Cache verwendet

Das **exakt von GitHub Pages erzeugte Deployment-Artefakt** wurde anschließend erneut automatisiert geprüft mit:

- 402×874 CSS-Pixel (iPhone-17-Pro-typischer Hochformat-Viewport)
- 402×730 CSS-Pixel (absichtlich reduzierter Viewport zur Simulation sichtbarer Safari-Browserleisten)

Beide Tests bestanden:

- initial nur die Eingabeansicht sichtbar; Lösungsansicht `display:none`
- Eingabefläche vollständig sichtbar
- Palette vollständig sichtbar
- Navigation vollständig innerhalb des Panels und Viewports
- keine View-Überläufe
- Umschalten auf die Lösungsansicht blendet die Eingabe vollständig aus
- 3D-Würfel enthält 27 Cubies
- drehende Ebene enthält exakt 9 Cubies, feste Ebene 18
- bekannter Schnelltest zeigt `R'`
- Bestätigen führt zu `Geschafft!`
- auch im reduzierten 402×730-Viewport kein Lösungsansicht-Overflow

### WebKit/Safari-Teststatus

Ein automatisierter Playwright-WebKit-Test wurde vorbereitet, konnte in der Ausführungsumgebung aber **nicht gestartet werden**, weil die WebKit-Browser-Binary nicht installiert war. Der Nachinstallationsversuch scheiterte an der gesperrten externen Netzwerkauflösung der Testumgebung. Deshalb wird kein automatisierter Safari-Test behauptet.

Das reale iPhone-17-Pro-Safari-Fehlerbild stammt vom Nutzer. Ein realer Gerätetest **nach** dem Fix steht noch aus.

## Korrigierte Punkte während der Prüfung

- Solver-Fallback prüft zuerst Lösungen bis Tiefe 4 exakt, bevor die Zwei-Phasen-Suche gestartet wird.
- `Array.prototype.at(-1)` wurde durch eine ältere-Safari-kompatiblere Indexabfrage ersetzt.
- Service-Worker-Pfade werden aus dem tatsächlichen Scope berechnet; dadurch funktionieren sie auch unter `https://NAME.github.io/REPOSITORY/`.
- Für kleine Viewports wurde ein `tight`-Darstellungsmodus ergänzt.
- Bei der Regression wurde ein Layoutfehler im iPhone-Querformat gefunden: Farbpalette und Navigation lagen teilweise unterhalb des sichtbaren Bereichs. Die Querformatdarstellung wurde auf ein kompaktes Zwei-Spalten-Layout umgestellt und danach erneut erfolgreich getestet.
- doppelte Icon-Dateien im Repository-Stamm wurden entfernt; die gültigen Icons liegen ausschließlich unter `icons/`.
- Safari-Fehler mit gleichzeitig sichtbarer Eingabe- und Lösungsansicht behoben.
- PWA-Cache-Strategie gegen veraltete Layout-Dateien nach Deployments gehärtet.

## GitHub Pages

GitHub Pages ist aktiviert und wird über `.github/workflows/pages.yml` ausgerollt. Der aktuelle Safari-Fix wurde erfolgreich als GitHub-Pages-Deployment veröffentlicht.

Live-URL: `https://eitsch723723.github.io/rubik-cube-solver/`
