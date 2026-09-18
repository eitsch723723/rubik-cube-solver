import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'site');
const rootFiles=[
  'index.html','styles.css','features.css','tetra-visuals.css','tetra-core.js',
  'tetra-worker.js','app.js','release-fixes.js','features.js','tetra-visuals.js',
  'manifest.webmanifest','sw.js','.nojekyll'
];

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

for(const file of rootFiles){
  const source=path.join(root,file);
  if(!fs.existsSync(source))throw new Error(`Missing application file: ${file}`);
  fs.copyFileSync(source,path.join(out,file));
}

for(const directory of ['icons','cube']){
  const source=path.join(root,directory);
  if(!fs.existsSync(source))throw new Error(`Missing application directory: ${directory}`);
  fs.cpSync(source,path.join(out,directory),{recursive:true});
}

const pin='0ba83a6177d816f72af1a45c9015349da597456a';
for(const file of ['app.js','solver-worker.js','sw.js']){
  const source=fs.readFileSync(path.join(out,'cube',file),'utf8');
  if(source.includes('@master/min2phase.js')||!source.includes(pin)){
    throw new Error(`Cube ${file} is not pinned to the reviewed min2phase commit.`);
  }
}

console.log('Built self-contained GitHub Pages site from this repository.');
