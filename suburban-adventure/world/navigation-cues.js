import * as THREE from 'three';

export function createNavigationCues(scene,portals,camera) {
    const root=new THREE.Group();root.name='NeighborhoodDoorways';
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([
        -1.1,0,0,-1.1,2.4,0,-1.1,2.4,0,1.1,2.4,0,1.1,2.4,0,1.1,0,0,
        -1.1,0,0,1.1,0,0,-1.1,0,0,-1.1,0,1,1.1,0,0,1.1,0,1,-1.1,0,1,1.1,0,1
    ],3));
    const material=new THREE.LineBasicMaterial({color:0xa9e8d5,fog:true});
    for(const portal of portals) {
        const cue=new THREE.LineSegments(geometry,material);cue.name='EntranceThreshold:'+portal.name;
        const outward=portal.returnPosition?{x:portal.returnPosition.x-portal.position.x,z:portal.returnPosition.z-portal.position.z}:{x:0,z:portal.isFarBuilding?-1:1};
        cue.position.set(portal.position.x,.025,portal.position.z);
        cue.rotation.y=Math.atan2(outward.x,outward.z);root.add(cue);
    }
    const update=position=>root.children.forEach(cue=>{cue.visible=Math.hypot(cue.position.x-position.x,cue.position.z-position.z)<95;});
    scene.add(root);update(camera.position);
    return {group:root,update:camera=>update(camera.position)};
}
