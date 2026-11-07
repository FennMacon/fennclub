import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityPlan,CITY_DISTRICTS,CITY_SPECIAL_SITES,cityRoadClear,cityReserved,CITY_ATMOSPHERE,cityVisibilityDistances,CITY_LOCAL_ROADS,CITY_HORIZONTAL_ROADS,CITY_VERTICAL_ROADS} from '../world/city-layout.js';

test('all nine city districts have deterministic streets, housing and shops',()=>{
    const plan=createCityPlan();assert.deepEqual(plan,createCityPlan());
    assert.equal(plan.districts.length,9);
    for(const district of CITY_DISTRICTS) {
        const lots=plan.lots.filter(l=>l.district===district.key);
        assert.ok(lots.length>=25,district.name+' needs population');
        assert.ok(lots.some(l=>l.enterable),district.name+' needs doors');
        assert.ok(lots.some(l=>l.retail),district.name+' needs businesses');
    }
});
test('city lots clear streets, each other, existing shops, transit and the common',()=>{
    const lots=createCityPlan().lots;
    for(let i=0;i<lots.length;i++) {
        const a=lots[i];
        assert.ok(Math.abs(a.x)+a.width/2<500&&Math.abs(a.z)+a.depth/2<500,a.id+' outside map');
        assert.ok(cityRoadClear(a),a.id+' in roadway');
        if(!CITY_SPECIAL_SITES.some(s=>s.id===a.id))assert.ok(!cityReserved(a),a.id+' in reserved ground');
        for(const b of lots.slice(i+1))assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2||Math.abs(a.z-b.z)>=(a.depth+b.depth)/2,a.id+' overlaps '+b.id);
    }
});
test('local streets connect to the arterial grid and culling remains beyond opaque fog on wide screens',()=>{
    for(const road of CITY_LOCAL_ROADS) {
        const crossings=road.axis==='x'?CITY_VERTICAL_ROADS:CITY_HORIZONTAL_ROADS;
        assert.ok(crossings.filter(p=>p>road.min&&p<road.max).length>=2);
    }
    for(const aspect of [.46,1,16/9,32/9]) {
        const distances=cityVisibilityDistances(aspect,75);
        const visibleCorner=CITY_ATMOSPHERE.far*Math.hypot(1,Math.tan(75*Math.PI/360)*aspect);
        assert.ok(distances.load>visibleCorner+20&&distances.keep>distances.load);
    }
});
