'use strict';
const CACHE='rubik-puzzle-pwa-v7';
const BASE=new URL('./',self.location.href);
const LOCAL=[
  './','./index.html','./styles.css?v=20260918-1','./features.css?v=20260918-1','./tetra-visuals.css?v=20260918-1',
  './tetra-core.js?v=20260918-1','./tetra-worker.js?v=20260918-1','./app.js?v=20260918-1','./release-fixes.js?v=20260918-1','./features.js?v=20260918-1','./tetra-visuals.js?v=20260918-1',
  './manifest.webmanifest','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png',
  './cube/','./cube/index.html','./cube/styles.css?v=20260913-2','./cube/app.js?v=20260913-2','./cube/solver-worker.js','./cube/manifest.webmanifest',
  './cube/icons/apple-touch-icon.png','./cube/icons/icon-192.png','./cube/icons/icon-512.png'
].map(p=>new URL(p,BASE).href);
const SOLVER='https://cdn.jsdelivr.net/gh/cs0x7f/min2phase.js@0ba83a6177d816f72af1a45c9015349da597456a/min2phase.js';
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(LOCAL);try{const r=await fetch(SOLVER,{mode:'cors'});if(r.ok)await cache.put(SOLVER,r.clone());}catch{}await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE&&!k.startsWith('rubik-solver-pwa-')).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){event.respondWith((async()=>{try{const r=await fetch(event.request);if(r.ok){const c=await caches.open(CACHE);c.put(event.request,r.clone()).catch(()=>{});}return r;}catch{return (await caches.match(event.request))||(await caches.match(new URL('./index.html',BASE).href));}})());return;}
  if(event.request.url===SOLVER){event.respondWith((async()=>{const c=await caches.match(SOLVER);if(c)return c;const r=await fetch(event.request);if(r.ok)(await caches.open(CACHE)).put(SOLVER,r.clone()).catch(()=>{});return r;})());return;}
  if(url.origin===self.location.origin){event.respondWith((async()=>{try{const r=await fetch(event.request);if(r.ok)(await caches.open(CACHE)).put(event.request,r.clone()).catch(()=>{});return r;}catch{const c=await caches.match(event.request);if(c)return c;throw new Error('offline-resource-missing');}})());}
});
