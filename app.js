'use strict';
const $=id=>document.getElementById(id);
const Core=window.TetraCore;
const CUBE_URL='./cube/';
const FACES=[
  {name:'Vorne',short:'V',note:'Halte eine Spitze nach oben. Diese Dreiecksfläche zeigt zu dir.',topLabel:'Spitze oben',bottomLabel:'Fläche zeigt zu dir',help:'Halte eine Spitze nach oben. Die Fläche „Vorne“ zeigt direkt zu dir.'},
  {name:'Links',short:'L',note:'Drehe den ganzen Tetraeder nach rechts, bis die linke Fläche zu dir zeigt. Die obere Spitze bleibt oben.',topLabel:'Spitze oben',bottomLabel:'Fläche zeigt zu dir',help:'Drehe den ganzen Tetraeder nach rechts. Die obere Spitze bleibt oben und „Links“ zeigt zu dir.'},
  {name:'Rechts',short:'R',note:'Gehe zurück zur Vorderseite und drehe nach links, bis die rechte Fläche zu dir zeigt. Die obere Spitze bleibt oben.',topLabel:'Spitze oben',bottomLabel:'Fläche zeigt zu dir',help:'Gehe zurück zur Vorderseite und drehe den ganzen Tetraeder nach links. Die obere Spitze bleibt oben und „Rechts“ zeigt zu dir.'},
  {name:'Unten',short:'U',note:'Schau direkt auf die Unterseite. Das Dreieck bleibt mit der Spitze nach oben: Die einzelne hintere Ecke ist oben, die frühere Vorderkante liegt unten bei dir.',topLabel:'Hintere Ecke',bottomLabel:'Frühere Vorderkante · bei dir',help:'Das Dreieck steht nicht auf der Spitze. Die einzelne hintere Ecke zeigt nach oben; die frühere Vorderkante liegt unten bei dir.'}
];
const PALETTE={green:{label:'Grün',hex:'#079455',code:'g'},red:{label:'Rot',hex:'#d92d20',code:'r'},blue:{label:'Blau',hex:'#175cd3',code:'b'},yellow:{label:'Gelb',hex:'#ffd500',code:'y'}};
const COLOR_KEYS=Object.keys(PALETTE);
const state={faces:Array.from({length:4},()=>Array(9).fill(null)),currentFace:0,selected:'green',solution:[],states:[],step:0,testMode:null,previewAnim:null};

function setStatus(text,kind=''){$('statusText').textContent=text;$('statusDot').className='status-dot'+(kind?' '+kind:'');}
function setValidation(text='',kind='error'){const e=$('validation');e.textContent=text;e.className='validation'+(text?' show '+kind:'');}
function counts(){const c=Object.fromEntries(COLOR_KEYS.map(k=>[k,0]));state.faces.flat().forEach(x=>{if(x)c[x]++;});return c;}
function allFilled(){return state.faces.every(f=>f.every(Boolean));}
const INPUT_STORAGE_KEY='rubik-pyra-separate-v3';
function save(){try{localStorage.setItem(INPUT_STORAGE_KEY,JSON.stringify({faces:state.faces,currentFace:state.currentFace,selected:state.selected}));}catch{}}
function load(){try{const x=JSON.parse(localStorage.getItem(INPUT_STORAGE_KEY)||'null');if(!x)return;if(Array.isArray(x.faces)&&x.faces.length===4)x.faces.forEach((f,i)=>{if(Array.isArray(f)&&f.length===9)state.faces[i]=f.map(c=>COLOR_KEYS.includes(c)?c:null);});if(Number.isInteger(x.currentFace)&&x.currentFace>=0&&x.currentFace<4)state.currentFace=x.currentFace;if(COLOR_KEYS.includes(x.selected)||x.selected==='erase')state.selected=x.selected;}catch{}}

