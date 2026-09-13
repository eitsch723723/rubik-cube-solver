# Zauberwürfel-Löser – GitHub Pages / Safari Web App

Diese Version ist für GitHub Pages und Safari auf iPhone/iPad vorbereitet. Es ist kein Build-Schritt nötig.

## In 5 Schritten veröffentlichen

1. Auf GitHub ein neues Repository anlegen, z. B. `zauberwuerfel-solver`.
2. **Alle Dateien und Ordner aus diesem Paket** in die oberste Ebene des Repositorys hochladen.
3. Auf GitHub `Settings` → `Pages` öffnen.
4. Unter `Build and deployment` als Quelle **Deploy from a branch** wählen, dann `main` und `/ (root)` auswählen und speichern.
5. Nach der Veröffentlichung die angezeigte Pages-URL in Safari öffnen, z. B. `https://DEINNAME.github.io/zauberwuerfel-solver/`.

Wichtig: `.nojekyll` muss mit hochgeladen werden. Dadurch werden die statischen Dateien unverändert veröffentlicht.

## Tetraeder-Testversion

Die produktive Cube-App unter `index.html` bleibt unverändert. Zusätzlich liegt eine separat aufrufbare Testversion im Repository:

- `tetraeder-test.html` – Startauswahl Rubik Cube / Rubik Tetraeder und Tetraeder-GUI
- `tetraeder-test.css` – responsive Testdarstellung inklusive iPhone/iPad-Safe-Areas
- `tetraeder-test.js` – 36-Sticker-State, Hauptzug-Permutationen U/R/L/B, Reachability-Prüfung, bidirektionaler Solver, Lösungsverifikation und Schrittführung

Bei aktivem GitHub Pages ist die Testseite unter `/tetraeder-test.html` erreichbar. In diesem Stand ist sie bewusst noch **nicht** der produktive Einstiegspunkt.

Aktueller Testumfang: Hauptzüge U/R/L/B inklusive Gegenrichtung. Unabhängig verdrehte kleine Spitzen werden in dieser Teststufe noch nicht separat gelöst; solche Zustände werden als nicht erreichbar gemeldet. Vor einer Integration in `index.html` muss diese Spitzenlogik ergänzt und auf realen Pyraminx-Zuständen sowie Safari/iPhone/iPad getestet werden.

## Als Safari Web App auf iPhone/iPad installieren

1. Die GitHub-Pages-URL in **Safari** öffnen.
2. Auf **Teilen** tippen.
3. **Zum Home-Bildschirm** auswählen.
4. Den vorgeschlagenen Namen bestätigen.

Danach startet die App im Standalone-Modus ohne normale Safari-Adressleiste.

## Dateien

- `index.html` – produktiver App-Einstieg
- `styles.css` – responsive Darstellung für Desktop, iPhone und iPad
- `app.js` – Cube-Eingabe, Validierung, 3D-Animation und Bedienlogik
- `solver-worker.js` – Cube-Solver in einem Web Worker
- `tetraeder-test.html` / `.css` / `.js` – isolierte Tetraeder-Testversion
- `manifest.webmanifest` – PWA-/Home-Screen-Metadaten
- `sw.js` – Service Worker / Offline-Cache
- `icons/` – Home-Screen-Icons
- `.nojekyll` – verhindert Jekyll-Verarbeitung auf GitHub Pages

## Solver

Die 3×3-Lösung wird mit `min2phase.js` von Shuang Chen berechnet:
https://github.com/cs0x7f/min2phase.js

Beim ersten Online-Aufruf lädt die App den Solver über jsDelivr. Der Service Worker versucht ihn anschließend mit zu cachen. Die App-Oberfläche selbst ist vollständig im Repository enthalten.

Die Tetraeder-Testversion verwendet einen eigenen bidirektionalen Suchalgorithmus und prüft jede gefundene Zugfolge erneut mit demselben internen Move-State, bevor sie angezeigt wird.

## Aktualisieren

Wenn du Dateien änderst und neu zu GitHub hochlädst, kann eine bereits installierte Web App kurz noch die gecachte Version zeigen. Safari komplett schließen und erneut öffnen. Bei größeren Änderungen der Produktiv-App sollte zusätzlich die Cache-Version am Anfang von `sw.js` erhöht werden, z. B. von `rubik-solver-pwa-v1` auf `rubik-solver-pwa-v2`.