# Rubik Cube + Tetraeder Solver

Eine kindgerechte Web-App zum Lösen eines 3×3 Rubik Cube und eines Rubik Tetraeders (Pyraminx). Die App besteht nur aus HTML, CSS und JavaScript und funktioniert deshalb gut mit GitHub Pages.

## Aufbau

- `index.html` zeigt die Auswahl zwischen **Rubik Cube** und **Rubik Tetraeder**.
- Der Tetraeder-Löser liegt direkt im Repository-Stamm.
- Der Cube-Löser liegt vollständig unter `cube/` und öffnet sich ohne iframe.
- `scripts/build-site.mjs` kopiert ausschließlich Dateien aus diesem Repository in das geprüfte Veröffentlichungsartefakt `site/`.
- Der Deployment-Workflow lädt keinen Anwendungscode aus einem anderen Repository.

## Lokal öffnen

Für die Oberfläche reicht ein kleiner lokaler Webserver:

```bash
python3 -m http.server 4173
```

Danach im Browser `http://localhost:4173` öffnen.

## GitHub Pages

Ein Push auf `main` startet `.github/workflows/pages.yml`. Vor der Veröffentlichung werden Build, JavaScript-Syntax, Solver-Unit-Tests und Browser-Regressionen in Chromium und WebKit ausgeführt.

Veröffentlichte App:

`https://eitsch723723.github.io/rubik-cube-solver/`

## Responsive Bedienung

Die Tetraeder-Eingabe passt sich an iPhone, iPad und Laptop-Browser an. Header, Flächenauswahl, Eingabedreieck, Farbauswahl und Navigation bleiben dabei innerhalb des sichtbaren Browserfensters.

Für **Unten (U)** bleibt das Eingabedreieck aufrecht:

- die einzelne hintere Ecke liegt oben;
- die frühere Vorderkante liegt unten beim Betrachter;
- eine eigene Orientierungsgrafik und Beschriftungen zeigen diese Ausrichtung.

Die sichtbaren Dreiecksfelder jeder Seite werden dabei auf die tatsächliche räumliche Position am Tetraeder abgebildet. Dadurch können nach dieser Anleitung eingegebene physikalisch erreichbare Stellungen zuverlässig geprüft und gelöst werden.

## Sicherheit und Offline-Verhalten

- Es werden keine Zugangsdaten oder persönlichen Daten benötigt.
- Der Cube-Solver `min2phase.js` ist auf den geprüften Upstream-Commit `0ba83a6177d816f72af1a45c9015349da597456a` festgelegt.
- Der Service Worker speichert die App-Oberfläche für spätere Offline-Aufrufe zwischen.

## Tests

Die wichtigsten Befehle sind:

```bash
node scripts/build-site.mjs
node tests/unit.cjs
npx playwright test --config=tests/playwright.config.js
```

Details und die Abgrenzung zu realen Gerätetests stehen in [TEST_REPORT.md](./TEST_REPORT.md).

## Was geändert wurde

### 2026-09-18

- Die fehlerhafte Zuordnung zwischen den sichtbaren Eingabedreiecken und den internen Solver-Positionen wurde für alle vier Seiten korrigiert.
- Ein neuer Browsertest gibt eine erreichbare Stellung über alle 36 sichtbaren Dreiecke ein und prüft anschließend die vollständige Lösung.
- Die vollständige produktive App wurde in dieses Repository übernommen; das Deployment hängt nicht mehr von der früheren Testversion in einem anderen Repository ab.
- Die Tetraeder-Eingabe wurde für iPad quer und Laptop-Browser höhenresponsiv gemacht, damit kein Seitenscrollen nötig ist.
- Die Anleitung für **Unten (U)** wurde mit eindeutiger Kanten- und Eckbeschriftung sowie einer passenden Grafik ergänzt.
- Veraltete separate `tetraeder-test.*`-Dateien wurden entfernt.
