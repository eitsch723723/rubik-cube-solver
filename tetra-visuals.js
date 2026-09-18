'use strict';
(function(){
  const $=id=>document.getElementById(id);
  const api=window.__PYRA_TEST__;if(!api)return;
  const {Core,state,TRIANGLES}=api,SVG='http://www.w3.org/2000/svg';
  const H=Math.sqrt(8/3),V=[[0,2/Math.sqrt(3),H/4],[-1,-1/Math.sqrt(3),H/4],[1,-1/Math.sqrt(3),H/4],[0,0,H/4-H]];
  const FACE_VERTICES=[[0,1,2],[0,3,1],[0,2,3],[1,3,2]],FACE_LABELS=[['V','Vorne'],['L','Links'],['R','Rechts'],['U','Unten']],MOVE_VERTEX={U:0,L:1,R:2,B:3},CODE_COLOR={g:'#079455',r:'#d92d20',b:'#175cd3',y:'#ffd500'};
  const SOLVER_TO_GEOM=[[0,1,6,2,3,7,4,5,8],[0,1,6,2,3,7,4,8,5],[0,1,6,2,7,3,4,8,5],[3,4,7,1,8,5,2,6,0]];
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(a[0],a[1],a[2]),unit=a=>scale(a,1/norm(a));
  function rotateAxis(p,axis,angle){const k=unit(axis),c=Math.cos(angle),s=Math.sin(angle);return add(add(scale(p,c),scale(cross(k,p),s)),scale(k,dot(k,p)*(1-c)));}
  function rotateView(p){let[x,y,z]=p;const ax=-.16,ay=.42;let c=Math.cos(ax),s=Math.sin(ax);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(ay);s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];return[x,y,z];}
  function project(p){const[x,y,z]=rotateView(p),cam=4.7,k=cam/(cam-z),sc=75;return[150+x*sc*k,116-y*sc*k,z];}
  function polygon(points,attrs={}){const p=document.createElementNS(SVG,'polygon');p.setAttribute('points',points.map(q=>`${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' '));Object.entries(attrs).forEach(([k,v])=>p.setAttribute(k,String(v)));return p;}
  function faceTriangles(faceIndex){const[ai,bi,ci]=FACE_VERTICES[faceIndex],A=V[ai],B=V[bi],C=V[ci],n=3,out=[],P=(r,c)=>add(scale(A,1-r/n),add(scale(B,(r-c)/n),scale(C,c/n)));for(let r=0;r<n;r++)for(let c=0;c<=r;c++)out.push([P(r,c),P(r+1,c),P(r+1,c+1)]);for(let r=1;r<n;r++)for(let c=0;c<r;c++)out.push([P(r,c),P(r,c+1),P(r+1,c+1)]);return out;}
  const GEOM=FACE_VERTICES.map((_,i)=>faceTriangles(i));
  function permutationFor(move){const tokens=Array.from({length:36},(_,i)=>String.fromCharCode(0x400+i)).join(''),moved=Core.applyMove(tokens,move),oldToNew=Array(36);for(let newPos=0;newPos<36;newPos++)oldToNew[moved.charCodeAt(newPos)-0x400]=newPos;return oldToNew;}
  const BASE_MOVES=['U','R','L','B','u','r','l','b'];
  const MOVE_PERM=Object.fromEntries(BASE_MOVES.map(m=>[m,permutationFor(m)]));
  const AFFECTED=Object.fromEntries(Object.entries(MOVE_PERM).map(([m,p])=>[m,new Set(p.map((j,i)=>j!==i?i:null).filter(i=>i!==null))]));
  const currentState=()=>state.states[state.step]||Core.SOLVED;
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let scene=null,sceneBuilds=0,movingPointUpdates=0;

  function makeOrientationLabels(svg){
    const group=document.createElementNS(SVG,'g');group.setAttribute('class','orientation-markers');group.setAttribute('aria-label','Orientierung V L R U');
    FACE_VERTICES.forEach((verts,fi)=>{
      const c=verts.map(i=>V[i]).reduce((a,p)=>add(a,p),[0,0,0]).map(x=>x/3),pt=project(c);
      const g=document.createElementNS(SVG,'g');g.setAttribute('class','orientation-marker');g.setAttribute('data-face',FACE_LABELS[fi][0]);
      const circle=document.createElementNS(SVG,'circle');circle.setAttribute('cx',pt[0].toFixed(2));circle.setAttribute('cy',pt[1].toFixed(2));circle.setAttribute('r','12');circle.setAttribute('fill','rgba(255,255,255,.92)');circle.setAttribute('stroke','#087ff5');circle.setAttribute('stroke-width','2');
      const text=document.createElementNS(SVG,'text');text.setAttribute('x',pt[0].toFixed(2));text.setAttribute('y',(pt[1]+4.5).toFixed(2));text.setAttribute('text-anchor','middle');text.setAttribute('font-size','13');text.setAttribute('font-weight','900');text.setAttribute('fill','#095fc8');text.textContent=FACE_LABELS[fi][0];
      const title=document.createElementNS(SVG,'title');title.textContent=`${FACE_LABELS[fi][0]} – ${FACE_LABELS[fi][1]}`;g.append(circle,text,title);group.appendChild(g);
    });
    svg.appendChild(group);return group;
  }

  function ensureScene(move=null){
    const svg=$('solvePreview');if(!svg)return null;const s=currentState(),token=move?move[0]:null,key=`${s}|${move||''}`;
    if(scene&&scene.key===key&&scene.svg===svg)return scene;
    svg.innerHTML='';const affected=token?AFFECTED[token]:null,moveFace=token?token.toUpperCase():null,axis=moveFace?V[MOVE_VERTEX[moveFace]]:null,entries=[];
    for(let solverPos=0;solverPos<36;solverPos++){
      const fi=Math.floor(solverPos/9),li=solverPos%9,gi=SOLVER_TO_GEOM[fi][li],pts3=GEOM[fi][gi],pp=pts3.map(project),z=pp.reduce((n,p)=>n+p[2],0)/3,moving=!!(affected&&affected.has(solverPos));
      const node=polygon(pp,{fill:CODE_COLOR[s[solverPos]]||'#eef2f6',stroke:moving?'#0b4ca8':'#101828','stroke-width':moving?2.9:2.2,'stroke-linejoin':'round','data-pos':solverPos});svg.appendChild(node);
      entries.push({solverPos,pts3,node,baseZ:z,z,moving});
    }
    const labels=makeOrientationLabels(svg);scene={key,svg,entries,labels,axis,move};sceneBuilds++;return scene;
  }
  function drawTetra(angle=0,move=null){
    const sc=ensureScene(move);if(!sc)return;
    for(const e of sc.entries){
      if(e.moving){const pp=e.pts3.map(p=>project(rotateAxis(p,sc.axis,angle)));e.z=pp.reduce((n,p)=>n+p[2],0)/3;e.node.setAttribute('points',pp.map(q=>`${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' '));movingPointUpdates++;}
      else e.z=e.baseZ;
    }
    [...sc.entries].sort((a,b)=>a.z-b.z).forEach(e=>sc.svg.appendChild(e.node));sc.svg.appendChild(sc.labels);
  }

  let raf=0,animationKey='';
  function stopAnimation(){if(raf)cancelAnimationFrame(raf);raf=0;animationKey='';}
  function startAnimation(){
    stopAnimation();if($('solveView')?.hidden||document.hidden)return;const move=state.solution[state.step];
    if(!move){drawTetra(0,null);return;}
    drawTetra(0,move);
    if(reduceMotion.matches)return;
    animationKey=`${state.step}:${move}:${Date.now()}`;const key=animationKey,start=performance.now(),target=(move.endsWith("'")?1:-1)*(2*Math.PI/3),duration=900,hold=260,cycle=1650;
    const frame=now=>{if(key!==animationKey||$('solveView')?.hidden||document.hidden){raf=0;return;}const t=(now-start)%cycle;let angle=0;if(t<duration){const x=t/duration,e=.5-.5*Math.cos(Math.PI*x);angle=target*e;}else if(t<duration+hold)angle=target;drawTetra(angle,move);raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);
  }
  function syncVisibility(hidden=document.hidden){if(hidden)stopAnimation();else if(!$('solveView')?.hidden)startAnimation();}

  function renderLabeledFlat(){const h=$('flatPyra');if(!h)return;const s=currentState();h.innerHTML='';for(let f=0;f<4;f++){const card=document.createElement('div');card.className='mini-face-card';const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox','0 0 346.41 300');svg.classList.add('mini-face-svg');TRIANGLES.forEach((pts,i)=>svg.appendChild(polygon(pts,{fill:CODE_COLOR[s[f*9+i]]||'#eef2f6',stroke:'#101828','stroke-width':5,'stroke-linejoin':'round'})));const label=document.createElement('div');label.className='mini-face-label';label.innerHTML=`<strong>${FACE_LABELS[f][0]}</strong><span>${FACE_LABELS[f][1]}</span>`;card.append(svg,label);h.appendChild(card);}}
  function verifyVisualMapping(){const eps=1e-7;for(const m of BASE_MOVES){const p=MOVE_PERM[m],axis=V[MOVE_VERTEX[m.toUpperCase()]],angle=-2*Math.PI/3;for(const i of AFFECTED[m]){const fi=Math.floor(i/9),li=i%9,gi=SOLVER_TO_GEOM[fi][li],c=GEOM[fi][gi].reduce((a,q)=>add(a,q),[0,0,0]).map(x=>x/3),rc=rotateAxis(c,axis,angle),j=p[i],fj=Math.floor(j/9),lj=j%9,gj=SOLVER_TO_GEOM[fj][lj],dc=GEOM[fj][gj].reduce((a,q)=>add(a,q),[0,0,0]).map(x=>x/3);if(norm([rc[0]-dc[0],rc[1]-dc[1],rc[2]-dc[2]])>eps)return false;}}return true;}
  const step=$('stepCount');if(step)new MutationObserver(()=>requestAnimationFrame(()=>{scene=null;renderLabeledFlat();startAnimation();})).observe(step,{childList:true,subtree:true,characterData:true});
  const replay=$('replayBtn');if(replay)replay.onclick=startAnimation;const edit=$('editBtn');if(edit)edit.addEventListener('click',stopAnimation);const backHome=$('backHome');if(backHome)backHome.addEventListener('click',stopAnimation);
  document.addEventListener('visibilitychange',()=>syncVisibility());
  const motionChanged=()=>{scene=null;startAnimation();};if(reduceMotion.addEventListener)reduceMotion.addEventListener('change',motionChanged);else if(reduceMotion.addListener)reduceMotion.addListener(motionChanged);
  if(!verifyVisualMapping())console.error('Tetraeder visual mapping regression failed');
  window.__PYRA_VISUAL_TEST__={verifyVisualMapping,startAnimation,stopAnimation,syncVisibility,renderLabeledFlat,AFFECTED,isAnimating:()=>!!raf,isReducedMotion:()=>reduceMotion.matches,stats:()=>({sceneBuilds,movingPointUpdates,polygonCount:$('solvePreview')?.querySelectorAll('polygon').length||0})};
})();