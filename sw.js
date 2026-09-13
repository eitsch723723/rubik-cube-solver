'use strict';
const CACHE='rubik-solver-pwa-v2';
const BASE=new URL('./',self.location.href);
const INDEX=new URL('./index.html',BASE).href;
const ROOT=BASE.href;
const LOCAL_ASSETS=[
  './',
  './index.html',
  './styles.css?v=20260913-2',
  './app.js?v=20260913-2',
  './solver-worker.js',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
].map(p=>new URL(p,BASE).href);
const SOLVER='https://cdn.jsdelivr.net/gh/cs0x7f/min2phase.js@master/min2phase.js';

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(LOCAL_ASSETS);
    try{
      const response=await fetch(SOLVER,{mode:'cors'});
      if(response.ok)await cache.put(SOLVER,response.clone());
    }catch{}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(event.request);
        const cache=await caches.open(CACHE);
        cache.put(INDEX,fresh.clone()).catch(()=>{});
        return fresh;
      }catch{
        return (await caches.match(INDEX))||(await caches.match(ROOT));
      }
    })());
    return;
  }

  if(event.request.url===SOLVER){
    event.respondWith((async()=>{
      const cached=await caches.match(SOLVER);
      if(cached)return cached;
      const fresh=await fetch(event.request);
      const cache=await caches.open(CACHE);
      cache.put(SOLVER,fresh.clone()).catch(()=>{});
      return fresh;
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(event.request);
        if(fresh.ok){
          const cache=await caches.open(CACHE);
          cache.put(event.request,fresh.clone()).catch(()=>{});
        }
        return fresh;
      }catch{
        const cached=await caches.match(event.request);
        if(cached)return cached;
        throw new Error('offline-resource-missing');
      }
    })());
  }
});
