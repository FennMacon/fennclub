import {createEngine} from './engine.js?v=12';
export function validate(events){
 if(!Array.isArray(events)||events.length>500)throw Error('Use a catalogue with 1–500 events.');
 createEngine(events);
 for(const event of events){
  if(!/^[a-zA-Z0-9_-]+$/.test(event.id)||!event.title.trim())throw Error('Events need a stable ID and a name.');
  if(event.kind==='care'&&event.duration>180)throw Error('Daily care tasks must be 180 minutes or less.');
 }
 const care=events.filter(e=>e.kind==='care');
 for(const stage of new Set(care.map(e=>e.stage)))for(const period of ['morning','night'])if(care.filter(e=>e.stage===stage&&e.period===period).length!==1)throw Error(`Stage ${stage} needs exactly one morning care and one night care event.`);
 return events;
}
