const SLOTS_KEY='farm-empire-slots-v1';
let saveSlots=Array.from({length:4},(_,i)=>({name:'Farm '+(i+1),game:null})),activeSlot=0,slotsReadable=true;
function persistSlots(){if(!slotsReadable)return false;try{localStorage.setItem(SLOTS_KEY,JSON.stringify({version:1,activeSlot,slots:saveSlots}));return true;}catch{document.getElementById('save-status').textContent='Saving unavailable · keep this tab open';return false;}}
function initSlots(){
 try{
  const raw=localStorage.getItem(SLOTS_KEY);
  if(raw){const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.slots)||data.slots.length!==4||!Number.isInteger(data.activeSlot)||data.activeSlot<0||data.activeSlot>3||data.slots.some(s=>!s||typeof s.name!=='string'))throw Error('Invalid slots');saveSlots=data.slots;activeSlot=data.activeSlot;}
  else{const legacy=localStorage.getItem(KEY);if(legacy){saveSlots[0].game=JSON.parse(legacy);saveSlots[0].name=saveSlots[0].game.name?saveSlots[0].game.name+'’s farm':'Farm 1';}persistSlots();}
 }catch{slotsReadable=false;document.getElementById('save-status').textContent='Could not read saves. Existing browser saves have been left intact.';}
 renderSlots(true);
}
function renderSlots(updateName=false){
 const select=document.getElementById('save-slot');select.replaceChildren();
 saveSlots.forEach((slot,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+slot.name+(slot.game?' — '+slot.game.name:' — Empty');select.append(option);});select.value=String(activeSlot);
 if(updateName)document.getElementById('slot-name').value=saveSlots[activeSlot].name;
 document.getElementById('slot-status').textContent='Active: '+saveSlots[activeSlot].name+' · '+saveSlots.filter(s=>s.game).length+' / 4 slots used';
}
function switchSlot(index){
 if(!Number.isInteger(index)||index<0||index>3||index===activeSlot)return false;
 if(state&&!save()){toast('Could not save your current farm. Slot switching cancelled.');renderSlots();return false;}
 const previous=activeSlot;activeSlot=index;
 if(!persistSlots()){activeSlot=previous;renderSlots();toast('Could not save the slot selection. Your current farm is still open.');return false;}
 state=null;keys.clear();target=null;trade=null;selected='carrot';tab='seeds';saveTimer=0;uiTimer=0;doorCooldown=0;
 document.getElementById('trade').hidden=true;document.getElementById('start').hidden=false;document.getElementById('name').value='';document.getElementById('prompt').textContent='';
 load();previousNight=state?cycle().night:false;
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 updateUI();renderSlots(true);toast('Opened '+saveSlots[activeSlot].name);return true;
}
function renameSlot(name){name=name.trim().slice(0,24);if(!name){toast('Enter a name for this save slot.');return false;}const old=saveSlots[activeSlot].name;saveSlots[activeSlot].name=name;if(!persistSlots()){saveSlots[activeSlot].name=old;return false;}renderSlots(true);return true;}
function startNewSlot(){const index=saveSlots.findIndex(slot=>!slot.game);if(index<0){toast('All four slots are in use. Switch slots to continue an existing farm.');return false;}if(index===activeSlot){document.getElementById('name').focus();return true;}return switchSlot(index);}
