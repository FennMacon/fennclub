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
