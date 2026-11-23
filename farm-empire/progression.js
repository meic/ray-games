const PROGRESS_LEVELS=['standard','bronze','silver','gold'];
function levelRank(level=state?.level){return Math.max(0,PROGRESS_LEVELS.indexOf(level));}
function renderProgressShields(){const holder=document.getElementById('progress-shields');holder.replaceChildren();for(const level of PROGRESS_LEVELS.slice(1,levelRank()+1)){const badge=document.createElement('span');badge.className='progress-shield '+level;badge.title=level[0].toUpperCase()+level.slice(1)+' achieved';badge.setAttribute('aria-label',badge.title);badge.setAttribute('role','img');const emblem=document.createElement('span');emblem.textContent=level[0].toUpperCase();badge.append(emblem);holder.append(badge);}holder.hidden=!state||levelRank()===0;}
function cropAvailable(type){return type!=='pineapple'||levelRank()>=1;}
function availableCrops(){return Object.entries(CROPS).filter(([type])=>cropAvailable(type));}
function recordSale(type,quantity){if(type==='melon'&&quantity>0&&levelRank()===0&&!state.wizardUnlocked){state.wizardUnlocked=true;toast('A wizard has appeared above the lake. Speak to him about Bronze!');}}
function nearWizard(){return state?.room==='world'&&state.wizardUnlocked&&levelRank()===0&&Math.hypot(state.x-140,state.y-355)<48;}
function renderWizard(){
 $('trade-kicker').textContent='THE NEXT CHAPTER';$('trade-title').textContent='A passage to Bronze';
 $('trade-intro').textContent=state.portalOpen?'Your portal is open. Walk through it to begin Bronze.': 'For £10,000 I can open a portal to Bronze. Entering resets this farm to £0.50, ten empty plots, no seeds, crops, items or helpers. Your farmer’s name and other save slots stay intact. Bronze unlocks pineapples.';
 const list=$('trade-items');list.replaceChildren();const button=document.createElement('button');button.className='primary';button.textContent=state.portalOpen?'Portal already open':'Accept offer · £10,000';button.disabled=state.portalOpen||state.money<1000000;button.onclick=openBronzePortal;list.append(button);
}
function openBronzePortal(){if(!state||state.paused||trade!=='wizard'||!nearWizard()||state.portalOpen||state.money<1000000)return false;const previous=state.money;state.money-=1000000;state.portalOpen=true;if(!save()){state.money=previous;state.portalOpen=false;toast('Could not save. Portal purchase cancelled.');return false;}closeTrade();updateUI();toast('Portal opened! Walk into it to restart at Bronze.');return true;}
function enterBronzePortal(){if(!state||state.paused||state.room!=='world'||!state.portalOpen||levelRank()>=1||Math.hypot(state.x-220,state.y-350)>18)return false;const previous=state;state=fresh(previous.name,previous.gender);state.level='bronze';if(!save()){state=previous;toast('Could not save Bronze. Your farm is unchanged.');return false;}keys.clear();target=null;trade=null;selected='carrot';tab='seeds';previousNight=false;doorCooldown=1;$('trade').hidden=true;updateUI();toast('Welcome to Bronze! Pineapples are now available in the seed shop.');return true;}
function drawWizard(){if(!state?.wizardUnlocked||levelRank()>=1)return;
 rect(ctx,129,325,22,30,'#7657a5');rect(ctx,133,313,14,13,'#e6bc95');rect(ctx,125,311,30,4,'#5e438e');rect(ctx,132,300,16,12,'#7657a5');rect(ctx,137,294,7,8,'#8b6ab7');rect(ctx,136,322,8,16,'#e7e0cb');rect(ctx,157,314,3,39,'#ac8958');rect(ctx,154,309,9,7,'#daca8b');text(ctx,'WIZARD',140,374,9,'#344c39');
 if(state.portalOpen){rect(ctx,198,311,44,45,'#7657a5');rect(ctx,204,305,32,57,'#9b7cc7');rect(ctx,207,312,26,44,'#3f355e');rect(ctx,213,318,14,32,'#74bdba');rect(ctx,194,356,52,7,'#b39568');text(ctx,'BRONZE',220,378,9,'#644d30');}
}
