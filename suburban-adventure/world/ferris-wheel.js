import * as THREE from 'three';
import { createCarnivalKit, batchCarnivalGeometry } from './carnival-builders.js';
import { FERRIS, sampleFerrisAnchor } from './ferris-layout.js';

export function createFerrisWheel(cx, cz) {
    const group = new THREE.Group(); group.name = 'FerrisWheel';
    group.position.set(cx + FERRIS.x, 0, cz + FERRIS.z);
    const { mesh, box, beam, bulb } = createCarnivalKit();
    const steel = 0xd8dbe3, red = 0xd86668, gold = 0xffd774, blue = 0x75b9e5;
    box(group, [8, 0.4, 12], [0, 0.3, 0], steel);
    // Each tower meets the fixed horizontal axle; bases spread along the wheel plane.
    for (const x of [-2.8, 2.8]) {
        for (const z of [-5, 5]) beam(group, [x, 0.5, z], [x, FERRIS.pivotHeight, 0], 0.16, red);
        beam(group, [x, 4, -3.8], [x, 4, 3.8], 0.08, steel);
    }
    beam(group, [-3.1, FERRIS.pivotHeight, 0], [3.1, FERRIS.pivotHeight, 0], 0.25, red);
    const wheel = new THREE.Group(); wheel.name = 'FerrisRotor'; wheel.position.y = FERRIS.pivotHeight; group.add(wheel);
    for (const x of [-FERRIS.rimOffset, FERRIS.rimOffset]) {
        const rim = mesh(wheel, new THREE.TorusGeometry(FERRIS.radius, 0.09, 6, 64), [x, 0, 0], red);
        rim.rotation.y = Math.PI / 2;
        const hub = mesh(wheel, new THREE.TorusGeometry(1.1, 0.06, 5, 24), [x, 0, 0], gold);
        hub.rotation.y = Math.PI / 2;
        for (let i = 0; i < FERRIS.count; i++) {
            const anchor = sampleFerrisAnchor(i);
            // Two braces per station, spanning only half a station at the hub.
            for (const side of [-1, 1]) {
                const a = anchor.angle + side * Math.PI / FERRIS.count;
                beam(wheel, [x, Math.cos(a) * 1.1, Math.sin(a) * 1.1], [x, anchor.y, anchor.z], 0.045, gold);
            }
            bulb(wheel, [x, anchor.y, anchor.z], i);
        }
    }
    const gondolas = [];
    for (let i = 0; i < FERRIS.count; i++) {
        const anchor = sampleFerrisAnchor(i);
        beam(wheel, [-FERRIS.rimOffset, anchor.y, anchor.z], [FERRIS.rimOffset, anchor.y, anchor.z], 0.065, steel);
        const pivot = new THREE.Group(); pivot.name = 'FerrisGondola' + (i + 1);
        pivot.position.set(0, anchor.y, anchor.z); wheel.add(pivot); gondolas.push(pivot);
        const cart = new THREE.Group(); cart.name = 'FerrisBucket' + (i + 1);
        cart.position.y = -FERRIS.hangerDrop; pivot.add(cart);
        box(cart, [2.1, 0.6, 1.2], [0, 0, 0], blue);
        box(cart, [2.15, 0.12, 1.25], [0, -0.27, 0], 0x678dc9);
        box(cart, [1.8, 0.1, 0.42], [0, 0.2, -0.2], gold);
        box(cart, [1.8, 0.35, 0.08], [0, 0.35, -0.43], blue);
        for (const x of [-0.95, 0.95]) {
            // Yoke joins the rim pin at the origin and the canopy below it.
            beam(pivot, [0, 0, 0], [x, -0.35, 0], 0.035, gold);
            beam(pivot, [x, -0.35, 0], [x, -0.7, 0], 0.035, gold);
            for (const z of [-0.53, 0.53]) beam(cart, [x, 0.3, z], [x, 0.85, z], 0.03, steel);
            beam(cart, [x, 0.4, -0.55], [x, 0.4, 0.55], 0.035, gold);
        }
        box(cart, [2.2, 0.12, 1.35], [0, 0.88, 0], blue);
        for (const z of [-0.55, 0.55]) beam(cart, [-0.95, 0.4, z], [0.95, 0.4, z], 0.035, gold);
    }
    batchCarnivalGeometry(group);
    let angle = 0;
    const update = delta => {
        angle += Math.max(0, Math.min(delta, 0.1)) * FERRIS.speed;
        wheel.rotation.x = angle;
        gondolas.forEach(pivot => { pivot.rotation.x = -angle; });
    };
    update(0);
    return { group, update };
}
