import test from 'node:test';
import assert from 'node:assert/strict';
import {selectInteractionTarget} from '../interaction-targets.js';
import {resolveExteriorMovement,safeExteriorPosition,findSafeInteriorArrival,safeInteriorPosition} from '../world/traversal.js';

test('one interaction target prefers the view and obeys the advertised range',()=>{
    const origin={x:0,z:0},forward={x:0,z:-1};
    const front={type:'portal',position:{x:0,z:-5.5},radius:6};
    const behind={type:'portal',position:{x:0,z:2},radius:6};
    assert.equal(selectInteractionTarget(origin,forward,[behind,front]).position.z,-5.5);
    assert.equal(selectInteractionTarget(origin,forward,[{...front,position:{x:0,z:-6}}]),null);
    assert.ok(selectInteractionTarget(origin,forward,[{...behind,position:{x:0,z:1}}]),'Immediate threshold remains usable');
});

test('a stale interior checkpoint recovers to a clear entry instead of trapping the player in a wall',()=>{
    const bounds={minX:-24,maxX:24,minZ:-24,maxZ:24};
    const obstacles=[{x:8,z:0,width:1,depth:40}];
    const safe=findSafeInteriorArrival({x:8,z:0},bounds,obstacles);
    assert.ok(safeInteriorPosition(safe,bounds,obstacles));
    assert.deepEqual(findSafeInteriorArrival({x:2,z:10},bounds,obstacles),{x:2,y:2,z:10});
});

test('exterior movement cannot tunnel through facades and slides along walls',()=>{
    const rects=[{minX:2,maxX:5,minZ:-2,maxZ:2}];
    const end=resolveExteriorMovement({x:0,z:0},{x:20,z:0},rects);
    assert.ok(end.x<1.56&&end.x>1.2);
    const slide=resolveExteriorMovement({x:1.5,z:0},{x:4,z:4},rects);
    assert.ok(slide.z>3.9);
    assert.equal(resolveExteriorMovement({x:490,z:0},{x:900,z:0}).x,493);
    assert.equal(safeExteriorPosition({x:3,z:0},rects),false);
    assert.ok(resolveExteriorMovement({x:3,z:0},{x:6,z:0},rects).x>5.9,'Old saves can leave a footprint');
});
