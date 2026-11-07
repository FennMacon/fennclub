import test from 'node:test';
import assert from 'node:assert/strict';
import {createCitySurfacePlan,citySurfaceAt,cityMarkingSegments} from '../world/city-road-layout.js';
import {storeSignStyle} from '../world/city-layout.js';

test('city asphalt and sidewalks partition the network with no overlapping rectangles',()=>{
    const {rectangles,roads}=createCitySurfacePlan();
    for(let i=0;i<rectangles.length;i++) {
        const a=rectangles[i];assert.equal(citySurfaceAt((a.left+a.right)/2,(a.front+a.back)/2,roads),a.type);
        for(const b of rectangles.slice(i+1))assert.ok(a.right<=b.left||b.right<=a.left||a.back<=b.front||b.back<=a.front,'Stacked pavement');
    }
    for(const h of roads.filter(r=>r.axis==='x'))for(const v of roads.filter(r=>r.axis==='z')) {
        const surfaces=rectangles.filter(r=>v.coordinate>r.left&&v.coordinate<r.right&&h.coordinate>r.front&&h.coordinate<r.back);
        assert.equal(surfaces.length,1,'Each junction has exactly one surface');assert.equal(surfaces[0].type,'asphalt');
    }
});
test('lane markings terminate before every crossing instead of being covered by patches',()=>{
    const {roads}=createCitySurfacePlan();
    for(const road of roads)for(const [lo,hi] of cityMarkingSegments(road,roads))for(const crossing of roads.filter(r=>r.axis!==road.axis))
        assert.ok(hi<=crossing.coordinate-crossing.width/2||lo>=crossing.coordinate+crossing.width/2);
});
test('store categories receive distinct abstract identities',()=>{
    const names=['Static Records','Seoul Kitchen','Corner Cafe','Allston Books','Pixel Arcade','Vintage Threads','Bike Repair','Tattoo Parlor','Corner Market'];
    assert.equal(new Set(names.map(storeSignStyle)).size,names.length);
    assert.equal(storeSignStyle('Banh Mi Corner'),'steam');assert.equal(storeSignStyle('Secondhand Sound'),'orbit');
});
