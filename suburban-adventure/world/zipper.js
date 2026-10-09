import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { ZIPPER, trackLength, sampleCable, sampleAnchor, createZipperMotion } from './zipper-motion.js';

export function createZipper(x, z) {
    const group = new THREE.Group();
    group.name = 'Zipper';
    group.position.set(x, 0, z);
    const steel = createWireframeMaterial(0xe6e6df);
    const dark = createWireframeMaterial(0x777781);
    const amber = new THREE.MeshBasicMaterial({ color: 0xffce44 });
    const beamGeometry = new THREE.CylinderGeometry(1, 1, 1, 5);
    const bulbGeometry = new THREE.SphereGeometry(0.065, 5, 4);
    const direction = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const beam = (parent, a, b, radius = 0.06, material = steel) => {
        const first = new THREE.Vector3(...a), second = new THREE.Vector3(...b);
        const mesh = new THREE.Mesh(beamGeometry, material);
        direction.subVectors(second, first);
        mesh.position.copy(first).add(second).multiplyScalar(0.5);
        mesh.scale.set(radius, direction.length(), radius);
        mesh.quaternion.setFromUnitVectors(up, direction.normalize());
        parent.add(mesh);
        return mesh;
    };
    const box = (parent, size, position, material = steel) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(...position); parent.add(mesh); return mesh;
    };
    // Portable trailer, outriggers and twin A-frame supports around a horizontal shaft.
    box(group, [3.6, 0.45, 8.5], [0, 0.65, 0], dark);
    for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
            beam(group, [0, 0.65, end * 2.5], [side * 4.2, 0.35, end * 2.5], 0.12);
            box(group, [0.75, 0.18, 0.75], [side * 4.2, 0.15, end * 2.5], dark);
            beam(group, [side * 3.5, 0.6, end * 2.2], [0, ZIPPER.pivotHeight, end * 1.5], 0.18);
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.3, 12), dark);
            wheel.rotation.z = Math.PI / 2; wheel.position.set(side * 1.85, 0.45, end * 2.8); group.add(wheel);
        }
    }
    beam(group, [0, ZIPPER.pivotHeight, -1.7], [0, ZIPPER.pivotHeight, 1.7], 0.24);
    const boom = new THREE.Group();
    boom.name = 'ZipperBoom'; boom.position.y = ZIPPER.pivotHeight; group.add(boom);
    const h = ZIPPER.halfStraight, r = ZIPPER.radius;
    // Two matching stadium rails, rather than a scaled torus/ellipse.
    for (const depth of [-0.3, 0.3]) {
        for (let i = 0; i < 64; i++) {
            const a = sampleCable(i * trackLength / 64), b = sampleCable((i + 1) * trackLength / 64);
            beam(boom, [a.x, a.y, depth], [b.x, b.y, depth], 0.055);
        }
        for (let y = -h; y < h; y += 1.15) {
            beam(boom, [-r, y, depth], [r, Math.min(h, y + 1.15), depth], 0.035);
            beam(boom, [r, y, depth], [-r, Math.min(h, y + 1.15), depth], 0.035);
        }
    }
    const pulleys = [];
    for (const y of [-h, h]) {
        const pulley = new THREE.Group(); pulley.position.y = y; boom.add(pulley);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.075, 6, 24), steel); pulley.add(rim);
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            beam(pulley, [0, 0, 0], [Math.cos(a) * r, Math.sin(a) * r, 0], 0.035);
        }
        beam(pulley, [0, 0, -0.45], [0, 0, 0.45], 0.16);
        pulleys.push(pulley);
    }
    for (let i = 0; i < 40; i++) {
        const point = sampleCable(i * trackLength / 40);
        const bulb = new THREE.Mesh(bulbGeometry, amber);
        bulb.position.set(point.x, point.y, 0.4); boom.add(bulb);
    }
    // Contoured enclosed two-seat capsules: rounded upper cage and tapered footwell.
    const outline = new THREE.Shape();
    outline.moveTo(-0.48, -0.85);
    outline.lineTo(-0.52, -0.2);
    outline.bezierCurveTo(-0.55, 0.5, 0.45, 0.65, 0.6, -0.02);
    outline.lineTo(0.4, -1.25); outline.lineTo(-0.15, -1.25); outline.closePath();
    const cageGeometry = new THREE.ExtrudeGeometry(outline, { depth: 1.05, bevelEnabled: false, curveSegments: 7 });
    cageGeometry.translate(0, 0, -0.525);
    const colors = [0xffd34e, 0xe65ca7, 0x9d7ad4, 0xee6262, 0x42c9c9, 0xeaa552];
    const motion = createZipperMotion();
    const cages = motion.cars.map((state, index) => {
        const hinge = new THREE.Group(); hinge.name = `ZipperCapsule${index + 1}`; boom.add(hinge);
        const material = createWireframeMaterial(colors[index % colors.length]);
        hinge.add(new THREE.Mesh(cageGeometry, material));
        box(hinge, [0.75, 0.12, 0.8], [0, -0.88, 0], material);
        box(hinge, [0.75, 0.55, 0.1], [0, -0.6, -0.38], material);
        beam(hinge, [-0.4, -0.48, 0.25], [0.4, -0.48, 0.25], 0.035, material);
        // Front mesh door and visible hinge pin; all rotations stay on the shaft axis.
        for (const px of [-0.35, -0.15, 0.05, 0.25, 0.45]) beam(hinge, [px, -0.85, 0.54], [px, 0.12, 0.54], 0.014, material);
        for (const py of [-0.75, -0.5, -0.25, 0]) beam(hinge, [-0.4, py, 0.54], [0.45, py, 0.54], 0.014, material);
        beam(hinge, [0, 0, -0.7], [0, 0, 0.7], 0.065, steel);
        return hinge;
    });
    const update = deltaTime => {
        motion.update(deltaTime);
        const angle = sampleAnchor(motion.time, 0).boomAngle;
        boom.rotation.z = angle;
        cages.forEach((cage, index) => {
            const anchor = sampleAnchor(motion.time, index);
            cage.position.set(anchor.local.x, anchor.local.y, 1.05);
            cage.rotation.z = motion.cars[index].angle - angle;
        });
        pulleys.forEach(pulley => { pulley.rotation.z = motion.time * trackLength * ZIPPER.cableRPM / (60 * r); });
    };
    update(0);
    return { group, update, motion };
}
