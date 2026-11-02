import {PERIOD_ORDER,periodUsage,nextPlanningPeriod,periodChoices} from './planner.js?v=8';
import {createEngine,PERIODS,careStage} from './engine.js?v=8';
import {createSaveStore,exportSave} from './storage.js?v=8';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const title=s=>s[0].toUpperCase()+s.slice(1);
const clock=n=>`${(Math.floor(n/60)%12)||12}:${String(n%60).padStart(2,'0')} ${n>=720&&n<1440?'pm':'am'}`;
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
let engine,store,state,period='morning',protectSave=false,noticeTimer,fadeTimer;
function dismissNotice(){clearTimeout(noticeTimer);$('notice').classList.add('fading');fadeTimer=setTimeout(()=>{$('notice').hidden=true;$('notice-text').textContent='';},250);}
function notify(message){clearTimeout(noticeTimer);clearTimeout(fadeTimer);$('notice').hidden=false;$('notice').classList.remove('fading');$('notice-text').textContent=message;noticeTimer=setTimeout(dismissNotice,2000);}
$('notice-close').onclick=dismissNotice;
$('notice').onmouseenter=()=>clearTimeout(noticeTimer);
$('notice').onmouseleave=()=>{noticeTimer=setTimeout(dismissNotice,2000);};
$('notice').onfocusin=()=>clearTimeout(noticeTimer);
$('notice').onfocusout=()=>{noticeTimer=setTimeout(dismissNotice,2000);};
function save(){if(protectSave)return;const result=store.save(state);$('storage-warning').hidden=!result.error;$('storage-warning').textContent=result.error??'';}
function update(next,message){state=next;save();render();if(message)notify(message);}
function attempt(action){try{action();}catch(error){notify(error.message);}}
function render(){
 $('loading').hidden=true;$('game').hidden=false;
 $('day').textContent=`Day ${state.day}`;
 $('chapter').textContent=state.deathDay===null?'A life together':`${state.day-state.deathDay} days since Dad’s passing`;
 $('phase').textContent=state.phase==='planning'?'Planning the day ahead':'Day complete';
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
  if(r.milestones.length)box.append(node('p',`Care needs have changed. Stage ${Math.max(...r.milestones)} care will be reserved tomorrow.`));
  if(r.fatherDied)box.append(node('p','Dad has passed away. Take a moment. You can continue into the days that follow, with space for grief and the practical things that come with loss.'));
  if(state.playerHealth===0)box.append(node('p','You have reached the end of this playthrough. Start a new game whenever you are ready.'));
  $('advance').hidden=state.playerHealth===0;
  return;
 }
 const availablePeriod=nextPlanningPeriod(engine,state,period);
 if(availablePeriod)period=availablePeriod;else{period='night';state.planningComplete=true;}
 const options=engine.getOptions(state);
 $('periods').replaceChildren();
 for(const part of Object.keys(PERIODS)){const b=node('button',title(part));b.type='button';b.setAttribute('aria-pressed',String(part===period));b.onclick=()=>{period=part;render();$('periods').children[Object.keys(PERIODS).indexOf(part)].focus();};$('periods').append(b);}
 const used=periodUsage(engine,state,period),left=PERIODS[period].duration-used;
 $('period-time').textContent=`${title(period)} · ${clock(PERIODS[period].start)} — ${clock(PERIODS[period].start+PERIODS[period].duration)} · ${left} min left`;
 $('period-progress').max=PERIODS[period].duration;$('period-progress').value=used;
 const setupMinutes=state.plan.filter(item=>engine.getEvent(item.eventId).kind==='setup').reduce((sum,item)=>sum+engine.getEvent(item.eventId).duration,0);
 const careMinutes=state.plan.filter(item=>engine.getEvent(item.eventId).kind==='care').reduce((sum,item)=>sum+engine.getEvent(item.eventId).duration,0);
 $('care-status').textContent=careMinutes?`Dad’s care is reserved: ${careMinutes} minutes today (stage ${careStage(state.fatherHealth)}). This time grows as his needs increase.${setupMinutes?` New care needs add ${setupMinutes} required minutes today.`:''}`:'No daily care tasks are required yet. More time will be reserved as Dad’s needs increase.';
 $('next-period').textContent=period==='night'?'Finish planning →':'Leave remaining time open →';
 $('next-period').disabled=false;
 const complete=state.planningComplete===true||PERIOD_ORDER.every(part=>periodUsage(engine,state,part)===PERIODS[part].duration);
 $('settle').hidden=!complete;

 const cards=$('activities');cards.replaceChildren();
 for(const id of periodChoices(engine,state,period)){
  const e=engine.getEvent(id),card=node('article',undefined,'card');
  card.append(node('div',e.kind==='care'?'REQUIRED CARE':e.kind==='grief'?'AFTER LOSS':e.kind==='setup'?'REQUIRED NEW CARE NEED':e.shared?'TOGETHER':'FOR YOU','tag'),node('h4',e.title),node('p',e.description),node('p',`${e.duration} min${e.risk?' · Chance of a difficult outcome':''}`,'muted'));
  const controls=node('div',undefined,'card-controls');
  const planned=state.plan.some(i=>i.eventId===id),add=node('button',planned?'Planned':'Add to day');add.disabled=planned;
  add.onclick=()=>attempt(()=>{
   const current=period,next=engine.arrange(state,[...state.plan,{eventId:id,period}]);
   const following=nextPlanningPeriod(engine,next,current);period=following??'night';
   if(!following)next.planningComplete=true;
   update(next,`${e.title} added.${following&&following!==current?' Now plan '+following+'.':''}`);
  });
  controls.append(node('span','Time arranged automatically','muted'),add);card.append(controls);cards.append(card);
 }
 if(!periodChoices(engine,state,period).length){
  const ready=node('p'),play=node('a','Play the planned day');
  play.href='#summary';
  play.onclick=event=>{event.preventDefault();$('settle').click();};
  ready.append('Your plan is ready. ',play,' to see how it unfolds.');cards.append(ready);
 }
 const list=$('schedule');list.replaceChildren();let total=0;
 for(const item of state.plan){const e=engine.getEvent(item.eventId),start=PERIODS[item.period].start+item.minute,li=node('li'),time=node('time',`${clock(start)} — ${clock(start+e.duration)}`),row=node('div',undefined,'row'),remove=node('button','Remove');
  remove.setAttribute('aria-label',`Remove ${e.title}`);remove.onclick=()=>attempt(()=>{period=item.preferredPeriod??item.period;update({...engine.arrange(state,state.plan.filter(i=>i.eventId!==e.id)),planningComplete:false},`${e.title} removed.`);});row.append(node('span',e.title));if(['care','setup'].includes(e.kind))row.append(node('span','Required','tag'));else row.append(remove);li.append(time,row);list.append(li);total+=e.duration;
 }
 if(!state.plan.length)list.append(node('li','Your day is open. Add a moment from the left.'));
 $('planned-time').textContent=`${Math.floor(total/60)}h ${total%60}m planned`;

}
$('clear').onclick=()=>attempt(()=>{period='morning';update(engine.prepareDay({...engine.arrange(state,[]),planningComplete:false}),'Optional activities cleared. Required care and new care needs stay reserved.');});
$('next-period').onclick=()=>{
 const index=PERIOD_ORDER.indexOf(period);
 if(index<PERIOD_ORDER.length-1){const following=nextPlanningPeriod(engine,state,PERIOD_ORDER[index+1]);period=following??'night';if(!following){state={...state,planningComplete:true};save();}render();}
 else{state={...state,planningComplete:true};save();render();$('settle').focus();notify('Your plan is ready. Play the day to see how it unfolds.');}
};
$('settle').onclick=()=>attempt(()=>{if(state.phase!=='planning')return;const required=Object.values(engine.getOptions(state)).flat().filter(id=>engine.getEvent(id).kind==='care'&&!state.plan.some(i=>i.eventId===id));if(required.length&&!confirm('Required care is missing. End the day and apply missed-care penalties?'))return;update(engine.settleDay(state),'Day complete.');$('day').focus();});
$('advance').onclick=()=>attempt(()=>{if(state.phase!=='summary')return;period='morning';update(engine.prepareDay({...engine.advanceDay(state),planningComplete:false}),'Plan the next day. Required care is already reserved.');$('day').focus();});
$('reset').onclick=()=>attempt(()=>{if(!confirm('Start a new game? Your current progress will be replaced. Export it first if you want to keep it.'))return;protectSave=false;period='morning';update(engine.prepareDay(engine.newGame(seed())),'A new beginning.');});
$('export').onclick=()=>attempt(()=>{const blob=new Blob([exportSave(engine,state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=`also-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Save exported.');});
$('import').onchange=async event=>{const file=event.target.files[0];try{if(!engine)throw Error('Wait for the game to load.');if(!file)return;if(file.size>100000)throw Error('That save file is too large.');const {importSave}=await import('./storage.js?v=8');const next=importSave(engine,await file.text());if(!confirm('Replace the current game with this imported save?'))return;protectSave=false;period='morning';update(engine.prepareDay(next),'Save imported.');}catch(error){notify(error.message);}finally{event.target.value='';}};
window.addEventListener('storage',event=>{if(event.key==='fenn.also.save.v1'){protectSave=true;$('storage-warning').hidden=false;$('storage-warning').textContent='Another tab changed this save. Reload to use its progress, or export this tab before starting a new game. Autosaving is paused.';}});
try{
 const response=await fetch('./data/events.json?v=8',{cache:'no-store'});if(!response.ok)throw Error('The activity catalogue could not be loaded.');engine=createEngine(await response.json());
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};}
 store=createSaveStore(engine,storage);const loaded=store.load();state=engine.prepareDay(loaded.state??engine.newGame(seed()));period=state.phase==='planning'?(nextPlanningPeriod(engine,state,'morning')??'night'):'morning';
 if(loaded.error){protectSave=true;$('storage-warning').hidden=false;$('storage-warning').textContent=`${loaded.error} Your old save has been preserved. You can export this temporary game, import a valid save, or choose New game to replace it.`;}
 else save();render();
}catch(error){$('loading').textContent='The game could not load. Please reload to try again.';notify(error.message);}
