# Testbericht

Stand: 2026-09-18

Dieser Bericht beschreibt den automatisierten Testumfang des kombinierten Rubik-Cube-/Tetraeder-Solvers. Er unterscheidet ausdrücklich zwischen Code-Review, automatisierten Browser-/Unit-Tests und realen Geräte-/Safari-Tests.

## Automatisierte Tests

Der GitHub-Actions-Workflow erstellt vor dem Deployment ein deterministisches GitHub-Pages-Artefakt ausschließlich aus Dateien dieses Repositorys. Cube und Tetraeder liegen gemeinsam in `rubik-cube-solver`; es wird kein Anwendungscode aus einem anderen Repository geladen. Die `min2phase.js`-Abhängigkeit ist im lokalen Cube-Worker auf den unveränderlichen Commit `0ba83a6177d816f72af1a45c9015349da597456a` festgelegt.

### Syntax und Build

- JavaScript-Syntaxprüfung für Root-App, Feature-Module, Tetraeder-Core, Tetraeder-Worker, Visualisierung und Service Worker.
- JavaScript-Syntaxprüfung für den lokalen Cube-Löser und dessen Worker.
- Build-Abbruch, falls eine erforderliche lokale Datei fehlt oder die geprüfte Cube-Solver-Pinnung verändert wurde.

### Tetraeder-Unit-Regression

- bekannte Referenzsequenz,
- vollständige Hauptzug-Sequenz,
- unabhängige Spitzendrehung,
- inverse Zugbeziehungen,
- physikalisch nicht erreichbarer Zustand,
- 20 deterministisch erzeugte Scrambles,
- erneute Ausführung und Verifikation jeder berechneten Lösung mit derselben internen Move-Engine.

Der zuletzt bestätigte P2-Lauf meldete: `known=4`, `full=11`, `tip=1`, `deterministicRandom=20`.

### Browser-E2E

Die E2E-Suite wurde lokal am 2026-09-18 jeweils vollständig in Chromium und WebKit ausgeführt: **13 von 13 Tests bestanden**. Der GitHub-Actions-Workflow führt dieselbe Suite vor jeder Veröffentlichung erneut aus. Geprüft werden unter anderem:

- Puzzle-Auswahl und lokaler Wechsel zum eingebetteten Cube-Löser,
- Rückkehr zur Puzzle-Auswahl,
- Tetraeder-Schnelltest und vollständiger Test inklusive unabhängiger Spitzenzüge,
- Ablehnung unmöglicher Tetraederzustände,
- exakte Zuordnung zwischen Solver-Move und animierter Ebene,
- permanente Orientierungsmarker `V`, `L`, `R`, `U`,
- Reduced Motion,
- Pause/Fortsetzung der Animation bei ausgeblendeter Seite,
- Speicherung und validierte Wiederherstellung des Lösungsfortschritts,
- unveränderliche `min2phase.js`-Pinnung im erzeugten Pages-Build,
- Tetraeder-Eingabe ohne Seiten-Scrollen auf 402×740 px (iPhone-Portrait mit reduziertem Safari-Höhenbereich), 1180×820 px (iPad Landscape), 1280×720 px und 1440×900 px (Laptop/Desktop),
- eindeutige Unterseiten-Ausrichtung mit aufrechtem Dreieck, „Hintere Ecke“ oben und „Frühere Vorderkante“ unten beim Betrachter,
- Tetraeder-Lösungsansicht auf demselben iPhone-Portrait-Viewport: die SVG-Animation bleibt vollständig zwischen Richtungsanzeige und Replay-Button innerhalb ihres Panels, die reale große Testlösung wird vollständig angezeigt und eine 15-Zug-Maximalliste wird ohne horizontales oder vertikales Scrollen der Zugliste gleichzeitig dargestellt,
- iPhone-Landscape-Lösungsansicht ohne unerwünschtes Seitenscrolling,
- iPad Portrait und Landscape,
- Release-Oberfläche ohne `TESTVERSION`-Banner und ohne „Testversion“ im Seitentitel.

Die iPhone-17-Pro-Portrait-Regressionsprüfung verwendet absichtlich weniger als die volle Gerätehöhe, um die durch Safari-Adress-/Toolbar belegte Fläche konservativ zu berücksichtigen. Sie ist trotzdem eine automatisierte Viewport-Simulation und kein physischer Gerätetest.

## Deployment-Gate

GitHub Pages wird nur nach erfolgreichem Build und erfolgreicher Regression deployed. Das getestete Artefakt wird anschließend veröffentlicht; danach prüft ein Smoke-Test die veröffentlichte Cube- und Tetraeder-App erneut in Chromium und WebKit. Dieser lokale Branch wurde noch nicht veröffentlicht.

## Code-Review

Bei Änderungen werden insbesondere folgende Kopplungen geprüft:

- Solver-Move ↔ interner Cube-/Tetraeder-State,
- Move ↔ Textanweisung,
- Move ↔ betroffene Ebene und Drehrichtung der Animation,
- State nach Bestätigung ↔ dargestellte Sticker,
- relative Pfade, Service-Worker-Cache und GitHub-Pages-Unterpfad,
- Safe Areas und dynamische Viewports nach Layoutänderungen,
- Begrenzung der 3D-Animation auf ihren eigenen Layoutbereich und vollständige Sichtbarkeit der Lösungszugfolge.

## Nicht durchgeführt

Für den hier dokumentierten Stand wurde **kein realer Browser-/Gerätetest auf einem physischen iPhone oder iPad** durchgeführt. WebKit-Tests und emulierte Viewportgrößen sind eine automatisierte Regression, aber kein Ersatz für einen realen Safari-Gerätetest.

Reale Gerätetests dürfen in diesem Bericht erst als bestanden markiert werden, wenn sie tatsächlich durchgeführt wurden.

## Veröffentlichung

GitHub Pages:

`https://eitsch723723.github.io/rubik-cube-solver/`
