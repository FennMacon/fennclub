// A single non-overlapping partition for finite road corridors and their sidewalks.
export const roadSurfaceAt=(x,z,roads)=>{
    const contains=(road,padding)=>{
        const along=road.axis==='x'?x:z,across=road.axis==='x'?z:x;
        return along>=(road.min??-500)&&along<=(road.max??500)&&Math.abs(across-road.coordinate)<road.width/2+padding;
    };
    if(roads.some(r=>contains(r,0)))return 'asphalt';
    if(roads.some(r=>contains(r,r.sidewalk)))return 'sidewalk';
    return null;
};
export const partitionRoadSurfaces=roads=>{
    const xs=new Set([-500,500]),zs=new Set([-500,500]);
    for(const road of roads){
        const along=road.axis==='x'?xs:zs,across=road.axis==='x'?zs:xs;
        along.add(road.min??-500);along.add(road.max??500);
        for(const offset of [-road.width/2-road.sidewalk,-road.width/2,road.width/2,road.width/2+road.sidewalk])across.add(road.coordinate+offset);
    }
    const x=[...xs].sort((a,b)=>a-b),z=[...zs].sort((a,b)=>a-b),rectangles=[];
    for(let row=0;row<z.length-1;row++){
        let run=null;
        for(let col=0;col<x.length-1;col++){
            const type=roadSurfaceAt((x[col]+x[col+1])/2,(z[row]+z[row+1])/2,roads);
            if(run&&run.type===type&&run.right===x[col])run.right=x[col+1];
            else {if(run)rectangles.push(run);run=type?{type,left:x[col],right:x[col+1],front:z[row],back:z[row+1]}:null;}
        }
        if(run)rectangles.push(run);
    }
    return {roads,rectangles};
};
