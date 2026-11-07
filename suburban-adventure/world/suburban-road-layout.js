import {CONNECTOR_X,SUBURBAN_ZONE_STREET_X_MIN,SUBURBAN_ZONE_STREET_X_MAX,VERTICAL_BOUNDS} from '../roads.js';
import {SCENE_CONFIGS,UNIFIED_MAP_ZONE_OFFSETS} from '../scenes.js';
import {roadSurfaceAt,partitionRoadSurfaces} from './road-surfaces.js';
export const suburbanRoadDefinitions=()=>[
    ...['PLAZA','FOREST_SUBURBAN','POND'].map(key=>({id:key,axis:'x',coordinate:UNIFIED_MAP_ZONE_OFFSETS[key].z+SCENE_CONFIGS[key].STREET_Z,width:12,sidewalk:6,min:SUBURBAN_ZONE_STREET_X_MIN,max:SUBURBAN_ZONE_STREET_X_MAX})),
    ...[CONNECTOR_X.LEFT,CONNECTOR_X.RIGHT].map(x=>({id:x<0?'WEST':'EAST',axis:'z',coordinate:x,width:12,sidewalk:6,min:VERTICAL_BOUNDS.zMin,max:VERTICAL_BOUNDS.zMax}))
];
export const createSuburbanSurfacePlan=()=>partitionRoadSurfaces(suburbanRoadDefinitions());
export const suburbanSurfaceAt=(x,z)=>roadSurfaceAt(x,z,suburbanRoadDefinitions());
export const suburbanMarkingSegments=(road,offset=0,roads=suburbanRoadDefinitions())=>{
    const cuts=roads.filter(r=>r.axis!==road.axis).filter(cross=>{
        if(road.axis==='z'&&offset<0&&cross.min>road.coordinate)return false; // Keep the outside edge of a west-side T junction.
        return cross.coordinate+cross.width/2>=road.min&&cross.coordinate-cross.width/2<=road.max
            &&road.coordinate+road.width/2>=cross.min&&road.coordinate-road.width/2<=cross.max;
    }).map(r=>[r.coordinate-r.width/2-1,r.coordinate+r.width/2+1]).sort((a,b)=>a[0]-b[0]);
    const ranges=[];let start=road.min;
    for(const [lo,hi] of cuts){if(lo>start)ranges.push([start,Math.min(lo,road.max)]);start=Math.max(start,hi);}
    if(start<road.max)ranges.push([start,road.max]);return ranges.filter(([lo,hi])=>hi>lo);
};
