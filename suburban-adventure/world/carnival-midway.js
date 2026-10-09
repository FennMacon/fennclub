import * as THREE from 'three';
import { createCarnivalKit, batchCarnivalGeometry } from './carnival-builders.js';
import { MIDWAY_ALLEYS, MIDWAY_STALLS } from './carnival-midway-layout.js';
import { getFlavorContent } from '../content-loader.js';

export function createCarnivalMidway(cx, cz) {
    const group = new THREE.Group(); group.name = 'CarnivalMidway';
    group.position.set(cx, 0, cz);
    const { mesh, box, beam, bulb, sign } = createCarnivalKit();
    const interactiveItems = [];
    const colors = [0xed6f99, 0x64c9cb, 0xa686e1, 0xf1ae64];
    const sphere = new THREE.SphereGeometry(0.2, 8, 6);
    const ringGeometry = new THREE.TorusGeometry(0.18, 0.025, 5, 12);
    const bottleGeometry = new THREE.CylinderGeometry(0.13, 0.17, 0.45, 8);
    const prizes = (stall, color) => {
        for (let i = 0; i < 6; i++) {
            const x = (i - 2.5) * 0.6;
            const bear = new THREE.Group(); bear.position.set(x, 2.55, -0.85); stall.add(bear);
            mesh(bear, sphere, [0, 0, 0], color);
            mesh(bear, sphere, [0, 0.27, 0], color).scale.setScalar(0.7);
            for (const side of [-1, 1]) {
                mesh(bear, sphere, [side * 0.1, 0.4, 0], color).scale.setScalar(0.3);
                mesh(bear, sphere, [side * 0.15, -0.23, 0.07], color).scale.setScalar(0.4);
            }
        }
    };
    for (const alley of MIDWAY_ALLEYS) {
        const aisle = new THREE.Group(); aisle.name = alley.name;
        aisle.position.set(alley.x, 0, alley.z); group.add(aisle);
        const path = mesh(aisle, new THREE.PlaneGeometry(alley.width, alley.length), [0, -0.16, 0],
            new THREE.MeshBasicMaterial({ color: alley.kind === 'food' ? 0x453b35 : 0x323b4c, side: THREE.DoubleSide }));
        path.rotation.x = -Math.PI / 2;
        const gateway = new THREE.Group();
        gateway.name = alley.name + ' gateway'; gateway.position.set(alley.x, 0, alley.entranceZ);
        // Food fronts north; games fronts south, toward the road.
        gateway.rotation.y = alley.direction === 1 ? Math.PI : 0; group.add(gateway);
        for (const side of [-1, 1]) beam(gateway, [side * 4.2, 0, 0], [side * 4.2, 4.8, 0], 0.1, 0xffdb85);
        beam(gateway, [-4.2, 4.8, 0], [4.2, 4.8, 0], 0.09, 0xffdb85);
        sign(gateway, alley.name, [0, 4.6, 0.05], 6.5, alley.kind === 'food' ? 'SWEET • SALTY • FRESH' : 'STEP RIGHT UP');
        // Sagging strands sit above walking height, with no light objects.
        for (let row = 0; row < 4; row++) {
            const z = -alley.length / 2 + 5 + row * 8;
            for (let i = 0; i < 12; i++) {
                const x = -4.2 + i * 8.4 / 12, next = x + 8.4 / 12;
                const y = 4.1 + (x / 4.2) ** 2 * 0.5, ny = 4.1 + (next / 4.2) ** 2 * 0.5;
                beam(aisle, [x, y, z], [next, ny, z], 0.015, 0x9ea7bc);
                bulb(aisle, [x, y - 0.05, z], i + row);
            }
        }
    }
    for (const [index, spec] of MIDWAY_STALLS.entries()) {
        const stall = new THREE.Group(); stall.name = spec.label;
        stall.position.set(spec.x, 0, spec.z); stall.rotation.y = spec.rotation; group.add(stall);
        const color = colors[index % colors.length];
        // Open service window, raised counter, side walls and pitched striped canopy.
        box(stall, [4.6, 0.15, 3], [0, 0.15, 0], 0x7d8595);
        box(stall, [4.6, 2.6, 0.12], [0, 1.45, -1.4], color);
        for (const side of [-1, 1]) {
            box(stall, [0.12, 2.6, 2.8], [side * 2.25, 1.45, 0], color);
            beam(stall, [side * 2.3, 0.2, 1.5], [side * 2.3, 3.2, 1.5], 0.065, 0xffdf9e);
        }
        box(stall, [4.6, 0.95, 0.15], [0, 0.65, 1.35], color);
        const counter = new THREE.Group(); counter.name = spec.label + ' counter';
        counter.position.set(0, 1.18, 1.4); stall.add(counter);
        box(counter, [4.85, 0.12, 0.75], [0, 0, 0], 0xffdf9e);
        for (let strip = 0; strip < 10; strip++) {
            const roof = box(stall, [0.5, 0.1, 3.9], [(strip - 4.5) * 0.5, 3.05, 0.15], strip % 2 ? 0xffedc1 : color);
            roof.rotation.x = 0.12;
            box(stall, [0.5, 0.3, 0.08], [(strip - 4.5) * 0.5, 2.7, 2.05], strip % 2 ? 0xffedc1 : color);
        }
        sign(stall, spec.label, [0, 3.55, 1.75], 4.5);
        for (let i = 0; i < 12; i++) bulb(stall, [(i - 5.5) * 0.4, 3.15, 1.8], i);
        if (spec.alley === 'games') prizes(stall, color);
        if (spec.kind === 'rings') {
            for (let i = 0; i < 12; i++) {
                const x = (i % 4 - 1.5) * 0.65, z = -0.7 + Math.floor(i / 4) * 0.45;
                beam(stall, [x, 1.2, z], [x, 1.75, z], 0.035, 0xffdf9e);
            }
            for (let i = 0; i < 3; i++) mesh(stall, ringGeometry, [(i - 1) * 0.5, 1.3, 1.55], 0xffa64e).rotation.x = Math.PI / 2;
        } else if (spec.kind === 'balloons') {
            box(stall, [3.5, 1.3, 0.1], [0, 1.85, -1.2], 0x304867);
            for (let i = 0; i < 15; i++) {
                const balloon = mesh(stall, sphere, [(i % 5 - 2) * 0.6, 1.45 + Math.floor(i / 5) * 0.4, -1.05], colors[i % 4]);
                balloon.scale.y = 1.2;
            }
        } else if (spec.kind === 'bottles') {
            box(stall, [3, 0.1, 1], [0, 1.25, -0.6], 0xffdf9e);
            for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++)
                mesh(stall, bottleGeometry, [(i - (2 - row) / 2) * 0.4, 1.5 + row * 0.45, -0.6], 0xdfe8ff);
            mesh(stall, sphere, [0.8, 1.4, 1.45], 0xef9864);
        } else if (spec.kind === 'ducks') {
            box(stall, [3.4, 0.25, 1.8], [0, 1.25, -0.1], 0x65d9de);
            for (let i = 0; i < 8; i++) {
                const x = (i % 4 - 1.5) * 0.65, z = Math.floor(i / 4) * 0.7 - 0.45;
                mesh(stall, sphere, [x, 1.5, z], 0xffd44d).scale.set(0.9, 0.6, 1.1);
                mesh(stall, sphere, [x, 1.7, z + 0.1], 0xffd44d).scale.setScalar(0.55);
                box(stall, [0.14, 0.05, 0.15], [x, 1.7, z + 0.25], 0xf18b39);
            }
        } else if (spec.kind === 'hoops') {
            box(stall, [1.8, 1.1, 0.12], [0, 2.1, -1.15], 0xdfe8ff);
            const hoop = mesh(stall, new THREE.TorusGeometry(0.4, 0.045, 6, 16), [0, 1.95, -0.7], 0xf19662);
            hoop.rotation.x = Math.PI / 2;
            for (let i = 0; i < 8; i++) {
                const a = i * Math.PI / 4;
                beam(stall, [Math.sin(a) * 0.4, 1.95, -0.7 + Math.cos(a) * 0.4],
                    [Math.sin(a) * 0.23, 1.4, -0.7 + Math.cos(a) * 0.23], 0.015, 0xdfe8ff);
            }
            mesh(stall, sphere, [0.6, 1.4, 1.5], 0xf19662);
        } else if (spec.kind === 'skeeball') {
            for (const x of [-0.85, 0.85]) {
                const lane = box(stall, [1.3, 0.1, 2.4], [x, 1.1, 0], 0xc99661); lane.rotation.x = 0.2;
                const target = new THREE.Group(); target.position.set(x, 1.8, -0.9); target.rotation.x = -0.2; stall.add(target);
                for (const r of [0.22, 0.4, 0.58]) mesh(target, new THREE.TorusGeometry(r, 0.03, 5, 16), [0, 0, 0], 0xffdc85);
            }
        } else {
            // Food counters have distinct serving props and a menu board.
            sign(stall, spec.kind === 'lemonade' ? 'FRESH SQUEEZED' : 'MADE TO ORDER', [0, 2.15, -1.2], 2.6);
            if (spec.kind === 'cotton') for (let i = 0; i < 4; i++) {
                const x = (i - 1.5) * 0.65;
                beam(stall, [x, 1.25, 0.9], [x, 1.8, 0.9], 0.025, 0xffedc1);
                mesh(stall, new THREE.SphereGeometry(0.28, 8, 6), [x, 1.9, 0.9], i % 2 ? 0x8fd7ff : 0xef85be).scale.y = 1.4;
            } else if (spec.kind === 'lemonade') {
                mesh(stall, new THREE.CylinderGeometry(0.35, 0.35, 0.65, 12), [-0.9, 1.56, 0.7], 0xffdc65);
                for (let i = 0; i < 4; i++) mesh(stall, new THREE.CylinderGeometry(0.1, 0.07, 0.25, 8), [i * 0.35, 1.38, 1.45], 0xffedc1);
                for (let i = 0; i < 4; i++) mesh(stall, sphere, [0.3 + i * 0.3, 1.4, 0.5], 0xffdc65).scale.setScalar(0.6);
            } else if (spec.kind === 'hotdogs') {
                box(stall, [1.4, 0.35, 0.85], [-0.8, 1.4, 0.2], 0xb2c5d0);
                for (let i = 0; i < 5; i++) beam(stall, [-1.3 + i * 0.22, 1.62, -0.1], [-1.3 + i * 0.22, 1.62, 0.5], 0.07, 0xda9862);
                for (const [x, color] of [[0.7, 0xed765f], [1.1, 0xffd34e]]) mesh(stall, new THREE.CylinderGeometry(0.1, 0.12, 0.35, 8), [x, 1.4, 1.3], color);
            } else {
                box(stall, [1.5, 0.25, 0.95], [-0.8, 1.35, 0.3], 0x98a7b7);
                for (let i = 0; i < 3; i++) {
                    const pastry = mesh(stall, new THREE.TorusGeometry(spec.kind === 'funnel' ? 0.25 : 0.3, 0.07, 5, 12), [0.3 + i * 0.5, 1.3, 1.4], 0xffdb98);
                    pastry.rotation.x = Math.PI / 2;
                }
            }
        }
        const content = getFlavorContent(spec.contentId);
        counter.userData = { isInteractive: true, name: content.name, flavorText: content.flavorText };
        interactiveItems.push(counter);
    }
    batchCarnivalGeometry(group);
    return { group, interactiveItems };
}
