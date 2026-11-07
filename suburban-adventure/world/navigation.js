import {UNIFIED_MAP_ZONES,CITY_MAP_ZONES,getBusStopArrivalPosition} from '../scenes.js';
import {CITY_DISTRICTS} from './city-layout.js';
import {safeExteriorPosition} from './traversal.js';

const suburbNames={ZONE_NW:'North river',FOREST_SUBURBAN:'Forest plaza',ZONE_NE:'Woodland mansion',ZONE_W:'River walk',PLAZA:'Massachusetts Plaza',ZONE_E:'Carnival',ZONE_SW:'River & subway',POND:'The pond',ZONE_SE:'Forest clearings'};
export const getAreaInfo=(map,position)=>{
    const zones=map==='city'?CITY_MAP_ZONES:UNIFIED_MAP_ZONES;
    const zone=zones.reduce((a,b)=>Math.hypot(position.x-a.x,position.z-a.z)<Math.hypot(position.x-b.x,position.z-b.z)?a:b);
    return {...zone,name:map==='city'?CITY_DISTRICTS.find(d=>d.key===zone.key).name:suburbNames[zone.key]};
};
export const getTravelPosition=(map,key)=>{
    const zone=(map==='city'?CITY_MAP_ZONES:UNIFIED_MAP_ZONES).find(zone=>zone.key===key);
    if(!zone)return null;
    if(['PLAZA','FOREST_SUBURBAN','POND','CITY_PLAZA','CITY_N','CITY_S'].includes(key))return getBusStopArrivalPosition(key);
    const custom={ZONE_NW:[-290,340],ZONE_W:[-290,20],ZONE_SW:[-290,-328],ZONE_NE:[397,430],ZONE_E:[205,24],ZONE_SE:[250,-352]};
    const [x,z]=custom[key]||[zone.x,zone.z+11];
    return {x,y:2,z};
};
export function findSafeArrival(position,rects) {
    if(safeExteriorPosition(position,rects))return position;
    for(let radius=2;radius<=40;radius+=2)for(let i=0;i<16;i++) {
        const angle=i*Math.PI/8,candidate={x:position.x+Math.cos(angle)*radius,y:2,z:position.z+Math.sin(angle)*radius};
        if(safeExteriorPosition(candidate,rects))return candidate;
    }
    return null;
}
