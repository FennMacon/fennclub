import { FERRIS, sampleFerrisAnchor } from '../world/ferris-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MIDWAY_ALLEYS, MIDWAY_STALLS, TEACUPS, sampleTeacupMotion } from '../world/carnival-midway-layout.js';
import { CARNIVAL_ADDITIONS, sampleRideMotion } from '../world/carnival-motion.js';
import { ZONE_W_CARNIVAL, CARNIVAL_ROAD_EXCLUSION } from '../world/config.js';
import { readFile } from 'node:fs/promises';
import { parseFlavorFile } from '../content-loader.js';
test('ride footprints clear the road, trees, legacy rides and each other', () => {
    const legacy=[{x:-25,z:-40,radius:22},{x:55,z:45,radius:10},TEACUPS];
    const stalls = MIDWAY_STALLS.map(stall => [stall.x, stall.z]);
    for(const [i,ride] of CARNIVAL_ADDITIONS.entries()) {
        assert.ok(ride.z+ride.radius<CARNIVAL_ROAD_EXCLUSION.zMin || ride.z-ride.radius>CARNIVAL_ROAD_EXCLUSION.zMax, ride.name+' road');
        assert.ok(Math.hypot(ride.x,ride.z)+ride.radius<ZONE_W_CARNIVAL.radius,ride.name+' trees');
        for(const other of [...legacy,...CARNIVAL_ADDITIONS.slice(i+1)])assert.ok(Math.hypot(ride.x-other.x,ride.z-other.z)>ride.radius+other.radius,ride.name+' overlap');
        for(const [x,z] of stalls)assert.ok(Math.hypot(ride.x-x,ride.z-z)>ride.radius+4,ride.name+' stall');
    }
});
test('all five ride entrances have authored discovery text',async()=>{
    const content=parseFlavorFile(await readFile(new URL('../content/flavor/carnival.txt',import.meta.url),'utf8'));
    for(const ride of CARNIVAL_ADDITIONS)assert.ok(content[ride.contentId]?.flavorText,ride.contentId);
});
test('motion is bounded, with opposing Freestyle drives and specified carousel speed',()=>{
    for(let time=0;time<300;time+=.13)for(const ride of CARNIVAL_ADDITIONS){const state=sampleRideMotion(ride.kind,time);assert.ok(Object.values(state).every(Number.isFinite));if(ride.kind==='freestyle')assert.ok(state.tilt<=50*Math.PI/180+1e-9);}
    const free=sampleRideMotion('freestyle',60);assert.ok(Math.abs(free.turret-20*Math.PI)<1e-9);assert.ok(Math.abs(free.rim+44*Math.PI)<1e-9);
    assert.ok(Math.abs(sampleRideMotion('carousel',60).spin-13*Math.PI)<1e-9);
});

test('midway alleys preserve walking widths and keep booth footprints clear', () => {
    const rides = [...CARNIVAL_ADDITIONS, { x: -25, z: -40, radius: 22 }, { x: 55, z: 45, radius: 10 }, TEACUPS];
    assert.equal(MIDWAY_STALLS.filter(s => s.alley === 'food').length, 5);
    assert.equal(MIDWAY_STALLS.filter(s => s.alley === 'games').length, 6);
    for (const [i, stall] of MIDWAY_STALLS.entries()) {
        assert.ok(stall.z + 2.6 < 0 || stall.z - 2.6 > 22, stall.label + ' road');
        for (const dx of [-2.1, 2.1]) for (const dz of [-2.6, 2.6])
            assert.ok(Math.hypot(stall.x + dx, stall.z + dz) < 105, stall.label + ' trees');
        for (const ride of rides) assert.ok(Math.hypot(stall.x - ride.x, stall.z - ride.z) > ride.radius + 4, stall.label + ' ride');
        for (const other of MIDWAY_STALLS.slice(i + 1)) assert.ok(Math.hypot(stall.x - other.x, stall.z - other.z) > 8, stall.label + ' booth');
        const alley = MIDWAY_ALLEYS.find(a => a.kind === stall.alley);
        const frontX = stall.x + Math.sin(stall.rotation) * 2.1;
        assert.ok(Math.abs(frontX - alley.x) >= alley.width / 2, stall.label + ' aisle');
    }
});
test('new discoveries have text and cup motion is independent of frame sampling', async () => {
    const content = parseFlavorFile(await readFile(new URL('../content/flavor/carnival.txt', import.meta.url), 'utf8'));
    for (const stall of MIDWAY_STALLS) assert.ok(content[stall.contentId]?.flavorText);
    assert.ok(content.CARNIVAL_TEACUPS?.flavorText);
    assert.notEqual(sampleTeacupMotion(3, 0).cup, sampleTeacupMotion(3, 1).cup);
    for (const fps of [30, 60, 120]) {
        let time = 0; for (let i = 0; i < fps * 10; i++) time += 1 / fps;
        assert.ok(Math.abs(sampleTeacupMotion(time, 2).cup - sampleTeacupMotion(10, 2).cup) < 1e-9);
    }
});

test('Ferris hinges have uniform rim spacing and buckets clear the platform', () => {
    const spacings = [];
    for (let i = 0; i < FERRIS.count; i++) {
        const a = sampleFerrisAnchor(i), b = sampleFerrisAnchor((i + 1) % FERRIS.count);
        assert.ok(Math.abs(Math.hypot(a.y, a.z) - FERRIS.radius) < 1e-9);
        spacings.push(Math.hypot(a.y - b.y, a.z - b.z));
    }
    assert.ok(Math.max(...spacings) - Math.min(...spacings) < 1e-9);
    assert.ok(FERRIS.pivotHeight - FERRIS.radius - FERRIS.hangerDrop - 0.33 > 0.5);
});
test('corrected ride directions and entrances face their intended way', () => {
    assert.equal(sampleRideMotion('yoyo', 1).spin < 0, true);
    assert.equal(sampleRideMotion('carousel', 1).spin > 0, true);
    for (const kind of ['fury', 'carousel']) assert.equal(CARNIVAL_ADDITIONS.find(ride => ride.kind === kind).rotation, Math.PI);
});
