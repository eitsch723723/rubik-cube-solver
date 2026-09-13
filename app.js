'use strict';

const FACE_ORDER=['F','R','B','L','U','D'];
const SOLVER_ORDER=['U','R','F','D','L','B'];
const SOLVED='UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
const SOLVER_CDN='https://cdn.jsdelivr.net/gh/cs0x7f/min2phase.js@master/min2phase.js';

const FACE_INFO={
  F:{name:'Vorne',note:'Halte den Würfel so, dass diese Seite zu dir zeigt. Merke dir: Das ist ab jetzt deine Vorderseite.',neighbors:{top:'Oben (U)',right:'Rechts (R)',bottom:'Unten (D)',left:'Links (L)'}},
  R:{name:'Rechts',note:'Starte mit deiner gemerkten Vorderseite zu dir. Drehe den ganzen Würfel so, dass die rechte Seite zu dir zeigt. Oben bleibt oben.',neighbors:{top:'Oben (U)',right:'Hinten (B)',bottom:'Unten (D)',left:'Vorne (F)'}},
  B:{name:'Hinten',note:'Starte mit deiner gemerkten Vorderseite zu dir. Drehe den ganzen Würfel um 180°, sodass die Rückseite zu dir zeigt. Oben bleibt oben.',neighbors:{top:'Oben (U)',right:'Links (L)',bottom:'Unten (D)',left:'Rechts (R)'}},
  L:{name:'Links',note:'Starte mit deiner gemerkten Vorderseite zu dir. Drehe den ganzen Würfel so, dass die linke Seite zu dir zeigt. Oben bleibt oben.',neighbors:{top:'Oben (U)',right:'Vorne (F)',bottom:'Unten (D)',left:'Hinten (B)'}},
  U:{name:'Oben',note:'Schau direkt auf die obere Seite. Hinten (B) muss über den Kästchen stehen und Vorne (F) darunter.',neighbors:{top:'Hinten (B)',right:'Rechts (R)',bottom:'Vorne (F)',left:'Links (L)'}},
  D:{name:'Unten',note:'Schau direkt auf die Unterseite. Vorne (F) muss über den Kästchen stehen und Hinten (B) darunter.',neighbors:{top:'Vorne (F)',right:'Rechts (R)',bottom:'Hinten (B)',left:'Links (L)'}}
};

const PALETTE={
  white:{label:'Weiß',hex:'#f7f7f2'},yellow:{label:'Gelb',hex:'#ffd500'},red:{label:'Rot',hex:'#d92d20'},
  orange:{label:'Orange',hex:'#ff7a00'},blue:{label:'Blau',hex:'#175cd3'},green:{label:'Grün',hex:'#079455'}
};
const COLORS=Object.keys(PALETTE);
const DEFAULT_FACE_COLORS={U:'white',R:'red',F:'green',D:'yellow',L:'orange',B:'blue'};

const QUICK_TEST='UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB';
const FULL_TEST='LLDDUULRFDFRDRBRDUDULBFLDUBRLULDRURBUFBDLUFBBFFFRBBLFR';
const INVALID_TEST='UUUUUUUFURRRRRRRRRFUFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

const $=id=>document.getElementById(id);
const state={
  faces:Object.fromEntries(SOLVER_ORDER.map(f=>[f,Array(9).fill(null)])),
  currentFace:'F',selectedColor:'white',solutionMoves:[],playbackStates:[],currentStep:0,
  faceToColor:null,testMode:null,isSolving:false,animationToken:0
};

function setStatus(text,kind=''){
  $('statusText').textContent=text;
  $('statusDot').className='status-dot'+(kind?' '+kind:'');
}
function setValidation(text='',kind='error'){
  const el=$('validation');
  el.textContent=text;
  el.className='validation'+(text?' show '+kind:'');
  requestAnimationFrame(fitViewport);
}
function setTestResult(text='',kind=''){
  const el=$('testResult'); el.textContent=text; el.className='test-result'+(kind?' '+kind:'');
}

