import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine,careStage,weightedSample} from '../assets/engine.js';
import {createSaveStore,exportSave,importSave,SAVE_KEY} from '../assets/storage.js';
const catalogue=JSON.parse(readFileSync(new URL('../data/events.json',import.meta.url)));
const engine=createEngine(catalogue);
const game=(health=1000,day=1)=>({...engine.newGame(42),fatherHealth:health,dayStartFatherHealth:health,day});
const pick=(state,predicate)=>Object.entries(engine.getOptions(state)).flatMap(([period,ids])=>ids.map(id=>({period,...engine.getEvent(id)}))).find(predicate);
const planItem=(e,minute=0)=>({eventId:e.id,period:e.period,minute});

test('canonical catalogue has unique IDs and no duplicate titles within a period',()=>{
 assert.equal(new Set(catalogue.map(e=>e.id)).size,catalogue.length);
 assert.equal(new Set(catalogue.map(e=>e.title+'|'+e.period)).size,catalogue.length);
});
test('fresh options include shared activities, any-period rest and survive reload',()=>{
 const state=game(); const choices=engine.getOptions(state);
 assert.ok(Object.values(choices).flat().some(id=>engine.getEvent(id).shared));
 assert.ok(choices.lunch.length); assert.ok(choices.evening.length);
 assert.deepEqual(engine.getOptions(importSave(engine,exportSave(engine,state))),choices);
});
test('zero-weight sampling terminates and samples without replacement',()=>{
 assert.deepEqual(weightedSample([{weight:0}],6,()=>0),[]);
 assert.deepEqual(weightedSample([{id:'a',weight:1},{id:'b',weight:0}],6,()=>0.9).map(e=>e.id),['a']);
 assert.equal(new Set(weightedSample(catalogue,100,()=>0).map(e=>e.id)).size,catalogue.length);
});
test('care stage boundaries and required tasks replace earlier stages',()=>{
 assert.deepEqual([800,799,600,599,400,399,200,199,0].map(careStage),[0,1,1,2,2,3,3,4,0]);
 for (const [health,stage] of [[799,1],[599,2],[399,3],[199,4]]) {
  const ids=Object.values(engine.getOptions(game(health))).flat();
  const care=ids.map(id=>engine.getEvent(id)).filter(e=>e.kind==='care');
  assert.equal(care.length,2); assert.ok(care.every(e=>e.stage===stage));
 }
});
test('plans validate cross-period overlap, boundaries, duplicates and availability atomically',()=>{
 const fixture=createEngine([
  {id:'a',title:'A',period:'morning',duration:240,shared:false,kind:'activity',weight:1,risk:0,hospitalPenalty:false},
  {id:'b',title:'B',period:'lunch',duration:60,shared:false,kind:'activity',weight:1,risk:0,hospitalPenalty:false},
  {id:'c',title:'C',period:'night',duration:60,shared:false,kind:'activity',weight:1,risk:0,hospitalPenalty:false}
 ]),state=fixture.newGame();
 const a={eventId:'a',period:'morning',minute:0},b={eventId:'b',period:'lunch',minute:0};
 assert.throws(()=>fixture.setPlan(state,[a,b]),/overlap/);
 assert.equal(fixture.setPlan(state,[a,{...b,minute:60}]).plan.length,2);
 for (const item of [{...a,minute:-1},{...a,minute:0.5},{...a,minute:180},{...a,eventId:'missing'},{...a,period:'night'},{eventId:'c',period:'night',minute:200}]) assert.throws(()=>fixture.setPlan(state,[item]));
 assert.throws(()=>fixture.setPlan(state,[a,a]),/once/);
 assert.deepEqual(state.plan,[]);
});
test('care must use exact start/end times and active stage',()=>{
 const state=game(700);
 assert.throws(()=>engine.setPlan(state,[{eventId:'care-1-morning',period:'morning',minute:1}]),/Care/);
 assert.throws(()=>engine.setPlan(state,[{eventId:'care-1-night',period:'night',minute:0}]),/Care/);
 assert.throws(()=>engine.setPlan(state,[{eventId:'care-2-morning',period:'morning',minute:0}]),/available/);
 const plan=[{eventId:'care-1-morning',period:'morning',minute:0},{eventId:'care-1-night',period:'night',minute:210}];
 assert.deepEqual(engine.settleDay(engine.setPlan(state,plan)).summary.missedCare,[]);
});
test('settlement and summary reload are repeat-safe; advance never applies losses',()=>{
 let state=game(700); state=engine.setPlan(state,[{eventId:'care-1-morning',period:'morning',minute:0}]);
 const before=structuredClone(state),done=engine.settleDay(state);
 assert.deepEqual(state,before); assert.deepEqual(engine.settleDay(done),done);
 assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
 assert.throws(()=>engine.setPlan(done,[]),/already ended/);
 const next=engine.advanceDay(done); assert.equal(next.fatherHealth,done.fatherHealth); assert.equal(next.day,2);
 assert.throws(()=>engine.advanceDay(next),/End the current day/);
});
test('new care requirements apply the following day, not the threshold-crossing day',()=>{
 const done=engine.settleDay(game(800,100));
 assert.ok(done.fatherHealth<800); assert.deepEqual(done.summary.missedCare,[]);
 assert.ok(done.summary.milestones.includes(1));
 assert.ok(Object.values(engine.getOptions(engine.advanceDay(done))).flat().includes('care-1-morning'));
});
test('setup is one-time and summary remains importable after completing it',()=>{
 const state=game(700),e=pick(state,e=>e.kind==='setup');
 const done=engine.settleDay(engine.setPlan(state,[planItem(e)]));
 assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
 assert.ok(!Object.values(engine.getOptions(engine.advanceDay(done))).flat().includes(e.id));
});
test('death at zero records day and dated grief options without care/shared activities',()=>{
 const state=game(1),done=engine.settleDay(state);
 assert.equal(done.fatherHealth,0); assert.equal(done.deathDay,1); assert.equal(done.summary.fatherDied,true);
 assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
 let next=engine.advanceDay(done);
 let ids=Object.values(engine.getOptions(next)).flat();
 assert.ok(ids.includes('grief-49')); assert.ok(!ids.includes('grief-51'));
 assert.ok(ids.every(id=>!engine.getEvent(id).shared));
 next=engine.advanceDay(engine.settleDay(next));
 ids=Object.values(engine.getOptions(next)).flat();
 assert.ok(ids.includes('grief-51')); assert.ok(!ids.includes('grief-49'));
});
test('exact-zero care penalty triggers death and cannot lose the death transition',()=>{
 // Find a seeded day where daily father loss rounds to zero; two missed stage-4 tasks cost 80.
 let done;
 for(let seed=0;seed<100;seed++) {
  const state={...game(80),seed}; const result=engine.settleDay(state);
  if(result.summary.fatherLoss===80) {done=result;break;}
 }
 assert.ok(done); assert.equal(done.fatherHealth,0); assert.equal(done.deathDay,1);
});
test('player exhaustion ends advancement and reset creates a completely fresh save',()=>{
 const done=engine.settleDay({...game(1000,10000),playerHealth:1});
 assert.equal(done.playerHealth,0); assert.throws(()=>engine.advanceDay(done),/ended/);
 const storage=new Map(),store=createSaveStore(engine,{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)});
 store.save(done); const {state}=store.reset(7);
 assert.deepEqual(state,engine.newGame(7)); assert.deepEqual(store.load().state,state);
});
test('invalid imports preserve existing saves and storage failures are reported',()=>{
 const memory=new Map(),store=createSaveStore(engine,{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)});
 store.save(game()); const old=memory.get(SAVE_KEY);
 for(const text of ['{','null',JSON.stringify({...game(),version:99}),JSON.stringify({...game(),fatherHealth:-1}),JSON.stringify({...game(),plan:[{eventId:'bad'}]}),' '.repeat(100001)]) assert.throws(()=>store.import(text));
 assert.equal(memory.get(SAVE_KEY),old);
 memory.set(SAVE_KEY,'broken'); assert.ok(store.load().error); assert.equal(memory.get(SAVE_KEY),'broken');
 const blocked=createSaveStore(engine,{getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 assert.ok(blocked.load().error); assert.ok(blocked.save(game()).error);
});
test('long playthroughs validate every summary and continue through grief',()=>{
 let state=engine.newGame(123),died=false;
 for(let i=0;i<400;i++) {
  if(state.phase==='summary') {if(!state.playerHealth) break;state=engine.advanceDay(state);}
  const options=engine.getOptions(state),plan=[];
  for(const [period,ids] of Object.entries(options)) for(const id of ids) {
   const e=engine.getEvent(id);
   if(e.kind==='care') plan.push({eventId:id,period,minute:period==='night'?240-e.duration:0});
  }
  state=engine.settleDay(engine.setPlan(state,plan));
  state=importSave(engine,exportSave(engine,state));
  died ||= state.deathDay!==null;
 }
 assert.ok(died);
});
test('randomized valid plans remain saveable across setup and death transitions',()=>{
 for(let seed=0;seed<100;seed++) {
  const state={...game([1000,800,799,600,599,400,399,200,199,80,1][seed%11],1+seed),seed};
  let planned=state;
  for(const [period,ids] of Object.entries(engine.getOptions(state))) {
   for(const id of ids) {
    const e=engine.getEvent(id);
    const minute=e.kind==='care' && period==='night'?240-e.duration:0;
    try {planned=engine.setPlan(planned,[...planned.plan,{eventId:id,period,minute}]);} catch { /* Overlap: keep the previous valid plan. */ }
   }
  }
  const done=engine.settleDay(planned);
  assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
  assert.deepEqual(engine.settleDay(planned),done);
 }
});

const activity=(id,period,duration,extras={})=>({id,title:id,period,duration,shared:false,kind:'activity',weight:1,risk:0,hospitalPenalty:false,...extras});
test('automatic scheduling compacts after removal and pushes later activities forward',()=>{
 const e=createEngine([activity('first','morning',90),activity('second','morning',60),activity('third','morning',90)]);
 const state=e.newGame();
 const planned=e.arrange(state,[{eventId:'first',period:'morning'},{eventId:'second',period:'morning'},{eventId:'third',period:'morning'}]);
 assert.deepEqual(planned.plan.map(i=>[i.period,i.minute]),[['morning',0],['morning',90],['morning',150]]);
 const compact=e.arrange(planned,planned.plan.filter(i=>i.eventId!=='first'));
 assert.deepEqual(compact.plan.map(i=>i.minute),[0,60]);
 assert.deepEqual(state.plan,[]);
});
test('adding care repacks existing activities and anchors care to day boundaries',()=>{
 let state=game(700);
 const ordinary=pick(state,e=>e.kind==='activity'&&e.period==='morning');
 state=engine.arrange(state,[{eventId:ordinary.id,period:'morning'}]);
 state=engine.arrange(state,[...state.plan,{eventId:'care-1-morning',period:'morning'},{eventId:'care-1-night',period:'night'}]);
 assert.equal(state.plan.find(i=>i.eventId==='care-1-morning').minute,0);
 assert.equal(state.plan.find(i=>i.eventId===ordinary.id).minute,30);
 assert.equal(state.plan.find(i=>i.eventId==='care-1-night').minute,210);
});
test('automatic overflow crosses periods and excess choices fail atomically',()=>{
 const e=createEngine([activity('a','morning',240),activity('b','morning',180),activity('c','night',240)]);
 let state=e.arrange(e.newGame(),[{eventId:'a',period:'morning'},{eventId:'b',period:'morning'}]);
 assert.deepEqual(state.plan[1],{eventId:'b',preferredPeriod:'morning',period:'lunch',minute:60});
 assert.deepEqual(importSave(e,exportSave(e,state)),state);
 const full=e.arrange(state,[...state.plan,{eventId:'c',period:'night'}]);
 assert.throws(()=>e.arrange(state,[...state.plan,{eventId:'a',period:'morning'}]),/once/);
 const tooMuch=createEngine([activity('x','night',240),activity('y','night',60)]);
 const before=tooMuch.arrange(tooMuch.newGame(),[{eventId:'x',period:'night'}]);
 assert.throws(()=>tooMuch.arrange(before,[...before.plan,{eventId:'y',period:'night'}]),/not enough time/);
 assert.equal(before.plan.length,1);
});
test('emergencies never appear as choices, occur by chance, and are fixed across reload',()=>{
 for(let seed=0;seed<30;seed++) {
  const state=engine.newGame(seed);
  assert.ok(Object.values(engine.getOptions(state)).flat().every(id=>!engine.getEvent(id).unexpected));
  assert.throws(()=>engine.arrange(state,[{eventId:'activity-38',period:'afternoon'}]),/available/);
 }
 let incident,quiet;
 for(let seed=0;seed<200;seed++){
  const state=engine.newGame(seed),done=engine.settleDay(state);
  if(done.summary.incidents.length){incident??=done;assert.deepEqual(engine.settleDay(importSave(engine,exportSave(engine,state))),done);}
  else quiet??=done;
 }
 assert.ok(incident);assert.ok(quiet);
 assert.deepEqual(engine.settleDay(importSave(engine,exportSave(engine,incident))),incident);
});
test('emergencies supersede plans, move activities later, and exclude displaced setup effects',()=>{
 const fixture=createEngine([
  activity('morning','morning',180),activity('lunch','lunch',180),activity('afternoon','afternoon',180),
  activity('evening','evening',180),activity('late','night',240,{kind:'setup',stage:1}),
  activity('emergency','afternoon',180,{unexpected:true,incidentChance:1,shared:true,hospitalPenalty:true})
 ]);
 let done;
 for(let seed=0;seed<100;seed++) {
  const state={...fixture.newGame(seed),fatherHealth:700,dayStartFatherHealth:700};
  const plan=['morning','lunch','afternoon','evening','late'].map(id=>({eventId:id,period:id==='late'?'night':id}));
  const settled=fixture.settleDay(fixture.arrange(state,plan));
  if(settled.summary.incidents.length){done=settled;break;}
 }
 assert.ok(done);
 assert.equal(done.plan.find(i=>i.eventId==='emergency').period,'afternoon');
 assert.equal(done.plan.find(i=>i.eventId==='afternoon').period,'evening');
 assert.equal(done.plan.find(i=>i.eventId==='evening').period,'night');
 assert.equal(done.summary.displaced[0].eventId,'late');
 assert.ok(!done.completedSetups.includes('late'));
 assert.deepEqual(importSave(fixture,exportSave(fixture,done)),done);
});
test('emergencies stop after Dad dies',()=>{
 for(let seed=0;seed<100;seed++){
  const state={...engine.newGame(seed),fatherHealth:0,dayStartFatherHealth:0,deathDay:1};
  assert.deepEqual(engine.settleDay(state).summary.incidents,[]);
 }
});
test('version 1 saves migrate without losing ordinary choices or reapplying a settled day',async()=>{
 const {createEngine:createOld}=await import('../assets/engine-v1.js');
 const old=createOld(catalogue);
 for(let seed=0;seed<30;seed++){
  let state=old.newGame(seed);
  const options=old.getOptions(state);
  const id=options.morning.find(id=>!old.getEvent(id).unexpected);
  state=old.setPlan(state,[{eventId:id,period:'morning',minute:0}]);
  const migrated=importSave(engine,JSON.stringify(state));
  assert.equal(migrated.version,2);assert.equal(migrated.plan[0].eventId,id);
  assert.equal(engine.advanceDay(engine.settleDay(migrated)).legacyPlanningDay,false);
  const summary=old.settleDay(state),converted=importSave(engine,JSON.stringify(summary));
  assert.deepEqual(engine.settleDay(converted),converted);
  assert.equal(converted.fatherHealth,summary.fatherHealth);
 }
});
test('emergency care takes precedence over routine care without a missed-care penalty',()=>{
 const fixture=createEngine([
  activity('care','morning',30,{kind:'care',stage:1,shared:true}),
  activity('hospital','morning',120,{unexpected:true,incidentChance:1,shared:true})
 ]);
 let done;
 for(let seed=0;seed<100;seed++){
  const state={...fixture.newGame(seed),fatherHealth:700,dayStartFatherHealth:700};
  const summary=fixture.settleDay(fixture.arrange(state,[{eventId:'care',period:'morning'}]));
  if(summary.summary.incidents.length){done=summary;break;}
 }
 assert.ok(done);assert.equal(done.summary.displaced[0].eventId,'care');
 assert.deepEqual(done.summary.missedCare,[]);
 assert.deepEqual(importSave(fixture,exportSave(fixture,done)),done);
});
test('legacy manually scheduled emergencies are removed from planning but preserved in historical summaries',async()=>{
 const {createEngine:createOld}=await import('../assets/engine-v1.js');const old=createOld(catalogue);
 let scheduled;
 for(let seed=0;seed<50;seed++){
  const state=old.newGame(seed);
  const pair=Object.entries(old.getOptions(state)).flatMap(([period,ids])=>ids.map(id=>({id,period}))).find(({id})=>old.getEvent(id).unexpected);
  if(pair){scheduled=old.setPlan(state,[{eventId:pair.id,period:pair.period,minute:0}]);break;}
 }
 assert.ok(scheduled);
 const planning=importSave(engine,JSON.stringify(scheduled));
 assert.deepEqual(planning.plan,[]);assert.equal(planning.fatherHealth,scheduled.fatherHealth);
 const done=old.settleDay(scheduled),converted=importSave(engine,JSON.stringify(done));
 assert.deepEqual(converted.plan,done.plan);assert.equal(converted.fatherHealth,done.fatherHealth);
 assert.deepEqual(engine.settleDay(converted),converted);
});
