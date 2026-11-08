import { POND_SHORE } from './pond-layout.js';
/** Smooth woodland centerlines, shared by ground ribbons and tree clearance. */
export const sampleTrail = (points, steps = 20) => {
    if(points.length<2) return points.map(p=>({...p}));
    const closed=Math.hypot(points[0].x-points.at(-1).x,points[0].z-points.at(-1).z)<1e-6;
    const count=points.length-1;
    const samples = [];
    const interpolate = (a,b,c,d,t) => .5 * (2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
    for(let i=0;i<points.length-1;i++) {
        const a=points[closed ? (i+count-1)%count : Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[closed ? (i+2)%count : Math.min(points.length-1,i+2)];
        for(let step=0;step<steps;step++) {
            const t=step/steps;
            samples.push({x:interpolate(a.x,b.x,c.x,d.x,t),z:interpolate(a.z,b.z,c.z,d.z,t)});
        }
    }
    if(points.length) samples.push({...points.at(-1)});
    return samples;
};
export const nearTrail = (x,z,samples,radius=4.5) => samples.some(p => (x-p.x)**2+(z-p.z)**2<radius**2);

// Trail mouths meet the outside edges of the sidewalks (road center: local z=61).
export const POND_TRAILS = {
    pond: [{x:-15,z:73},{x:-29,z:84},{x:-24,z:102},{x:-10,z:113},POND_SHORE[24]],
    campsite: [{x:35,z:49},{x:24,z:35},{x:30,z:18},{x:24,z:0},{x:31,z:-16},{x:40,z:-20}],
    shore: POND_SHORE
};
