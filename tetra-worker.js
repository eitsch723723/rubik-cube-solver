'use strict';
importScripts('./tetra-core.js');
self.onmessage=e=>{
  const d=e.data||{};if(d.type!=='solve')return;
  try{
    self.postMessage({id:d.id,type:'status',text:'Ich löse zuerst den Hauptkörper …'});
    const moves=self.TetraCore.solveFull(d.start,d.maxDepth||11);
    self.postMessage({id:d.id,type:'done',moves});
  }catch(err){self.postMessage({id:d.id,type:'error',message:err?.message||String(err)});}
};
