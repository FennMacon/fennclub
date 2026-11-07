import {CITY_HORIZONTAL_ROADS,CITY_VERTICAL_ROADS} from './city-layout.js';

export const cityRoadDefinitions = () => [
    ...CITY_HORIZONTAL_ROADS.map(z=>({axis:'x',coordinate:z,width:[-443,-223,-110,110,223,443].includes(z)?8:12,sidewalk:[-443,-223,-110,110,223,443].includes(z)?3:6})),
    ...CITY_VERTICAL_ROADS.map(x=>({axis:'z',coordinate:x,width:Math.abs(x)===410?8:12,sidewalk:Math.abs(x)===410?3:6}))
];
export const citySurfaceAt=(x,z,roads=cityRoadDefinitions())=>{
    if(roads.some(r=>Math.abs((r.axis==='x'?z:x)-r.coordinate)<r.width/2))return 'asphalt';
    if(roads.some(r=>Math.abs((r.axis==='x'?z:x)-r.coordinate)<r.width/2+r.sidewalk))return 'sidewalk';
    return null;
};
// Partition the union into disjoint rectangles. An intersection has one surface, not stacked patches.
export const createCitySurfacePlan=()=>{
    const roads=cityRoadDefinitions(),xs=new Set([-500,500]),zs=new Set([-500,500]);
    for(const r of roads)for(const offset of [-r.width/2-r.sidewalk,-r.width/2,r.width/2,r.width/2+r.sidewalk])
        (r.axis==='x'?zs:xs).add(r.coordinate+offset);
    const x=[...xs].sort((a,b)=>a-b),z=[...zs].sort((a,b)=>a-b),rectangles=[];
    for(let row=0;row<z.length-1;row++){
        let run=null;
        for(let col=0;col<x.length-1;col++){
            const type=citySurfaceAt((x[col]+x[col+1])/2,(z[row]+z[row+1])/2,roads);
            if(run&&run.type===type&&run.right===x[col])run.right=x[col+1];
            else {if(run)rectangles.push(run);run=type?{type,left:x[col],right:x[col+1],front:z[row],back:z[row+1]}:null;}
        }
        if(run)rectangles.push(run);
    }
    return {roads,rectangles};
};
export const cityMarkingSegments=(road,roads=cityRoadDefinitions())=>{
    const crossing=roads.filter(r=>r.axis!==road.axis).sort((a,b)=>a.coordinate-b.coordinate),ranges=[];
    let start=-500;
    for(const cross of crossing){const lo=cross.coordinate-cross.width/2-1,hi=cross.coordinate+cross.width/2+1;if(lo>start)ranges.push([start,lo]);start=hi;}
    if(start<500)ranges.push([start,500]);return ranges;
};