function saveInput(){
  if(state.testMode) return;
  try{localStorage.setItem('rubik-pages-input-v1',JSON.stringify({faces:state.faces,currentFace:state.currentFace,selectedColor:state.selectedColor}));}catch{}
}
function loadInput(){
  try{
    const raw=localStorage.getItem('rubik-pages-input-v1'); if(!raw) return;
    const x=JSON.parse(raw);
    SOLVER_ORDER.forEach(f=>{if(Array.isArray(x.faces?.[f])&&x.faces[f].length===9) state.faces[f]=x.faces[f].map(c=>COLORS.includes(c)?c:null);});
    if(FACE_ORDER.includes(x.currentFace)) state.currentFace=x.currentFace;
    if(COLORS.includes(x.selectedColor)||x.selectedColor==='erase') state.selectedColor=x.selectedColor;
  }catch{}
}

function colorCounts(){
  const c=Object.fromEntries(COLORS.map(x=>[x,0]));
  SOLVER_ORDER.forEach(f=>state.faces[f].forEach(x=>{if(x)c[x]++;})); return c;
}
function allFilled(){return SOLVER_ORDER.every(f=>state.faces[f].every(Boolean));}
function currentFaceFilled(){return state.faces[state.currentFace].every(Boolean);}
function hasAnyInput(){return SOLVER_ORDER.some(f=>state.faces[f].some(Boolean));}

function renderTabs(){
  const host=$('faceTabs');host.innerHTML='';
  FACE_ORDER.forEach((f,i)=>{
    const filled=state.faces[f].filter(Boolean).length;
    const b=document.createElement('button'); b.type='button'; b.className='face-tab'+(f===state.currentFace?' active':'')+(filled===9?' complete':'');
    b.disabled=state.isSolving; b.innerHTML=`<strong>${i+1}. ${FACE_INFO[f].name}</strong><small>${filled===9?'fertig':filled+'/9'}</small>`;
    b.onclick=()=>{state.currentFace=f;saveInput();renderInput();}; host.appendChild(b);
  });
}
function renderPalette(){
  const host=$('palette');host.innerHTML='';
  COLORS.forEach(c=>{
    const b=document.createElement('button');b.type='button';b.className='palette-btn'+(state.selectedColor===c?' active':'');b.disabled=state.isSolving;
    b.innerHTML=`<span class="swatch" style="background:${PALETTE[c].hex}"></span><span>${PALETTE[c].label}</span>`;
    b.onclick=()=>{state.selectedColor=c;saveInput();renderPalette();};host.appendChild(b);
  });
  const e=document.createElement('button');e.type='button';e.className='palette-btn'+(state.selectedColor==='erase'?' active':'');e.disabled=state.isSolving;
  e.innerHTML='<span class="swatch" style="background:#f2f4f7;display:grid;place-items:center">×</span><span>Löschen</span>';
  e.onclick=()=>{state.selectedColor='erase';saveInput();renderPalette();};host.appendChild(e);
}
function renderFaceEditor(){
  const f=state.currentFace,info=FACE_INFO[f];
  $('currentFaceTitle').textContent=`${info.name} (${f})`; $('orientationNote').textContent=info.note;
  $('neighborTop').textContent='↑ '+info.neighbors.top; $('neighborRight').textContent=info.neighbors.right+' →';
  $('neighborBottom').textContent='↓ '+info.neighbors.bottom; $('neighborLeft').textContent='← '+info.neighbors.left;
  $('faceProgress').textContent=state.faces[f].filter(Boolean).length+'/9';
  const host=$('faceEditor');host.innerHTML='';
  state.faces[f].forEach((c,i)=>{
    const b=document.createElement('button');b.type='button';b.className='sticker'+(i===4?' center':'');b.disabled=state.isSolving;
    if(c){b.style.background=PALETTE[c].hex;if(['red','green','blue'].includes(c))b.dataset.dark='1';}
    b.setAttribute('aria-label',`${info.name}, Reihe ${Math.floor(i/3)+1}, Spalte ${i%3+1}, ${c?PALETTE[c].label:'leer'}`);
    b.onclick=()=>{
      setValidation();state.testMode=null;
      if(state.selectedColor==='erase'){state.faces[f][i]=null;}
      else{
        const counts=colorCounts();const old=state.faces[f][i];
        if(old!==state.selectedColor&&counts[state.selectedColor]>=9){setValidation(`${PALETTE[state.selectedColor].label} ist schon 9-mal eingetragen.`);return;}
        state.faces[f][i]=state.selectedColor;
      }
      saveInput();renderInput();
    };
    host.appendChild(b);
  });
}
function renderCounts(){
  const c=colorCounts(),host=$('colorCounts');host.innerHTML='';
  COLORS.forEach(k=>{const d=document.createElement('div');d.className='count'+(c[k]===9?' good':c[k]>9?' bad':'');d.textContent=`${PALETTE[k].label}: ${c[k]}/9`;host.appendChild(d);});
}
function makeMiniFace(f,cls){
  const d=document.createElement('div');d.className='mini-face '+cls+(f===state.currentFace?' current':'');
  state.faces[f].forEach(c=>{const s=document.createElement('span');if(c)s.style.background=PALETTE[c].hex;d.appendChild(s);});
  const l=document.createElement('b');l.className='mini-label';l.textContent=f;d.appendChild(l);return d;
}
function renderReference(){
  const host=$('referenceNet');host.innerHTML='';const pos={U:'net-u',L:'net-l',F:'net-f',R:'net-r',B:'net-b',D:'net-d'};
  ['U','L','F','R','B','D'].forEach(f=>host.appendChild(makeMiniFace(f,pos[f])));
  const ch=$('centerMap');ch.innerHTML='';const cc={};FACE_ORDER.forEach(f=>{const c=state.faces[f][4];if(c)cc[c]=(cc[c]||0)+1;});
  FACE_ORDER.forEach(f=>{const c=state.faces[f][4],bad=c&&cc[c]>1;const row=document.createElement('div');row.className='center-row'+(bad?' bad':'');
    row.innerHTML=`<span>${FACE_INFO[f].name} (${f})</span><span><i class="center-dot" style="background:${c?PALETTE[c].hex:'#eaecf0'}"></i>${c?PALETTE[c].label+(bad?' – doppelt':''):'fehlt'}</span>`;ch.appendChild(row);});
}
function renderNav(){
  const i=FACE_ORDER.indexOf(state.currentFace),complete=allFilled();
  $('prevFaceBtn').disabled=state.isSolving||i===0;$('nextFaceBtn').disabled=state.isSolving||!currentFaceFilled();
  $('nextFaceBtn').hidden=i===FACE_ORDER.length-1;$('solveBtn').hidden=!(complete||i===FACE_ORDER.length-1);$('solveBtn').disabled=state.isSolving||!complete;$('clearFaceBtn').disabled=state.isSolving;
}
function renderInput(){renderTabs();renderPalette();renderFaceEditor();renderCounts();renderReference();renderNav();requestAnimationFrame(fitViewport);}

