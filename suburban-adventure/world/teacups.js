import * as THREE from 'three';
import { createCarnivalKit, batchCarnivalGeometry } from './carnival-builders.js';
import { TEACUPS, sampleTeacupMotion } from './carnival-midway-layout.js';

export function createTeacups(cx, cz) {
    const group = new THREE.Group(); group.name = 'TeacupRide';
    group.position.set(cx + TEACUPS.x, 0, cz + TEACUPS.z);
    const { mesh, box, beam, bulb, sign } = createCarnivalKit();
    const palette = [0xef85be, 0x83e7df, 0xffd47d, 0xa296ee, 0xec8b71, 0x89b9ff];
    mesh(group, new THREE.CylinderGeometry(6.4, 6.5, 0.35, 48), [0, 0.25, 0], 0xcbd6e0);
    // A fixed perimeter and entrance facing the central road (-Z).
    for (let i = 0; i < 32; i++) {
        const a = i * Math.PI / 16, next = (i + 1) * Math.PI / 16;
        if (Math.cos(a) < -0.94 || Math.cos(next) < -0.94) continue;
        const p = [Math.sin(a) * 6.2, 1, Math.cos(a) * 6.2];
        const q = [Math.sin(next) * 6.2, 1, Math.cos(next) * 6.2];
        beam(group, [p[0], 0.3, p[2]], p, 0.045, 0xffd47d);
        beam(group, p, q, 0.04, 0xffd47d); bulb(group, p, i);
    }
    box(group, [2.3, 0.13, 1.4], [0, 0.1, -6.6], 0xcbd6e0);
    const entrance = new THREE.Group(); entrance.name = 'Teacups entrance';
    entrance.position.set(1.8, 0, -6.3); entrance.rotation.y = Math.PI; group.add(entrance);
    beam(entrance, [0, 0, 0], [0, 2.3, 0], 0.07, 0xffd47d);
    sign(entrance, 'TWILIGHT TEACUPS', [0, 2.3, 0], 3.6, 'SIX CUPS • ENDLESS CIRCLES');
    const rotor = new THREE.Group(); rotor.name = 'TeacupTurntable'; group.add(rotor);
    mesh(rotor, new THREE.CylinderGeometry(5.8, 5.8, 0.16, 48), [0, 0.48, 0], 0x987dcb);
    for (let i = 0; i < 24; i++) {
        const a = i * Math.PI / 12;
        beam(rotor, [0, 0.58, 0], [Math.sin(a) * 5.7, 0.58, Math.cos(a) * 5.7], 0.022, 0xe7c4ff);
    }
    // Hollow curved walls with a front entry gap, a bench, center handwheel and saucer.
    const profile = [[0.55, 0], [0.72, 0.12], [0.92, 0.4], [1.04, 0.85], [1.02, 1.04],
        [0.91, 1.04], [0.91, 0.85], [0.81, 0.42], [0.62, 0.18]].map(p => new THREE.Vector2(...p));
    const bowl = new THREE.LatheGeometry(profile, 24, Math.PI / 6, Math.PI * 5 / 3);
    const cups = [];
    for (let i = 0; i < TEACUPS.count; i++) {
        const a = i * Math.PI / 3;
        const cup = new THREE.Group(); cup.name = 'Teacup' + (i + 1);
        cup.position.set(Math.sin(a) * TEACUPS.orbitRadius, 0.6, Math.cos(a) * TEACUPS.orbitRadius);
        rotor.add(cup); cups.push(cup);
        mesh(cup, new THREE.CylinderGeometry(1.25, 1.1, 0.09, 24), [0, 0, 0], palette[i]);
        mesh(cup, bowl, [0, 0.06, 0], palette[i]);
        mesh(cup, new THREE.CylinderGeometry(0.65, 0.65, 0.08, 16), [0, 0.18, 0], palette[i]);
        box(cup, [1.1, 0.12, 0.32], [0, 0.36, -0.48], 0xffe3ac);
        const handle = mesh(cup, new THREE.TorusGeometry(0.35, 0.07, 6, 16, Math.PI * 1.6), [1.04, 0.61, 0], palette[i]);
        handle.rotation.z = Math.PI * 0.2;
        beam(cup, [0, 0.2, 0], [0, 0.66, 0], 0.045, 0xffe3ac);
        const wheel = mesh(cup, new THREE.TorusGeometry(0.28, 0.035, 5, 16), [0, 0.66, 0], 0xffe3ac);
        wheel.rotation.x = Math.PI / 2;
        for (let j = 0; j < 4; j++) {
            const theta = j * Math.PI / 2;
            beam(cup, [0, 0.66, 0], [Math.sin(theta) * 0.28, 0.66, Math.cos(theta) * 0.28], 0.02, 0xffe3ac);
        }
    }
    // Center teapot: rounded belly, lid, bent spout and loop handle.
    const pot = mesh(rotor, new THREE.SphereGeometry(0.85, 16, 10), [0, 1.25, 0], 0xffd47d);
    pot.scale.y = 0.85;
    mesh(rotor, new THREE.ConeGeometry(0.7, 0.25, 16), [0, 1.99, 0], 0xef85be);
    mesh(rotor, new THREE.SphereGeometry(0.12, 8, 6), [0, 2.18, 0], 0xffd47d);
    beam(rotor, [0.65, 1.3, 0], [1.02, 1.65, 0], 0.18, 0xffd47d);
    beam(rotor, [1.02, 1.65, 0], [1.22, 1.75, 0], 0.12, 0xffd47d);
    mesh(rotor, new THREE.TorusGeometry(0.43, 0.08, 6, 16), [-0.8, 1.35, 0], 0xef85be);
    batchCarnivalGeometry(group);
    let time = 0;
    const update = delta => {
        time += Math.max(0, Math.min(delta, 0.1));
        rotor.rotation.y = sampleTeacupMotion(time, 0).platform;
        cups.forEach((cup, i) => { cup.rotation.y = sampleTeacupMotion(time, i).cup; });
    };
    update(0);
    return { group, entrance, update };
}
