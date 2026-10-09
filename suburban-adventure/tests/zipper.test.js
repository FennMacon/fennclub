import test from 'node:test';
import assert from 'node:assert/strict';
import { ZIPPER, trackLength, sampleCable, sampleAnchor, createZipperMotion } from '../world/zipper-motion.js';
test('cable track has straight sides, rounded ends, continuous wrap', () => {
    const a = sampleCable(1), b = sampleCable(4);
    assert.equal(a.x, ZIPPER.radius); assert.equal(b.x, a.x); assert.equal(b.y - a.y, 3);
    assert.deepEqual(sampleCable(0), sampleCable(trackLength));
    for (let i = 0; i < 1000; i++) {
        const p = sampleCable(i * trackLength / 1000), q = sampleCable((i + 1) * trackLength / 1000);
        assert.ok(Math.hypot(p.x - q.x, p.y - q.y) <= trackLength / 1000 + 1e-8);
    }
});
test('boom turns in-plane at specified speed and cable completes its circuit', () => {
    assert.ok(Math.abs(sampleAnchor(8, 0).boomAngle - 2 * Math.PI) < 1e-8);
    const a = sampleAnchor(0, 0).local, b = sampleAnchor(15, 0).local;
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-8);
});
test('single-hinge capsule simulation stays finite and matches frame rates', () => {
    const results = [30, 60, 120].map(fps => {
        const motion = createZipperMotion();
        for (let i = 0; i < fps * 30; i++) motion.update(1 / fps);
        assert.equal(motion.cars.length, 12);
        assert.ok(motion.cars.every(car => Number.isFinite(car.angle) && Number.isFinite(car.velocity)));
        return motion.cars.map(car => car.angle);
    });
    results[0].forEach((value, index) => { assert.ok(Math.abs(value - results[1][index]) < 1e-7); assert.ok(Math.abs(value - results[2][index]) < 1e-7); });
});
