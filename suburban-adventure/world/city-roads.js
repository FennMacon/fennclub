import * as THREE from 'three';
import {createCitySurfacePlan,cityMarkingSegments} from './city-road-layout.js';

export const createCityRoadNetwork=scene=>{
    const group=new THREE.Group();group.name='CityRoadNetwork';const plan=createCitySurfacePlan();
    const unit=new THREE.PlaneGeometry(1,1),rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    const batch=(name,rects,color,y)=>{
        const mesh=new THREE.InstancedMesh(unit,new THREE.MeshBasicMaterial({color}),rects.length);mesh.name=name;
        rects.forEach((r,i)=>mesh.setMatrixAt(i,new THREE.Matrix4().compose(new THREE.Vector3((r.left+r.right)/2,y,(r.front+r.back)/2),rotation,new THREE.Vector3(r.right-r.left,r.back-r.front,1))));
        mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
    };
    batch('CityAsphalt',plan.rectangles.filter(r=>r.type==='asphalt'),0x3e4542,-.12);
    batch('CitySidewalk',plan.rectangles.filter(r=>r.type==='sidewalk'),0x747970,-.12);
    const markings=[];
    for(const road of plan.roads)for(const [lo,hi] of cityMarkingSegments(road,plan.roads)) {
        if(road.width===8){for(let p=lo+2;p+3<hi;p+=10)markings.push(road.axis==='x'?{left:p,right:p+3,front:road.coordinate-.05,back:road.coordinate+.05}:{left:road.coordinate-.05,right:road.coordinate+.05,front:p,back:p+3});}
        else for(const offset of [-.14,.14])markings.push(road.axis==='x'?{left:lo,right:hi,front:road.coordinate+offset-.045,back:road.coordinate+offset+.045}:{left:road.coordinate+offset-.045,right:road.coordinate+offset+.045,front:lo,back:hi});
    }
    batch('CityLaneMarkings',markings,0xbbb386,-.105);
    group.userData.surfacePlan=plan;scene.add(group);return group;
};
