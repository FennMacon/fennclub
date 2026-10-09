import test from 'node:test';
import assert from 'node:assert/strict';
import { getMansionWalls, roomCenter, resolveInteriorMovement } from '../buildings/mansion-layout.js';
import { getMansionPathSamples, MANSION_CONFIG } from '../world/config.js';

test('every mansion chamber is reachable through real doorways with player clearance', () => {
    const walls=getMansionWalls(), seen=new Set(['0,20']), queue=[{x:0,z:20}];
    for(let i=0;i<queue.length;i++) for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const p=queue[i],target={x:p.x+dx,z:p.z+dz},key=`${target.x},${target.z}`;
        if(seen.has(key)||Math.abs(target.x)>23||Math.abs(target.z)>23)continue;
        const result=resolveInteriorMovement(p,target,walls);
        if(Math.hypot(result.x-target.x,result.z-target.z)>1e-6)continue;
        seen.add(key);queue.push(target);
    }
    for(let id=0;id<9;id++){const c=roomCenter(id);assert.ok(seen.has(`${c.x},${c.z}`),`Room ${id} inaccessible`);}
});
test('sprinting cannot tunnel through mansion walls but open doorways remain traversable', () => {
    const walls=getMansionWalls();
    const blocked=resolveInteriorMovement({x:0,z:0},{x:20,z:0},walls);
    assert.ok(blocked.x<8);
    const passage=resolveInteriorMovement({x:0,z:19},{x:0,z:23},walls);
    assert.ok(Math.abs(passage.z-23)<1e-6);
});
test('mansion trail stays inside the northeast woods and reaches the sheltered courtyard', () => {
    const path=getMansionPathSamples();
    assert.ok(path.every(p=>p.x>170&&p.x<500&&p.z>=350&&p.z<500));
    assert.ok(Math.hypot(path.at(-1).x-(MANSION_CONFIG.x-8),path.at(-1).z-MANSION_CONFIG.z)<14);
    assert.ok(path.some((p,i)=>i&&p.z<path[i-1].z),'Trail doubles back');
});
