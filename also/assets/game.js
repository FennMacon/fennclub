import {createEngine,PERIODS,careStage} from './engine.js?v=2';
import {createSaveStore,exportSave} from './storage.js?v=2';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const title=s=>s[0].toUpperCase()+s.slice(1);
const clock=n=>`${(Math.floor(n/60)%12)||12}:${String(n%60).padStart(2,'0')} ${n>=720&&n<1440?'pm':'am'}`;
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
let engine,store,state,period='morning',protectSave=false;
function notify(message){$('notice').textContent=message;}
function save(){if(protectSave)return;const result=store.save(state);$('storage-warning').hidden=!result.error;$('storage-warning').textContent=result.error??'';}
function update(next,message){state=next;save();render();if(message)notify(message);}
function attempt(action){try{action();}catch(error){notify(error.message);}}
function render(){
 $('loading').hidden=true;$('game').hidden=false;
 $('day').textContent=`Day ${state.day}`;
 $('chapter').textContent=state.deathDay===null?'A life together':`${state.day-state.deathDay} days since Dad’s passing`;
 $('phase').textContent=state.phase==='planning'?'Planning your day':'Day complete';
 for(const [id,value] of [['player',state.playerHealth],['father',state.fatherHealth]]){$(id).value=value;$(id+'-value').textContent=`${value} / 1000`;}
 const scenes=['mourning','desert','autumn','hills','forest','snowy'];
 const level=state.deathDay!==null?0:5-careStage(state.fatherHealth);
 window.renderScene($('sceneCanvas').getContext('2d'),1200,200,scenes[level]);
 $('planning').hidden=state.phase!=='planning';$('summary').hidden=state.phase!=='summary';
 $('export').disabled=false;$('reset').disabled=false;
 if(state.phase==='summary'){
  const r=state.summary,box=$('summary-content');box.replaceChildren();
  box.append(node('p',`Your health: ${r.oldPlayerHealth} → ${state.playerHealth} (−${r.playerLoss}). Dad’s health: ${r.oldFatherHealth} → ${state.fatherHealth} (−${r.fatherLoss}).`));
  if(r.incidents.length) {
   const incident=node('div',undefined,'incident');incident.append(node('h4','An unexpected turn'));
   for(const item of r.incidents)incident.append(node('p',`${engine.getEvent(item.eventId).title} took priority at ${clock(PERIODS[item.period].start+item.minute)}. Other activities were moved later where possible.`));
   box.append(incident);
  }
  if(r.displaced.length)box.append(node('p',`There wasn’t time for: ${r.displaced.map(item=>engine.getEvent(item.eventId).title).join(', ')}. These activities were not completed or counted in today’s effects.`));
  const list=node('ul');for(const item of state.plan){const e=engine.getEvent(item.eventId);list.append(node('li',`${clock(PERIODS[item.period].start+item.minute)} · ${e.title}`));}box.append(list);
  if(!state.plan.length)box.append(node('p','A quiet day, with no activities planned.'));
  if(r.missedCare.length)box.append(node('p',`Care was missed: ${r.missedCare.map(id=>engine.getEvent(id).title).join(', ')}. Family stepped in; additional health loss was applied.`));
  if(r.milestones.length)box.append(node('p',`Care needs have changed. Stage ${Math.max(...r.milestones)} care will be available tomorrow.`));
  if(r.fatherDied)box.append(node('p','Dad has passed away. Take a moment. You can continue into the days that follow, with space for grief and the practical things that come with loss.'));
  if(state.playerHealth===0)box.append(node('p','You have reached the end of this playthrough. Start a new game whenever you are ready.'));
  $('advance').hidden=state.playerHealth===0;
  return;
 }
 const options=engine.getOptions(state);
 $('periods').replaceChildren();
 for(const part of Object.keys(PERIODS)){const b=node('button',title(part));b.type='button';b.setAttribute('aria-pressed',String(part===period));b.onclick=()=>{period=part;render();$('periods').children[Object.keys(PERIODS).indexOf(part)].focus();};$('periods').append(b);}
 $('period-time').textContent=`${clock(PERIODS[period].start)} — ${clock(PERIODS[period].start+PERIODS[period].duration)}`;
 const cards=$('activities');cards.replaceChildren();
 for(const id of options[period]){
  const e=engine.getEvent(id),card=node('article',undefined,'card');
  card.append(node('div',e.kind==='care'?'REQUIRED CARE':e.kind==='grief'?'AFTER LOSS':e.kind==='setup'?'NEW CARE NEED':e.shared?'TOGETHER':'FOR YOU','tag'),node('h4',e.title),node('p',e.description),node('p',`${e.duration} min${e.risk?' · Chance of a difficult outcome':''}`,'muted'));
  const controls=node('div',undefined,'card-controls');
  const planned=state.plan.some(i=>i.eventId===id),add=node('button',planned?'Planned':'Add to day');add.disabled=planned;
  add.onclick=()=>attempt(()=>update(engine.arrange(state,[...state.plan,{eventId:id,period}]),`${e.title} added. Your day has been rearranged.`));
  controls.append(node('span','Time arranged automatically','muted'),add);card.append(controls);cards.append(card);
 }
 if(!options[period].length)cards.append(node('p','No activities available in this period. Leave it open for yourself.'));
 const list=$('schedule');list.replaceChildren();let total=0;
 for(const item of state.plan){const e=engine.getEvent(item.eventId),start=PERIODS[item.period].start+item.minute,li=node('li'),time=node('time',`${clock(start)} — ${clock(start+e.duration)}`),row=node('div',undefined,'row'),remove=node('button','Remove');
  remove.setAttribute('aria-label',`Remove ${e.title}`);remove.onclick=()=>attempt(()=>update(engine.arrange(state,state.plan.filter(i=>i.eventId!==e.id)),`${e.title} removed.`));row.append(node('span',e.title),remove);li.append(time,row);list.append(li);total+=e.duration;
 }
 if(!state.plan.length)list.append(node('li','Your day is open. Add a moment from the left.'));
 $('planned-time').textContent=`${Math.floor(total/60)}h ${total%60}m planned`;
 $('prefill').hidden=state.deathDay!==null||careStage(state.fatherHealth)===0;
}
$('clear').onclick=()=>attempt(()=>update(engine.arrange(state,[]),'Plan cleared.'));
$('prefill').onclick=()=>attempt(()=>{
 const plan=[...state.plan];
 for(const [part,ids] of Object.entries(engine.getOptions(state)))for(const id of ids){
  if(engine.getEvent(id).kind==='care'&&!plan.some(i=>i.eventId===id))plan.push({eventId:id,period:part});
 }
 update(engine.arrange(state,plan),'Required care added. The rest of your day has been adjusted.');
});
$('settle').onclick=()=>attempt(()=>{if(state.phase!=='planning')return;const required=Object.values(engine.getOptions(state)).flat().filter(id=>engine.getEvent(id).kind==='care'&&!state.plan.some(i=>i.eventId===id));if(required.length&&!confirm('Required care is missing. End the day and apply missed-care penalties?'))return;update(engine.settleDay(state),'Day complete.');$('day').focus();});
$('advance').onclick=()=>attempt(()=>{if(state.phase!=='summary')return;update(engine.advanceDay(state),'A new day.');$('day').focus();});
$('reset').onclick=()=>attempt(()=>{if(!confirm('Start a new game? Your current progress will be replaced. Export it first if you want to keep it.'))return;protectSave=false;update(engine.newGame(seed()),'A new beginning.');});
$('export').onclick=()=>attempt(()=>{const blob=new Blob([exportSave(engine,state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=`also-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Save exported.');});
$('import').onchange=async event=>{const file=event.target.files[0];try{if(!engine)throw Error('Wait for the game to load.');if(!file)return;if(file.size>100000)throw Error('That save file is too large.');const {importSave}=await import('./storage.js?v=2');const next=importSave(engine,await file.text());if(!confirm('Replace the current game with this imported save?'))return;protectSave=false;update(next,'Save imported.');}catch(error){notify(error.message);}finally{event.target.value='';}};
window.addEventListener('storage',event=>{if(event.key==='fenn.also.save.v1'){protectSave=true;$('storage-warning').hidden=false;$('storage-warning').textContent='Another tab changed this save. Reload to use its progress, or export this tab before starting a new game. Autosaving is paused.';}});
try{
 const response=await fetch('./data/events.json?v=2');if(!response.ok)throw Error('The activity catalogue could not be loaded.');engine=createEngine(await response.json());
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};}
 store=createSaveStore(engine,storage);const loaded=store.load();state=loaded.state??engine.newGame(seed());
 if(loaded.error){protectSave=true;$('storage-warning').hidden=false;$('storage-warning').textContent=`${loaded.error} Your old save has been preserved. You can export this temporary game, import a valid save, or choose New game to replace it.`;}
 else save();render();
}catch(error){$('loading').textContent='The game could not load. Please reload to try again.';notify(error.message);}
