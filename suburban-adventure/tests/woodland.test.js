import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTrail, nearTrail, POND_TRAILS } from '../world/trail-layout.js';
import { FOREST_CLEARINGS, FOREST_TRAILS } from '../world/config.js';
import { SCENE_CONFIGS, UNIFIED_MAP_ZONE_OFFSETS } from '../scenes.js';

test('pond trails meet the actual road after parent offsets and reach the shore and campsite',()=>{
    const offset=UNIFIED_MAP_ZONE_OFFSETS.POND.z+SCENE_CONFIGS.POND.FRONT_SHOPS_Z;
    const road=UNIFIED_MAP_ZONE_OFFSETS.POND.z+SCENE_CONFIGS.POND.STREET_Z;
    assert.equal(POND_TRAILS.pond[0].z+offset,road);
    assert.equal(POND_TRAILS.campsite[0].z+offset,road);
    assert.ok(nearTrail(POND_TRAILS.pond.at(-1).x,POND_TRAILS.pond.at(-1).z,sampleTrail(POND_TRAILS.shore),4));
    assert.ok(Math.hypot(POND_TRAILS.campsite.at(-1).x-50,POND_TRAILS.campsite.at(-1).z+20)<8);
});
test('expanded clearings clear the road and map edges, with trails reaching every setting',()=>{
    const paths=FOREST_TRAILS.map(p=>sampleTrail(p));
    for(const c of FOREST_CLEARINGS) {
        assert.ok(Math.abs(c.z+322)>c.radius+11,`${c.id} overlaps road`);
        assert.ok(c.x-c.radius>182&&c.x+c.radius<500&&c.z-c.radius>-500&&c.z+c.radius<-166,`${c.id} outside woodland`);
        assert.ok(paths.some(p=>nearTrail(c.x,c.z,p,c.radius*.6)),`${c.id} disconnected`);
    }
    assert.ok(paths.flat().every(p=>p.x>182&&p.x<500&&p.z>-500&&p.z<-166));
});
test('smooth trail samples stay finite and retain exact endpoints',()=>{
    for(const points of [...Object.values(POND_TRAILS),...FOREST_TRAILS]) {
        const samples=sampleTrail(points);
        assert.deepEqual(samples[0],points[0]);assert.deepEqual(samples.at(-1),points.at(-1));
        assert.ok(samples.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));
        assert.ok(samples.slice(1).every((p,i)=>Math.hypot(p.x-samples[i].x,p.z-samples[i].z)<5));
    }
});
