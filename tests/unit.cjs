'use strict';
const assert=require('node:assert/strict');
const Core=require('../tetra-core.js');

const expectedInputToSolver=[
  [0,1,3,4,6,7,2,5,8],
  [0,1,3,4,6,8,2,5,7],
  [0,1,3,5,6,8,2,4,7],
  [0,3,1,8,6,5,2,7,4]
];
assert.deepEqual(Core.INPUT_TO_SOLVER,expectedInputToSolver,'visible triangles must map to the physical face orientation');
for(let face=0;face<4;face++)for(let input=0;input<9;input++){
  const solver=Core.inputIndexToSolver(face,input);
  assert.equal(Core.solverIndexToInput(face,solver),input,`input mapping is not reversible for face ${face}, triangle ${input}`);
}

for(const m of Core.MOVES){
  const back=Core.applyMove(Core.applyMove(Core.SOLVED,m),Core.inverse(m));
  assert.equal(back,Core.SOLVED,`inverse failed for ${m}`);
  let s=Core.SOLVED;const q=m.endsWith("'")?m[0]:m;for(let i=0;i<3;i++)s=Core.applyMove(s,q);
  assert.equal(s,Core.SOLVED,`three 120-degree turns failed for ${m}`);
}

const known=Core.solveFull(Core.KNOWN,11);assert.ok(known);assert.equal(known.length,4);assert.ok(Core.verifySolution(Core.KNOWN,known));
const tipState=Core.applyMove(Core.SOLVED,'u');const tipSolution=Core.solveFull(tipState,11);assert.ok(tipSolution);assert.equal(tipSolution.length,1);assert.ok(Core.verifySolution(tipState,tipSolution));
const sequence=['U','R',"L'",'B',"U'",'L',"R'",'B','u',"r'",'l','b'];let full=Core.SOLVED;for(const m of sequence)full=Core.applyMove(full,m);const fullSolution=Core.solveFull(full,11);assert.ok(fullSolution);assert.ok(fullSolution.some(m=>m[0]===m[0].toLowerCase()));assert.ok(Core.verifySolution(full,fullSolution));
assert.equal(Core.solveFull(Core.INVALID,11),null);

const knownSequences=[
  ['U'],["U'"],['R','L'],['B',"R'",'U'],['L','B',"U'",'R'],
  ['u','r','l','b'],['U','u','R',"r'",'L','l','B',"b'"],
  ['U','R','L','B',"U'","R'","L'","B'"]
];
for(const seq of knownSequences){let s=Core.SOLVED;for(const m of seq)s=Core.applyMove(s,m);const sol=Core.solveFull(s,11);assert.ok(sol,`no solution for known sequence ${seq.join(' ')}`);assert.ok(Core.verifySolution(s,sol),`verification failed for known sequence ${seq.join(' ')}`);}

let seed=0x5a17c0de;
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
let randomCases=0;
for(let c=0;c<20;c++){
  const len=3+Math.floor(rnd()*5),seq=[];let last=null;
  for(let i=0;i<len;i++){
    let options=Core.MOVES.filter(m=>m[0].toUpperCase()!==last);const m=options[Math.floor(rnd()*options.length)];seq.push(m);last=m[0].toUpperCase();
  }
  let s=Core.SOLVED;for(const m of seq)s=Core.applyMove(s,m);
  const sol=Core.solveFull(s,11);assert.ok(sol,`random case ${c} unsolved: ${seq.join(' ')}`);assert.ok(Core.verifySolution(s,sol),`random case ${c} verification failed: ${seq.join(' ')}`);randomCases++;
}

console.log(`Tetraeder unit regression passed: inputMapping=36, known=${known.length}, full=${fullSolution.length}, tip=${tipSolution.length}, deterministicRandom=${randomCases}`);
