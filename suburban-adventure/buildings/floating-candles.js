import * as THREE from 'three';
import { roomCenter } from './mansion-layout.js';

export const createFloatingCandles = group => {
    // One real light per chamber keeps the mobile light count bounded.
    const wax=new THREE.MeshLambertMaterial({color:0xffe1ab});
    const flameMaterial=new THREE.MeshBasicMaterial({color:0xffd184});
    const candles=[],lights=[];
    for(let room=0;room<9;room++) {
        const c=roomCenter(room);
        const light=new THREE.PointLight(0xffcd91,18,24,1.2);
        light.position.set(c.x,3.2,c.z);light.name='FloatingCandleLight';group.add(light);lights.push(light);
        for(let i=0;i<3;i++) {
            const candle=new THREE.Group();candle.name='FloatingCandle';
            const angle=i*Math.PI*2/3+room*.3;
            const height=3+i*.45;
            candle.position.set(c.x+Math.cos(angle)*2.2,height,c.z+Math.sin(angle)*2.2);
            const body=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.7,8),wax);candle.add(body);
            const flame=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),flameMaterial);
            flame.scale.y=1.8;flame.position.y=.48;candle.add(flame);
            const halo=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),new THREE.MeshBasicMaterial({color:0xffb95b,transparent:true,opacity:.12,depthWrite:false}));
            halo.position.y=.48;candle.add(halo);group.add(candle);
            candles.push({group:candle,height,phase:room+i*2});
        }
    }
    const fill=new THREE.HemisphereLight(0xffe2bb,0x665246,.65);fill.name='MansionWarmFill';group.add(fill);
    let time=0;
    const update=delta=>{
        time+=Math.min(delta,.1);
        candles.forEach(c=>c.group.position.y=c.height+Math.sin(time*.8+c.phase)*.14);
        lights.forEach((light,i)=>light.intensity=18*(1+.035*Math.sin(time*2.1+i)));
    };
    group.userData.floatingCandles=candles;group.userData.candleLights=lights;
    return update;
};