const SVG='http://www.w3.org/2000/svg';
function el(name,attrs={}){const x=document.createElementNS(SVG,name);for(const[k,v]of Object.entries(attrs))x.setAttribute(k,String(v));return x;}
function vAdd(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]];}function vScale(a,s){return[a[0]*s,a[1]*s,a[2]*s];}
function rotate3(p,ax,ay){let[x,y,z]=p;let c=Math.cos(ax),s=Math.sin(ax);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(ay);s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];return[x,y,z];}
function project(p,w,h,scale=72){const cam=5.2,k=cam/(cam-p[2]);return[w/2+p[0]*scale*k,h/2-p[1]*scale*k,p[2]];}
function polyPoints(points){return points.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');}

function cubeStickers(angle){
  const faces=[
    {n:[0,0,1],u:[1,0,0],v:[0,1,0],color:'#079455'},
    {n:[1,0,0],u:[0,0,-1],v:[0,1,0],color:'#175cd3'},
    {n:[0,1,0],u:[1,0,0],v:[0,0,-1],color:'#f7f7f2'},
    {n:[0,0,-1],u:[-1,0,0],v:[0,1,0],color:'#d92d20'},
    {n:[-1,0,0],u:[0,0,1],v:[0,1,0],color:'#ff7a00'},
    {n:[0,-1,0],u:[1,0,0],v:[0,0,1],color:'#ffd500'}
  ];
  const out=[];const gap=.055;
  for(const f of faces)for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    const x0=-1+c*2/3+gap,x1=-1+(c+1)*2/3-gap,y0=1-r*2/3-gap,y1=1-(r+1)*2/3+gap;
    const pts=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([u,v])=>vAdd(f.n,vAdd(vScale(f.u,u),vScale(f.v,v))));
    const rp=pts.map(p=>rotate3(p,-.42,angle));const pp=rp.map(p=>project(p,240,190,68));out.push({z:rp.reduce((s,p)=>s+p[2],0)/4,pts:pp,color:f.color});
  }
  return out.sort((a,b)=>a.z-b.z);
}
function tetraTriangles(angle){
  const V=[[0,1.28,0],[-1,-.7,.95],[1,-.7,.95],[0,-.7,-1.16]];
  const faces=[
    {v:[0,1,2],color:'#079455'},
    {v:[0,2,3],color:'#175cd3'},
    {v:[0,3,1],color:'#d92d20'},
    {v:[1,3,2],color:'#ffd500'}
  ];
  const out=[];
  for(const f of faces){const A=V[f.v[0]],B=V[f.v[1]],C=V[f.v[2]];const P=(r,c)=>{const n=3;return vAdd(vScale(A,1-r/n),vAdd(vScale(B,(r-c)/n),vScale(C,c/n)));};
    for(let r=0;r<3;r++)for(let c=0;c<=r;c++){const pts=[P(r,c),P(r+1,c),P(r+1,c+1)];pushTri(pts,f.color);}
    for(let r=1;r<3;r++)for(let c=0;c<r;c++){const pts=[P(r,c),P(r,c+1),P(r+1,c+1)];pushTri(pts,f.color);}
  }
  function pushTri(pts,color){const rp=pts.map(p=>rotate3(p,-.28,angle));const pp=rp.map(p=>project(p,240,190,68));out.push({z:rp.reduce((s,p)=>s+p[2],0)/3,pts:pp,color});}
  return out.sort((a,b)=>a.z-b.z);
}
function drawScene(svg,kind,angle,highlight=null){
  svg.innerHTML='';const items=kind==='cube'?cubeStickers(angle):tetraTriangles(angle);
  for(const item of items){const p=el('polygon',{points:polyPoints(item.pts),fill:item.color,stroke:'#101828','stroke-width':kind==='cube'?2.1:2.5,'stroke-linejoin':'round'});svg.appendChild(p);}
  if(kind==='tetra'&&highlight){
    const labels={U:[120,25],R:[196,143],L:[44,143],B:[120,165]},pt=labels[highlight[0]]||[120,25];
    const ring=el('circle',{cx:pt[0],cy:pt[1],r:16,fill:'none',stroke:'#087ff5','stroke-width':5,'stroke-dasharray':'7 5'});ring.classList.add('move-ring');svg.appendChild(ring);
  }
}
function drawHoldGuide(faceIndex){
  const svg=$('holdPreview'),face=FACES[faceIndex];if(!svg)return;
  svg.innerHTML='';
  const faceShape=el('polygon',{points:'120,30 211,158 29,158',fill:'#eaf3ff',stroke:'#0f1b2d','stroke-width':4,'stroke-linejoin':'round'});svg.appendChild(faceShape);
  const lines=[['120,30','120,158'],['74.5,94','165.5,94'],['74.5,94','120,158'],['165.5,94','120,158']];
  lines.forEach(([a,b])=>{const line=el('line',{x1:a.split(',')[0],y1:a.split(',')[1],x2:b.split(',')[0],y2:b.split(',')[1],stroke:'#91bfee','stroke-width':2});svg.appendChild(line);});
  const badge=el('circle',{cx:120,cy:112,r:24,fill:'#fff',stroke:'#087ff5','stroke-width':3});svg.appendChild(badge);
  const letter=el('text',{x:120,y:120,'text-anchor':'middle','font-size':24,'font-weight':900,fill:'#095fc8'});letter.textContent=face.short;svg.appendChild(letter);
  const top=el('text',{x:120,y:19,'text-anchor':'middle','font-size':faceIndex===3?12:13,'font-weight':800,fill:'#344054'});top.textContent=face.topLabel;svg.appendChild(top);
  const bottom=el('text',{x:120,y:181,'text-anchor':'middle','font-size':faceIndex===3?12:13,'font-weight':800,fill:'#344054'});bottom.textContent=face.bottomLabel;svg.appendChild(bottom);
  if(faceIndex===3){const arrow=el('path',{d:'M120 160 V171 M114 166 L120 172 L126 166',fill:'none',stroke:'#087ff5','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});svg.appendChild(arrow);}
}
function startChooserAnimation(){
  if(state.previewAnim)return;let stopped=false;state.previewAnim={stop:()=>stopped=true};
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame=t=>{if(stopped)return;const a=reduce?.65:t*.0005;drawScene($('cubePreview'),'cube',a);drawScene($('tetraPreview'),'tetra',a+.45);requestAnimationFrame(frame);};requestAnimationFrame(frame);
}

function triangleGrid(){
  const W=346.41,H=300,n=3,pts=[];
  const P=(r,c)=>[W/2-r*(W/(2*n))+c*(W/n),r*(H/n)];
  for(let r=0;r<n;r++)for(let c=0;c<=r;c++)pts.push([P(r,c),P(r+1,c),P(r+1,c+1)]);
  for(let r=1;r<n;r++)for(let c=0;c<r;c++)pts.push([P(r,c),P(r,c+1),P(r+1,c+1)]);
  return pts;
}
const TRIANGLES=triangleGrid();
function renderTabs(){const h=$('faceTabs');h.innerHTML='';FACES.forEach((f,i)=>{const n=state.faces[i].filter(Boolean).length,b=document.createElement('button');b.type='button';b.className='face-tab'+(i===state.currentFace?' active':'')+(n===9?' complete':'');b.innerHTML=`<strong>${i+1}. ${f.name}</strong><small>${n===9?'fertig':n+'/9'}</small>`;b.onclick=()=>{state.currentFace=i;save();renderInput();};h.appendChild(b);});}
function renderTriangle(){
  const f=FACES[state.currentFace];$('faceTitle').textContent=`${f.name} (${f.short})`;$('orientationText').textContent=f.note;$('faceProgress').textContent=state.faces[state.currentFace].filter(Boolean).length+'/9';
  $('triangleEditorWrap').dataset.face=f.short;$('triangleTopLabel').textContent=f.topLabel;$('triangleBottomLabel').textContent=f.bottomLabel;$('holdHelp').textContent=f.help;drawHoldGuide(state.currentFace);
  const svg=$('triangleEditor');svg.innerHTML='';
  TRIANGLES.forEach((pts,inputIndex)=>{const solverIndex=Core.inputIndexToSolver(state.currentFace,inputIndex),c=state.faces[state.currentFace][solverIndex],p=el('polygon',{points:polyPoints(pts),fill:c?PALETTE[c].hex:'#eef2f6',tabindex:'0',role:'button','aria-label':`${f.name}, Dreieck ${inputIndex+1}, ${c?PALETTE[c].label:'leer'}`});p.classList.add('tri-cell');const paint=()=>{setValidation();state.testMode=null;if(state.selected==='erase')state.faces[state.currentFace][solverIndex]=null;else{const co=counts(),old=state.faces[state.currentFace][solverIndex];if(old!==state.selected&&co[state.selected]>=9){setValidation(`${PALETTE[state.selected].label} ist schon 9-mal eingetragen.`);return;}state.faces[state.currentFace][solverIndex]=state.selected;}save();renderInput();};p.addEventListener('click',paint);p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();paint();}});svg.appendChild(p);});
}
function renderPalette(){const h=$('palette');h.innerHTML='';COLOR_KEYS.forEach(k=>{const b=document.createElement('button');b.type='button';b.className='palette-btn'+(k===state.selected?' active':'');b.innerHTML=`<span class="swatch" style="background:${PALETTE[k].hex}"></span><span>${PALETTE[k].label}</span>`;b.onclick=()=>{state.selected=k;save();renderPalette();};h.appendChild(b);});const e=document.createElement('button');e.type='button';e.className='palette-btn'+(state.selected==='erase'?' active':'');e.innerHTML='<span class="swatch" style="display:grid;place-items:center;background:#f2f4f7">×</span><span>Löschen</span>';e.onclick=()=>{state.selected='erase';save();renderPalette();};h.appendChild(e);}
function renderCounts(){const c=counts(),h=$('counts');h.innerHTML='';COLOR_KEYS.forEach(k=>{const d=document.createElement('span');d.className='count'+(c[k]===9?' good':c[k]>9?' bad':'');d.textContent=`${PALETTE[k].label}: ${c[k]}/9`;h.appendChild(d);});}
function renderNav(){const i=state.currentFace,filled=state.faces[i].every(Boolean);$('prevFace').disabled=i===0;$('nextFace').hidden=i===3;$('nextFace').disabled=!filled;$('solveBtn').hidden=!(i===3||allFilled());$('solveBtn').disabled=!allFilled();}
function renderInput(){renderTabs();renderTriangle();renderPalette();renderCounts();renderNav();}
function toStringState(){return state.faces.flat().map(k=>k?PALETTE[k].code:'?').join('');}
function fromStringState(s){const byCode=Object.fromEntries(COLOR_KEYS.map(k=>[PALETTE[k].code,k]));state.faces=Array.from({length:4},(_,fi)=>Array.from({length:9},(_,i)=>byCode[s[fi*9+i]]));state.currentFace=0;state.selected='green';save();renderInput();}
function validateBasic(){if(!allFilled())return 'Es fehlen noch Farben.';const c=counts(),bad=COLOR_KEYS.filter(k=>c[k]!==9);if(bad.length)return 'Jede der vier Farben muss genau 9-mal vorkommen.';return null;}
async function solve(){
  setValidation();const basic=validateBasic();if(basic){setValidation(basic);return;}const start=toStringState();setStatus('Ich prüfe, ob dieser Tetraeder erreichbar ist …','busy');$('solveBtn').disabled=true;await new Promise(r=>setTimeout(r,30));
  try{const path=Core.solveBidirectional(start,11);if(path===null){setValidation('Dieser Zustand ist physikalisch nicht erreichbar. Prüfe, ob du alle vier Seiten genau in der gezeigten Ausrichtung eingegeben hast.');setStatus('Der Tetraeder-Zustand ist physikalisch nicht erreichbar.','error');return;}if(!Core.verifySolution(start,path))throw new Error('verification');state.solution=path;state.states=Core.buildStates(start,path);state.step=0;setStatus(path.length?`Lösung verifiziert: ${path.length} Züge.`:'Der Tetraeder ist schon gelöst.','ok');showSolve();}
  catch(e){console.error(e);setValidation('Interner Prüffehler. Die Lösung wurde nicht angezeigt.');setStatus('Lösung konnte nicht verifiziert werden.','error');}
  finally{$('solveBtn').disabled=false;}
}
function moveName(m){return{U:'obere Spitze',R:'rechte Spitze',L:'linke Spitze',B:'hintere Spitze'}[m[0]];}
function label(m){return({U:'O',R:'R',L:'L',B:'H'}[m[0]])+(m.endsWith("'")?"'":'');}
function describe(m){return`Schau direkt auf die ${moveName(m)}. Drehe die ganze Ebene unter dieser Spitze um 120° ${m.endsWith("'")?'gegen den Uhrzeigersinn':'im Uhrzeigersinn'}.`;}
function renderSolution(){
  const total=state.solution.length,m=state.solution[state.step];$('backStep').disabled=state.step===0;$('nextStep').disabled=state.step>=total;
  if(!total){$('stepCount').textContent='0 Züge nötig';$('moveTitle').textContent='Schon gelöst';$('moveDescription').textContent='Du musst nichts drehen.';$('moveBadge').textContent='✓';$('directionCard').textContent='Schon gelöst';}
  else if(state.step>=total){$('stepCount').textContent=`${total} von ${total} geschafft`;$('moveTitle').textContent='Geschafft';$('moveDescription').textContent='Alle Züge sind bestätigt.';$('moveBadge').textContent='✓';$('directionCard').textContent='Tetraeder gelöst';}
  else{$('stepCount').textContent=`Zug ${state.step+1} von ${total}`;$('moveTitle').textContent='Jetzt: '+label(m);$('moveDescription').textContent=describe(m)+' Die Markierung wiederholt sich bis zur Bestätigung.';$('moveBadge').textContent=label(m);$('directionCard').textContent=`${moveName(m)}: 120° ${m.endsWith("'")?'gegen den Uhrzeigersinn':'im Uhrzeigersinn'}`;}
  const h=$('solutionList');h.innerHTML='';state.solution.forEach((x,i)=>{const c=document.createElement('span');c.className='move-chip'+(i<state.step?' done':i===state.step?' current':'');c.textContent=`${i+1}. ${label(x)}`;h.appendChild(c);});renderSolvePreview();renderFlat();
}
function renderSolvePreview(){const m=state.solution[state.step];drawScene($('solvePreview'),'tetra',.55,m);$('replayBtn').disabled=!m;if(m){const ring=$('solvePreview').querySelector('.move-ring');if(ring){ring.animate([{strokeDashoffset:0,opacity:.35},{strokeDashoffset:-48,opacity:1},{strokeDashoffset:-96,opacity:.35}],{duration:1200,iterations:Infinity});}}}
function renderFlat(){const h=$('flatPyra');h.innerHTML='';const s=state.states[state.step]||Core.SOLVED;for(let f=0;f<4;f++){const svg=el('svg',{viewBox:'0 0 346.41 300'});svg.classList.add('mini-face-svg');TRIANGLES.forEach((pts,inputIndex)=>{const solverIndex=Core.inputIndexToSolver(f,inputIndex),code=s[f*9+solverIndex],k=COLOR_KEYS.find(k=>PALETTE[k].code===code);svg.appendChild(el('polygon',{points:polyPoints(pts),fill:PALETTE[k]?.hex||'#eef2f6',stroke:'#101828','stroke-width':5}));});h.appendChild(svg);}}
function showSolve(){$('inputView').hidden=true;$('solveView').hidden=false;renderSolution();}
function showInput(){$('solveView').hidden=true;$('inputView').hidden=false;renderInput();}
function reset(){state.faces=Array.from({length:4},()=>Array(9).fill(null));state.currentFace=0;state.selected='green';state.solution=[];state.states=[];state.step=0;state.testMode=null;try{localStorage.removeItem(INPUT_STORAGE_KEY);localStorage.removeItem('rubik-pyra-separate-v2');}catch{}setValidation();setStatus('Bereit.');showInput();}

