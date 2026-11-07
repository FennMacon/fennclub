import test from 'node:test';
import assert from 'node:assert/strict';
import { updateTraffic } from '../world/traffic.js';
import { disposeObjectResources } from '../world/resource-lifecycle.js';
import { getBlendedZoneFog } from '../world/fog-blending.js';
import { updateDetailVisibility } from '../world/detail-visibility.js';
import { cityVisibilityDistances } from '../world/city-layout.js';

const fakeCar = (roadType, direction, x, z, onDispose = () => {}) => ({
    userData: { roadType, direction },
    position: { x, z, set(x, y, z) { this.x = x; this.z = z; } },
    traverse(visit) { visit({ geometry: { dispose: onDispose } }); }
});
const fakeGroup = zoneKey => ({
    children: [], parent: { userData: { zoneKey } },
    add(car) { this.children.push(car); car.parent = this; },
    remove(car) { this.children.splice(this.children.indexOf(car), 1); car.parent = null; }
});

test('replacement traffic uses right-hand lane centers in both axes and directions',()=>{
    const originalRandom=Math.random;
    try {
        for(const reverse of [false,true]) {
            Math.random=()=>reverse ? .75 : .25;
            const horizontal=fakeGroup('PLAZA'),vertical=fakeGroup();
            const state={cars:[],mapType:'suburban',streetElementsGroup:horizontal,connectorVehiclesGroup:vertical,lastSpawnedLeft:reverse};
            updateTraffic(state,(x,color,direction,options)=>fakeCar(options?.vertical?'vertical':'horizontal',direction,x,0),()=>0,1,30);
            const car=state.cars.find(car=>car.userData.roadType==='horizontal');
            assert.equal(car.position.z,reverse?3:-3,'Westbound cars are north of the divider; eastbound cars are south');
            const connector=state.cars.find(car=>car.userData.roadType==='vertical');
            assert.equal(connector.position.x-connector.userData.connectorX,reverse?3:-3,'Southbound cars are west of the divider; northbound cars are east');
        }
    } finally { Math.random=originalRandom; }
});

test('traffic retires cars crossing either end of horizontal and vertical streets', () => {
    for (const [axis, direction, edge] of [['horizontal', 'left', 500], ['horizontal', 'right', -165.05], ['vertical', 'left', -500], ['vertical', 'right', 500]]) {
        let disposed = 0;
        const car = fakeCar(axis, direction, axis === 'horizontal' ? edge : 170, axis === 'vertical' ? edge : 2, () => disposed++);
        const group = fakeGroup('PLAZA'); group.add(car);
        const state = { cars: [car], mapType: 'suburban' };
        updateTraffic(state, () => assert.fail('No spawn expected'), () => 0);
        assert.equal(state.cars.length, 0, axis + ' ' + direction + ' remained counted');
        assert.equal(group.children.length, 0);
        assert.equal(disposed, 1);
    }
});

test('retired connector traffic frees capacity for replacement cars', () => {
    const group = fakeGroup();
    const cars = Array.from({ length: 12 }, () => fakeCar('vertical', 'right', 170, 500));
    cars.forEach(car => group.add(car));
    let spawned = 0;
    const state = { cars, connectorVehiclesGroup: group, mapType: 'suburban' };
    updateTraffic(state, (x, color, direction) => { spawned++; return fakeCar('vertical', direction, x, 0); }, () => 0, 1, 30);
    assert.equal(spawned, 1);
    assert.equal(state.cars.length, 1);
    assert.equal(group.children.length, 1);
    assert.ok(Math.abs(state.cars[0].position.z) === 500);
});

test('city traffic counts existing city cars toward its spawn cap', () => {
    const group = fakeGroup('CITY_PLAZA');
    const cars = Array.from({ length: 6 }, (_, i) => fakeCar('horizontal', 'left', i * 20, 2));
    cars.forEach(car => { car.userData.zoneKey = 'CITY_PLAZA'; group.add(car); });
    updateTraffic({ cars, streetElementsGroup: group, mapType: 'city' }, () => assert.fail('City already has six cars'), () => 0, 1, 30);
    assert.equal(cars.length, 6);
});

