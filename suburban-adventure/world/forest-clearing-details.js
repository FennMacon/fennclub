import * as THREE from 'three';
import { createTree, createWireframeMaterial } from '../utils.js';
import { getFlavorContent } from '../content-loader.js';
import { GROUND_LAYERS } from './constants.js';
import { nearTrail } from './trail-layout.js';

export const createClearingDetails = (clearing, paths) => {
    const group=new THREE.Group();group.name='ClearingSetting:'+clearing.id;group.position.set(clearing.x,0,clearing.z);
    const material=color=>createWireframeMaterial(color);
    const box=(name,x,y,z,w,h,d,color)=>{
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));
        mesh.name=name;mesh.position.set(x,y,z);group.add(mesh);return mesh;
    };
    const shape=new THREE.Shape();
    for(let i=0;i<=32;i++) {
        const angle=i/32*Math.PI*2,r=clearing.radius*(.76+.06*Math.sin(angle*5+.8));
        const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
        if(i===0)shape.moveTo(x,z);else shape.lineTo(x,z);
    }
    const patch=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0x35452d,side:THREE.DoubleSide}));
    patch.rotation.x=-Math.PI/2;patch.position.y=GROUND_LAYERS.base+.008;group.add(patch);
    // Small edge trees and understory frame the clearing without growing across a trail.
    for(let i=0;i<12;i++) {
        const a=i/12*Math.PI*2,r=clearing.radius-2,x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(paths.some(path=>nearTrail(clearing.x+x,clearing.z+z,path,6)))continue;
        if(i%3===0){const tree=createTree(x,z,.55);group.add(tree);}
        const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,0),material(0x49653c));
        shrub.scale.y=.55;shrub.position.set(x,.5,z);group.add(shrub);
        const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.7,0),material(0x72756c));
        rock.scale.set(1.4,.6,1);rock.position.set(x-1,.2,z+1);group.add(rock);
    }
    let observation;
    switch(clearing.id) {
        case 'chair':
            box('Weathered overlook bench',-5,.7,5,5,.2,1,0x6d5140);
            box('Bench back',-5,1.3,5.5,5,1,.2,0x6d5140);
            for(const x of [-7,-3])box('Bench leg',x,.35,5,.3,.7,.7,0x55534e);
            observation=box('Forgotten thermos',5,.5,-5,.5,1,.5,0x77928d);
            break;
        case 'lamp':
            for(let i=0;i<6;i++)box('Broken paving slab',-5+i*1.8,-.2,4,1.5,.06,2,0x696d68);
            box('Bus shelter frame',-5,1.8,6,.15,3.6,.15,0x626a67);
            box('Bus shelter frame',1,1.8,6,.15,3.6,.15,0x626a67);
            box('Shelter roof',-2,3.6,6,6.5,.2,2.5,0x586963);
            observation=box('Timetable case',5,1.4,-5,1.2,2,.2,0x8b9b8e);
            break;
        case 'stoneCircle':
            for(let i=0;i<7;i++) {
                const a=i/7*Math.PI*2;
                const stone=box('Standing stone',Math.cos(a)*10,1.6,Math.sin(a)*10,1.2,3.2,1,0x787b70);
                stone.rotation.z=.07*Math.sin(i);
            }
            observation=box('Weathered plinth',5,.75,-5,1.8,1.5,1.8,0x93917e);
            break;
        case 'oddPatch':
            for(const x of [-6,6])for(const z of [-5,5])box('Greenhouse upright',x,2,z,.15,4,.15,0x68766a);
            for(const z of [-5,5])box('Greenhouse crossbeam',0,4,z,12,.15,.15,0x68766a);
            for(const x of [-6,6])box('Greenhouse crossbeam',x,4,0,.15,.15,10,0x68766a);
            for(let i=0;i<4;i++)box('Empty growing bed',-4+i*2.6,.2,-4,1.8,.4,1.2,0x544332);
            observation=box('Seed box',5,.6,-6,1.5,1.2,1,0x766547);
            break;
        case 'emptyTable':
            for(let i=0;i<4;i++) {
                const a=i*Math.PI/2,x=Math.cos(a)*6,z=Math.sin(a)*6;
                box('Garden-party chair',x,.6,z,1.2,.15,1.2,0x847565);
                box('Chair back',x,1.2,z+.5,1.2,1.2,.15,0x847565);
            }
            box('Unlit garden lantern',-6,1.5,-5,.7,3,.7,0x958368);
            observation=box('Sealed invitation',5,.6,-5,1.2,.1,.8,0xd7c8a7);
            break;
        case 'trafficCone':
            for(let i=0;i<4;i++)box('Unfinished footbridge plank',-6+i*1.2,.1,4,.9,.2,6,0x756046);
            for(const z of [-2,6])box('Abandoned barrier',5,1,z,6,.4,.3,0x978361);
            observation=box('Discarded tool chest',5,.55,-5,2,1.1,1.2,0x837e63);
            break;
        case 'shoppingCart':
            for(let i=0;i<5;i++)box('Rusting fence upright',-8+i*2.4,1.5,6,.1,3,.1,0x725f4c);
            box('Rusting fence rail',-3,1,6,10,.12,.12,0x725f4c);
            box('Rusting fence rail',-3,2.5,6,10,.12,.12,0x725f4c);
            for(let i=0;i<3;i++)box('Abandoned crate',-6+i*2,.6,3,1.4,1.2,1.4,0x6b5b46);
            observation=box('Old receipt tin',5,.3,-5,1,.6,1,0x888272);
            break;
    }
    const content=getFlavorContent('CLEARING_DETAIL_'+clearing.id.toUpperCase());
    observation.userData={isInteractive:true,name:content.name,flavorText:content.flavorText};
    return {group,observation};
};
