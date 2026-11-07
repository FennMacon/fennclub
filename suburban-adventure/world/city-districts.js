import {createStoreSignFactory} from './city-signs.js';
import {updateDetailVisibility} from './detail-visibility.js';
import * as THREE from 'three';
import { createCityPlan, CITY_DISTRICTS, CITY_HORIZONTAL_ROADS, CITY_VERTICAL_ROADS, CITY_ATMOSPHERE, cityVisibilityDistances } from './city-layout.js';

// Batches of wireframe buildings: no per-frame creation or random building pop-in.
export const createCityDistricts = scene => {
    const plan=createCityPlan(),root=new THREE.Group();root.name='AllstonDistricts';
    const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(.5,.5,1,7);
    const chunks=new Map(),materials=new Map(),labels=new Map();
    const portals=[],items=[],details=[],entranceCues=[],makeSign=createStoreSignFactory();
    const addDetail=object=>{root.add(object);details.push(object);return object;};
    const cueMaterial=new THREE.LineBasicMaterial({color:0x9fdfd0,fog:true});
    const entranceCue=(portal,z=portal.position.z,facing=portal.isFarBuilding?-1:1)=>{
        const vertices=[-1.1,0,0,-1.1,2.3,0,-1.1,2.3,0,1.1,2.3,0,1.1,2.3,0,1.1,0,0,
            -1.1,0,0,1.1,0,0,-1.1,0,0,-1.1,0,1.2,1.1,0,0,1.1,0,1.2,-1.1,0,1.2,1.1,0,1.2];
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        const cue=new THREE.LineSegments(geometry,cueMaterial);cue.name='CityEntranceCue:'+portal.name;
        cue.position.set(portal.position.x,-.03,z);cue.rotation.y=facing>0?0:Math.PI;
        cue.userData.portalName=portal.name;entranceCues.push(cue);addDetail(cue);
    };
    const material=color=>{
        if(!materials.has(color))materials.set(color,new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(1.5),wireframe:true}));
        return materials.get(color);
    };
    const labelMaterial=text=>{
        if(labels.has(text))return labels.get(text);
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#343f3c';ctx.fillRect(0,0,512,96);
        ctx.strokeStyle='#c2b896';ctx.strokeRect(5,5,502,86);ctx.fillStyle='#eadfc2';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text.toUpperCase(),256,48,480);
        const mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),fog:true});labels.set(text,mat);return mat;
    };
    const chunkFor=(x,z)=>{
        const key=Math.floor((x+500)/80)+','+Math.floor((z+500)/80);
        if(!chunks.has(key))chunks.set(key,{key,batches:new Map(),group:new THREE.Group(),minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
        return chunks.get(key);
    };
    const add=(x,y,z,w,h,d,color,rotation=0,round=false)=>{
        const chunk=chunkFor(x,z),mat=typeof color==='number'?material(color):labelMaterial(color);
        const key=(round?'round:':'box:')+(typeof color==='number'?color:color);
        if(!chunk.batches.has(key))chunk.batches.set(key,{mat,round,transforms:[]});
        const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),new THREE.Vector3(w,h,d));
        chunk.batches.get(key).transforms.push(matrix);
        const radius=Math.hypot(w,d)/2;chunk.minX=Math.min(chunk.minX,x-radius);chunk.maxX=Math.max(chunk.maxX,x+radius);chunk.minZ=Math.min(chunk.minZ,z-radius);chunk.maxZ=Math.max(chunk.maxZ,z+radius);
    };
    const plane=(name,x,z,w,d,color,y=-.14)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.name=name;root.add(mesh);return mesh;};
    for(const road of plan.roads) {
        const horizontal=road.axis==='x',length=road.max-road.min;
        const x=horizontal?0:road.coordinate,z=horizontal?road.coordinate:0;
        for(let p=-465;p<480;p+=56) {
            const crossings=horizontal?CITY_VERTICAL_ROADS:CITY_HORIZONTAL_ROADS;
            if(crossings.some(c=>Math.abs(p-c)<20))continue;
            const px=horizontal?p:x+6,pz=horizontal?z+6:p;
            add(px,3,pz,.16,6,.16,0x464e49);add(px,5.8,pz,1.2,.18,.45,0xc4b993);
            // Parked cars, leaving the junctions open.
            const cx=horizontal?p-10:x+2.5,cz=horizontal?z-2.5:p-10;
            add(cx,.6,cz,3.8,1.1,1.7,0x59645f,horizontal?0:Math.PI/2);
            add(cx,1.25,cz,2.1,.6,1.5,0x3c4b48,horizontal?0:Math.PI/2);
        }
    }
    const palette=[0x785b4d,0x8d7362,0x695b50,0x8a7f69,0x5a6c66,0x7e8171];
    for(let index=0;index<plan.lots.length;index++) {
        const lot=plan.lots[index],{x,z,width:w,depth:d,facing:f}=lot;
        const h=lot.style==='porches'?10.5+(index%2)*.8:lot.height;
        const housing=lot.style==='porches'||(!lot.retail&&lot.style==='park');
        const wall=housing?palette[index%palette.length]:[0x765b50,0x846c59,0x62584e][index%3];
        add(x,h/2,z,w,h,d,wall);
        add(x,h+.25,z,w+.8,.5,d+.8,0x3c4441);
        add(x,h-.6,z,w+.4,.35,d+.4,0xb0a58b);
        add(x+w*.3,h+1,z-2,1.1,2,1.1,0x71584b);
        const front=z+f*(d/2+.08);
        const rows=Math.max(2,Math.floor(h/3.6));
        for(let row=0;row<rows;row++)for(let col=0;col<4;col++) {
            const wx=x-w*.36+col*w*.24,wy=2.5+row*3.2;
            if(row===0&&lot.retail)continue;
            add(wx,wy,front,1.9,2,.15,index%5===0?0x9e997c:0x334744);
            add(wx,wy+1.1,front+f*.04,2.3,.16,.22,0xb8ae94);
            // Side windows prevent featureless walls along side streets.
            if(col===0)for(const side of [-1,1])add(x+side*(w/2+.06),wy,z,.13,1.8,1.6,0x344743);
        }
        if(housing) {
            for(let floor=0;floor<3;floor++) {
                const y=.9+floor*3.2;
                add(x,y,front+f*1.4,w*.65,.23,2.8,0x9a9079);
                for(const side of [-1,1])add(x+side*w*.3,y+1.2,front+f*2.4,.18,2.4,.18,0xb3a98d);
                add(x,y+1,front+f*2.6,w*.66,.15,.15,0xc1b69a);
            }
            for(let step=0;step<3;step++)add(x,.12+step*.15,front+f*(4-step*.7),3,.24+step*.3,.8,0x77796b);
            // A bay window and a crooked curbside moving box.
            add(x-w*.3,4.5,front+f*.4,2.5,5,.8,0x8d9789);
            add(x-w*.3,4.5,front+f*.85,1.7,3.9,.12,0x384e49);
            add(x+6,.45,front+f*4,1.3,.9,1.1,0x9e8c65);
        } else {
            for(const side of [-1,1])add(x+side*w*.27,1.9,front,5.3,2.8,.2,0x2f4541);
            add(x,3.6,front+f*.9,w*.95,.25,1.8,index%2?0x677b6b:0x8a7161);
            const sign=makeSign(lot.name);sign.position.set(x,5.8,front+f*(sign.userData.mount==='blade'?1.9:.8));sign.rotation.y=(f>0?0:Math.PI)+(sign.userData.mount==='blade'?Math.PI/2:0);addDetail(sign);
            // Narrow service alley fixtures behind the shop.
            add(x+6,.7,z-f*(d/2+2),2.2,1.4,1.4,0x40594a);
        }
        add(x,.9,front+.02*f,1.8,1.8,.23,0x554c3b);
        if(lot.enterable) {
            const style=housing?'groton_colonial':lot.style==='music'?'record_store':lot.style==='food'?'pho':lot.style==='nightlife'?'arcade_bar':lot.style==='station'?'bodega':'shop';
            const portal={style,name:lot.name,zoneKey:'CITY_PLAZA',position:new THREE.Vector3(x,2,front+f*1.2),returnPosition:new THREE.Vector3(x,2,front+f*5),returnYaw:f>0?Math.PI:0};
            portals.push(portal);entranceCue(portal,front+f*.2,f);
        }
    }
    const observation=(district,x,z,name,text)=>{
        const item=new THREE.Group();item.name='CityDiscovery:'+district;item.position.set(x,0,z);item.userData={isInteractive:true,name,flavorText:text,district};
        const frameMaterial=new THREE.MeshBasicMaterial({color:0xb2ae8e,wireframe:true,fog:true});
        const post=new THREE.Mesh(new THREE.BoxGeometry(.14,2.8,.14),frameMaterial);post.position.y=1.4;item.add(post);
        const board=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.5,.14),frameMaterial);board.position.y=2.2;item.add(board);
        for(let i=0;i<3;i++) {
            const flyer=new THREE.Mesh(new THREE.PlaneGeometry(.5,.7),new THREE.MeshBasicMaterial({color:[0xb9dfce,0xe6bc98,0xc7b9e7][i],wireframe:true,side:THREE.DoubleSide,fog:true}));
            flyer.position.set((i-1)*.65,2.2+(i%2)*.2,.09);flyer.rotation.z=(i-1)*.13;item.add(flyer);
        }
        addDetail(item);items.push(item);
    };
    // Local identity and street life, with usable paths through each destination.
    for(const district of CITY_DISTRICTS) {
        const x=district.x+117,z=district.z-56;
        add(x,.8,z,4,.4,1.2,0x766b59);add(x,1.4,z+.5,4,.9,.18,0x85765f);
        add(x-4,.8,z,1.1,1.6,1.1,0x4c6054);
        observation(district.key,x+4,z,district.name,{
            porches:'Porches above porches. A couch waits by the curb beside moving boxes. Someone is rehearsing in a basement.',
            apartments:'Brick apartments line the avenue. Rails, a narrow platform, and rows of windows disappear into the haze.',
            music:'Flyers overlap on the rehearsal room doors. A loading alley leads behind the music hall and the record shops.',
            village:'Small shops, corner groceries, laundry, and apartment windows crowd together. Every side street seems to lead to another block.',
            food:'Awnings line the block. Crates and bins collect in the service alleys behind the late-night kitchens.',
            park:'A small neighborhood common, a basketball court, and garden plots tucked between residential streets.',
            nightlife:'Arcade lights and takeaway windows. Last night’s show posters are already covered by the next bill.',
            station:'The Green Line entrance sits among repair shops and a service yard. The suburbs are one train ride away.'
        }[district.kind]);
    }
    // Enclosed common and community garden in the southwest.
    plane('NeighborhoodCommon',-344,-385,104,70,0x536653,-.22);
    plane('BasketballCourt',-344,-385,28,44,0x696653,-.20);
    for(const z of [-403,-367]) {
        add(-344,2.8,z,.18,5.6,.18,0x606960);add(-344,4.5,z+1,2,1.2,.15,0xb4ad96);
        add(-344,4,z+1.4,1,.1,.7,0xa78864);
    }
    for(const x of [-380,-306])for(const z of [-406,-370]){add(x,.65,z,4,.25,1,0x84745c);add(x,1.2,z+.4,4,.8,.13,0x84745c);}
    for(let i=0;i<8;i++){const x=-473+(i%2)*17,z=-409+Math.floor(i/2)*15;add(x,.2,z,11,.4,9,0x6e5c42);add(x,.7,z,8,1,6,0x506b47);}
    // Transit and music landmarks, deliberately low-rise.
    for(const x of [-357.8,-330.2])add(x,-.18,-385,.12,.015,43,0xbab8a5);
    for(const z of [-406.8,-385,-363.2])add(-344,-.18,z,27.6,.015,.12,0xbab8a5);
    const centerRing=new THREE.Mesh(new THREE.RingGeometry(4.8,5,32),new THREE.MeshBasicMaterial({color:0xbab8a5}));
    centerRing.rotation.x=-Math.PI/2;centerRing.position.set(-344,-.17,-385);root.add(centerRing);
    for(const x of [-388,-300])for(const z of [-412,-382,-356]) {
        add(x,2,z,.45,4,.45,0x665a46,0,true);
        add(x,5,z,5,4,5,0x596c50);add(x+1,6.5,z,3,2.5,3,0x60765a);
    }
    for(const z of [342.8,345.2])plane('GreenLineRail',0,z,150,.12,0xa6a998,-.085);
    plane('GreenLinePlatform',120,354,24,3.5,0x9a9783,-.08);
    add(120,2.5,355,.14,5,.14,0x4c6852);add(120,4,355,2,1.4,.13,'GREEN LINE',0);
    plane('StationForecourt',333,-290,48,32,0x737b6c,-.2);
    for(const x of [313,353]){add(x,.65,-278,5,.25,1,0x897a60);add(x,1.2,-277.6,5,.9,.12,0x897a60);}
    plane('MusicLoadingAlley',350,373,58,5,0x4c524b,-.13);
    for(let i=0;i<5;i++)add(335+i*3,1.8,377.7,1.6,2.2,.1,['LIVE MUSIC','FRIDAY','BASEMENT SHOW','OPEN MIC','SATURDAY'][i],Math.PI);
    // Assemble shared geometry into small spatial batches. All are resident before a teleport.
    for(const chunk of chunks.values()) {
        chunk.group.name='CityBlock:'+chunk.key;
        for(const batch of chunk.batches.values()) {
            const mesh=new THREE.InstancedMesh(batch.round?cylinder:cube,batch.mat,batch.transforms.length);
            batch.transforms.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();chunk.group.add(mesh);
        }
        root.add(chunk.group);
    }
    const update=camera=>{
        const distances=cityVisibilityDistances(camera.aspect,camera.fov);
        for(const chunk of chunks.values()) {
            const dx=Math.max(chunk.minX-camera.position.x,0,camera.position.x-chunk.maxX);
            const dz=Math.max(chunk.minZ-camera.position.z,0,camera.position.z-chunk.maxZ);
            const limit=chunk.group.visible?distances.keep:distances.load;
            chunk.group.visible=Math.hypot(dx,dz)<limit;
        }
        updateDetailVisibility(details,camera,distances);
    };
    const signExistingBusinesses=existing=>{
        for(const portal of existing) {
            entranceCue(portal);
            if(portal.isFarBuilding)continue;
            const sign=makeSign(portal.name);sign.position.set(portal.position.x,5.7,portal.position.z+(sign.userData.mount==='blade'?1.9:.6));sign.rotation.y=sign.userData.mount==='blade'?Math.PI/2:0;addDetail(sign);
        }
    };
    root.userData.plan=plan;root.userData.chunks=[...chunks.values()];root.userData.distanceDetails=details;root.userData.entranceCues=entranceCues;
    scene.add(root);
    return {group:root,update,buildingPortals:portals,interactiveItems:items,signExistingBusinesses,plan};
};