function validateBasic(){
  if(!allFilled()) return 'Es fehlen noch Farben. Fülle bitte alle Kästchen aus.';
  const c=colorCounts(),bad=COLORS.filter(k=>c[k]!==9);if(bad.length)return `Jede Farbe muss genau 9-mal vorkommen. Prüfe: ${bad.map(k=>PALETTE[k].label).join(', ')}.`;
  const centers=SOLVER_ORDER.map(f=>state.faces[f][4]);if(new Set(centers).size!==6)return 'In der Mitte jeder Seite muss eine andere Farbe sein.';return null;
}
function buildFaceletString(){
  const centerToFace={},faceToColor={};SOLVER_ORDER.forEach(f=>{centerToFace[state.faces[f][4]]=f;faceToColor[f]=state.faces[f][4];});
  return {str:SOLVER_ORDER.flatMap(f=>state.faces[f].map(c=>centerToFace[c])).join(''),faceToColor};
}

// Pure facelet move engine, used to verify the solver and build animation states.
function buildMovePermutations(){
  const normals={U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1]};
  const coord=(f,r,c)=>({F:[c-1,1-r,1],B:[1-c,1-r,-1],R:[1,1-r,1-c],L:[-1,1-r,c-1],U:[c-1,1,r-1],D:[c-1,-1,1-r]}[f]);
  const key=(c,n)=>c.join(',')+'|'+n.join(',');const rev=new Map();
  SOLVER_ORDER.forEach((f,fi)=>{for(let i=0;i<9;i++){const [r,c]=[Math.floor(i/3),i%3];rev.set(key(coord(f,r,c),normals[f]),fi*9+i);}});
  const rot=(v,a,s)=>{const[x,y,z]=v;if(a==='x')return[x,-s*z,s*y];if(a==='y')return[s*z,y,-s*x];return[-s*y,s*x,z];};
  const specs={R:['x',1,-1],L:['x',-1,1],U:['y',1,-1],D:['y',-1,1],F:['z',1,-1],B:['z',-1,1]},perms={};
  Object.entries(specs).forEach(([f,[a,layer,s]])=>{const p=Array.from({length:54},(_,i)=>i);SOLVER_ORDER.forEach((sf,fi)=>{for(let i=0;i<9;i++){const r=Math.floor(i/3),c=i%3,co=coord(sf,r,c),n=normals[sf],v=a==='x'?co[0]:a==='y'?co[1]:co[2];if(v!==layer)continue;const j=rev.get(key(rot(co,a,s),rot(n,a,s)));p[j]=fi*9+i;}});perms[f]=p;});return perms;
}
const MOVE_PERMS=buildMovePermutations();
function applyQuarter(stateStr,face){const p=MOVE_PERMS[face],o=Array(54);for(let i=0;i<54;i++)o[i]=stateStr[p[i]];return o.join('');}
function applyMove(stateStr,move){let n=move.endsWith('2')?2:move.endsWith("'")?3:1;while(n-->0)stateStr=applyQuarter(stateStr,move[0]);return stateStr;}
function buildStates(start,moves){const states=[start];let s=start;for(const m of moves){s=applyMove(s,m);states.push(s);}return states;}
function shallowShortestPure(start,maxDepth=4){
  const moves=["U","U2","U'","R","R2","R'","F","F2","F'","D","D2","D'","L","L2","L'","B","B2","B'"];
  if(start===SOLVED)return '';
  const dfs=(pos,left,lastFace,path)=>{
    if(left===0)return pos===SOLVED?path:null;
    for(const m of moves){if(m[0]===lastFace)continue;const found=dfs(applyMove(pos,m),left-1,m[0],path.concat(m));if(found)return found;}
    return null;
  };
  for(let depth=1;depth<=maxDepth;depth++){const found=dfs(start,depth,null,[]);if(found)return found.join(' ');}
  return null;
}

