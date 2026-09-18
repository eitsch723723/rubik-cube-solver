'use strict';
(function(){
  const $=id=>document.getElementById(id),api=window.__PYRA_TEST__;if(!api)return;
  const {Core,state}=api;
  const PROGRESS_KEY='rubik-pyra-progress-v1',CODE_TO_COLOR={g:'green',r:'red',b:'blue',y:'yellow'};
  let seq=0;
  function solveInWorker(start){
    if(typeof Worker==='undefined')return Promise.resolve(Core.solveFull(start,11));
    return new Promise((resolve,reject)=>{
      const id=++seq,w=new Worker('./tetra-worker.js?v=20260918-1'),timer=setTimeout(()=>{w.terminate();reject(new Error('timeout'));},20000);
      const done=fn=>{clearTimeout(timer);w.terminate();fn();};
      w.onmessage=e=>{const d=e.data||{};if(d.id!==id)return;if(d.type==='status'){window.setStatus(d.text,'busy');return;}if(d.type==='done')done(()=>resolve(d.moves));else if(d.type==='error')done(()=>reject(new Error(d.message||'worker-error')));};
      w.onerror=()=>done(()=>reject(new Error('worker-error')));w.postMessage({id,type:'solve',start,maxDepth:11});
    });
  }
  function readProgress(){try{return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'null');}catch{return null;}}
  function clearProgress(){try{localStorage.removeItem(PROGRESS_KEY);}catch{}}
  function persistProgress(active){
    try{
      const start=state.states?.[0]||null,moves=Array.isArray(state.solution)?state.solution.slice():[];
      if(!start||start.length!==36||!Core.verifySolution(start,moves)){if(!active)localStorage.removeItem(PROGRESS_KEY);return;}
      localStorage.setItem(PROGRESS_KEY,JSON.stringify({version:1,active:!!active,start,solution:moves,step:Math.max(0,Math.min(Number(state.step)||0,moves.length))}));
    }catch{}
  }
  function restoreFaces(start){
    if(typeof start!=='string'||start.length!==36||![...start].every(c=>CODE_TO_COLOR[c]))throw new Error('invalid-persisted-start');
    state.faces=Array.from({length:4},(_,fi)=>Array.from({length:9},(_,i)=>CODE_TO_COLOR[start[fi*9+i]]));state.currentFace=0;state.selected='green';
  }
  function restoreProgress(){
    const p=readProgress();if(!p?.active||p.version!==1||typeof p.start!=='string'||!Array.isArray(p.solution))return;
    try{
      if(!Core.verifySolution(p.start,p.solution)){clearProgress();return;}
      restoreFaces(p.start);state.solution=p.solution.slice();state.states=Core.buildStates(p.start,state.solution);state.step=Math.max(0,Math.min(Number(p.step)||0,state.solution.length));
      window.renderInput();$('chooser').hidden=true;$('pyraApp').hidden=false;window.showSolve();window.setStatus(state.solution.length?`Lösung wiederhergestellt: Zug ${Math.min(state.step+1,state.solution.length)} von ${state.solution.length}.`:'Gelöster Tetraeder wiederhergestellt.','ok');
    }catch(e){console.error(e);clearProgress();}
  }
  const base=m=>m[0].toUpperCase(),isTip=m=>m&&m[0]===m[0].toLowerCase();
  window.moveName=m=>({U:'obere Spitze',R:'rechte Spitze',L:'linke Spitze',B:'hintere Spitze'}[base(m)]);
  window.label=m=>{const side={U:'O',R:'R',L:'L',B:'H'}[base(m)],prime=m.endsWith("'")?"'":'';return isTip(m)?`Spitze ${side}${prime}`:side+prime;};
  window.describe=m=>{const dir=m.endsWith("'")?'gegen den Uhrzeigersinn':'im Uhrzeigersinn';return isTip(m)?`Schau direkt auf die ${window.moveName(m)}. Drehe nur die kleine Spitze um 120° ${dir}.`:`Schau direkt auf die ${window.moveName(m)}. Drehe die ganze Ebene unter dieser Spitze um 120° ${dir}.`;};
  window.renderSolution=function(){
    const total=state.solution.length,m=state.solution[state.step];$('backStep').disabled=state.step===0;$('nextStep').disabled=state.step>=total;
    if(!total){$('stepCount').textContent='0 Züge nötig';$('moveTitle').textContent='Schon gelöst';$('moveDescription').textContent='Du musst nichts drehen.';$('moveBadge').textContent='✓';$('directionCard').textContent='Schon vollständig gelöst';}
    else if(state.step>=total){$('stepCount').textContent=`${total} von ${total} geschafft`;$('moveTitle').textContent='Geschafft';$('moveDescription').textContent='Alle Züge sind bestätigt.';$('moveBadge').textContent='✓';$('directionCard').textContent='Tetraeder vollständig gelöst';}
    else{$('stepCount').textContent=`Zug ${state.step+1} von ${total}`;$('moveTitle').textContent='Jetzt: '+window.label(m);$('moveDescription').textContent=window.describe(m)+' Die Animation wiederholt sich bis zur Bestätigung.';$('moveBadge').textContent=window.label(m);$('directionCard').textContent=`${isTip(m)?'Nur ':''}${window.moveName(m)}: 120° ${m.endsWith("'")?'gegen den Uhrzeigersinn':'im Uhrzeigersinn'}`;}
    const h=$('solutionList');h.innerHTML='';state.solution.forEach((x,i)=>{const c=document.createElement('span');c.className='move-chip'+(i<state.step?' done':i===state.step?' current':'');c.textContent=`${i+1}. ${window.label(x)}`;h.appendChild(c);});window.renderSolvePreview();window.renderFlat();
  };
  window.showSolve=function(){document.body.classList.remove('editing-pyra');document.body.classList.add('solving-pyra');$('inputView').hidden=true;$('solveView').hidden=false;window.renderSolution();persistProgress(true);};
  window.showInput=function(){document.body.classList.remove('solving-pyra');document.body.classList.add('editing-pyra');$('solveView').hidden=true;$('inputView').hidden=false;window.renderInput();persistProgress(false);};
  window.solve=async function(){
    window.setValidation();const basic=window.validateBasic();if(basic){window.setValidation(basic);return;}const start=window.toStringState();$('solveBtn').disabled=true;$('solveBtn').textContent='Ich prüfe …';window.setStatus('Ich prüfe den ganzen Tetraeder und suche eine kurze Lösung …','busy');
    try{const path=await solveInWorker(start);if(path===null){window.setValidation('So kann ein echter Rubik Tetraeder nicht aussehen. Prüfe die Farben und die Ausrichtung der vier Flächen.');window.setStatus('Dieser Tetraeder-Zustand ist physikalisch nicht erreichbar.','error');clearProgress();return;}if(!Core.verifySolution(start,path))throw new Error('verification');state.solution=path;state.states=Core.buildStates(start,path);state.step=0;window.setStatus(path.length?`Lösung verifiziert: ${path.length} Züge.`:'Der Tetraeder ist schon vollständig gelöst.','ok');window.showSolve();}
    catch(e){console.error(e);window.setValidation('Interner Prüffehler. Die Lösung wurde nicht angezeigt.');window.setStatus('Lösung konnte nicht verifiziert werden.','error');}
    finally{$('solveBtn').disabled=false;$('solveBtn').textContent='Tetraeder lösen';}
  };
  $('nextStep')?.addEventListener('click',()=>queueMicrotask(()=>persistProgress(true)));
  $('backStep')?.addEventListener('click',()=>queueMicrotask(()=>persistProgress(true)));
  $('editBtn')?.addEventListener('click',()=>queueMicrotask(()=>persistProgress(false)));
  $('backHome')?.addEventListener('click',()=>{document.body.classList.remove('solving-pyra','editing-pyra');queueMicrotask(()=>persistProgress(false));});
  $('resetBtn')?.addEventListener('click',()=>queueMicrotask(()=>{if(state.faces.flat().every(x=>!x))clearProgress();}));
  window.addEventListener('beforeunload',()=>persistProgress(!$('pyraApp')?.hidden&&!$('solveView')?.hidden));
  const scheduleRestore=()=>setTimeout(restoreProgress,0);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRestore,{once:true});else scheduleRestore();
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
  window.__PYRA_TEST__.solveInWorker=solveInWorker;window.__PYRA_TEST__.persistProgress=persistProgress;window.__PYRA_TEST__.restoreProgress=restoreProgress;window.__PYRA_TEST__.clearProgress=clearProgress;window.__PYRA_TEST__.readProgress=readProgress;
})();
