import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine,careStage} from '../assets/engine.js';
import {exportSave,importSave} from '../assets/storage.js';
const catalogue=JSON.parse(readFileSync(new URL('../data/events.json',import.meta.url)));
const activity=(id,period,duration,extra={})=>({id,title:id,description:'',period,duration,kind:'activity',shared:false,weight:1,risk:0,hospitalPenalty:false,...extra});
test('each exact health threshold clears later activities without applying their risks',()=>{
 for(const threshold of [800,600,400,200,0]){
  const engine=createEngine([activity('trigger','morning',30,{shared:true,hospitalPenalty:true}),activity('later','evening',60,{risk:1})]);
  const health=threshold+1,state={...engine.newGame(42),fatherHealth:health,dayStartFatherHealth:health};
  const done=engine.settleDay(engine.arrange(state,[{eventId:'trigger',period:'morning'},{eventId:'later',period:'evening'}]));
  assert.equal(done.summary.cutoff.threshold,threshold);
  assert.equal(done.summary.cutoff.minute,510);
  assert.deepEqual(done.plan.map(i=>i.eventId),['trigger']);
  assert.ok(done.summary.displaced.some(i=>i.eventId==='later'));
  assert.equal(done.playerHealth,1000);
  assert.equal(done.summary.fatherDied,threshold===0);
  assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
  assert.deepEqual(engine.settleDay(done),done);
 }
 assert.deepEqual([800,600,400,200,0].map(careStage),[1,2,3,4,0]);
});
test('natural decline can interrupt the middle of a day',()=>{
 const engine=createEngine([activity('later','night',60)]);
 const state={...engine.newGame(42),day:100,fatherHealth:801,dayStartFatherHealth:801};
 const done=engine.settleDay(engine.arrange(state,[{eventId:'later',period:'night'}]));
 assert.equal(done.summary.cutoff.threshold,800);assert.ok(done.summary.cutoff.minute<1200);
 assert.deepEqual(done.plan,[]);
});
test('setup completed before a milestone stays completed; later setup remains due',()=>{
 const engine=createEngine([
  activity('early','morning',60,{kind:'setup',stage:1}),activity('late','night',60,{kind:'setup',stage:1}),
  activity('trigger','morning',30,{shared:true,hospitalPenalty:true})
 ]);
 const state={...engine.newGame(42),fatherHealth:601,dayStartFatherHealth:601};
 const done=engine.settleDay(engine.arrange(state,[{eventId:'trigger',period:'morning'}]));
 assert.deepEqual(done.completedSetups,['early']);
 const next=engine.prepareDay(engine.advanceDay(done));
 assert.ok(next.plan.some(i=>i.eventId==='late'));assert.ok(!next.plan.some(i=>i.eventId==='early'));
});
test('dated after-loss events are reserved, survive clearing and disappear when completed',()=>{
 const engine=createEngine(catalogue);
 const state=engine.prepareDay({...engine.newGame(3),fatherHealth:0,dayStartFatherHealth:0,deathDay:1,day:2});
 for(const id of ['grief-49','grief-50'])assert.ok(state.plan.some(i=>i.eventId===id));
 const cleared=engine.arrange(state,[]);
 for(const id of ['grief-49','grief-50'])assert.ok(cleared.plan.some(i=>i.eventId===id));
 const done=engine.settleDay(cleared);
 assert.ok(done.completedGrief.includes('grief-49'));assert.ok(done.completedGrief.includes('grief-50'));
 const next=engine.prepareDay(engine.advanceDay(done));
 assert.ok(next.plan.some(i=>i.eventId==='grief-51'));assert.ok(!next.plan.some(i=>i.eventId==='grief-49'));
 assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
});
test('unfinished after-loss obligations carry over rather than expiring',()=>{
 const engine=createEngine([activity('first','morning',960,{kind:'grief',dayOffset:1}),activity('second','afternoon',60,{kind:'grief',dayOffset:1})]);
 const state=engine.prepareDay({...engine.newGame(1),fatherHealth:0,dayStartFatherHealth:0,deathDay:1,day:2});
 const done=engine.settleDay(state);
 assert.deepEqual(done.completedGrief,['first']);
 assert.ok(done.summary.displaced.some(i=>i.eventId==='second'));
 const next=engine.prepareDay(engine.advanceDay(done));assert.deepEqual(next.plan.map(i=>i.eventId),['second']);
});
test('emotion events take more time as health declines and especially after loss',()=>{
 const engine=createEngine(catalogue),totals=[0,0,0],counts=[0,0,0];
 for(let seed=0;seed<200;seed++)for(const [index,health] of [1000,150,0].entries()){
  const state=engine.prepareDay({...engine.newGame(seed),fatherHealth:health,dayStartFatherHealth:health,...(health===0?{deathDay:1,day:2}:{})});
  const done=engine.settleDay(state);
  for(const item of done.summary.emotions){totals[index]+=engine.getEvent(item.eventId).duration;counts[index]++;}
  assert.ok(Object.values(engine.getOptions(state)).flat().every(id=>engine.getEvent(id).kind!=='emotion'));
  assert.deepEqual(importSave(engine,exportSave(engine,done)),done);
  assert.deepEqual(engine.settleDay(state),done);
 }
 assert.ok(totals[1]>totals[0]);assert.ok(totals[2]>totals[1]);
 assert.ok(counts[1]>counts[0]);assert.ok(counts[2]>counts[1]);
});
test('pre-timeline saved summaries keep their original results and upgrade on the next day',()=>{
 const engine=createEngine(catalogue);
 const fixtures=JSON.parse(readFileSync(new URL('./fixtures/pre-timeline-summaries.json',import.meta.url)));
 assert.equal(fixtures.length,2);
 for(const saved of fixtures){
  const restored=importSave(engine,JSON.stringify(saved));
  assert.deepEqual(restored,saved);assert.deepEqual(engine.settleDay(restored),saved);
  const next=engine.prepareDay(engine.advanceDay(restored));assert.equal(next.rulesVersion,3);
  if(next.fatherHealth===800)assert.ok(next.plan.some(item=>item.eventId==='care-1-morning'));
 }
});