let solverScriptPromise=null;
function loadSolverMain(){
  if(window.min2phase)return Promise.resolve(window.min2phase);if(solverScriptPromise)return solverScriptPromise;
  solverScriptPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=SOLVER_CDN;s.async=true;s.onload=()=>window.min2phase?resolve(window.min2phase):reject(new Error('solver missing'));s.onerror=()=>reject(new Error('solver load'));document.head.appendChild(s);});return solverScriptPromise;
}
function normalizeSolution(raw){if(typeof raw!=='string')return null;const s=raw.trim();if(!s||/^Error\s+\d+/i.test(s))return null;return s.replace(/\s+/g,' ');}

async function solveWithWorker(facelet){
  return new Promise((resolve,reject)=>{
    let worker;try{worker=new Worker('./solver-worker.js');}catch(e){reject(e);return;}
    let done=false;const timer=setTimeout(()=>{if(done)return;done=true;worker.terminate();reject(new Error('timeout'));},18000);
    const finish=(fn)=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();fn();};
    worker.onmessage=e=>{const d=e.data||{};if(d.type==='status'){setStatus(d.text,'busy');return;}if(d.type==='candidate'){setStatus(`Ich habe ${d.count} Züge gefunden und suche noch nach einer kürzeren Lösung …`,'busy');return;}if(d.type==='invalid'){finish(()=>reject(new Error('invalid-cube')));return;}if(d.type==='done'){finish(()=>resolve(d));return;}if(d.type==='error'){finish(()=>reject(new Error(d.message||'worker-error')));}};
    worker.onerror=()=>finish(()=>reject(new Error('worker-error')));worker.postMessage({facelet});
  });
}
async function solveMainThread(facelet){
  setStatus('Ich prüfe zuerst sehr kurze Lösungen …','busy');await new Promise(r=>setTimeout(r,40));
  const short=shallowShortestPure(facelet,4);if(short!==null)return {solution:short,complete:true,shallowOptimal:true};
  setStatus('Ich suche eine kurze Lösung …','busy');const solver=await loadSolverMain();solver.initFull();const search=new solver.Search();const raw=search.solution(facelet,21,100000000,10000,0);if(/^Error\s+\d+/i.test(String(raw||'')))throw new Error('invalid-cube');const solution=normalizeSolution(raw);if(!solution)throw new Error('no-solution');return {solution,complete:false,shallowOptimal:false};
}
async function solveCube(){
  setValidation();const basic=validateBasic();if(basic){setValidation(basic);return;}state.isSolving=true;renderInput();$('solveBtn').textContent='Ich prüfe …';
  try{
    const {str,faceToColor}=buildFaceletString();setStatus('Ich prüfe die Farben und suche eine kurze Lösung …','busy');let result;
    try{result=await solveWithWorker(str);}catch(e){console.warn('Worker fallback',e);if(e.message==='invalid-cube')throw e;result=await solveMainThread(str);}
    if(state.testMode==='invalid'){setTestResult('Fehlertest nicht bestanden: Der unmögliche Würfel wurde nicht erkannt.','error');}
    const moves=result.solution?.trim()?result.solution.trim().split(/\s+/):[];const states=buildStates(str,moves);if(states[states.length-1]!==SOLVED)throw new Error('verification-failed');
    state.faceToColor=faceToColor;state.solutionMoves=moves;state.playbackStates=states;state.currentStep=0;
    setStatus(moves.length?`Kurze Lösung gefunden: ${moves.length} Züge.`:'Dein Würfel ist schon gelöst.','ok');
    if(state.testMode==='quick')setTestResult(moves.length===1?'Schnelltest bestanden: 1-Zug-Lösung gefunden.':`Schnelltest auffällig: ${moves.length} Züge gefunden.`,moves.length===1?'success':'error');
    if(state.testMode==='full')setTestResult(`Großer Test: geprüfte Lösung mit ${moves.length} Zügen gefunden.`,'success');
    showSolve();
  }catch(e){console.error(e);if(e.message==='invalid-cube'){setValidation('So kann ein echter Zauberwürfel nicht aussehen. Prüfe die Farben und die Ausrichtung der Seiten.');setStatus('Die eingegebenen Farben passen nicht zu einem echten Würfel.','error');if(state.testMode==='invalid')setTestResult('Fehlertest bestanden: Der unmögliche Würfel wurde richtig abgelehnt.','success');}else if(e.message==='solver load'){setValidation('Zum Lösen brauche ich eine Internetverbindung.');setStatus('Solver konnte nicht geladen werden.','error');}else{setValidation('Beim Lösen ist etwas schiefgegangen. Versuche es bitte noch einmal.');setStatus('Beim Lösen ist etwas schiefgegangen.','error');}}
  finally{state.isSolving=false;$('solveBtn').textContent='Würfel lösen';renderInput();}
}