$('chooseCube').onclick=()=>{location.href=CUBE_URL;};
$('choosePyra').onclick=()=>{$('chooser').hidden=true;$('pyraApp').hidden=false;showInput();};
$('backHome').onclick=()=>{$('pyraApp').hidden=true;$('chooser').hidden=false;};
$('resetBtn').onclick=()=>{if(confirm('Alle Tetraeder-Farben löschen?'))reset();};
$('prevFace').onclick=()=>{if(state.currentFace>0){state.currentFace--;save();renderInput();}};
$('nextFace').onclick=()=>{if(state.faces[state.currentFace].every(Boolean)&&state.currentFace<3){state.currentFace++;save();renderInput();}};
$('clearFace').onclick=()=>{state.faces[state.currentFace]=Array(9).fill(null);state.testMode=null;save();renderInput();};
$('solveBtn').onclick=solve;
$('nextStep').onclick=()=>{if(state.step<state.solution.length){state.step++;renderSolution();}};
$('backStep').onclick=()=>{if(state.step>0){state.step--;renderSolution();}};
$('editBtn').onclick=showInput;
$('replayBtn').onclick=renderSolvePreview;
$('knownTest').onclick=()=>{fromStringState(Core.KNOWN);setValidation("Referenztest geladen: Zustand nach L R' L' R.",'success');setStatus('4-Zug-Referenz geladen.','ok');};
$('solvedTest').onclick=()=>{fromStringState(Core.SOLVED);setValidation('Gelöster Referenzzustand geladen.','success');setStatus('Gelöster Zustand geladen.','ok');};
$('invalidTest').onclick=()=>{fromStringState(Core.INVALID);setValidation('Unmöglicher Zustand geladen: zwei Spitzen-Sticker wurden vertauscht.','success');setStatus('Fehlertest geladen.');};
load();renderInput();setStatus('Bereit.');startChooserAnimation();
window.__PYRA_TEST__={Core,TRIANGLES,state,toStringState};
