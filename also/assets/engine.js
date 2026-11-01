/** Browser/Node game rules. All transitions return new state; no DOM or storage access. */
export const SAVE_VERSION = 1;
export const PERIODS = Object.freeze(Object.fromEntries(
  [['morning',480,180],['lunch',660,180],['afternoon',840,180],['evening',1020,180],['night',1200,240]]
    .map(([id,start,duration]) => [id,Object.freeze({start,duration})])));
const copy = value => JSON.parse(JSON.stringify(value));
const fail = message => { throw new Error(message); };
const integer = (n,min,max) => Number.isSafeInteger(n) && n >= min && n <= max;
export const careStage = health => health <= 0 ? 0 : health < 200 ? 4 : health < 400 ? 3 : health < 600 ? 2 : health < 800 ? 1 : 0;
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
        !['activity','care','setup','grief'].includes(e.kind) || typeof e.shared !== 'boolean' ||
        typeof e.hospitalPenalty !== 'boolean' || !Number.isFinite(e.weight) || e.weight < 0 || e.weight > 1000 ||
        !Number.isFinite(e.risk) || e.risk < 0 || e.risk > 1 ||
        (['care','setup'].includes(e.kind) && !integer(e.stage,1,4)) ||
        (e.kind === 'care' && !['morning','night'].includes(e.period)) ||
        (e.kind === 'grief' && !integer(e.dayOffset,1,365))) fail('Invalid event catalogue.');
    byId.set(e.id,e);
  }
  function options(state) {
    const random = rng((state.seed ^ Math.imul(state.day,2654435761)) >>> 0);
    const alive = state.deathDay === null, stage = careStage(state.dayStartFatherHealth);
    const available = events.filter(e => e.kind === 'care' ? alive && e.stage === stage :
      e.kind === 'setup' ? alive && e.stage <= stage && !state.completedSetups.includes(e.id) :
      e.kind === 'grief' ? !alive && state.day - state.deathDay === e.dayOffset : alive || !e.shared);
    return Object.fromEntries(Object.keys(PERIODS).map(period => {
      const pool = available.filter(e => e.period === period || e.period === 'any');
      const required = pool.filter(e => e.kind !== 'activity');
      return [period,[...required,...weightedSample(pool.filter(e => e.kind === 'activity'),Math.max(0,6-required.length),random)].map(e => e.id)];
    }));
  }
  function validatePlan(state,plan) {
    if (!Array.isArray(plan) || plan.length > events.length) fail('Invalid schedule.');
    const available = options(state), used = new Set();
    const normalized = plan.map(item => {
      if (!item || typeof item.eventId !== 'string') fail('Invalid schedule item.');
      const e = byId.get(item.eventId), period = Object.hasOwn(PERIODS,item.period) ? PERIODS[item.period] : null;
      if (!e || !period || !available[item.period].includes(e.id)) fail('Event is not available in that period.');
      if (used.has(e.id)) fail('An event can only be scheduled once per day.');
      used.add(e.id);
      if (!integer(item.minute,0,period.duration-1)) fail('Invalid start minute.');
      const start = period.start + item.minute, end = start + e.duration;
      if (end > 1440) fail('An activity cannot extend past midnight.');
      if (e.kind === 'care' && (item.period === 'morning' ? item.minute !== 0 : end !== 1440)) fail('Care must start the morning or finish the night.');
      return {eventId:e.id,period:item.period,minute:item.minute,start,end};
    }).sort((a,b) => a.start-b.start);
    for (let i=1;i<normalized.length;i++) if (normalized[i].start < normalized[i-1].end) fail('Activities overlap.');
    return normalized.map(({eventId,period,minute}) => ({eventId,period,minute}));
  }
  function assertState(s) {
    if (!s || s.version !== SAVE_VERSION || !integer(s.seed,0,4294967295) || !integer(s.day,1,1000000) ||
      !['planning','summary'].includes(s.phase) || !integer(s.playerHealth,0,1000) || !integer(s.fatherHealth,0,1000) ||
      !integer(s.dayStartFatherHealth,0,1000) || !(s.deathDay === null || integer(s.deathDay,1,s.day)) ||
      (s.fatherHealth === 0) !== (s.deathDay !== null) ||
      !Array.isArray(s.completedSetups) || new Set(s.completedSetups).size !== s.completedSetups.length ||
      s.completedSetups.some(id => byId.get(id)?.kind !== 'setup') ||
      (s.phase === 'planning' && (s.fatherHealth !== s.dayStartFatherHealth || s.playerHealth === 0)) ||
      (s.phase === 'planning' && s.summary !== null)) fail('Invalid or unsupported save.');
    if (s.phase === 'summary') {
      const r=s.summary;
      if (!r || r.day !== s.day || !integer(r.oldPlayerHealth,1,1000) || r.oldFatherHealth !== s.dayStartFatherHealth ||
        r.playerLoss !== r.oldPlayerHealth-s.playerHealth || r.fatherLoss !== r.oldFatherHealth-s.fatherHealth ||
        !Array.isArray(r.missedCare) || r.missedCare.some(id => byId.get(id)?.kind !== 'care') ||
        !Array.isArray(r.milestones) || r.milestones.some(n => !integer(n,1,4)) || typeof r.fatherDied !== 'boolean') fail('Invalid day summary.');
    }
    // A settled plan refers to the beginning-of-day state, before death/setup changes.
    const start = s.phase === 'summary' ? {...s,deathDay:s.summary.fatherDied ? null : s.deathDay,
      completedSetups:s.completedSetups.filter(id => !s.plan?.some(item => item.eventId === id))} : s;
    validatePlan(start,s.plan);
    return copy(s);
  }
  function newGame(seed = 1) {
    if (!integer(seed,0,4294967295)) fail('Seed must be an unsigned 32-bit integer.');
    return {version:SAVE_VERSION,seed,day:1,phase:'planning',playerHealth:1000,fatherHealth:1000,
      dayStartFatherHealth:1000,deathDay:null,completedSetups:[],plan:[],summary:null};
  }
  function setPlan(state,plan) {
    assertState(state);
    if (state.phase !== 'planning') fail('This day has already ended.');
    return {...copy(state),plan:validatePlan(state,plan)};
  }
  function settleDay(state) {
    assertState(state);
    if (state.phase === 'summary') return copy(state); // Idempotent: no rerolls or duplicate effects.
    const next=copy(state), random=rng((state.seed ^ Math.imul(state.day,2246822519)) >>> 0);
    const scheduled=state.plan.map(item => byId.get(item.eventId));
    const shared=scheduled.filter(e => e.shared).length;
    const variation=base => Math.max(0,round(base*(0.8+random()*0.4)));
    let player=state.playerHealth-variation(0.5+state.day**1.2/2000);
    let father=state.fatherHealth === 0 ? 0 : state.fatherHealth-variation((0.5+state.day**1.6/200)*(1-Math.min(0.8,shared*0.2)));
    for (const e of scheduled) {
      if (e.shared && state.deathDay === null && e.hospitalPenalty) father-=30+Math.floor(random()*31);
      if (random()<e.risk) player-=5+Math.floor(random()*11);
      if (e.shared && state.deathDay === null && random()<e.risk) father-=5+Math.floor(random()*11);
      if (e.kind==='setup') next.completedSetups.push(e.id);
    }
    const stage=careStage(state.fatherHealth);
    const missed=state.deathDay === null ? events.filter(e => e.kind==='care' && e.stage===stage && !scheduled.some(a => a.id===e.id)).map(e => e.id) : [];
    father-=missed.length*10*stage;
    next.playerHealth=Math.max(0,player); next.fatherHealth=Math.max(0,father);
    const fatherDied=state.deathDay===null && next.fatherHealth===0;
    if (fatherDied) next.deathDay=state.day;
    const newStage=careStage(next.fatherHealth);
    next.phase='summary';
    next.summary={day:state.day,oldPlayerHealth:state.playerHealth,oldFatherHealth:state.fatherHealth,
      playerLoss:state.playerHealth-next.playerHealth,fatherLoss:state.fatherHealth-next.fatherHealth,
      missedCare:missed,milestones:fatherDied ? [] : [1,2,3,4].filter(n => n>stage && n<=newStage),fatherDied};
    return next;
  }
  function advanceDay(state) {
    assertState(state);
    if (state.phase !== 'summary') fail('End the current day before advancing.');
    if (state.playerHealth === 0) fail('The game has ended. Start a new game.');
    if (state.day === 1000000) fail('Maximum day reached.');
    return {...copy(state),day:state.day+1,phase:'planning',dayStartFatherHealth:state.fatherHealth,plan:[],summary:null};
  }
  return Object.freeze({newGame,setPlan,settleDay,advanceDay,assertState,
    getOptions(state) { assertState(state); if (state.phase !== 'planning') fail('This day has already ended.'); return copy(options(state)); },
    getEvent(id) { return byId.has(id) ? copy(byId.get(id)) : null; }});
}
