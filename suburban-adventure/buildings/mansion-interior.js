import * as THREE from 'three';
import { createInteriorBounds } from './shared.js';
import { MANSION_ROOMS, MANSION_CONNECTIONS, roomCenter, getMansionWalls } from './mansion-layout.js';

export const createMansionInterior = scene => {
    const group = new THREE.Group(); group.name = 'Regal Mansion Interior';
    group.userData.bounds = createInteriorBounds(48, 48, .7, 7);
    const obstacles = getMansionWalls(); group.userData.collisionRects = obstacles;
    const items = []; group.userData.interactiveItems = items;
    const material = color => new THREE.MeshLambertMaterial({ color });
    const stone = material(0xd3c5ad), gold = material(0xba9550), wood = material(0x422b25), crimson = material(0x641f32);
    const box = (name, x, y, z, w, h, d, mat) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.name = name; mesh.position.set(x, y, z); group.add(mesh); return mesh;
    };
    for (const wall of obstacles) {
        box('Mansion partition', wall.x, 3.5, wall.z, wall.width, 7, wall.depth, stone);
        box('Gilded cornice', wall.x, 6.7, wall.z, wall.width + .08, .18, wall.depth + .08, gold);
        box('Walnut wainscot', wall.x, .8, wall.z, wall.width + .04, 1.6, wall.depth + .04, wood);
    }
    for (const [a,b] of MANSION_CONNECTIONS) {
        const p=roomCenter(a),q=roomCenter(b),vertical=p.z===q.z;
        const row=Math.floor(a/3),col=a%3;
        const x=vertical ? (p.x+q.x)/2 : p.x+(col%2 ? 3 : -3);
        const z=vertical ? p.z+(row%2 ? -3 : 3) : (p.z+q.z)/2;
        box('Doorway lintel',x,5.5,z,vertical ? .4 : 4,3,vertical ? 4 : .4,stone);
        box('Gilded doorway',x,4.05,z,vertical ? .48 : 4,.18,vertical ? 4 : .48,gold);
    }
    const descriptions = [
        'Velvet chairs wait for guests who never seem to arrive.',
        'A grand hall. The double doors behind you lead back to the courtyard.',
        'The grand piano is silent, but the room still seems to be listening.',
        'Leather-bound volumes climb to the ceiling. Their gilded titles repeat.',
        'Every portrait watches a different doorway. None watches the same way twice.',
        'The long table is set for an elaborate dinner, without a single guest.',
        'A secluded treasury at the end of the winding rooms. An empty jewel case rests here.',
        'A crimson throne beneath gold trim. The route here was less direct than it looked.',
        'Pale urns and greenery fill the winter garden. Another doorway leads around the house.'
    ];
    for (let id = 0; id < 9; id++) {
        const c = roomCenter(id), name = MANSION_ROOMS[Math.floor(id / 3)][id % 3];
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(16,16), material(id % 2 ? 0x514039 : 0x65564a));
        floor.rotation.x = -Math.PI / 2; floor.position.set(c.x, 0, c.z); group.add(floor);
        const rug = new THREE.Mesh(new THREE.PlaneGeometry(7,8), crimson);
        rug.rotation.x = -Math.PI / 2; rug.position.set(c.x,.025,c.z); group.add(rug);
        // Downward-facing ceilings close the rooms but allow an overhead cutaway preview.
        const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(16,16),material(0x52463e));
        ceiling.rotation.x=Math.PI/2;ceiling.position.set(c.x,7,c.z);group.add(ceiling);
        // Fixtures sit off the circulation route through each chamber.
        const fixture = box(name, c.x - 4, 1, c.z - 4, id === 5 ? 5 : 2.5, 2, 2, id === 7 ? crimson : wood);
        fixture.userData = { isInteractive: true, name, flavorText: descriptions[id] }; items.push(fixture);
        for (const side of [-1,1]) {
            const portrait = box('Gilded portrait', c.x + side * 5, 4, c.z - 7.7, 2.5, 2.8, .15, gold);
            box('Portrait canvas', portrait.position.x, 4, c.z - 7.59, 2.1, 2.4, .06, material(id % 2 ? 0x3d4c46 : 0x583b47));
        }
        if (id === 1 || id === 4) {
            for (let ix=0;ix<8;ix++) for(let iz=0;iz<8;iz++) {
                if((ix+iz)%2) continue;
                const tile=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),material(0xc8bfae));
                tile.rotation.x=-Math.PI/2;tile.position.set(c.x-7+ix*2,.012,c.z-7+iz*2);group.add(tile);
            }
        }
        if (id === 0) {
            box('Velvet sofa back',c.x-4,1.6,c.z-5,3,1.5,.5,crimson);
            box('Tea table',c.x, .5,c.z,2,1,1.5,wood);
        }
        if (id === 2) {
            box('Piano lid',c.x-4,2.05,c.z-4,3.5,.15,2.5,material(0x181619));
            box('Ivory keyboard',c.x-4,1.4,c.z-2.8,3,.15,.4,material(0xe8dbc4));
        }
        if (id === 5) {
            box('Dining tabletop',c.x-4,1.7,c.z-4,6,.18,2.5,wood);
            for(let i=0;i<3;i++) for(const side of [-1,1])
                box('Dining chair',c.x-6+i*2, .8,c.z-4+side*2,.8,1.6,.8,crimson);
        }
        if (id === 8) for (const side of [-1,1]) {
            const urn=new THREE.Mesh(new THREE.CylinderGeometry(.6,.4,1.4,10),stone);
            urn.position.set(c.x+side*5,.7,c.z-5);group.add(urn);
            const shrub=new THREE.Mesh(new THREE.SphereGeometry(1.2,8,6),material(0x3b6046));
            shrub.position.set(urn.position.x,2,urn.position.z);group.add(shrub);
        }
        if (id === 3) for (let shelf = 0; shelf < 3; shelf++)
            box('Library shelves', c.x - 7, 2, c.z + shelf * 3 - 3, .8, 4, 2, wood);
        if (id === 7) {
            box('Throne back', c.x - 4, 2.5, c.z - 4.8, 2.5, 3, .4, crimson);
            for (const side of [-1,1]) box('Throne finial', c.x - 4 + side * 1.3, 3, c.z - 4.8, .18, 4, .18, gold);
        }
        const chandelier = new THREE.Mesh(new THREE.TorusGeometry(1.4,.08,6,12), gold);
        chandelier.rotation.x=Math.PI/2; chandelier.position.set(c.x,5.5,c.z);group.add(chandelier);
        for(let i=0;i<6;i++) {
            const candle=box('Chandelier candle',c.x+Math.cos(i*Math.PI/3)*1.4,5.8,c.z+Math.sin(i*Math.PI/3)*1.4,.12,.5,.12,material(0xffe4a5));
            const flame=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),new THREE.MeshBasicMaterial({color:0xffd38a}));
            flame.position.copy(candle.position);flame.position.y+=.35;group.add(flame);
        }
    }
    const exit = box('Courtyard doors',0,1.8,24,3.6,3.6,.18,wood);
    exit.userData.isExitPortal=true;
    box('Entrance arch',0,4,24,4.5,.4,.4,gold);
    scene.add(group); return group;
};
