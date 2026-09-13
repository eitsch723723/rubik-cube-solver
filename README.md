# Zauberwürfel-Löser – GitHub Pages / Safari Web App

Diese Version ist für GitHub Pages und Safari auf iPhone/iPad vorbereitet. Es ist kein Build-Schritt nötig.

## In 5 Schritten veröffentlichen

1. Auf GitHub ein neues Repository anlegen, z. B. `zauberwuerfel-solver`.
2. **Alle Dateien und Ordner aus diesem Paket** in die oberste Ebene des Repositorys hochladen.
3. Auf GitHub `Settings` → `Pages` öffnen.
4. Unter `Build and deployment` als Quelle **Deploy from a branch** wählen, dann `main` und `/ (root)` auswählen und speichern.
5. Nach der Veröffentlichung die angezeigte Pages-URL in Safari öffnen, z. B. `https://DEINNAME.github.io/zauberwuerfel-solver/`.

Wichtig: `.nojekyll` muss mit hochgeladen werden. Dadurch werden die statischen Dateien unverändert veröffentlicht.

## Als Safari Web App auf iPhone/iPad installieren

1. Die GitHub-Pages-URL in **Safari** öffnen.
2. Auf **Teilen** tippen.
3. **Zum Home-Bildschirm** auswählen.
4. Den vorgeschlagenen Namen bestätigen.

Danach startet die App im Standalone-Modus ohne normale Safari-Adressleiste.

## Dateien

- `index.html` – App-Einstieg
- `styles.css` – responsive Darstellung für Desktop, iPhone und iPad
- `app.js` – Eingabe, Validierung, 3D-Animation und Bedienlogik
- `solver-worker.js` – Solver in einem Web Worker
- `manifest.webmanifest` – PWA-/Home-Screen-Metadaten
- `sw.js` – Service Worker / Offline-Cache
- `icons/` – Home-Screen-Icons
- `.nojekyll` – verhindert Jekyll-Verarbeitung auf GitHub Pages

## Solver

Die Lösung wird mit `min2phase.js` von Shuang Chen berechnet:
https://github.com/cs0x7f/min2phase.js

Beim ersten Online-Aufruf lädt die App den Solver über jsDelivr. Der Service Worker versucht ihn anschließend mit zu cachen. Die App-Oberfläche selbst ist vollständig im Repository enthalten.

## Aktualisieren

Wenn du Dateien änderst und neu zu GitHub hochlädst, kann eine bereits installierte Web App kurz noch die gecachte Version zeigen. Safari komplett schließen und erneut öffnen. Bei größeren Änderungen sollte zusätzlich die Cache-Version am Anfang von `sw.js` erhöht werden, z. B. von `rubik-solver-pwa-v1` auf `rubik-solver-pwa-v2`.
