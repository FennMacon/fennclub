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

// Coordinates are local to the pond's front group (road is at local z=61).
export const POND_TRAILS = {
    pond: [{x:-15,z:61},{x:-29,z:80},{x:-24,z:102},{x:-7,z:112},{x:0,z:130}],
    campsite: [{x:35,z:61},{x:22,z:41},{x:35,z:18},{x:29,z:-2},{x:44,z:-16}],
    shore: Array.from({length:17},(_,i)=>{
        const a=i/16*Math.PI*2,r=25+1.5*Math.sin(a*3);
        return {x:Math.cos(a)*r,z:150+Math.sin(a)*r*.86};
    })
};