function faceletColor(letter){const c=state.faceToColor?.[letter];return c?PALETTE[c].hex:'#cfd4dc';}
function currentFacelet(){return state.playbackStates[state.currentStep]||SOLVED;}
function currentMove(){return state.currentStep<state.solutionMoves.length?state.solutionMoves[state.currentStep]:null;}
function inverseMove(m){if(!m)return'';if(m.endsWith('2'))return m;return m.endsWith("'")?m[0]:m+"'";}
function describeMove(m){const name={F:'vordere',R:'rechte',B:'hintere',L:'linke',U:'obere',D:'untere'}[m[0]];if(m.endsWith('2'))return `Schau direkt auf die ${name} Seite. Drehe sie um 180° – eine halbe Drehung.`;if(m.endsWith("'"))return `Schau direkt auf die ${name} Seite. Drehe sie eine Vierteldrehung gegen den Uhrzeigersinn.`;return `Schau direkt auf die ${name} Seite. Drehe sie eine Vierteldrehung im Uhrzeigersinn.`;}
function directionText(m){const n={F:'Vorne',R:'Rechts',B:'Hinten',L:'Links',U:'Oben',D:'Unten'}[m[0]];if(m.endsWith('2'))return `${n}: 180° (halbe Drehung)`;return `${n}: ${m.endsWith("'")?'gegen den Uhrzeigersinn':'im Uhrzeigersinn'}`;}

