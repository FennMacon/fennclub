import * as THREE from 'three';
import { GROUND_LAYERS } from './constants.js';
import { sampleTrail } from './trail-layout.js';

export const createWoodlandTrail = (points, { width=3.6, name='WoodlandTrail' }={}) => {
    const group=new THREE.Group();group.name=name;
    const samples=sampleTrail(points);group.userData.samples=samples;
    const closed=Math.hypot(samples[0].x-samples.at(-1).x,samples[0].z-samples.at(-1).z)<1e-6;
    for(const edge of [.8,0]) {
        const vertices=[],indices=[];
        samples.forEach((p,i)=>{
            const a=samples[closed && (i===0||i===samples.length-1) ? samples.length-2 : Math.max(0,i-1)],b=samples[closed && (i===0||i===samples.length-1) ? 1 : Math.min(samples.length-1,i+1)];
            const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1;
            const half=width/2+.25*Math.sin(closed ? i/(samples.length-1)*Math.PI*12 : i*.27)+edge;
            for(const side of [-1,1]) vertices.push(p.x+side*dz/length*half,
                GROUND_LAYERS.base+(edge?.012:.022),p.z-side*dx/length*half);
            if(i){const n=i*2;indices.push(n-2,n-1,n,n-1,n+1,n);}
        });
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        geometry.setIndex(indices);geometry.computeVertexNormals();
        const material=new THREE.MeshBasicMaterial({color:edge?0x606047:0x77684e,side:THREE.DoubleSide,transparent:!!edge,opacity:edge?.45:1});
        const mesh=new THREE.Mesh(geometry,material);mesh.name=edge?name+'Edge':name+'Surface';group.add(mesh);
    }
    return group;
};
