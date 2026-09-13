'use strict';
const SOLVED='UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
const SOLVER_CDN='https://cdn.jsdelivr.net/gh/cs0x7f/min2phase.js@master/min2phase.js';
const ORDER=['U','R','F','D','L','B'];
const MOVES=["U","U2","U'","R","R2","R'","F","F2","F'","D","D2","D'","L","L2","L'","B","B2","B'"];

function buildPerms(){
  const n={U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1]};
  const coord=(f,r,c)=>({F:[c-1,1-r,1],B:[1-c,1-r,-1],R:[1,1-r,1-c],L:[-1,1-r,c-1],U:[c-1,1,r-1],D:[c-1,-1,1-r]}[f]);
  const key=(c,no)=>c.join(',')+'|'+no.join(','),rev=new Map();
  ORDER.forEach((f,fi)=>{for(let i=0;i<9;i++)rev.set(key(coord(f,Math.floor(i/3),i%3),n[f]),fi*9+i);});
  const rot=(v,a,s)=>{const[x,y,z]=v;if(a==='x')return[x,-s*z,s*y];if(a==='y')return[s*z,y,-s*x];return[-s*y,s*x,z];};
  const specs={R:['x',1,-1],L:['x',-1,1],U:['y',1,-1],D:['y',-1,1],F:['z',1,-1],B:['z',-1,1]},out={};
  Object.entries(specs).forEach(([f,[a,layer,s]])=>{const p=Array.from({length:54},(_,i)=>i);ORDER.forEach((sf,fi)=>{for(let i=0;i<9;i++){const c=coord(sf,Math.floor(i/3),i%3),no=n[sf],v=a==='x'?c[0]:a==='y'?c[1]:c[2];if(v!==layer)continue;p[rev.get(key(rot(c,a,s),rot(no,a,s)))]=fi*9+i;}});out[f]=p;});return out;
}
const PERMS=buildPerms();
function quarter(pos,face){const p=PERMS[face],o=Array(54);for(let i=0;i<54;i++)o[i]=pos[p[i]];return o.join('');}
function movePos(pos,m){let n=m.endsWith('2')?2:m.endsWith("'")?3:1;while(n-->0)pos=quarter(pos,m[0]);return pos;}
function shallow(start,maxDepth=4){if(start===SOLVED)return '';const dfs=(pos,left,last,path)=>{if(left===0)return pos===SOLVED?path:null;for(const m of MOVES){if(m[0]===last)continue;const found=dfs(movePos(pos,m),left-1,m[0],path.concat(m));if(found)return found;}return null;};for(let d=1;d<=maxDepth;d++){const found=dfs(start,d,null,[]);if(found)return found.join(' ');}return null;}
function normalize(raw){if(typeof raw!=='string')return null;const s=raw.trim();if(!s||/^Error\s+\d+/i.test(s))return null;return s.replace(/\s+/g,' ');}

self.onmessage=e=>{
  try{
    const facelet=e.data.facelet;
    self.postMessage({type:'status',text:'Ich prüfe zuerst sehr kurze Lösungen …'});
    const short=shallow(facelet,4);if(short!==null){self.postMessage({type:'done',solution:short,complete:true,shallowOptimal:true,engine:'exact'});return;}
    self.postMessage({type:'status',text:'Ich suche eine kurze Lösung …'});
    importScripts(SOLVER_CDN);
    if(!self.min2phase)throw new Error('solver-missing');
    min2phase.initFull();
    const search=new min2phase.Search();
    let raw=search.solution(facelet,21,100000000,10000,0);
    if(/^Error\s+\d+/i.test(String(raw||''))){self.postMessage({type:'invalid'});return;}
    let best=normalize(raw);if(!best)throw new Error('no-solution');
    let bestCount=best.split(/\s+/).length;self.postMessage({type:'candidate',count:bestCount});
    const start=performance.now();let rounds=0;
    while(rounds<8&&performance.now()-start<4500&&bestCount>5){rounds++;const c=normalize(search.next(5000,0,0));if(c){const n=c.split(/\s+/).length;if(n<bestCount){best=c;bestCount=n;self.postMessage({type:'candidate',count:bestCount});}}}
    self.postMessage({type:'done',solution:best,complete:true,shallowOptimal:false,engine:'min2phase'});
  }catch(err){self.postMessage({type:'error',message:String(err?.message||err)});}
};