function faceletCoord(f,r,c){return {F:[c-1,1-r,1],B:[1-c,1-r,-1],R:[1,1-r,1-c],L:[-1,1-r,c-1],U:[c-1,1,r-1],D:[c-1,-1,1-r]}[f];}
function buildStickerMap(facelet){const map=new Map();SOLVER_ORDER.forEach((f,fi)=>{for(let i=0;i<9;i++){const [r,c]=[Math.floor(i/3),i%3],p=faceletCoord(f,r,c),k=p.join(',');if(!map.has(k))map.set(k,{});map.get(k)[f]=faceletColor(facelet[fi*9+i]);}});return map;}
function cubieTransform(x,y,z){return `translate3d(${x*45}px,${-y*45}px,${z*45}px)`;}
function cubieSide(face,color){const d=document.createElement('div');d.className='cubie-side side-'+({F:'front',B:'back',R:'right',L:'left',U:'up',D:'down'}[face]);if(color){const s=document.createElement('span');s.className='sticker3d';s.style.background=color;d.appendChild(s);}return d;}
function makeCubie(x,y,z,stickers){const c=document.createElement('div');c.className='cubie';c.dataset.x=x;c.dataset.y=y;c.dataset.z=z;c.dataset.base=cubieTransform(x,y,z);c.style.transform=c.dataset.base;['F','B','R','L','U','D'].forEach(f=>c.appendChild(cubieSide(f,stickers?.[f])));return c;}
function moveSpec(m){if(!m)return null;const f=m[0],axis={F:'Z',B:'Z',R:'X',L:'X',U:'Y',D:'Y'}[f],layer={F:['z',1],B:['z',-1],R:['x',1],L:['x',-1],U:['y',1],D:['y',-1]}[f];let angle={F:90,B:-90,R:90,L:-90,U:-90,D:90}[f];if(m.endsWith('2'))angle*=2;if(m.endsWith("'"))angle*=-1;return {axis,angle,layer};}
function playAnimation(move,delay=100){const spec=moveSpec(move);if(!spec)return;const token=++state.animationToken,layer=$('cube3d').querySelector('.turning-layer');if(!layer)return;
  const reset=()=>{layer.style.transition='none';layer.style.webkitTransition='none';layer.style.transform=`rotate${spec.axis}(0deg)`;layer.style.webkitTransform=`rotate${spec.axis}(0deg)`;};
  const cycle=()=>{if(token!==state.animationToken)return;reset();void layer.offsetWidth;if(typeof layer.animate!=='function'){layer.style.transition='transform 800ms cubic-bezier(.22,.72,.18,1)';layer.style.webkitTransition='-webkit-transform 800ms cubic-bezier(.22,.72,.18,1)';requestAnimationFrame(()=>{if(token!==state.animationToken)return;const t=`rotate${spec.axis}(${spec.angle}deg)`;layer.style.transform=t;layer.style.webkitTransform=t;setTimeout(()=>{if(token!==state.animationToken)return;reset();setTimeout(cycle,700);},950);});return;}
    const a=layer.animate([{transform:`rotate${spec.axis}(0deg)`,offset:0},{transform:`rotate${spec.axis}(0deg)`,offset:.1},{transform:`rotate${spec.axis}(${spec.angle}deg)`,offset:.82},{transform:`rotate${spec.axis}(${spec.angle}deg)`,offset:1}],{duration:1050,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'});a.finished.then(()=>{if(token!==state.animationToken){a.cancel();return;}setTimeout(()=>{if(token!==state.animationToken){a.cancel();return;}a.cancel();reset();setTimeout(cycle,280);},650);}).catch(()=>{});
  };setTimeout(cycle,delay);
}
function render3D(auto=true){state.animationToken++;const host=$('cube3d');host.innerHTML='';const m=currentMove(),spec=moveSpec(m),stickers=buildStickerMap(currentFacelet());const fixed=document.createElement('div'),turning=document.createElement('div');fixed.className='cubie-layer fixed-layer';turning.className='cubie-layer turning-layer';host.append(fixed,turning);
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){const c=makeCubie(x,y,z,stickers.get([x,y,z].join(',')));const inMove=spec&&Number(c.dataset[spec.layer[0]])===spec.layer[1];(inMove?turning:fixed).appendChild(c);}
  const cam={F:'rotateX(-22deg) rotateY(30deg)',R:'rotateX(-20deg) rotateY(-62deg)',B:'rotateX(-20deg) rotateY(148deg)',L:'rotateX(-20deg) rotateY(118deg)',U:'rotateX(-69deg) rotateY(28deg)',D:'rotateX(58deg) rotateY(28deg)'};host.style.transform=m?cam[m[0]]:cam.F;
  const ar=$('turnArrow');ar.className='turn-arrow';if(m){if(m.endsWith("'"))ar.classList.add('ccw');if(m.endsWith('2'))ar.classList.add('half');ar.classList.add('show');if(auto)playAnimation(m,380);}$('replayBtn').disabled=!m;
}
function renderFlat(){const host=$('flatNet');host.innerHTML='';const pos={U:'net-u',L:'net-l',F:'net-f',R:'net-r',B:'net-b',D:'net-d'},facelet=currentFacelet(),m=currentMove();['U','L','F','R','B','D'].forEach(f=>{const d=document.createElement('div');d.className='flat-face '+pos[f]+(m&&m[0]===f?' current':'');const off=SOLVER_ORDER.indexOf(f)*9;for(let i=0;i<9;i++){const s=document.createElement('span');s.style.background=faceletColor(facelet[off+i]);d.appendChild(s);}const l=document.createElement('b');l.className='flat-label';l.textContent=f;d.appendChild(l);host.appendChild(d);});}
function renderSolutionList(){const host=$('solutionList');host.innerHTML='';state.solutionMoves.forEach((m,i)=>{const s=document.createElement('span');s.className='move-chip'+(i<state.currentStep?' done':i===state.currentStep?' current':'');s.textContent=`${i+1}. ${m}`;host.appendChild(s);});}
function renderPlayback(){const total=state.solutionMoves.length,m=currentMove();$('backStepBtn').disabled=state.currentStep===0;$('nextStepBtn').disabled=state.currentStep>=total;$('directionCard').classList.remove('done');
  if(total===0){$('stepCount').textContent='0 Züge nötig';$('moveTitle').textContent='Schon gelöst';$('moveDescription').textContent='Du musst nichts drehen.';$('moveBadge').textContent='✓';$('directionCard').textContent='Schon gelöst';$('directionCard').classList.add('done');$('finishedBox').classList.add('show');}
  else if(state.currentStep>=total){$('stepCount').textContent=`${total} von ${total} Zügen geschafft`;$('moveTitle').textContent='Geschafft!';$('moveDescription').textContent='Du hast alle Züge bestätigt.';$('moveBadge').textContent='✓';$('directionCard').textContent='Geschafft – der Würfel ist gelöst';$('directionCard').classList.add('done');$('finishedBox').classList.add('show');}
  else{$('stepCount').textContent=`Zug ${state.currentStep+1} von ${total}`;$('moveTitle').textContent='Jetzt: '+m;$('moveDescription').textContent=describeMove(m)+' Die Animation wiederholt sich, bis du den Zug bestätigst.';$('moveBadge').textContent=m;$('directionCard').textContent=directionText(m);$('finishedBox').classList.remove('show');}
  renderSolutionList();render3D();renderFlat();fitViewport();
}
function showSolve(){document.body.classList.add('solving');$('inputView').hidden=true;$('solveView').hidden=false;renderPlayback();}
function showInput(){document.body.classList.remove('solving');$('solveView').hidden=true;$('inputView').hidden=false;renderInput();}

function loadFacelet(facelet,mode,message){SOLVER_ORDER.forEach((f,fi)=>state.faces[f]=Array.from({length:9},(_,i)=>DEFAULT_FACE_COLORS[facelet[fi*9+i]]));state.currentFace='F';state.testMode=mode;setValidation(message,'success');setTestResult();showInput();}
function resetAll(ask=true){if(ask&&hasAnyInput()&&!confirm('Möchtest du wirklich alle Farben löschen?'))return;SOLVER_ORDER.forEach(f=>state.faces[f]=Array(9).fill(null));state.currentFace='F';state.selectedColor='white';state.solutionMoves=[];state.playbackStates=[];state.currentStep=0;state.faceToColor=null;state.testMode=null;setValidation();setTestResult();try{localStorage.removeItem('rubik-pages-input-v1');}catch{}showInput();}

function updateViewport(){const h=Math.round(window.visualViewport?.height||window.innerHeight);if(h>0)document.documentElement.style.setProperty('--app-h',h+'px');}
function overflows(){const view=$('solveView').hidden?$('inputView'):$('solveView');return view.scrollHeight>view.clientHeight+2||view.scrollWidth>view.clientWidth+2;}
function fitViewport(){document.body.classList.remove('tight');requestAnimationFrame(()=>{if(overflows())document.body.classList.add('tight');});}

$('prevFaceBtn').onclick=()=>{const i=FACE_ORDER.indexOf(state.currentFace);if(i>0){state.currentFace=FACE_ORDER[i-1];saveInput();renderInput();}};
$('nextFaceBtn').onclick=()=>{const i=FACE_ORDER.indexOf(state.currentFace);if(!currentFaceFilled()){setValidation('Auf dieser Seite fehlen noch Farben.');return;}if(i<FACE_ORDER.length-1){state.currentFace=FACE_ORDER[i+1];saveInput();setValidation();renderInput();}};
$('clearFaceBtn').onclick=()=>{state.faces[state.currentFace]=Array(9).fill(null);state.testMode=null;saveInput();setValidation();renderInput();};
$('solveBtn').onclick=solveCube;$('resetBtn').onclick=()=>resetAll(true);$('editBtn').onclick=()=>{if(state.currentStep>0&&!confirm('Du hast schon Züge gemacht. Trotzdem zurück zu den Farben?'))return;showInput();};
$('nextStepBtn').onclick=()=>{if(state.currentStep<state.solutionMoves.length){state.currentStep++;renderPlayback();}};
$('backStepBtn').onclick=()=>{if(state.currentStep<=0)return;const undo=inverseMove(state.solutionMoves[state.currentStep-1]);if(confirm(`Mache zuerst diesen Rückwärts-Zug:\n\n${describeMove(undo)}\n\nDrücke OK, wenn du ihn gemacht hast.`)){state.currentStep--;renderPlayback();}};
$('replayBtn').onclick=()=>{const m=currentMove();if(m)playAnimation(m,0);};
$('testsBtn').onclick=()=>{$('testDrawer').hidden=!$('testDrawer').hidden;};
$('quickTestBtn').onclick=()=>loadFacelet(QUICK_TEST,'quick','Schnelltest geladen. Erwartung: genau 1 Zug.');
$('fullTestBtn').onclick=()=>loadFacelet(FULL_TEST,'full','Großer Test geladen. Erwartung: eine geprüfte längere Lösung.');
$('invalidTestBtn').onclick=()=>loadFacelet(INVALID_TEST,'invalid','Fehlertest geladen. Erwartung: Die App muss diesen Würfel ablehnen.');
document.addEventListener('pointerdown',e=>{if(!$('testDrawer').hidden&&!$('testDrawer').contains(e.target)&&!$('testsBtn').contains(e.target))$('testDrawer').hidden=true;});
window.addEventListener('resize',()=>{updateViewport();fitViewport();});window.addEventListener('orientationchange',()=>setTimeout(()=>{updateViewport();fitViewport();},120));window.visualViewport?.addEventListener('resize',()=>{updateViewport();fitViewport();});

if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
updateViewport();loadInput();renderInput();setStatus(navigator.onLine?'Bereit.':'Offline – Eingabe funktioniert; der Solver braucht eventuell eine Verbindung.');
