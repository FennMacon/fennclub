import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createWireframeMaterial } from '../utils.js';

import { sampleRideMotion } from './carnival-motion.js';
export { CARNIVAL_ADDITIONS } from './carnival-motion.js';

export function createCarnivalRide(spec, cx = 0, cz = 0) {
    const group = new THREE.Group(); group.name = spec.name; group.position.set(cx + spec.x, 0, cz + spec.z);
    const steel = createWireframeMaterial(0xb8d9e4), gold = createWireframeMaterial(0xffd46b);
    const colors = [0xf06b9d, 0x63e3d6, 0x9776ee, 0xffa24b];
    const paint = colors.map(createColor => createWireframeMaterial(createColor));
    const unitBox = new THREE.BoxGeometry(1, 1, 1), unitBeam = new THREE.CylinderGeometry(1, 1, 1, 6);
    const bulbGeo = new THREE.SphereGeometry(0.07, 5, 4);
    const bulbs = [0xffd66b, 0x87ffe1].map(color => new THREE.MeshBasicMaterial({ color }));
    const box = (parent, size, p, material = steel) => { const m = new THREE.Mesh(unitBox, material); m.scale.set(...size); m.position.set(...p); parent.add(m); return m; };
    const beam = (parent, a, b, radius = 0.06, material = steel) => {
        const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), d = to.clone().sub(from);
        const m = new THREE.Mesh(unitBeam, material); m.position.copy(from).add(to).multiplyScalar(0.5);
        m.scale.set(radius, d.length(), radius); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
    };
    const ring = (parent, radius, y, material = gold) => { const m = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.065, 5, 32), material); m.rotation.x = Math.PI / 2; m.position.y = y; parent.add(m); };
    const lights = (parent, radius, y, count = 32) => { for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count, m = new THREE.Mesh(bulbGeo, bulbs[i % 2]); m.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius); parent.add(m); } };
    const seat = (parent, p, color, width = 0.65) => { const g = new THREE.Group(); g.position.set(...p); parent.add(g); box(g, [width, 0.12, 0.6], [0, 0, 0], color); box(g, [width, 0.7, 0.1], [0, 0.35, -0.26], color); beam(g, [-width/2, 0.4, 0.27], [width/2, 0.4, 0.27], 0.035, gold); return g; };
    const deckRadius = spec.kind === 'carousel' ? 4.15 : spec.kind === 'fury' ? 7 : 8;
    const deck = new THREE.Mesh(spec.kind === 'fury' ? new THREE.BoxGeometry(14, 0.3, 7) : new THREE.CylinderGeometry(deckRadius, deckRadius, 0.3, 32), steel); deck.position.y = 0.25; group.add(deck);
    const entranceDepth = spec.kind === 'fury' ? 3.5 : deckRadius;
    // Entrance rails flank an open gate and low step; the sign is the inspect target.
    for (const side of [-1, 1]) { beam(group, [side * 1.3, 0.3, entranceDepth], [side * 1.3, 1.3, entranceDepth + 3]); beam(group, [side * 1.3, 0.1, entranceDepth + 3], [side * 1.3, 1.3, entranceDepth + 3]); }
    box(group, [2.5, 0.12, 1.5], [0, 0.12, entranceDepth + 0.5]);
    const sign = new THREE.Group(); sign.position.set(2.4, 0, entranceDepth + 2); sign.name = `${spec.name} entrance`;
    beam(sign, [0, 0, 0], [0, 2.4, 0], 0.08);
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#132539'; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = '#ffdb75'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = '#ffdb75'; ctx.textAlign = 'center'; ctx.font = 'bold 38px sans-serif'; ctx.fillText(spec.name.toUpperCase(), 256, 58); ctx.font = '22px sans-serif'; ctx.fillText('MIDWAY • INSPECT', 256, 100);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide })); panel.position.y = 2.3; sign.add(panel); group.add(sign);
    let animate;
    if (spec.kind === 'fury') {
        // Two A frames, a horizontal axle, twin hanger arms and a curved ten-row boat.
        const pivotY = 12, length = 8;
        for (const z of [-2.6, 2.6]) { for (const x of [-6, 6]) beam(group, [x, 0.4, z], [0, pivotY, z], 0.18); beam(group, [-4, 4, z], [4, 4, z], 0.08, gold); }
        beam(group, [0, pivotY, -3], [0, pivotY, 3], 0.2);
        const pendulum = new THREE.Group(); pendulum.position.y = pivotY; group.add(pendulum);
        for (const z of [-2.2, 2.2]) beam(pendulum, [0, 0, z], [0, -length, z], 0.12, gold);
        const boat = new THREE.Group(); boat.position.y = -length; pendulum.add(boat);
        for (let i = 0; i < 10; i++) { const x = (i - 4.5) * 0.9, y = x*x*0.065; box(boat, [0.86, 0.5, 3], [x, y-0.3, 0], paint[i%4]); for (const z of [-1.5, 1.5]) { beam(boat, [x-0.43, y+0.45, z], [x+0.43, y+0.45, z], 0.05, gold); } const row=seat(boat, [x, y, 0], paint[i%4], 2.5); row.rotation.y = i<5 ? Math.PI/2 : -Math.PI/2; }
        for (let i = 0; i < 20; i++) {
            const x = (i - 9.5) * 0.46;
            for (const z of [-1.55, 1.55]) {
                const bulb = new THREE.Mesh(bulbGeo, bulbs[i % 2]);
                bulb.position.set(x, x * x * 0.065 + 0.5, z); boat.add(bulb);
            }
        }
        for (const side of [-1, 1]) { beam(boat, [side*4.5, 1, 0], [side*5.8, 2.5, 0], 0.2, gold); const crest=new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.3, 4), gold); crest.position.set(side*5.8, 2.8, 0); boat.add(crest); }
        animate = state => { pendulum.rotation.z = state.swing; };
    } else if (spec.kind === 'freestyle' || spec.kind === 'wipeout') {
        const free = spec.kind === 'freestyle', radius = free ? 4.3 : 5.5;
        box(group, [3, 0.45, 12], [0, 0.6, 0]); beam(group, [0, 0.6, 0], [0, free ? 5.2 : 4.2, 0], 0.6);
        const turret = new THREE.Group(); turret.position.y = free ? 5.2 : 4.2; group.add(turret);
        const tilt = new THREE.Group(); turret.add(tilt); const rotor = new THREE.Group(); tilt.add(rotor);
        ring(rotor, radius, 0); ring(rotor, radius-0.7, 0); lights(rotor, radius, 0.15);
        const sections = free ? 12 : 10;
        for (let i=0;i<sections;i++) { const a=i*Math.PI*2/sections; beam(rotor,[0,0,0],[Math.cos(a)*radius,0,Math.sin(a)*radius],0.09); const pod=new THREE.Group(); pod.position.set(Math.cos(a)*(radius-0.35),0,Math.sin(a)*(radius-0.35)); pod.rotation.y=Math.PI/2-a; rotor.add(pod);
            if (free) { for (const x of [-0.36,0.36]) { const chair=seat(pod,[x,0.1,0],paint[i%4]); for(const side of [-1,1]) beam(chair,[side*0.23,0.7,-0.25],[side*0.23,0.3,0.2],0.045,gold); } }
            else { for(const direction of [-1,1]) { const bench=seat(pod,[0,0.1,direction*0.55],paint[i%4],1.4); bench.rotation.y=direction===1?Math.PI:0; } }
        }
        animate = state => { turret.rotation.y = state.turret; tilt.rotation.z = state.tilt; rotor.rotation.y = state.rim; };
    } else if (spec.kind === 'carousel') {
        const rotor=new THREE.Group(); group.add(rotor); ring(rotor,3,0.45); beam(rotor,[0,0.4,0],[0,5.8,0],0.35,gold);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.15,1.5,16),paint[0]); roof.position.y=5.15; rotor.add(roof); ring(rotor,3.15,4.4); lights(rotor,3.15,4.4); lights(rotor,2.7,0.5);
        const horses=[];
        for(let i=0;i<14;i++) { const a=Math.floor(i/2)*Math.PI*2/8, r=i%2?2.6:1.8, x=Math.cos(a)*r,z=Math.sin(a)*r; beam(rotor,[x,0.4,z],[x,4.4,z],0.035,gold); const horse=new THREE.Group(); horse.position.set(x,1.4,z); horse.rotation.y=-a; rotor.add(horse); box(horse,[0.38,0.55,0.95],[0,0,0],paint[i%4]); const neck=box(horse,[0.28,0.65,0.3],[0,0.4,-0.4],paint[i%4]); neck.rotation.x=-0.35; box(horse,[0.3,0.3,0.5],[0,0.75,-0.55],paint[i%4]); box(horse,[0.4,0.12,0.4],[0,0.32,0.05],gold); for(const side of [-1,1])for(const end of [-1,1])beam(horse,[side*0.15,-0.2,end*0.3],[side*0.22,-0.7,end*0.47],0.055,paint[i%4]); beam(horse,[0,0.15,0.4],[0,-0.35,0.8],0.08,gold); horses.push(horse); }
        const chariot=seat(rotor,[0,0.75,-2.3],paint[2],1.4); box(chariot,[1.7,0.2,1.1],[0,-0.2,0],gold);
        animate=state=>{rotor.rotation.y=state.spin;horses.forEach((horse,i)=>horse.position.y=1.4+Math.sin(state.bob+i*Math.PI/2)*0.25);};
    } else {
        beam(group,[0,0.4,0],[0,8,0],0.5,paint[1]);
        const crown=new THREE.Group(); crown.position.y=8; group.add(crown);
        const canopy=new THREE.Mesh(new THREE.ConeGeometry(5.2,1.8,32),paint[2]);canopy.position.y=0.8;crown.add(canopy);ring(crown,5.2,0);lights(crown,5.2,0);
        const hangers=[];
        for(let i=0;i<32;i++){const a=i*Math.PI*2/32, r=i%2?5.2:4.4;const radial=new THREE.Group();radial.rotation.y=-a;crown.add(radial);const hinge=new THREE.Group();hinge.position.x=r;radial.add(hinge);for(const z of [-0.2,0.2])beam(hinge,[0,0,z],[0,-3.4,z],0.025);seat(hinge,[0,-3.4,0],paint[i%4]);hangers.push(hinge);}
        animate=state=>{crown.rotation.y=state.spin;hangers.forEach(hinge=>hinge.rotation.z=state.flare);};
    }
    // Batch rigid pieces inside each moving assembly to limit mobile draw calls.
    const batch = parent => {
        for (const child of [...parent.children]) if (child.isGroup) batch(child);
        const buckets = new Map();
        for (const child of parent.children) if (child.isMesh && !Array.isArray(child.material)) {
            const list = buckets.get(child.material) || []; list.push(child); buckets.set(child.material, list);
        }
        for (const [material, meshes] of buckets) {
            if (meshes.length < 2) continue;
            const parts = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
            const geometry = mergeGeometries(parts);
            parts.forEach(part => part.dispose());
            if (geometry) { meshes.forEach(mesh => parent.remove(mesh)); parent.add(new THREE.Mesh(geometry, material)); }
        }
    };
    batch(group);
    let time=0;
    const update=delta=>{time+=Math.max(0,Math.min(delta,0.1));animate(sampleRideMotion(spec.kind,time));}; update(0);
    return {group,sign,update};
}
