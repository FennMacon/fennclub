import test from 'node:test';
import assert from 'node:assert/strict';
import { getSuburbanAtmosphere } from '../world/suburban-atmosphere.js';
import { getBlendedZoneFog } from '../world/fog-blending.js';
import { UNIFIED_MAP_ZONES, FOG_PRESETS, SCENE_CONFIGS } from '../scenes.js';

test('sun, moon, stars and daylight agree at midnight, sunrise, noon and sunset', () => {
    const midnight = getSuburbanAtmosphere(0), dawn = getSuburbanAtmosphere(.25);
    const noon = getSuburbanAtmosphere(.5), dusk = getSuburbanAtmosphere(.75);
    assert.equal(midnight.moon.y, 1); assert.equal(midnight.sunOpacity, 0); assert.equal(midnight.starOpacity, 1);
    assert.equal(noon.sun.y, 1); assert.equal(noon.moonOpacity, 0); assert.equal(noon.starOpacity, 0);
    assert.equal(dawn.sun.x, 1); assert.equal(dawn.sunOpacity, 0);
    assert.equal(dusk.sun.x, -1); assert.ok(dusk.sunOpacity < 1e-10);
    assert.ok(noon.exposure > midnight.exposure && midnight.exposure >= .8, 'Night remains readable');
});

test('orbits and fades stay continuous through the clock wrap and horizon crossings', () => {
    for (const phase of [0, .25, .5, .75, 1]) {
        const before = getSuburbanAtmosphere(phase - 1e-7), after = getSuburbanAtmosphere(phase + 1e-7);
        assert.ok(Math.hypot(before.sun.x - after.sun.x, before.sun.y - after.sun.y) < .00001);
        for (const key of ['sunOpacity', 'moonOpacity', 'starOpacity', 'exposure', 'near', 'far']) assert.ok(Math.abs(before[key] - after[key]) < .0001, key);
        for (const key of ['fogColor', 'zenithColor']) for (const shift of [0, 8, 16]) assert.ok(Math.abs(((before[key] >> shift) & 255) - ((after[key] >> shift) & 255)) <= 1);
    }
});

test('all nine suburban districts retain local clarity and hide distance in haze all day', () => {
    const config = (key, preset) => SCENE_CONFIGS[key]?.FOG ?? FOG_PRESETS[preset];
    for (const zone of UNIFIED_MAP_ZONES) for (const phase of [0, .25, .5, .75]) {
        const fog = getBlendedZoneFog(UNIFIED_MAP_ZONES, zone.x, zone.z, config);
        const state = getSuburbanAtmosphere(phase, fog);
        assert.ok(state.near >= 10 && state.near <= 25);
        assert.ok(state.far >= 85 && state.far <= 115 && state.far > state.near + 50);
    }
    for (const z of [-166.5, 166.5]) {
        const left = getSuburbanAtmosphere(.5, getBlendedZoneFog(UNIFIED_MAP_ZONES, 166.5 - .001, z, config));
        const right = getSuburbanAtmosphere(.5, getBlendedZoneFog(UNIFIED_MAP_ZONES, 166.5 + .001, z, config));
        assert.ok(Math.abs(left.far - right.far) < .001);
    }
});
