'use strict';
(function(){
  const $=id=>document.getElementById(id),api=window.__PYRA_TEST__;if(!api)return;
  const {Core,state}=api,byCode={g:'green',r:'red',b:'blue',y:'yellow'},originalSolve=window.solve;
  const FULL_SEQUENCE=['U','R',"L'",'B',"U'",'L',"R'",'B','u',"r'",'l','b'];
  const FULL_TEST=FULL_SEQUENCE.reduce((s,m)=>Core.applyMove(s,m),Core.SOLVED);
  function setTestResult(text='',kind=''){const e=$('testResult');if(!e)return;e.textContent=text;e.className='test-result'+(kind?' '+kind:'');}
  function loadTest(s,mode,message){state.testMode=mode;state.solution=[];state.states=[];state.step=0;state.faces=Array.from({length:4},(_,fi)=>Array.from({length:9},(_,i)=>byCode[s[fi*9+i]]));state.currentFace=0;state.selected='green';window.showInput();window.setValidation(message,'success');window.setStatus('Testzustand geladen.','ok');setTestResult();$('testDrawer').hidden=true;}
  $('chooseCube').onclick=()=>{location.href='./cube/';};
  $('testsBtn').onclick=()=>{$('testDrawer').hidden=!$('testDrawer').hidden;};
  $('quickTestBtn').onclick=()=>loadTest(Core.KNOWN,'quick','Schnelltest geladen. Erwartung: eine verifizierte 4-Zug-Lösung.');
  $('fullTestBtn').onclick=()=>loadTest(FULL_TEST,'full',"Großer Test geladen: Hauptkörper und kleine Spitzen sind verdreht.");
  $('invalidTestBtn').onclick=()=>loadTest(Core.INVALID,'invalid','Fehlertest geladen. Erwartung: Die App muss diesen Zustand als physikalisch unmöglich ablehnen.');
  $('solveBtn').onclick=async()=>{
    const mode=state.testMode,start=mode==='full'?FULL_TEST:mode==='quick'?Core.KNOWN:mode==='invalid'?Core.INVALID:null;
    state.solution=[];await originalSolve();
    if(mode==='quick'){const ok=state.solution.length===4&&Core.verifySolution(start,state.solution);setTestResult(ok?'Schnelltest bestanden: 4-Zug-Referenz vollständig gelöst.':`Schnelltest auffällig: ${state.solution.length} Züge.`,ok?'success':'error');}
    else if(mode==='full'){const hasTip=state.solution.some(m=>m[0]===m[0].toLowerCase()),ok=state.solution.length>0&&hasTip&&Core.verifySolution(start,state.solution);setTestResult(ok?`Großer Test bestanden: Hauptkörper und Spitzen in ${state.solution.length} Zügen vollständig gelöst.`:'Großer Test fehlgeschlagen: keine vollständige verifizierte Lösung gefunden.',ok?'success':'error');}
    else if(mode==='invalid'){const path=Core.solveFull(Core.INVALID,11);setTestResult(path===null?'Fehlertest bestanden: Der unmögliche Tetraeder wurde richtig abgelehnt.':'Fehlertest nicht bestanden: Der unmögliche Zustand wurde akzeptiert.',path===null?'success':'error');}
  };
  document.addEventListener('pointerdown',e=>{const drawer=$('testDrawer'),button=$('testsBtn');if(drawer&&!drawer.hidden&&!drawer.contains(e.target)&&!button.contains(e.target))drawer.hidden=true;});
})();
