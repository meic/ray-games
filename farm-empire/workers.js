// Helpers move independently while the game is running; cargo lives in the save.
function emptyCargo(){return Object.fromEntries(Object.keys(CROPS).map(type=>[type,0]));}
function cargoCount(cargo){return Object.values(cargo).reduce((a,b)=>a+b,0);}
function ensureWorkers(){
  if(!state)return;
  state.pile??=emptyCargo();
  for(const type of Object.keys(CROPS))if(!Number.isInteger(state.pile[type])||state.pile[type]<0)state.pile[type]=0;
  state.workers??={};
  for(const role of ['harvester','seller','planter','buyer']){
    let worker=state.workers[role];
    if(!worker||!Number.isFinite(worker.x)||!Number.isFinite(worker.y))worker=state.workers[role]={x:({harvester:510,seller:530,planter:550,buyer:570})[role],y:330,cargo:emptyCargo(),path:[],job:null};
    worker.cargo??=emptyCargo();
    for(const type of Object.keys(CROPS))if(!Number.isInteger(worker.cargo[type])||worker.cargo[type]<0)worker.cargo[type]=0;
    if(!Array.isArray(worker.path)||worker.path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))worker.path=[];
  }
}
function moveWorker(worker,dt){
  let remaining=100*dt;
  while(worker.path.length&&remaining>0){const p=worker.path[0],distance=Math.hypot(p.x-worker.x,p.y-worker.y);if(distance<.001){worker.path.shift();continue;}const step=Math.min(distance,remaining);worker.x+=(p.x-worker.x)*step/distance;worker.y+=(p.y-worker.y)*step/distance;remaining-=step;if(step===distance)worker.path.shift();}
  return worker.path.length===0;
}
function routeToRoad(worker){
  // Return around the bottom shops, never through their walls or roofs.
  if(worker.y<=350)return [{x:worker.x,y:330}];
  const lane=worker.x<500?480:730;
  if(Math.abs(worker.x-lane)<3)return [{x:lane,y:330}];
  return [{x:worker.x,y:550},{x:lane,y:550},{x:lane,y:330}];
}
function updateCommutes(dt,now){
  const night=cycle(now).night;
  let ready=true;
  for(const [role,w]of Object.entries(state.workers)){
    if(state.upgrade<({harvester:4,seller:5,planter:6,buyer:7})[role])continue;
    if(night&&(!w.commute||w.commute==='returning')){
      w.job=null;w.commute=cargoCount(w.cargo)?'dropoff':'leaving';
      w.path=routeToRoad(w);
      w.path.push(...(w.commute==='dropoff'?[{x:480,y:330}]:[{x:1000,y:330}]));save();
    }
    if(w.commute==='away'&&!night){w.commute='returning';w.path=[{x:480,y:330}];save();}
    if(w.commute==='dropoff'||w.commute==='leaving'||w.commute==='returning'){
      ready=false;
      if(moveWorker(w,dt)){
        if(w.commute==='dropoff'){
          for(const type of Object.keys(CROPS)){state.pile[type]+=w.cargo[type];w.cargo[type]=0;}
          w.commute='leaving';w.path=[{x:1000,y:330}];updateUI();
        }else if(w.commute==='leaving'){w.commute='away';w.x=1000;w.y=330;}
        else{w.commute=null;w.job=null;}
        save();
      }
    }else if(w.commute==='away')ready=false;
  }
  return !night&&ready;
}
function bestSeed(){return Object.keys(CROPS).filter(type=>state.seeds[type]>0&&cropAvailable(type)).sort((a,b)=>CROPS[b].seed-CROPS[a].seed)[0];}
function updatePlanter(dt,now=gameNow()){
  if(state.upgrade<6)return;
  const planter=state.workers.planter;
  if(!moveWorker(planter,dt))return;
  if(Number.isInteger(planter.job)){
    const index=planter.job,type=bestSeed();
    // Recheck at arrival: the player may have planted or spent these seeds.
    if(index>=0&&index<state.plots.length&&!state.plots[index]&&type){
      state.seeds[type]--;state.plots[index]={type,planted:state.upgrade>=3?now:null};save();updateUI();
    }
    planter.job=null;
  }
  const index=state.plots.findIndex(plant=>plant===null);
  if(index>=0&&bestSeed()){planter.job=index;planter.path=[{x:plots[index].x+24,y:plots[index].y+24}];}
}
function updateBuyer(dt,now=gameNow()){
  if(state.upgrade<7||cycle(now).night)return;
  const buyer=state.workers.buyer,type=state.buyerSeed;
  if(!moveWorker(buyer,dt))return;
  if(!Object.hasOwn(CROPS,type)||!cropAvailable(type))return;
  if(Object.values(state.seeds).some(count=>count>0))return;
  const freePlots=state.plots.filter(plant=>plant===null).length;
  const amount=Math.min(freePlots,Math.floor(state.money/CROPS[type].seed));
  if(amount<=0)return;
  if(Math.hypot(buyer.x-627,buyer.y-530)>2){
    // Walk east of the seed shop, around its right wall, then to its door.
    buyer.path=[{x:730,y:350},{x:730,y:550},{x:627,y:550},{x:627,y:530}];return;
  }
  state.money-=amount*CROPS[type].seed;state.seeds[type]+=amount;
  save();updateUI();
}
function updateWorkers(dt,now=gameNow()){
  if(!state||state.upgrade<4)return;
  ensureWorkers();
  if(!updateCommutes(dt,now))return;
  updatePlanter(dt,now);updateBuyer(dt,now);const h=state.workers.harvester;
  if(moveWorker(h,dt)){
    if(cargoCount(h.cargo)&&Math.hypot(h.x-480,h.y-330)<2){
      for(const type of Object.keys(CROPS)){state.pile[type]+=h.cargo[type];h.cargo[type]=0;}
      h.job=null;save();
    }else if(Number.isInteger(h.job)){
      const plant=state.plots[h.job];
      if(cargoCount(h.cargo)<5&&plant&&plant.planted!==null&&growthAge(plant,now)>=CROPS[plant.type].grow){h.cargo[plant.type]++;state.plots[h.job]=null;state.harvests++;}
      h.job=null;
      save();
    }
    // Fill the basket from the nearest ripe plots, then deposit a full or partial load.
    let index=-1,distance=Infinity;
    if(cargoCount(h.cargo)<5)state.plots.forEach((plant,i)=>{
      if(!plant||plant.planted===null||growthAge(plant,now)<CROPS[plant.type].grow)return;
      const d=Math.hypot(plots[i].x+24-h.x,plots[i].y+24-h.y);
      if(d<distance){index=i;distance=d;}
    });
    if(index>=0){h.job=index;h.path=[{x:plots[index].x+24,y:plots[index].y+24}];}
    else if(cargoCount(h.cargo)){h.job='deposit';h.path=[{x:480,y:330}];}
  }
  if(state.upgrade<5)return;
  const seller=state.workers.seller;
  // The market closes at night. Keep both carried crops and route until morning.
  if(cycle(now).night)return;
  if(!moveWorker(seller,dt))return;
  if(seller.job==='sell'){
    let earned=0;for(const type of Object.keys(CROPS)){earned+=seller.cargo[type]*CROPS[type].sell;recordSale(type,seller.cargo[type]);seller.cargo[type]=0;}
    state.money+=earned;seller.job='return';seller.path=[{x:375,y:550},{x:480,y:550},{x:480,y:330}];
    save();updateUI();if(earned)toast('Seller earned '+money(earned)+' at the market.');
  }else if(seller.job==='return'){seller.job=null;}
  else if(Math.hypot(seller.x-480,seller.y-330)>2){seller.path=[{x:480,y:330}];}
  else if(cargoCount(state.pile)){
    for(const type of Object.keys(CROPS)){seller.cargo[type]+=state.pile[type];state.pile[type]=0;}
    seller.job='sell';seller.path=[{x:480,y:550},{x:375,y:550},{x:375,y:530}];save();
  }
}
function collectPile(){ensureWorkers();const count=cargoCount(state.pile);if(!count){toast('The crop pile is empty.');return;}for(const type of Object.keys(CROPS)){state.crops[type]+=state.pile[type];state.pile[type]=0;}tab='crops';document.querySelectorAll('[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab===tab));save();updateUI();toast('Collected '+count+' crops · now in your Harvest satchel.');}
function drawWorkers(now){
  ensureWorkers();rect(ctx,456,313,48,28,'#8b6844');rect(ctx,459,316,42,4,'#c2a16a');rect(ctx,459,335,42,3,'#b28d59');
  let n=0;for(const type of Object.keys(CROPS))if(state.pile[type]){crop(ctx,467+n*12,322,type,2,.6);n++;}
  text(ctx,'CROP PILE · '+cargoCount(state.pile),480,357,9,'#344c39');
  for(const [role,worker]of Object.entries(state.workers)){if(state.upgrade<({harvester:4,seller:5,planter:6,buyer:7})[role])continue;avatar(ctx,worker.x,worker.y,role==='harvester'?'boy':'girl',1.5,worker.path.length?Math.floor(now/150)%2:0);text(ctx,role.toUpperCase(),worker.x,worker.y-51,8,'#2f4934');if(cargoCount(worker.cargo)){rect(ctx,worker.x-9,worker.y-17,18,12,'#a37d49');rect(ctx,worker.x-7,worker.y-15,14,2,'#d0b079');}}
}
