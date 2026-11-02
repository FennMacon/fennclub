/** Browser/Node game rules. All transitions return new state; no DOM or storage access. */
import {createEngine as createLegacyEngine} from './engine-v1.js';
export const SAVE_VERSION = 2;
export const PERIODS = Object.freeze(Object.fromEntries(
  [['morning',480,180],['lunch',660,180],['afternoon',840,180],['evening',1020,180],['night',1200,240]]
    .map(([id,start,duration]) => [id,Object.freeze({start,duration})])));
const copy = value => JSON.parse(JSON.stringify(value));
const fail = message => { throw new Error(message); };
const integer = (n,min,max) => Number.isSafeInteger(n) && n >= min && n <= max;
export const careStage = health => health <= 0 ? 0 : health <= 200 ? 4 : health <= 400 ? 3 : health <= 600 ? 2 : health <= 800 ? 1 : 0;
function rng(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, n | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Bounded sampling; weights are recalculated after each selection.
export function weightedSample(items,count,random) {
  const pool = items.filter(e => e.weight > 0).slice(), result = [];
  while (result.length < count && pool.length) {
    const total = pool.reduce((sum,e) => sum + e.weight,0);
    let target = random() * total, index = pool.length - 1;
    for (let i=0;i<pool.length;i++) { target -= pool[i].weight; if (target < 0) { index=i; break; } }
    result.push(pool.splice(index,1)[0]);
  }
  return result;
}
// Python's round uses ties-to-even, unlike Math.round.
const round = n => n % 1 === 0.5 ? 2 * Math.round(n / 2) : Math.round(n);
export function createEngine(definitions) {
  const events = copy(definitions), byId = new Map();
  if (!Array.isArray(events) || !events.length) fail('An event catalogue is required.');
  for (const e of events) {
    if (!e || typeof e.id !== 'string' || byId.has(e.id) || typeof e.title !== 'string' ||
        !(Object.hasOwn(PERIODS,e.period) || e.period === 'any') || !integer(e.duration,1,960) ||
        !['activity','care','setup','grief','emotion'].includes(e.kind) || typeof e.shared !== 'boolean' ||
        (e.unexpected !== undefined && typeof e.unexpected !== 'boolean') ||
        (e.unexpected && (!Number.isFinite(e.incidentChance) || e.incidentChance<0 || e.incidentChance>1 || (e.period==='any' ? e.kind!=='emotion'||e.duration>180 : e.duration>PERIODS[e.period].duration))) ||
        typeof e.hospitalPenalty !== 'boolean' || !Number.isFinite(e.weight) || e.weight < 0 || e.weight > 1000 ||
        !Number.isFinite(e.risk) || e.risk < 0 || e.risk > 1 ||
        (['care','setup'].includes(e.kind) && !integer(e.stage,1,4)) ||
        (e.kind === 'care' && !['morning','night'].includes(e.period)) ||
        (e.kind === 'grief' && !integer(e.dayOffset,1,365)) ||
        (e.kind === 'emotion' && (!e.unexpected || !integer(e.emotionStage,0,5) || !['any','lunch','afternoon','evening'].includes(e.period)))) fail('Invalid event catalogue.');
    byId.set(e.id,e);
  }
  function supplements(state,period) {
    return events.filter(e=>e.introduced===4 && e.kind==='activity' && !e.unexpected &&
      (e.period===period || e.period==='any') && (state.deathDay===null || !e.shared) && e.weight>0).map(e=>e.id);
  }
  function stateStage(state) {
    const h=state.dayStartFatherHealth;
    return state.rulesVersion===3?careStage(h):h<=0?0:h<200?4:h<400?3:h<600?2:h<800?1:0;
  }
  function griefCompleted(state) {
    return state.completedGrief ?? events.filter(e=>e.kind==='grief' && state.deathDay!==null && e.dayOffset<state.day-state.deathDay).map(e=>e.id);
  }
  function options(state) {
    if (state.legacyPlanningDay) {
      const legacyState={...state,version:1,phase:'planning',fatherHealth:state.dayStartFatherHealth,
        playerHealth:state.summary?.oldPlayerHealth ?? state.playerHealth,plan:[],summary:null};
      return Object.fromEntries(Object.entries(createLegacyEngine(definitions.filter(e=>!e.introduced)).getOptions(legacyState))
        .map(([period,ids])=>[period,[...ids.filter(id=>!byId.get(id).unexpected),...supplements(state,period)]]));
    }
    const random = rng((state.seed ^ Math.imul(state.day,2654435761)) >>> 0);
    const alive = state.deathDay === null, stage = stateStage(state);
    const available = events.filter(e => !e.unexpected).filter(e => e.kind === 'care' ? alive && e.stage === stage :
      e.kind === 'setup' ? alive && e.stage <= stage && !state.completedSetups.includes(e.id) :
      e.kind === 'grief' ? !alive && state.day - state.deathDay >= e.dayOffset && !griefCompleted(state).includes(e.id) : alive || !e.shared);
    return Object.fromEntries(Object.keys(PERIODS).map(period => {
      const pool = available.filter(e => !e.introduced && (e.period === period || e.period === 'any'));
      const required = pool.filter(e => e.kind !== 'activity');
      return [period,[...required,...weightedSample(pool.filter(e => e.kind === 'activity'),Math.max(0,6-required.length),random)].map(e => e.id).concat(supplements(state,period))];
    }));
  }
  function incidents(state) {
    if (state.dayStartFatherHealth === 0) return [];
    const random=rng((state.seed ^ Math.imul(state.day,3266489917)) >>> 0);
    const pool=events.filter(e => e.kind==='activity' && e.unexpected && e.incidentChance > 0);
    const chance=Math.min(0.25,pool.reduce((sum,e)=>sum+e.incidentChance,0)*(1+stateStage(state)*0.25));
    if (!pool.length || random() >= chance) return [];
    const [event]=weightedSample(pool.map(e=>({...e,weight:e.incidentChance})),1,random);
    return [{eventId:event.id,period:event.period,minute:0}];
  }
  function emotions(state,medical=incidents(state)) {
    const stage=state.deathDay===null?stateStage(state):5;
    const pool=events.filter(e=>e.kind==='emotion' && e.emotionStage===stage && e.incidentChance>0);
    const random=rng((state.seed ^ Math.imul(state.day,668265263))>>>0),result=[];
    for(const period of ['lunch','afternoon','evening']){
      const eligible=pool.filter(e=>e.period==='any'||e.period===period);
      const chance=Math.min(0.8,eligible.reduce((n,e)=>n+e.incidentChance,0));
      if(!eligible.length || random()>=chance)continue;
      const remaining=eligible.filter(e=>!result.some(item=>item.eventId===e.id));
      if(!remaining.length)break;
      const [event]=weightedSample(remaining.map(e=>({...e,weight:e.incidentChance})),1,random);
      const start=PERIODS[period].start,end=start+event.duration;
      if(medical.some(item=>{const a=PERIODS[item.period].start+item.minute;return start<a+byId.get(item.eventId).duration&&a<end;}))continue;
      result.push({eventId:event.id,period,minute:0});
    }
    return result;
  }
  function pack(state,choices,interruptions=[]) {
    if (!Array.isArray(choices) || choices.length > events.length) fail('Invalid activities.');
    const available=options(state), used=new Set(), placed=[], displaced=[];
    const ordered=choices.map(item=>{
      const preferredPeriod=item.preferredPeriod ?? item.period, e=byId.get(item.eventId);
      if (!e || !available[preferredPeriod]?.includes(e.id)) fail('Event is not available in that period.');
      if (used.has(e.id)) fail('An event can only be scheduled once per day.');
      used.add(e.id);
      return {eventId:e.id,preferredPeriod};
    }).sort((a,b)=>PERIODS[a.preferredPeriod].start-PERIODS[b.preferredPeriod].start);
    const interval=item=>{
      const start=PERIODS[item.period].start+item.minute;
      return {...item,start,end:start+byId.get(item.eventId).duration};
    };
    const overlaps=(a,b)=>a.start<b.end && b.start<a.end;
    placed.push(...interruptions.map(interval));
    for (const item of ordered.filter(item=>byId.get(item.eventId).kind==='care')) {
      const e=byId.get(item.eventId), period=item.preferredPeriod;
      const fixed=interval({...item,period,minute:period==='night'?240-e.duration:0});
      if (placed.some(other=>overlaps(fixed,other))) displaced.push(item); else placed.push(fixed);
    }
    for(const group of [ordered.filter(item=>['setup','grief'].includes(byId.get(item.eventId).kind)),ordered.filter(item=>!['care','setup','grief'].includes(byId.get(item.eventId).kind))]){
    let cursor=480;
    for (const item of group) {
      const duration=byId.get(item.eventId).duration;
      let start=Math.max(cursor,PERIODS[item.preferredPeriod].start);
      for (const fixed of placed.slice().sort((a,b)=>a.start-b.start)) {
        if (start<fixed.end && start+duration>fixed.start) start=fixed.end;
      }
      if (start+duration>1440) {displaced.push(item);continue;}
      const period=Object.keys(PERIODS).find(part=>start>=PERIODS[part].start && start<PERIODS[part].start+PERIODS[part].duration);
      placed.push({...item,period,minute:start-PERIODS[period].start,start,end:start+duration});cursor=start+duration;
    }
    }
    return {plan:placed.sort((a,b)=>a.start-b.start).map(({start,end,...item})=>item),displaced};
  }
  function withSetups(state,choices) {
    if(!Array.isArray(choices))fail('Invalid activities.');
    const setups=Object.entries(options(state)).flatMap(([period,ids])=>ids.filter(id=>['setup','grief'].includes(byId.get(id).kind)).map(eventId=>({eventId,period})));
    return [...setups,...choices.filter(item=>!['setup','grief'].includes(byId.get(item.eventId)?.kind))];
  }
  function arrange(state,choices) {
    assertState(state);
    if (state.phase!=='planning') fail('This day has already ended.');
    const result=pack(state,withSetups(state,choices));
    if (result.displaced.length) fail('There is not enough time left. Remove an activity to make room.');
    return {...copy(state),plan:result.plan};
  }
  function prepareDay(state) {
    assertState(state);
    if(state.phase!=='planning') return copy(state);
    const required=Object.entries(options(state)).flatMap(([period,ids])=>ids.filter(id=>['care','setup','grief'].includes(byId.get(id).kind)).map(eventId=>({eventId,period})));
    const result=pack(state,[...required,...state.plan.filter(item=>!['care','setup','grief'].includes(byId.get(item.eventId).kind))]);
    return {...copy(state),completedGrief:griefCompleted(state).slice(),plan:result.plan};
  }
  function validatePlan(state,plan) {
    if (!Array.isArray(plan) || plan.length > events.length) fail('Invalid schedule.');
    const available = options(state), used = new Set();
    const normalized = plan.map(item => {
      if (!item || typeof item.eventId !== 'string') fail('Invalid schedule item.');
      const e = byId.get(item.eventId), period = Object.hasOwn(PERIODS,item.period) ? PERIODS[item.period] : null;
      const preferred=item.preferredPeriod ?? item.period;
      const incident=state.phase==='summary' && [...(state.summary?.incidents??[]),...(state.summary?.emotions??[])].some(i=>i.eventId===item.eventId && i.period===item.period && i.minute===item.minute);
      const historical=state.phase==='summary' && state.summary?.legacy && e?.unexpected;
      if (!e || !period || (!incident && !historical && !available[preferred]?.includes(e.id))) fail('Event is not available in that period.');
      if (!incident && !historical && (!Object.hasOwn(PERIODS,preferred) || period.start+item.minute<PERIODS[preferred].start)) fail('An activity cannot start before its chosen period.');
      if (used.has(e.id)) fail('An event can only be scheduled once per day.');
      used.add(e.id);
      if (!integer(item.minute,0,period.duration-1)) fail('Invalid start minute.');
      const start = period.start + item.minute, end = start + e.duration;
      if (end > 1440) fail('An activity cannot extend past midnight.');
      if (e.kind === 'care' && (item.period === 'morning' ? item.minute !== 0 : end !== 1440)) fail('Care must start the morning or finish the night.');
      return {eventId:e.id,period:item.period,minute:item.minute,...(item.preferredPeriod ? {preferredPeriod:item.preferredPeriod} : {}),start,end};
    }).sort((a,b) => a.start-b.start);
    for (let i=1;i<normalized.length;i++) if (normalized[i].start < normalized[i-1].end) fail('Activities overlap.');
    return normalized.map(({start,end,...item}) => item);
  }
  function assertState(s) {
    if (!s || (s.rulesVersion!==undefined&&s.rulesVersion!==3) || s.version !== SAVE_VERSION || !integer(s.seed,0,4294967295) || !integer(s.day,1,1000000) ||
      (s.legacyPlanningDay !== undefined && typeof s.legacyPlanningDay !== 'boolean') || !['planning','summary'].includes(s.phase) || !integer(s.playerHealth,0,1000) || !integer(s.fatherHealth,0,1000) ||
      !integer(s.dayStartFatherHealth,0,1000) || !(s.deathDay === null || integer(s.deathDay,1,s.day)) ||
      (s.fatherHealth === 0) !== (s.deathDay !== null) ||
      !Array.isArray(s.completedSetups) || new Set(s.completedSetups).size !== s.completedSetups.length ||
      s.completedSetups.some(id => byId.get(id)?.kind !== 'setup') ||
      (s.completedGrief!==undefined && (!Array.isArray(s.completedGrief)||new Set(s.completedGrief).size!==s.completedGrief.length||s.completedGrief.some(id=>byId.get(id)?.kind!=='grief'))) ||
      (s.phase === 'planning' && (s.fatherHealth !== s.dayStartFatherHealth || s.playerHealth === 0)) ||
      (s.phase === 'planning' && s.summary !== null)) fail('Invalid or unsupported save.');
    if (s.phase === 'summary') {
      const r=s.summary;
      if (!r || !Array.isArray(r.incidents) || !Array.isArray(r.displaced) ||
        r.displaced.some(item=>!byId.has(item.eventId) || !Object.hasOwn(PERIODS,item.preferredPeriod)) ||
        (!r.legacy && !r.timelineRules && JSON.stringify(r.incidents)!==JSON.stringify(incidents(s))) ||
        (r.timelineRules && (!Array.isArray(r.emotions) || r.incidents.some(item=>!incidents(s).some(e=>JSON.stringify(e)===JSON.stringify(item))) || r.emotions.some(item=>!emotions({...s,deathDay:r.fatherDied?null:s.deathDay}).some(e=>JSON.stringify(e)===JSON.stringify(item)))))) fail('Invalid incident summary.');
      if(r.timelineRules && r.cutoff!==null){
        const c=r.cutoff;
        if(!c || !integer(c.minute,480,1440) || !['death','milestone'].includes(c.reason) ||
          (c.reason==='death' ? c.threshold!==0 || s.fatherHealth!==0 : ![800,600,400,200].includes(c.threshold) || s.fatherHealth<=0 || s.fatherHealth>c.threshold) ||
          s.plan.some(item=>!PERIODS[item.period] || !byId.has(item.eventId) || PERIODS[item.period].start+item.minute+byId.get(item.eventId).duration>c.minute))fail('Invalid day interruption.');
      }
      if (!r || r.day !== s.day || !integer(r.oldPlayerHealth,1,1000) || r.oldFatherHealth !== s.dayStartFatherHealth ||
        r.playerLoss !== r.oldPlayerHealth-s.playerHealth || r.fatherLoss !== r.oldFatherHealth-s.fatherHealth ||
        !Array.isArray(r.missedCare) || r.missedCare.some(id => byId.get(id)?.kind !== 'care') ||
        !Array.isArray(r.milestones) || r.milestones.some(n => !integer(n,1,4)) || typeof r.fatherDied !== 'boolean') fail('Invalid day summary.');
    }
    // A settled plan refers to the beginning-of-day state, before death/setup changes.
    const start = s.phase === 'summary' ? {...s,deathDay:s.summary.fatherDied ? null : s.deathDay,
      completedGrief:griefCompleted(s).filter(id=>!s.plan?.some(item=>item.eventId===id)),
      completedSetups:s.completedSetups.filter(id => !s.plan?.some(item => item.eventId === id))} : s;
    validatePlan(start,s.plan);
    return copy(s);
  }
  function newGame(seed = 1) {
    if (!integer(seed,0,4294967295)) fail('Seed must be an unsigned 32-bit integer.');
    return {version:SAVE_VERSION,rulesVersion:3,seed,day:1,phase:'planning',playerHealth:1000,fatherHealth:1000,
      dayStartFatherHealth:1000,deathDay:null,completedSetups:[],completedGrief:[],plan:[],summary:null};
  }
  function setPlan(state,plan) {
    assertState(state);
    if (state.phase !== 'planning') fail('This day has already ended.');
    return {...copy(state),plan:validatePlan(state,plan)};
  }
  function settleDay(state) {
    assertState(state);
    if (state.phase === 'summary') return copy(state); // Idempotent: no rerolls or duplicate effects.
    const next=copy(state),random=rng((state.seed ^ Math.imul(state.day,2246822519))>>>0);
    next.completedGrief=griefCompleted(state).slice();
    const medical=incidents(state),feelings=emotions(state,medical);
    const arranged=pack(state,withSetups(state,state.plan),[...medical,...feelings]);
    const variation=base=>Math.max(0,round(base*(0.8+random()*0.4)));
    const playerDaily=variation(0.5+state.day**1.2/2000),fatherDaily=variation(0.5+state.day**1.6/200);
    let player=state.playerHealth,father=state.fatherHealth,time=480,shared=0,pAccum=0,dAccum=0,pApplied=0,dApplied=0,cutoff=null;
    const done=[],cancelled=[...arranged.displaced];
    const milestones=[];
    function checkTransition(at){
      if(state.deathDay!==null)return;
      if(father<=0){father=0;cutoff={minute:at,reason:'death',threshold:0};return;}
      const thresholds=[800,600,400,200].filter(n=>state.fatherHealth>n&&father<=n);
      if(thresholds.length){milestones.push(...thresholds.map(n=>[800,600,400,200].indexOf(n)+1));cutoff={minute:at,reason:'milestone',threshold:thresholds.at(-1)};}
    }
    function advanceTime(until){
      while(time<until&&!cutoff){
        time++;pAccum+=playerDaily/960;
        dAccum+=fatherDaily*(1-Math.min(0.8,shared*0.2))/960;
        const p=Math.floor(pAccum+0.5+1e-8),d=Math.floor(dAccum+0.5+1e-8);
        player=Math.max(0,player-(p-pApplied));
        if(state.deathDay===null)father=Math.max(0,father-(d-dApplied));
        pApplied=p;dApplied=d;checkTransition(time);
      }
    }
    for(const item of arranged.plan){
      const event=byId.get(item.eventId),start=PERIODS[item.period].start+item.minute;
      advanceTime(start);if(cutoff)break;
      advanceTime(start+event.duration);if(cutoff)break;
      done.push(item);
      if(event.kind==='setup')next.completedSetups.push(event.id);
      if(event.kind==='grief'){next.completedGrief??=griefCompleted(state).slice();next.completedGrief.push(event.id);}
      if(event.shared)shared++;
      if(event.shared&&state.deathDay===null&&event.hospitalPenalty)father-=30+Math.floor(random()*31);
      if(random()<event.risk)player-=5+Math.floor(random()*11);
      if(event.shared&&state.deathDay===null&&random()<event.risk)father-=5+Math.floor(random()*11);
      player=Math.max(0,player);father=Math.max(0,father);checkTransition(time);
    }
    advanceTime(1440);
    if(cutoff)cancelled.push(...arranged.plan.filter(item=>!done.some(d=>d.eventId===item.eventId)&&!byId.get(item.eventId).unexpected).map(item=>({...item,preferredPeriod:item.preferredPeriod??item.period})));
    const stage=stateStage(state);
    const missed=state.deathDay===null&&!cutoff?events.filter(e=>e.kind==='care'&&e.stage===stage&&!done.some(item=>item.eventId===e.id)&&!arranged.displaced.some(item=>item.eventId===e.id)).map(e=>e.id):[];
    father=Math.max(0,father-missed.length*10*stage);checkTransition(time);
    const fatherDied=state.deathDay===null&&father===0;
    if(fatherDied)next.deathDay=state.day;
    next.playerHealth=Math.max(0,player);next.fatherHealth=father;
    next.phase='summary';next.plan=done;
    next.summary={day:state.day,oldPlayerHealth:state.playerHealth,oldFatherHealth:state.fatherHealth,
      playerLoss:state.playerHealth-next.playerHealth,fatherLoss:state.fatherHealth-father,
      timelineRules:1,cutoff,incidents:medical.filter(item=>done.some(d=>d.eventId===item.eventId)),
      emotions:feelings.filter(item=>done.some(d=>d.eventId===item.eventId)),displaced:cancelled,
      missedCare:missed,milestones:fatherDied?[]:[...new Set(milestones)],fatherDied};
    return next;
  }
  function advanceDay(state) {
    assertState(state);
    if (state.phase !== 'summary') fail('End the current day before advancing.');
    if (state.playerHealth === 0) fail('The game has ended. Start a new game.');
    if (state.day === 1000000) fail('Maximum day reached.');
    return {...copy(state),day:state.day+1,rulesVersion:3,legacyPlanningDay:false,phase:'planning',dayStartFatherHealth:state.fatherHealth,plan:[],summary:null};
  }
  function migrateSave(saved) {
    if (saved?.version!==1) return assertState(saved);
    const legacy=createLegacyEngine(definitions.filter(e=>!e.introduced)).assertState(saved);
    const upgraded={...legacy,version:SAVE_VERSION,legacyPlanningDay:true};
    if (legacy.phase==='summary') {
      upgraded.summary={...legacy.summary,incidents:[],displaced:[],legacy:true};
    } else {
      // Preserve all valid choices even though the incident removal changes the random option pool.
      const available=options(upgraded);
      const retained=legacy.plan.filter(item=>!byId.get(item.eventId).unexpected && available[item.period].includes(item.eventId));
      upgraded.plan=pack(upgraded,retained).plan;
    }
    return assertState(upgraded);
  }
  return Object.freeze({newGame,setPlan,arrange,prepareDay,settleDay,advanceDay,assertState,migrateSave,
    getOptions(state) { assertState(state); if (state.phase !== 'planning') fail('This day has already ended.'); return copy(options(state)); },
    getEvent(id) { return byId.has(id) ? copy(byId.get(id)) : null; }});
}
