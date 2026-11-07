// One target drives the prompt and the action on both input systems.
export function selectInteractionTarget(position, forward, candidates) {
    let selected=null,best=Infinity;
    for(const candidate of candidates) {
        const dx=candidate.position.x-position.x,dz=candidate.position.z-position.z;
        const distance=Math.hypot(dx,dz);
        if(distance>=candidate.radius)continue;
        const facing=distance>.001?(dx*forward.x+dz*forward.z)/distance:1;
        // At a threshold, allow turning around or using a door immediately beside you.
        if(distance>1.25&&facing<-.15&&!(candidate.type==='exit'&&distance<2.5))continue;
        const score=distance-Math.max(0,facing)*.9+(candidate.type==='npc'?-.2:0);
        if(score<best) { best=score;selected={...candidate,distance}; }
    }
    return selected;
}
