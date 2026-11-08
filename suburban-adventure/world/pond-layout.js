// Coordinates are local to POND's front group; the steam stays centered at (0,150).
export const POND_CENTER = { x: 0, z: 150 };
export const POND_SEGMENTS = [
    { x: 2, z: 0, rx: 21.6, rz: 12.6 },
    { x: -12, z: 8, rx: 6.4, rz: 9.6 },
    { x: 15, z: -5, rx: 7.8, rz: 3.6 },
    { x: -8, z: -12, rx: 4.5, rz: 5.5 }
];
export const pondRadiusAt = angle => {
    const dx = Math.cos(angle), dz = Math.sin(angle);
    return Math.max(...POND_SEGMENTS.map(({x,z,rx,rz}) => {
        const a = dx*dx/(rx*rx) + dz*dz/(rz*rz);
        const b = -2*(dx*x/(rx*rx) + dz*z/(rz*rz));
        const c = x*x/(rx*rx) + z*z/(rz*rz) - 1;
        const discriminant = b*b - 4*a*c;
        return discriminant < 0 ? 0 : (-b + Math.sqrt(discriminant))/(2*a);
    }));
};
export const pondOutline = (padding = 0, steps = 96) => Array.from({length:steps},(_,i) => {
    const angle = i/steps*Math.PI*2, radius = pondRadiusAt(angle)+padding;
    return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius};
});
const boundary = pondOutline(0,192);
export const distanceToPondEdge = (x,z) => Math.min(...boundary.map((a,i) => {
    const b=boundary[(i+1)%boundary.length],dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
}));
export const POND_SHORE = Array.from({length:33},(_,i) => {
    const angle=i/32*Math.PI*2;
    let radius=pondRadiusAt(angle)+7.5+0.6*Math.sin(angle*3);
    // Check against the whole irregular shoreline, including neighboring inlets.
    while(distanceToPondEdge(Math.cos(angle)*radius,Math.sin(angle)*radius)<7)radius+=.25;
    return {x:Math.cos(angle)*radius,z:POND_CENTER.z+Math.sin(angle)*radius};
});
export const POND_NEIGHBORS = {
    Maya: {x:46,z:-17}, Jake:{x:54,z:-16},
    Alex:{x:-4,z:123}, Sam:{x:0,z:122}, Casey:{x:63,z:-36}
};
