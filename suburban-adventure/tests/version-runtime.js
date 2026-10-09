// Pin the entire module graph to one content revision so cached files cannot mix releases.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
async function collect(dir='.') {
    const files=[];
    for(const entry of await readdir(dir,{withFileTypes:true})) {
        if(entry.name.startsWith('.')||['node_modules','tests'].includes(entry.name))continue;
        const path=join(dir,entry.name);
        if(entry.isDirectory())files.push(...await collect(path));
        else if(path.endsWith('.js'))files.push(path);
    }
    return files.sort();
}
const files=await collect(),hash=createHash('sha256');
for(const file of files){hash.update(file);hash.update(await readFile(file));}
const revision=hash.digest('hex').slice(0,12);
const imports={three:'https://unpkg.com/three@0.160.0/build/three.module.js','three/addons/':'https://unpkg.com/three@0.160.0/examples/jsm/'};
for(const file of files)imports['./'+file]='./'+file+'?v='+revision;
const path='index.html',source=await readFile(path,'utf8');
const updated=source.replace(/<script type="importmap">[\s\S]*?<\/script>/,`<script type="importmap">\n${JSON.stringify({imports},null,2)}\n    </script>`)
    .replace(/src="bootstrap\.js(?:\?v=[^"]*)?"/,`src="bootstrap.js?v=${revision}"`);
if(updated!==source)await writeFile(path,updated);
console.log(`Runtime revision ${revision}: ${files.length} modules pinned together.`);