test('retirement disposes sibling-shared geometry, materials and textures only once', () => {
    let geometries = 0, materials = 0, textures = 0;
    const texture = { isTexture: true, dispose() { textures++; } };
    const geometry = { dispose() { geometries++; } };
    const material = { map: texture, uniforms: { tDiffuse: { value: texture } }, dispose() { materials++; } };
    disposeObjectResources({ traverse(visit) { for (let i = 0; i < 4; i++) visit({ geometry, material: [material, material] }); } });
    assert.deepEqual({ geometries, materials, textures }, { geometries: 1, materials: 1, textures: 1 });
});

test('fog preserves district centers and crosses boundaries continuously', () => {
    const zones = [{ key: 'a', x: 0, z: 0 }, { key: 'b', x: 333, z: 0 }];
    const configs = { a: { color: 0, near: 20, far: 100 }, b: { color: 0xffffff, near: 40, far: 200 } };
    const at = x => getBlendedZoneFog(zones, x, 0, key => configs[key]);
    assert.deepEqual(at(0), configs.a);
    assert.deepEqual(at(333), configs.b);
    assert.deepEqual(at(166.5), { color: 0x808080, near: 30, far: 150 });
    assert.ok(Math.abs(at(166.49).far - at(166.51).far) < .1, 'Fog snaps at the zone boundary');
    assert.ok(Math.abs(at(89.99).far - at(90.01).far) < .1, 'Fog snaps at the old center-radius cutoff');
});

test('fog also blends continuously where four districts meet', () => {
    const zones = [{ key: 'a', x: 0, z: 0 }, { key: 'b', x: 333, z: 0 }, { key: 'c', x: 0, z: 333 }, { key: 'd', x: 333, z: 333 }];
    const configs = { a: { color: 0xff0000, near: 10, far: 100 }, b: { color: 0x00ff00, near: 20, far: 200 }, c: { color: 0x0000ff, near: 30, far: 300 }, d: { color: 0xffffff, near: 40, far: 400 } };
    const at = (x, z) => getBlendedZoneFog(zones, x, z, key => configs[key]);
    assert.deepEqual(at(166.5, 166.5), { color: 0x808080, near: 25, far: 250 });
    assert.ok(Math.abs(at(166.49, 166.51).far - at(166.51, 166.49).far) < .1, 'Second-nearest zone switch snaps');
});

test('city detail culling supports teleports, hysteresis and wide-screen fog corners', () => {
    const detail = { position: { x: 400, z: 0 }, userData: {}, visible: true };
    const camera = { position: { x: 0, z: 0 } };
    const distances = cityVisibilityDistances(1, 75);
    updateDetailVisibility([detail], camera, distances);
    assert.equal(detail.visible, false, 'Fog-hidden sign stayed submitted');
    camera.position.x = 350;
    updateDetailVisibility([detail], camera, distances);
    assert.equal(detail.visible, true, 'Sign missing immediately after teleport');
    camera.position.x = 400 - (distances.load + distances.keep) / 2;
    updateDetailVisibility([detail], camera, distances);
    assert.equal(detail.visible, true, 'Sign should remain within keep distance');
    detail.visible = false;
    updateDetailVisibility([detail], camera, distances);
    assert.equal(detail.visible, false, 'Sign should wait for load distance');
    camera.position.x = 0;
    const wide = cityVisibilityDistances(32 / 9, 75);
    detail.position.x = wide.load - 10;
    updateDetailVisibility([detail], camera, wide);
    assert.equal(detail.visible, true, 'Wide-screen fog corner lost its detail');
});

test('a stalled music request aborts, shares in-flight work and can retry successfully', async () => {
    const previousFetch = globalThis.fetch;
    let requests = 0, requestSignal;
    globalThis.fetch = (url, { signal }) => {
        requests++; requestSignal = signal;
        return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
    };
    try {
        const music = await import('../music-library.js?timeout-regression');
        const first = music.loadMusicCatalog({ timeoutMs: 10 });
        const second = music.loadMusicCatalog({ timeoutMs: 10 });
        const results = await Promise.allSettled([first, second]);
        assert.equal(requests, 1);
        assert.ok(requestSignal.aborted);
        assert.ok(results.every(result => result.status === 'rejected' && result.reason.name === 'AbortError'));
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ recordings: [{ id: 'one', file: 'one.mp3', rewards: ['First Song'] }] }) });
        await music.loadMusicCatalog({ timeoutMs: 10 });
        assert.equal(music.getRecording('First Song').file, 'one.mp3');
    } finally { globalThis.fetch = previousFetch; }
});
