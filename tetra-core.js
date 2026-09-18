'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.TetraCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MAIN_MOVES=['U',"U'",'R',"R'",'L',"L'",'B',"B'"];
  const TIP_MOVES=['u',"u'",'r',"r'",'l',"l'",'b',"b'"];
  const MOVES=MAIN_MOVES.concat(TIP_MOVES);
  const SOLVED='gggggggggrrrrrrrrrbbbbbbbbbyyyyyyyyy';
  const KNOWN='gggyggrggrrrbrrrrrbgbbbbbbbyyyyyygyy';
  const INVALID='rgggggggggrrrrrrrrbbbbbbbbbyyyyyyyyy';
  const TIP_CYCLES={u:[0,18,9],r:[7,32,23],l:[4,17,35],b:[13,26,27]};
  const TIP_POSITIONS=new Set(Object.values(TIP_CYCLES).flat());
  const BODY_POSITIONS=Array.from({length:36},(_,i)=>i).filter(i=>!TIP_POSITIONS.has(i));

  function cycle(a,x,y,z){const t=a[x];a[x]=a[y];a[y]=a[z];a[z]=t;}
  function quarterMain(s,face){
    const a=s.split('');
    if(face==='U'){
      const x=a.slice(0,4);
      a.splice(0,4,...a.slice(18,22));
      a.splice(18,4,...a.slice(9,13));
      a.splice(9,4,...x);
    }else if(face==='R'){
      [[3,33,24],[6,28,19],[7,32,23],[8,31,22]].forEach(v=>cycle(a,...v));
    }else if(face==='L'){
      [[1,15,33],[4,17,35],[5,16,34],[6,12,30]].forEach(v=>cycle(a,...v));
    }else if(face==='B'){
      [[10,24,30],[13,26,27],[14,25,29],[15,21,28]].forEach(v=>cycle(a,...v));
    }else throw new Error('unknown main move '+face);
    return a.join('');
  }
  function quarterTip(s,face){
    const a=s.split(''),v=TIP_CYCLES[face];
    if(!v)throw new Error('unknown tip move '+face);
    cycle(a,...v);return a.join('');
  }
  function applyMove(s,m){
    if(!m)throw new Error('empty move');
    const base=m[0],isTip=base===base.toLowerCase();
    let n=m.endsWith("'")?2:1;
    while(n--)s=isTip?quarterTip(s,base):quarterMain(s,base);
    return s;
  }
  function inverse(m){return m.endsWith("'")?m[0]:m+"'";}
  function permutations(a){
    if(a.length<=1)return[a];
    const out=[];
    a.forEach((x,i)=>permutations(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>out.push([x,...p])));
    return out;
  }
  function goalsFor(s){
    const colors=[...new Set(s)];
    if(colors.length!==4)return[];
    return permutations(colors).map(p=>p.map(c=>c.repeat(9)).join(''));
  }
  function bodyKey(s){return BODY_POSITIONS.map(i=>s[i]).join('');}
  function bodyGoalsFor(s){return goalsFor(s).map(g=>({state:g,key:bodyKey(g)}));}
  function solveMainBody(start,maxDepth=11){
    const goals=bodyGoalsFor(start);if(!goals.length)return null;
    const startKey=bodyKey(start),goalKeys=new Set(goals.map(g=>g.key));
    if(goalKeys.has(startKey))return[];
    const fm=new Map([[startKey,{state:start,path:[]}]]),bm=new Map(goals.map(g=>[g.key,{state:g.state,path:[]}]))
    let ff=[startKey],bf=goals.map(g=>g.key),df=0,db=0;
    while(ff.length&&bf.length&&df+db<maxDepth){
      if(ff.length<=bf.length){
        const next=[];
        for(const key of ff){
          const node=fm.get(key),last=node.path.length?node.path[node.path.length-1][0]:null;
          for(const m of MAIN_MOVES){
            if(m[0]===last)continue;
            const ns=applyMove(node.state,m),nk=bodyKey(ns);if(fm.has(nk))continue;
            const np=node.path.concat(m);fm.set(nk,{state:ns,path:np});
            if(bm.has(nk))return np.concat(bm.get(nk).path);
            next.push(nk);
          }
        }
        ff=next;df++;
      }else{
        const next=[];
        for(const key of bf){
          const node=bm.get(key),first=node.path.length?node.path[0][0]:null;
          for(const m of MAIN_MOVES){
            if(m[0]===first)continue;
            const ns=applyMove(node.state,m),nk=bodyKey(ns);if(bm.has(nk))continue;
            const np=[inverse(m)].concat(node.path);bm.set(nk,{state:ns,path:np});
            if(fm.has(nk))return fm.get(nk).path.concat(np);
            next.push(nk);
          }
        }
        bf=next;db++;
      }
    }
    return null;
  }
  function solvedFaceColors(bodySolved){
    const out=[];
    for(let f=0;f<4;f++){
      const vals=[];for(let i=0;i<9;i++){const pos=f*9+i;if(!TIP_POSITIONS.has(pos))vals.push(bodySolved[pos]);}
      if(!vals.length||!vals.every(x=>x===vals[0]))return null;out.push(vals[0]);
    }
    return out;
  }
  function solveTips(bodySolved){
    const target=solvedFaceColors(bodySolved);if(!target)return null;
    let s=bodySolved;const path=[];
    for(const face of ['u','r','l','b']){
      const positions=TIP_CYCLES[face];
      const ok=()=>positions.every(pos=>s[pos]===target[Math.floor(pos/9)]);
      if(ok())continue;
      const once=applyMove(s,face);s=once;if(ok()){path.push(face);continue;}
      const twice=applyMove(s,face);s=twice;if(ok()){path.push(face+"'");continue;}
      return null;
    }
    return {path,state:s};
  }
  function solveFull(start,maxMainDepth=11){
    const main=solveMainBody(start,maxMainDepth);if(main===null)return null;
    let bodySolved=start;for(const m of main)bodySolved=applyMove(bodySolved,m);
    const tip=solveTips(bodySolved);if(!tip)return null;
    const path=main.concat(tip.path);return verifySolution(start,path)?path:null;
  }
  function solveBidirectional(start,maxDepth=11){return solveFull(start,maxDepth);}
  function verifySolution(start,moves){
    let s=start;for(const m of moves)s=applyMove(s,m);
    return goalsFor(start).includes(s);
  }
  function buildStates(start,moves){const out=[start];let s=start;for(const m of moves){s=applyMove(s,m);out.push(s);}return out;}
  return {MAIN_MOVES,TIP_MOVES,MOVES,SOLVED,KNOWN,INVALID,TIP_CYCLES,TIP_POSITIONS,BODY_POSITIONS,quarterMain,quarterTip,applyMove,inverse,goalsFor,bodyKey,solveMainBody,solveTips,solveFull,solveBidirectional,verifySolution,buildStates};
});
