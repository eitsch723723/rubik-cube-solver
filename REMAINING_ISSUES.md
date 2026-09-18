# Issue-Status

## P2 – abgeschlossen am 2026-09-15

Die zuvor offenen P2-Punkte sind umgesetzt und durch die CI-Regressionssuite abgesichert:

1. **Reduced Motion – erledigt:** Die Tetraeder-Zuganimation berücksichtigt `prefers-reduced-motion` und zeigt bei reduzierter Bewegung einen statischen, eindeutig beschrifteten Zustand statt einer Dauerdrehung.
2. **Energieverbrauch – erledigt:** Die 3D-Ansicht baut ihre SVG-Sticker nicht mehr in jedem Frame neu auf. Nur betroffene Stickerpunkte werden aktualisiert; bei ausgeblendeter Seite (`document.hidden`) pausiert die Animation und wird beim Zurückkehren fortgesetzt.
3. **Cube-Solver-Abhängigkeit – erledigt:** Der lokale Cube-Worker verwendet den unveränderlichen Upstream-Commit `0ba83a6177d816f72af1a45c9015349da597456a`. Der Build bricht ab, falls diese geprüfte Pinnung fehlt.
4. **Zusätzliche Tetraeder-Testabdeckung – erledigt:** Neben bekannten Referenzfällen werden feste Sequenzen und 20 deterministisch erzeugte Scrambles geprüft. Jede berechnete Lösung wird durch die interne Move-Engine erneut verifiziert.
5. **Orientierungsmarker – erledigt:** Die animierte 3D-Tetraederansicht zeigt permanent `V`, `L`, `R`, `U` direkt am Modell.
6. **Lösungsfortschritt – erledigt:** Lösungsmodus, Startzustand, Lösung und aktueller Schritt werden gespeichert, vor Wiederherstellung erneut verifiziert und nach einem Reload fortgesetzt.
7. **GitHub-Pages-Re-Run – erledigt:** Pages-Artefakte verwenden pro Workflow-Attempt einen eindeutigen Namen (`github-pages-${{ github.run_attempt }}`), sodass ein Re-Run nicht mehr zwei gleichnamige Deploy-Artefakte erzeugt.

## P3 – abgeschlossen am 2026-09-15

1. **Testbanner – erledigt:** Der sichtbare Hinweis `TESTVERSION` und der Zusatz „Testversion“ im Seitentitel wurden entfernt. Nicht mehr benötigte Banner-CSS-Regeln wurden ebenfalls entfernt. Ein Browser-Regressionscheck stellt sicher, dass Banner und Text nicht wieder ausgeliefert werden.
2. **Dokumentationspflege – erledigt:** Die README beschreibt die selbstständige App in `rubik-cube-solver`, die vollständige Tetraeder-Unterstützung, die Solver-Pinnung, PWA-Mechanik und den aktuellen Testumfang. `TEST_REPORT.md` dokumentiert den tatsächlich ausgeführten automatisierten Testumfang und grenzt ihn von realen Gerätetests ab.

## Noch offen

Keine bekannten P2- oder P3-Issues.

## Release-Gate

Ein Release gilt nur als bestätigt, wenn der aktuelle `main`-Stand den deterministischen Build, Syntaxprüfungen, Solver-Unit-Tests, Chromium- und WebKit-E2E sowie den GitHub-Pages-Deploy erfolgreich durchläuft. Dokumentation wird bei Änderungen an Architektur, Solver-Verhalten, Testumfang oder Deployment-Mechanik im selben Release aktualisiert.
