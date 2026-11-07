import test from 'node:test';
import assert from 'node:assert/strict';
import {createSuburbanSurfacePlan,suburbanSurfaceAt,suburbanMarkingSegments} from '../world/suburban-road-layout.js';
import {SUBURBAN_HORIZONTAL_BOUNDS} from '../roads.js';

test('suburban asphalt and sidewalks never overlap, including all six junctions',()=>{
    const plan=createSuburbanSurfacePlan();
    for(let i=0;i<plan.rectangles.length;i++)for(const b of plan.rectangles.slice(i+1)){
        const a=plan.rectangles[i];assert.ok(a.right<=b.left||b.right<=a.left||a.back<=b.front||b.back<=a.front);
    }
    for(const z of [-322,11,344])for(const x of [-170,170]) {
        assert.equal(suburbanSurfaceAt(x,z),'asphalt');
        const hits=plan.rectangles.filter(r=>x>r.left&&x<r.right&&z>r.front&&z<r.back);
        assert.equal(hits.length,1);assert.equal(hits[0].type,'asphalt');
        assert.equal(suburbanSurfaceAt(x+9,z),'asphalt','Eastward road connects');
    }
});
test('west junctions remain T junctions with continuous river-side pavement edges',()=>{
    const plan=createSuburbanSurfacePlan(),west=plan.roads.find(r=>r.id==='WEST');
    assert.deepEqual(suburbanMarkingSegments(west,-5),[[-500,500]]);
    for(const z of [-322,11,344]) {
        assert.equal(suburbanSurfaceAt(-179,z),'sidewalk');assert.equal(suburbanSurfaceAt(-190,z),null);
        assert.ok(suburbanMarkingSegments(west,0).every(([lo,hi])=>!(lo<z&&hi>z)));
    }
    const horizontal=plan.roads.filter(r=>r.axis==='x');
    assert.ok(horizontal.every(r=>r.min===SUBURBAN_HORIZONTAL_BOUNDS.xMin&&r.max===SUBURBAN_HORIZONTAL_BOUNDS.xMax));
    assert.ok(plan.rectangles.every(r=>r.left>=-182),'No pavement extends toward the river');
});
test('suburban center lines and east-junction edge lines stop before crossings',()=>{
    const plan=createSuburbanSurfacePlan();
    for(const road of plan.roads)for(const [lo,hi] of suburbanMarkingSegments(road,0)) {
        const crossings=plan.roads.filter(r=>r.axis!==road.axis);
        for(const cross of crossings)assert.ok(hi<=cross.coordinate-6||lo>=cross.coordinate+6);
    }
    const east=plan.roads.find(r=>r.id==='EAST');
    for(const offset of [-5,5])for(const z of [-322,11,344])assert.ok(suburbanMarkingSegments(east,offset).every(([lo,hi])=>!(lo<z&&hi>z)));
});
