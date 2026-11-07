export const WORLD_LIMIT=493;
export const PLAYER_RADIUS=.45;
export const pointInFootprint=(point,rect,padding=PLAYER_RADIUS)=>
    point.x>rect.minX-padding&&point.x<rect.maxX+padding&&point.z>rect.minZ-padding&&point.z<rect.maxZ+padding;

export function resolveExteriorMovement(previous,desired,rects=[]) {
    let x=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,previous.x));
    let z=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,previous.z));
    const end={x:Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,desired.x)),z:Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,desired.z))};
    const steps=Math.max(1,Math.ceil(Math.hypot(end.x-x,end.z-z)/.25));
    const dx=(end.x-x)/steps,dz=(end.z-z)/steps;
    // Existing developer teleports and old saves may begin inside a facade. Allow escape.
    const active=rects.filter(rect=>!pointInFootprint(previous,rect));
    for(let i=0;i<steps;i++) {
        if(!active.some(rect=>pointInFootprint({x:x+dx,z},rect)))x+=dx;
        if(!active.some(rect=>pointInFootprint({x,z:z+dz},rect)))z+=dz;
    }
    return {x,z};
}

export function safeExteriorPosition(position,rects=[]) {
    if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return false;
    return Math.abs(position.x)<=WORLD_LIMIT&&Math.abs(position.z)<=WORLD_LIMIT&&!rects.some(rect=>pointInFootprint(position,rect,.8));
}

export function safeInteriorPosition(position,bounds,obstacles=[]) {
    return position&&bounds&&Number.isFinite(position.x)&&Number.isFinite(position.z)
        &&position.x>=bounds.minX&&position.x<=bounds.maxX&&position.z>=bounds.minZ&&position.z<=bounds.maxZ
        &&!obstacles.some(rect=>Math.abs(position.x-rect.x)<rect.width/2+.5&&Math.abs(position.z-rect.z)<rect.depth/2+.5);
}
export function findSafeInteriorArrival(position,bounds,obstacles=[]) {
    if(safeInteriorPosition(position,bounds,obstacles))return {x:position.x,y:2,z:position.z};
    const entry={x:0,y:2,z:Math.min(20,bounds.maxZ-1)};
    if(safeInteriorPosition(entry,bounds,obstacles))return entry;
    for(let radius=1;radius<50;radius++)for(let i=0;i<16;i++) {
        const point={x:Math.cos(i*Math.PI/8)*radius,y:2,z:entry.z+Math.sin(i*Math.PI/8)*radius};
        if(safeInteriorPosition(point,bounds,obstacles))return point;
    }
    return entry;
}
