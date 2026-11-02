import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine,PERIODS} from '../assets/engine.js';
import {periodUsage,nextPlanningPeriod,periodChoices,PERIOD_ORDER} from '../assets/planner.js';
import {validate} from '../assets/catalogue.js';
const definitions=JSON.parse(readFileSync(new URL('../data/events.json',import.meta.url)));
const event=(id,period,duration)=>({id,title:id,period,duration,description:'',kind:'activity',shared:false,hospitalPenalty:false,weight:1,risk:0});
test('full periods progress through morning, lunch, afternoon, evening, then night without settlement',()=>{
 const engine=createEngine(PERIOD_ORDER.map(p=>event(p,p,PERIODS[p].duration)));
 let state=engine.newGame();
 for(let i=0;i<PERIOD_ORDER.length;i++){
  const part=PERIOD_ORDER[i];
  state=engine.arrange(state,[...state.plan,{eventId:part,period:part}]);
  assert.equal(periodUsage(engine,state,part),PERIODS[part].duration);
  assert.equal(nextPlanningPeriod(engine,state,part),PERIOD_ORDER[i+1]??null);
  assert.equal(state.phase,'planning');assert.equal(state.fatherHealth,1000);
 }
});
test('period choices must fit remaining time; clearing time reopens that period',()=>{
 const engine=createEngine([event('a','morning',150),event('b','morning',60),event('c','morning',30)]);
 const full=engine.arrange(engine.newGame(),[{eventId:'a',period:'morning'}]);
 assert.deepEqual(periodChoices(engine,full,'morning'),['c']);
 assert.equal(nextPlanningPeriod(engine,full,'morning'),'morning');
 const cleared=engine.arrange(full,[]);assert.equal(periodUsage(engine,cleared,'morning'),0);
});
test('required care automatically reserves more of each day and survives clearing optional choices',()=>{
 const engine=createEngine(definitions);
 for(const [health,minutes] of [[1000,0],[799,60],[599,90],[399,120],[199,180]]){
  const state=engine.prepareDay({...engine.newGame(),fatherHealth:health,dayStartFatherHealth:health});
  assert.equal(state.plan.reduce((n,i)=>n+engine.getEvent(i.eventId).duration,0),minutes);
  assert.deepEqual(engine.prepareDay(state),state);
  const cleared=engine.prepareDay(engine.arrange(state,[]));assert.deepEqual(cleared,state);
 }
});
test('published catalogue validates; invalid edits and incomplete care stages are rejected',()=>{
 assert.equal(validate(definitions),definitions);
 assert.throws(()=>validate([...definitions,{...definitions[0]}]));
 assert.throws(()=>validate(definitions.map(e=>e.id==='care-1-morning'?{...e,duration:400}:e)),/180/);
 assert.throws(()=>validate(definitions.filter(e=>e.id!=='care-2-night')),/exactly one/);
 assert.throws(()=>validate(definitions.map(e=>e.id==='rest'?{...e,risk:2}:e)));
});
test('a period with spare minutes but no fitting choices advances automatically',()=>{
 const engine=createEngine([event('morning-long','morning',150),event('morning-too-long','morning',60),event('lunch','lunch',60),event('night','night',60)]);
 const state=engine.arrange(engine.newGame(),[{eventId:'morning-long',period:'morning'}]);
 assert.equal(periodUsage(engine,state,'morning'),150);
 assert.deepEqual(periodChoices(engine,state,'morning'),[]);
 assert.equal(nextPlanningPeriod(engine,state,'morning'),'lunch');
 assert.equal(nextPlanningPeriod(engine,state,'afternoon'),'night');
});
test('lunch and evening retain choices when rest was used earlier',()=>{
 const engine=createEngine(definitions);
 const state=engine.arrange(engine.newGame(42),[{eventId:'rest',period:'lunch'}]);
 assert.ok(periodChoices(engine,state,'lunch').length>=4);
 assert.ok(periodChoices(engine,state,'evening').length>=5);
});
test('new period activities preserve every previously offered option and existing saves',()=>{
 const before=createEngine(definitions.filter(e=>!e.introduced)),after=createEngine(definitions);
 for(let seed=0;seed<30;seed++){
  const state=before.newGame(seed),previous=before.getOptions(state),current=after.getOptions(state);
  for(const period of PERIOD_ORDER)assert.deepEqual(current[period].filter(id=>!after.getEvent(id).introduced),previous[period]);
  const id=previous.afternoon[0];const planned=before.arrange(state,[{eventId:id,period:'afternoon'}]);
  assert.deepEqual(after.assertState(planned),planned);
  const done=before.settleDay(planned);assert.deepEqual(after.assertState(done),done);
 }
});
