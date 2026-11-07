import test from 'node:test';
import assert from 'node:assert/strict';
import { landmarkMix, updateLandmarkAudio, getLandmarkAudioStatus, beginLandmarkAudio } from '../landmark-audio.js';

test('landmark cues fade smoothly to silence at their bounded radius', () => {
    const source = { x: 0, z: 0 };
    assert.deepEqual(landmarkMix(source, source), { gain: 1, pan: 0 });
    assert.equal(landmarkMix({ x: 50, z: 0 }, source, 0, 100).gain, .25);
    assert.equal(landmarkMix({ x: 100, z: 0 }, source, 0, 100).gain, 0);
    assert.equal(landmarkMix({ x: 1000, z: 0 }, source, 0, 100).gain, 0);
    assert.deepEqual(landmarkMix({ x: NaN, z: 0 }, source), { gain: 0, pan: 0 });
});

test('directional cues follow the camera orientation and remain centered ahead', () => {
    const listener = { x: 0, z: 0 };
    assert.equal(landmarkMix(listener, { x: 10, z: 0 }).pan, 1);
    assert.equal(landmarkMix(listener, { x: -10, z: 0 }).pan, -1);
    assert.equal(landmarkMix(listener, { x: 0, z: -10 }).pan, 0);
    assert.ok(Math.abs(landmarkMix(listener, { x: 10, z: 0 }, Math.PI).pan + 1) < 1e-10);
    assert.ok(Math.abs(landmarkMix(listener, { x: 0, z: -10 }, Math.PI / 2).pan - 1) < 1e-10);
});

test('importing and updating audio cannot initialize sound without a browser gesture', async () => {
    updateLandmarkAudio({ position: { x: 0, z: 0 }, rotation: { y: 0 } }, 'suburban');
    assert.deepEqual(getLandmarkAudioStatus(), { started: false, sources: 0, muted: true });
    assert.equal(await beginLandmarkAudio(), false);
});
