# Zauberwürfel-Löser

Eine für iPhone, iPad und Desktop optimierte Web-App zum Eingeben und Lösen eines 3×3-Zauberwürfels. Die App zeigt die Lösung Zug für Zug mit einer wiederholten 3D-Animation.

## GitHub Pages

Dieses Repository ist für GitHub Pages vorbereitet. Veröffentliche den Branch `main` aus dem Repository-Stammverzeichnis (`/ root`).

Danach ist die App typischerweise unter `https://eitsch723723.github.io/rubik-cube-solver/` erreichbar.

## iPhone / iPad

Die veröffentlichte Seite in Safari öffnen. Über **Teilen → Zum Home-Bildschirm** kann sie wie eine Web-App installiert werden.

## Technik

- statisches HTML/CSS/JavaScript
- PWA-Manifest und Service Worker
- Safari-/iOS-optimiertes Viewport- und Touch-Verhalten
- Solver in separatem Web Worker
- exakte Suche für sehr kurze Lösungen, anschließend Min2Phase

Weitere technische Hinweise stehen in `TEST_REPORT.md` und `THIRD_PARTY.md`.
