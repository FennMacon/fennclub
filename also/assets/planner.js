import {PERIODS} from './engine.js?v=3';
export const PERIOD_ORDER=Object.keys(PERIODS);
export function periodUsage(engine,state,period){
 const {start,duration}=PERIODS[period];
 return state.plan.reduce((minutes,item)=>{
  const from=PERIODS[item.period].start+item.minute,to=from+engine.getEvent(item.eventId).duration;
  return minutes+Math.max(0,Math.min(to,start+duration)-Math.max(from,start));
 },0);
}
export function nextPlanningPeriod(engine,state,current){
 const index=PERIOD_ORDER.indexOf(current);
 return PERIOD_ORDER.slice(Math.max(0,index)).find(part=>periodUsage(engine,state,part)<PERIODS[part].duration)??null;
}
export function periodChoices(engine,state,period){
 const left=PERIODS[period].duration-periodUsage(engine,state,period);
 return engine.getOptions(state)[period].filter(id=>!state.plan.some(item=>item.eventId===id)&&engine.getEvent(id).duration<=left);
}
