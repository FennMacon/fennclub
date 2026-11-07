import * as THREE from 'three';
import {createSuburbanSurfacePlan,suburbanMarkingSegments} from './suburban-road-layout.js';
import {roadSurfaceAt} from './road-surfaces.js';

export const createSuburbanRoadNetwork=scene=>{
    const group=new THREE.Group();group.name='SuburbanRoadNetwork';const plan=createSuburbanSurfacePlan();
    const unit=new THREE.PlaneGeometry(1,1),rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    const batch=(name,rects,color,y)=>{
        if(!rects.length)return;
        const mesh=new THREE.InstancedMesh(unit,new THREE.MeshBasicMaterial({color}),rects.length);mesh.name=name;
        rects.forEach((r,i)=>mesh.setMatrixAt(i,new THREE.Matrix4().compose(new THREE.Vector3((r.left+r.right)/2,y,(r.front+r.back)/2),rotation,new THREE.Vector3(r.right-r.left,r.back-r.front,1))));
        mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
    };
    batch('SuburbanAsphalt',plan.rectangles.filter(r=>r.type==='asphalt'),0x444444,-.12);
    batch('SuburbanSidewalk',plan.rectangles.filter(r=>r.type==='sidewalk'),0x888888,-.12);
    const yellow=[],white=[],seams=[];
    const mark=(road,offset,lo,hi)=>road.axis==='x'?{left:lo,right:hi,front:road.coordinate+offset-.05,back:road.coordinate+offset+.05}:{left:road.coordinate+offset-.05,right:road.coordinate+offset+.05,front:lo,back:hi};
    for(const road of plan.roads){
        for(const offset of [-.15,.15])for(const [lo,hi] of suburbanMarkingSegments(road,0,plan.roads))yellow.push(mark(road,offset,lo,hi));
        for(const offset of [-5,5])for(const [lo,hi] of suburbanMarkingSegments(road,offset,plan.roads))white.push(mark(road,offset,lo,hi));
        for(let p=Math.ceil(road.min/6)*6;p<road.max;p+=6)for(const side of [-1,1]){
            const cross=road.coordinate+side*9;
            const probes=[-2.9,0,2.9].map(d=>road.axis==='x'?[p,cross+d]:[cross+d,p]);
            if(!probes.every(([x,z])=>roadSurfaceAt(x,z,plan.roads)==='sidewalk'))continue;
            seams.push(road.axis==='x'?{left:p-.035,right:p+.035,front:cross-3,back:cross+3}:{left:cross-3,right:cross+3,front:p-.035,back:p+.035});
        }
    }
    batch('SuburbanCenterLines',yellow,0xffff00,-.103);batch('SuburbanEdgeLines',white,0xffffff,-.103);batch('SuburbanPavementSeams',seams,0x666666,-.105);
    group.userData.surfacePlan=plan;group.userData.markings={yellow,white,seams};scene.add(group);return group;
};
