const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const draw=new Proxy({}, {get:()=>()=>{},set:()=>true});
function element(){return {hidden:true,textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){}},getContext:()=>draw,replaceChildren(){},append(){},setAttribute(){},addEventListener(){},focus(){},querySelector:()=>element(),innerHTML:''};}
const elements={},storage={},events={};const context={document:{getElementById:id=>elements[id]??=element(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>element(),addEventListener(){}},window:{addEventListener(name,handler){events[name]=handler;}},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},Date,console,confirm:()=>true};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../farm-empire/progression.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/../farm-empire/slots.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/../farm-empire/workers.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/../farm-empire/game.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
run("const originalFresh=fresh;fresh=(...args)=>{const s=originalFresh(...args);s.started-=60000;return s;}");
run("state=fresh('Tester','girl')");assert.equal(run('state.room'),'home');assert.equal(run('state.money'),50);assert.equal(run('Object.values(state.seeds).reduce((a,b)=>a+b,0)'),0);
assert.equal(run('cycle(state.started+599999).night'),false);assert.equal(run('cycle(state.started+600000).night'),true);assert.equal(run('cycle(state.started+1200000).day'),2);
for(const type of ['carrot','potato','tomato']){run(`state.room='world';state.x=334;state.y=165;selected='${type}';state.seeds[selected]=1;tend(0)`);assert.equal(run('state.seeds[selected]'),0);assert.equal(run('state.plots[0].type'),type);run('tend(0)');assert.equal(run('state.crops[selected]'),0);run('state.water=2;tend(0);state.plots[0].planted-=CROPS[selected].grow;tend(0)');assert.equal(run('state.crops[selected]'),1);assert.equal(run('state.plots[0]'),null);}
run("state.started=gameNow()-PHASE;state.room='world';enter(buildings[1])");assert.equal(run('state.room'),'world');run('enter(buildings[0])');assert.equal(run('state.room'),'home');run('exitRoom()');assert.equal(run('state.room'),'world');
assert.equal(run('plots.length'),10);assert.equal(run('CROPS.carrot.seed'),50);assert.equal(run('CROPS.potato.sell'),600);assert.equal(run('CROPS.tomato.grow'),20000);
run('save();state=null;load()');assert.equal(run('state.name'),'Tester');
// Exercise actual trade callbacks with a collecting DOM stub.
elements['trade-items']=element();elements['trade-items'].append=function(row){(this.rows??=[]).push(row)};context.document.createElement=()=>{let e=element();e.append=(...children)=>e.children=children;return e};
run("state.started=gameNow();state.room='shop';trade='shop';renderTrade()");let buy=elements['trade-items'].rows[0].children[1];const before=run('state.money');buy.onclick();assert.equal(run('state.money'),before-50);assert.equal(run('state.seeds.carrot'),1);
elements['trade-items'].rows=[];run("state.room='market';trade='market';renderTrade()");elements['trade-items'].rows[0].children[1].onclick();assert.equal(run('state.money'),before+50);assert.equal(run('state.crops.carrot'),0);
run("world(gameNow());state.room='home';interior(gameNow());state.room='shop';interior(gameNow())");
console.log('PASS: character start, crop timings and harvesting, prices, buying, selling, ten plots, day/night gates, save/load, render smoke checks.');

// Walking over plots harvests ripe crops only, never plants or consumes seeds.
run("state=fresh('Walker','boy');trade=null;state.room='world';state.x=plots[0].x+20;state.y=plots[0].y+20");
assert.equal(run('blocked(state.x,state.y)'),false);
assert.equal(run('plots.every(p=>p.y>=153&&p.y+p.h<=288)'),true);
run("state.plots[0]={type:'carrot',planted:gameNow()-10001};keys.add('d');frame(100)");
assert.equal(run('state.crops.carrot'),1);assert.equal(run('state.plots[0]'),null);
run('frame(116)');assert.equal(run('state.seeds.carrot'),0);assert.equal(run('state.plots[0]'),null);assert.equal(run('state.crops.carrot'),1);
run("state.plots[0]={type:'carrot',planted:gameNow()};frame(132)");assert.equal(run('state.plots[0].type'),'carrot');assert.equal(run('state.crops.carrot'),1);
run("state.x=plots[0].x-10;state.plots[0].planted-=10001;harvestUnderfoot()");assert.equal(run('state.crops.carrot'),1);
console.log('PASS: plots stay inside farm, walkable soil, movement auto-harvest, no auto-planting, no premature or distant harvest.');

// Bulk sales credit every harvested item once and preserve other crop types.
elements['trade-items'].rows=[];
run("state=fresh('Seller','boy');state.room='market';trade='market';state.crops.carrot=7;state.crops.potato=2;renderTrade()");
const sellAll=elements['trade-items'].rows[0].children[2];
assert.equal(sellAll.textContent,'Sell all · £7.00');assert.equal(sellAll.disabled,false);
sellAll.onclick();assert.equal(run('state.money'),750);assert.equal(run('state.crops.carrot'),0);assert.equal(run('state.crops.potato'),2);
sellAll.onclick();assert.equal(run('state.money'),750);
assert.equal(elements['trade-items'].rows[7].children[2].disabled,true);
run('state=null;load()');assert.equal(run('state.money'),750);assert.equal(run('state.crops.carrot'),0);
elements['trade-items'].rows=[];run("trade='market';renderTrade();state.started=gameNow()-PHASE");elements['trade-items'].rows[1].children[2].onclick();assert.equal(run('state.money'),750);assert.equal(run('state.crops.potato'),2);
console.log('PASS: sell-all totals, inventory, repeat-click protection, empty-stock disabling, persistence and nighttime closure.');
// Bed interaction skips only nighttime and advances crops by the skipped time.
run("state=fresh('Sleeper','girl');trade=null;state.started=gameNow()-PHASE-120000;state.plots[0]={type:'tomato',planted:gameNow()};keys.add('w');target={x:400,y:400}");
assert.equal(run('nearBed()'),true);run('interact()');assert.equal(run('cycle().night'),false);assert.equal(run('cycle().day'),2);assert.ok(run('cycle().remaining')>599000);assert.equal(run('keys.size'),0);assert.equal(run('target'),null);assert.ok(run('gameNow()-state.plots[0].planted')>=20000);assert.equal(run('state.crops.tomato'),0);
const morningStart=run('state.started');assert.equal(run('sleepUntilMorning()'),false);assert.equal(run('state.started'),morningStart);
run('state=null;load()');assert.equal(run('cycle().day'),2);assert.equal(run('state.room'),'home');
run("state.started=gameNow()-PHASE;state.x=650;state.y=450");assert.equal(run('sleepUntilMorning()'),false);assert.equal(run('cycle().night'),true);
run("state.room='world';state.x=365;state.y=302");assert.equal(run('sleepUntilMorning()'),false);
console.log('PASS: nighttime bed interaction, next-day dawn, crop time advancement, daytime/distance/room guards, and saved morning.');

// Lake collision follows the water shape, leaving shoreline and dock accessible.
run("state=fresh('Tester','boy');state.room='world'");
for(const [x,y] of [[100,450],[40,450],[180,450],[60,400],[60,525]])assert.equal(run(`blocked(${x},${y})`),true);
for(const [x,y] of [[40,410],[190,460],[100,535]])assert.equal(run(`blocked(${x},${y})`),false);
run('state.x=100;state.y=450;save();state=null;load()');assert.equal(run('inLake(state.x,state.y)'),false);
for(const type of ['carrot','potato','tomato']){
 elements['trade-items'].rows=[];run(`state=fresh('Buyer','boy');state.room='shop';trade='shop';state.money=1275;renderTrade()`);
 const index=['carrot','potato','tomato'].indexOf(type),cost=run(`CROPS.${type}.seed`),qty=Math.min(10,Math.floor(1275/cost));
 const button=elements['trade-items'].rows[index].children[2];assert.ok(button.textContent.startsWith('Buy '+qty+' · '));button.onclick();
 assert.equal(run(`state.seeds.${type}`),qty);assert.equal(run('state.money'),1275-qty*cost);assert.equal(run(`state.seeds.${type}`),qty);
 assert.equal(elements['trade-items'].rows[7+index].children[2].disabled,1275-qty*cost<cost);
 run('state=null;load()');assert.equal(run(`state.seeds.${type}`),qty);
}
elements['trade-items'].rows=[];run("state.money=1000;trade='shop';renderTrade();state.started=gameNow()-PHASE");elements['trade-items'].rows[0].children[2].onclick();assert.equal(run('state.money'),1000);
console.log('PASS: lake water collision, shoreline access, safe lake save recovery, bulk seed quantities/prices/remainders, persistence and night guard.');

// New crops remain dry until watered; the can waters exactly two plants.
run("state=fresh('Waterer','boy');trade=null;state.room='world';state.x=334;state.y=184;state.seeds.carrot=3;selected='carrot';tend(0)");
assert.equal(run('state.plots[0].planted'),null);run('harvestUnderfoot(gameNow()+1000000)');assert.equal(run('state.plots[0].planted'),null);assert.equal(run('state.crops.carrot'),0);
run('tend(0)');assert.equal(run('state.plots[0].planted'),null);
run('state.x=200;state.y=460;interact()');assert.equal(run('state.water'),2);run('interact()');assert.equal(run('state.water'),2);
run('state.x=334;state.y=184;tend(0)');assert.equal(run('state.water'),1);assert.ok(run('gameNow()-state.plots[0].planted')<1000);run('tend(0)');assert.equal(run('state.water'),1);
run('state.x=395;tend(1);harvestUnderfoot()');assert.equal(run('state.water'),0);assert.ok(run('state.plots[1].planted')>0);
run('state.x=456;tend(2);harvestUnderfoot()');assert.equal(run('state.plots[2].planted'),null);
run("state.room='home';state.x=365;state.y=302;state.started=gameNow()-PHASE;sleepUntilMorning()");assert.equal(run('state.plots[2].planted'),null);assert.ok(run('gameNow()-state.plots[0].planted')>=10000);
run('save();state=null;load()');assert.equal(run('state.water'),0);assert.equal(run('state.plots[2].planted'),null);
run("state.room='world';world(gameNow());frame(200)");
console.log('PASS: dry crops do not grow, lake refill capacity, manual/automatic watering, no double watering, empty-can behavior, sleep and save/load.');
// Mouse routes avoid obstacles and execute the requested action once on arrival.
function finishRoute(){for(let n=0;n<2000&&run('target!==null');n++)run('followPath(.04)');assert.equal(run('target'),null);}
run("state=fresh('Mouse','boy');trade=null;state.room='world';state.x=790;state.y=320;walkToClick(100,460)");assert.ok(run('target.path.length')>0);assert.equal(run('state.water'),0);finishRoute();assert.equal(run('state.water'),2);assert.equal(run('nearLake()'),true);assert.equal(run('inLake(state.x,state.y)'),false);
run('state.seeds.carrot=2;selected="carrot";walkToClick(334,184)');finishRoute();assert.equal(run('state.seeds.carrot'),1);assert.equal(run('state.plots[0].planted'),null);
run('walkToClick(334,184)');finishRoute();assert.ok(run('state.plots[0].planted')>0);assert.equal(run('state.water'),1);
run("state.x=375;state.y=350;walkToClick(375,490)");assert.ok(run('target.path.some(p=>p.x<=288||p.x>=462)'));finishRoute();assert.equal(run('state.room'),'market');
run("state.room='world';state.x=400;state.y=330;walkToClick(-100,-100)");assert.equal(run('target'),null);assert.equal(run('state.x'),400);assert.equal(run('state.y'),330);
run('state.x=200;state.y=460;state.water=0;walkToClick(100,460)');assert.equal(run('state.water'),2);assert.equal(run('target'),null);
run("state.room='home';state.x=365;state.y=302;walkToClick(310,270)");assert.equal(run('target'),null);assert.equal(run('state.x'),365);
console.log('PASS: lake click refill near/far, plot arrival plant/water once, route around market into door, unreachable destinations stay put.');

// Item shop progression, pricing, watering upgrades, and sprinkler automation.
run("state=fresh('Upgrader','boy');state.room='items';trade='items';state.money=8000");
assert.equal(run('buyUpgrade(1)'),false);assert.equal(run('buyUpgrade(2)'),false);assert.equal(run('state.money'),8000);
assert.equal(run('buyUpgrade(0)'),true);assert.equal(run('state.money'),7000);run('refillCan()');assert.equal(run('state.water'),5);assert.equal(run('buyUpgrade(0)'),false);
assert.equal(run('buyUpgrade(1)'),true);assert.equal(run('state.money'),5000);run('refillCan()');assert.equal(run('state.water'),10);
run('save();state=null;load()');assert.equal(run('state.upgrade'),2);assert.equal(run('state.water'),10);assert.equal(run('state.room'),'items');
run("state.plots[0]={type:'carrot',planted:null};state.plots[1]={type:'tomato',planted:12345}");assert.equal(run('buyUpgrade(2)'),true);assert.equal(run('state.money'),0);assert.ok(run('state.plots[0].planted')>0);assert.equal(run('state.plots[1].planted'),12345);
run("state.room='world';state.x=456;state.y=184;state.seeds.carrot=1;selected='carrot';state.water=0;tend(2)");assert.ok(run('state.plots[2].planted')>0);assert.equal(run('state.water'),0);
run("state=fresh('Poor','boy');state.room='items';trade='items'");assert.equal(run('buyUpgrade(0)'),false);run('state.money=8000;state.started=gameNow()-PHASE');assert.equal(run('buyUpgrade(0)'),false);
run("state.started=gameNow();state.room='world';trade=null;state.x=740;state.y=350;walkToClick(840,470)");finishRoute();assert.equal(run('state.room'),'items');run('interior(gameNow());exitRoom()');assert.equal(run('state.x'),840);run('world(gameNow())');
console.log('PASS: item-shop entry/exit, upgrade order, exact prices, 5/10-use refills, persistence, sprinkler old/new crops, insufficient funds and night guard.');


// Helpers preserve crop ownership through harvest, pile, transport and sale.
run("state=fresh('Boss','girl');state.room='items';trade='items';state.upgrade=3;state.money=22500");
assert.equal(run('buyUpgrade(4)'),false);assert.equal(run('buyUpgrade(3)'),true);assert.equal(run('state.money'),12500);
run("state.plots[0]={type:'tomato',planted:gameNow()-30000};state.plots[1]={type:'carrot',planted:null}");
for(let i=0;i<300;i++)run('updateWorkers(.04)');
assert.equal(run('state.plots[0]'),null);assert.equal(run('state.pile.tomato'),1);assert.equal(run('state.crops.tomato'),0);assert.equal(run('state.plots[1].planted'),null);
run('save();state=null;load()');assert.equal(run('state.upgrade'),4);assert.equal(run('state.pile.tomato'),1);
assert.equal(run('buyUpgrade(4)'),true);assert.equal(run('state.money'),0);
for(let i=0;i<40;i++)run('updateWorkers(.04)');
assert.equal(run('state.workers.seller.cargo.tomato'),1);assert.equal(run('state.pile.tomato'),0);
run('save();state=null;load();state.started=gameNow()-PHASE');
for(let i=0;i<200;i++)run('updateWorkers(.04)');assert.equal(run('state.money'),0);assert.equal(run('state.workers.seller.cargo.tomato'),0);assert.equal(run('state.pile.tomato'),1);
run('state.started=gameNow()');for(let i=0;i<600;i++)run('updateWorkers(.04)');assert.equal(run('state.money'),1200);assert.equal(run('state.workers.seller.cargo.tomato'),0);
for(let i=0;i<250;i++)run('updateWorkers(.04)');assert.equal(run('state.money'),1200);
run("state.room='world';state.x=456;state.y=184;state.seeds.carrot=1;selected='carrot';tend(2)");assert.ok(run('state.plots[2].planted')>0);
run('state.pile.potato=2;collectPile()');assert.equal(run('state.crops.potato'),2);assert.equal(run('state.pile.potato'),0);
run('world(gameNow())');
console.log('PASS: helper purchase order/prices, ripe-only harvesting, pile ownership, carried cargo save/load, nighttime pause, exact sale proceeds, no duplicate sales, retained sprinkler and manual pile collection.');

// E must work after clicking sidebar buttons, and show the collected inventory.
run("state=fresh('Collector','boy');state.upgrade=4;state.room='world';state.x=480;state.y=330;state.pile.carrot=3;trade=null;tab='seeds'");
events.keydown({key:'e',target:{tagName:'BUTTON'},repeat:false,preventDefault(){}});
assert.equal(run('state.pile.carrot'),0);assert.equal(run('state.crops.carrot'),3);assert.equal(run('tab'),'crops');
assert.ok(elements['toast'].textContent.includes('Harvest satchel'));
run('state.x=480;state.y=290;frame(300)');assert.equal(elements['prompt'].textContent,'E · Collect crops from pile');
console.log('PASS: E collects pile with sidebar-button focus, displays harvest inventory, and matches nearby interaction prompt.');
// Planter and buyer unlock in order, persist, and honor live inventory/funds.
run("state=fresh('Manager','boy');state.room='items';trade='items';state.upgrade=5;state.money=32500;ensureWorkers()");
assert.equal(run('buyUpgrade(6)'),false);assert.equal(run('buyUpgrade(5)'),true);assert.equal(run('state.money'),17500);
run('state.seeds={carrot:1,potato:1,tomato:1,pumpkin:0,apple:0,pear:0,melon:0,pineapple:0}');
for(let n=0;n<300;n++)run('updatePlanter(.04,1000)');
assert.equal(run('state.plots[0].type'),'tomato');assert.equal(run('state.plots[1].type'),'potato');assert.equal(run('state.plots[2].type'),'carrot');assert.equal(run('state.plots.filter(Boolean).length'),3);assert.equal(run('state.plots[0].planted'),1000);
assert.equal(run('buyUpgrade(6)'),true);assert.equal(run('state.money'),0);assert.equal(run('state.buyerSeed'),'none');
run('state.money=100000;updateBuyer(1)');assert.equal(run('state.money'),100000);
run("state.buyerSeed='carrot'");for(let n=0;n<300;n++)run('updateBuyer(.04)');
assert.equal(run('state.seeds.carrot'),7);assert.equal(run('state.money'),99650);run('updateBuyer(1)');assert.equal(run('state.money'),99650);
run('state.seeds.carrot=7;updateBuyer(.04)');assert.equal(run('state.seeds.carrot'),7);assert.equal(run('state.money'),99650);
run("state.seeds=emptyCargo();state.buyerSeed='tomato';state.money=2500;updateBuyer(.04)");assert.equal(run('state.seeds.tomato'),2);assert.equal(run('state.money'),500);
run("state.buyerSeed='none';state.money=50000;updateBuyer(1)");assert.equal(run('state.money'),50000);
run("state.buyerSeed='potato';state.started=gameNow()-PHASE;updateBuyer(1)");assert.equal(run('state.seeds.potato'),0);assert.equal(run('state.money'),50000);
run('save();state=null;load()');assert.equal(run('state.upgrade'),7);assert.equal(run('state.buyerSeed'),'potato');assert.equal(run('state.seeds.tomato'),2);
run("state.started=gameNow();state.seeds.potato=12;updateBuyer(1)");assert.equal(run('state.seeds.potato'),12);assert.equal(run('state.money'),50000);
run('state.plots=Array.from({length:10},()=>({type:"carrot",planted:gameNow()}));state.workers.planter.job=0;state.workers.planter.path=[];updatePlanter(1)');assert.equal(run('state.seeds.potato'),12);assert.equal(run('state.plots[0].type'),'carrot');
run("state.room='world';world(gameNow())");
console.log('PASS: planter/buyer unlock order and prices, expensive-first planting, no overwriting plots, buyer None/cap/restock/affordability/night checks, and save/load.');

run("state=fresh('Pumpkin farmer','girl');state.room='world';state.x=334;state.y=184;state.seeds.pumpkin=1;selected='pumpkin';tend(0)");assert.equal(run('state.plots[0].planted'),null);run('state.water=2;tend(0);state.plots[0].planted=gameNow()-29000;tend(0)');assert.equal(run('state.crops.pumpkin'),0);run('state.plots[0].planted-=2000;tend(0)');assert.equal(run('state.crops.pumpkin'),1);
assert.equal(run('CROPS.pumpkin.seed'),2000);assert.equal(run('CROPS.pumpkin.sell'),2500);assert.equal(run('CROPS.pumpkin.grow'),30000);
run('state.seeds.pumpkin=1;state.seeds.tomato=2');assert.equal(run('bestSeed()'),'pumpkin');
run("state.upgrade=7;ensureWorkers();state.seeds=emptyCargo();state.buyerSeed='pumpkin';state.workers.buyer.x=627;state.workers.buyer.y=530;state.money=4500;updateBuyer(1)");assert.equal(run('state.seeds.pumpkin'),2);assert.equal(run('state.money'),500);
run('delete state.seeds.pumpkin;delete state.crops.pumpkin;delete state.pile.pumpkin;save();state=null;load()');assert.equal(run('state.seeds.pumpkin'),0);assert.equal(run('state.crops.pumpkin'),0);assert.equal(run('state.pile.pumpkin'),0);assert.equal(run('state.name'),'Pumpkin farmer');
console.log('PASS: pumpkin watering/growth/prices, planter priority, buyer restock and migration of existing saves.');

run("state=fresh('Apple farmer','boy');state.room='world';state.x=334;state.y=184;state.seeds.apple=1;selected='apple';tend(0)");assert.equal(run('state.plots[0].planted'),null);run('state.water=2;tend(0);state.plots[0].planted=gameNow()-44000;tend(0)');assert.equal(run('state.crops.apple'),0);run('state.plots[0].planted-=2000;tend(0)');assert.equal(run('state.crops.apple'),1);
assert.equal(run('CROPS.apple.seed'),3000);assert.equal(run('CROPS.apple.sell'),4000);assert.equal(run('CROPS.apple.grow'),45000);
run('state.seeds.apple=1;state.seeds.pumpkin=2');assert.equal(run('bestSeed()'),'apple');
run("state.upgrade=7;ensureWorkers();state.seeds=emptyCargo();state.buyerSeed='apple';state.workers.buyer.x=627;state.workers.buyer.y=530;state.money=6500;updateBuyer(1)");assert.equal(run('state.seeds.apple'),2);assert.equal(run('state.money'),500);
elements['trade-items'].rows=[];run("trade='market';renderTrade()");elements['trade-items'].rows[4].children[1].onclick();assert.equal(run('state.money'),4500);assert.equal(run('state.crops.apple'),0);
run('delete state.seeds.apple;delete state.crops.apple;delete state.pile.apple;save();state=null;load()');assert.equal(run('state.seeds.apple'),0);assert.equal(run('state.crops.apple'),0);assert.equal(run('state.pile.apple'),0);assert.equal(run('state.name'),'Apple farmer');
console.log('PASS: apple watering/timing/prices/sale, helper priority and buying, existing-save compatibility.');

run("state=fresh('Daylight','girl');state.started=1000000;state.plots[0]={type:'carrot',planted:state.started+PHASE-4000}");
assert.equal(run('growthAge(state.plots[0],state.started+PHASE)'),4000);
assert.equal(run('growthAge(state.plots[0],state.started+2*PHASE)'),4000);
assert.equal(run('growthAge(state.plots[0],state.started+2*PHASE+6000)'),10000);
run('state.plots[0].planted=state.started+PHASE+2000');assert.equal(run('growthAge(state.plots[0],state.started+2*PHASE)'),0);assert.equal(run('growthAge(state.plots[0],state.started+4*PHASE)'),600000);
run("state=fresh('Sleeper','girl');state.started=gameNow()-PHASE-100000;state.plots[0]={type:'apple',planted:state.started+PHASE-5000}");const beforeSleep=run('growthAge(state.plots[0])');assert.equal(beforeSleep,5000);run('sleepUntilMorning()');assert.ok(Math.abs(run('growthAge(state.plots[0])')-beforeSleep)<100);run('save();state=null;load()');assert.ok(Math.abs(run('growthAge(state.plots[0])')-beforeSleep)<100);
run("state.started=gameNow()-PHASE-100000;state.room='world';state.x=334;state.y=184;state.upgrade=4;state.plots[0]={type:'carrot',planted:state.started+PHASE-4000};ensureWorkers();state.workers.harvester.job=0;state.workers.harvester.path=[];state.workers.harvester.x=334;state.workers.harvester.y=184;tend(0);harvestUnderfoot();updateWorkers(.04)");assert.equal(run('state.crops.carrot'),0);assert.equal(run('state.workers.harvester.cargo.carrot'),0);assert.ok(run('state.plots[0]'));
console.log('PASS: growth pauses across night, resumes at dawn, counts only daytime across multiple days, sleep/reload preserve progress, manual/automatic harvest reject unripe overnight crops.');

run("state=fresh('Roof test','boy');state.room='world'");
for(let i=0;i<4;i++){
 assert.equal(run(`blocked(buildings[${i}].x+40,buildings[${i}].y+10)`),true);
 assert.equal(run(`blocked(buildings[${i}].x-9,buildings[${i}].y+40)`),true);
 assert.equal(run(`blocked(buildings[${i}].door,buildings[${i}].y+buildings[${i}].h+12)`),false);
}
run('state.x=buildings[0].x+40;state.y=buildings[0].y+10;save();state=null;load()');assert.equal(run('blocked(state.x,state.y)'),false);
run('state.x=375;state.y=350;walkToClick(375,490)');finishRoute();assert.equal(run('state.room'),'market');
console.log('PASS: solid roofs and overhangs, accessible doors, roof save recovery and obstacle routing.');
run("state=fresh('Expander','boy');state.room='items';trade='items';state.money=99999");assert.equal(run('buyPlots()'),false);assert.equal(run('state.plots.length'),10);
run("state.money=600000;state.plots[0]={type:'apple',planted:null}");for(let i=0;i<5;i++){assert.equal(run('buyPlots()'),true);assert.equal(run('state.plots.length'),12+i*2);assert.equal(run('plots.length'),12+i*2);}
assert.equal(run('state.money'),100000);assert.equal(run('buyPlots()'),false);assert.equal(run('state.money'),100000);assert.equal(run('state.plots[0].type'),'apple');assert.equal(run('state.upgrade'),0);
assert.equal(run('plots[18].x'),40);assert.ok(run('plots.every(p=>p.x>=18&&p.y>=153&&p.y+p.h<=288)'));
run('save();state=null;load()');assert.equal(run('state.plots.length'),20);assert.equal(run('plots.length'),20);
run("state.room='world';trade=null;state.x=480;state.y=330;state.seeds.carrot=1;selected='carrot';walkToClick(64,188)");finishRoute();assert.equal(run('state.plots[18].type'),'carrot');assert.equal(run('state.seeds.carrot'),0);
run("state.upgrade=6;ensureWorkers();state.plots=state.plots.map(()=>({type:'apple',planted:null}));state.plots[19]=null;state.seeds.tomato=1;state.workers.planter.job=null;state.workers.planter.path=[]");for(let n=0;n<200;n++)run('updatePlanter(.04)');assert.equal(run('state.plots[19].type'),'tomato');
run('state.plots[19].planted=gameNow()-30000;state.workers.harvester.x=plots[19].x+24;state.workers.harvester.y=plots[19].y+24;state.workers.harvester.job=19;state.workers.harvester.path=[];updateWorkers(.04)');assert.equal(run('state.plots[19]'),null);assert.equal(run('state.workers.harvester.cargo.tomato'),1);
run('world(gameNow());updateUI()');assert.ok(elements['plot-count'].textContent.endsWith('/ 20'));
run("state=fresh('Night','boy');state.room='items';trade='items';state.money=100000;state.started=gameNow()-PHASE");assert.equal(run('buyPlots()'),false);
console.log('PASS: 2-plot expansion price/cap, independent purchases, existing crops/save preservation, leftward geometry, click planting and helpers on expanded plots.');

run("state=fresh('Buyer rules','girl');state.upgrade=7;ensureWorkers();state.buyerSeed='apple';state.money=100000;state.workers.buyer.x=627;state.workers.buyer.y=530;state.plots=Array(20).fill(null);state.seeds.carrot=1;updateBuyer(1)");assert.equal(run('state.money'),100000);assert.equal(run('state.seeds.apple'),0);
run('state.seeds.carrot=0;state.plots=state.plots.map(()=>({type:"carrot",planted:null}));updateBuyer(1)');assert.equal(run('state.money'),100000);
run('state.plots[0]=null;state.plots[1]=null;state.plots[2]=null;updateBuyer(1)');assert.equal(run('state.seeds.apple'),3);assert.equal(run('state.money'),91000);run('updateBuyer(1)');assert.equal(run('state.money'),91000);
run('state.seeds.apple=0;state.plots=Array(20).fill(null);updateBuyer(1)');assert.equal(run('state.seeds.apple'),20);assert.equal(run('state.money'),31000);
console.log('PASS: buyer requires zero seeds of every type and free plots, buys exactly plot demand, and supports 20-plot farms without stockpiling.');
run("state=fresh('Basket','boy');state.upgrade=4;state.plots=Array.from({length:20},(_,i)=>i<7?{type:i%2?'apple':'carrot',planted:gameNow()-50000}:null);syncPlots();ensureWorkers()");
let largestLoad=0,firstDeposit=0;
for(let n=0;n<2000;n++){run('updateWorkers(.04)');const load=run('cargoCount(state.workers.harvester.cargo)');largestLoad=Math.max(largestLoad,load);assert.ok(load<=5);const pile=run('cargoCount(state.pile)');if(pile&&!firstDeposit)firstDeposit=pile;if(pile===7)break;}
assert.equal(largestLoad,5);assert.equal(firstDeposit,5);assert.equal(run('cargoCount(state.pile)'),7);assert.equal(run('state.harvests'),7);assert.equal(run('state.pile.apple'),3);assert.equal(run('state.pile.carrot'),4);
run('save();state=null;load()');assert.equal(run('cargoCount(state.pile)'),7);
console.log('PASS: harvester fills five-item mixed baskets, deposits partial final loads, never exceeds capacity, and preserves exact crop counts.');

run("state=fresh('Pear farmer','girl');state.started=gameNow()-120000;state.room='world';state.x=334;state.y=184;state.seeds.pear=1;selected='pear';tend(0)");assert.equal(run('state.plots[0].planted'),null);run('state.water=2;tend(0);state.plots[0].planted=gameNow()-59000;tend(0)');assert.equal(run('state.crops.pear'),0);run('state.plots[0].planted-=2000;tend(0)');assert.equal(run('state.crops.pear'),1);
assert.equal(run('CROPS.pear.seed'),10000);assert.equal(run('CROPS.pear.sell'),11500);assert.equal(run('CROPS.pear.grow'),60000);
run('state.seeds.pear=1;state.seeds.apple=2');assert.equal(run('bestSeed()'),'pear');
run("state.seeds=emptyCargo();state.upgrade=7;ensureWorkers();state.buyerSeed='pear';state.workers.buyer.x=627;state.workers.buyer.y=530;state.money=20500;updateBuyer(1)");assert.equal(run('state.seeds.pear'),2);assert.equal(run('state.money'),500);
elements['trade-items'].rows=[];run("trade='market';renderTrade()");elements['trade-items'].rows[5].children[1].onclick();assert.equal(run('state.money'),12000);assert.equal(run('state.crops.pear'),0);
run('delete state.seeds.pear;delete state.crops.pear;delete state.pile.pear;save();state=null;load()');assert.equal(run('state.seeds.pear'),0);assert.equal(run('state.pile.pear'),0);assert.equal(run('state.name'),'Pear farmer');run("state.room='shop';interior(gameNow())");
console.log('PASS: pear watering/growth/prices/sale, helper priority/buying, save migration and render.');
run("state=fresh('Composter','boy');state.room='items';trade='items';state.money=49999");assert.equal(run('buyCompostHeap()'),false);run('state.money=50000');assert.equal(run('buyCompostHeap()'),true);assert.equal(run('state.money'),0);assert.equal(run('buyCompostHeap()'),false);
run("state.room='world';trade=null;state.x=653;state.y=190;interact();interact()");assert.equal(run('state.compost'),1);
run("state.x=334;state.y=184;state.plots[0]={type:'pear',planted:gameNow()-10000};tend(0)");assert.equal(run('state.compost'),0);assert.ok(run('Number.isFinite(state.plots[0].compostedAt)'));assert.ok(Math.abs(run('growthAge(state.plots[0],state.plots[0].compostedAt+1000)')-15000)<100);
run('state.compost=1;tend(0)');assert.equal(run('state.compost'),1);
run("state.plots[1]={type:'carrot',planted:null};state.x=395;state.water=0;tend(1)");assert.equal(run('state.compost'),1);assert.equal(run('state.plots[1].compostedAt'),undefined);
run('save();state=null;load()');assert.equal(run('state.compostHeap'),true);assert.equal(run('state.compost'),1);assert.ok(run('Number.isFinite(state.plots[0].compostedAt)'));
run("state.started=gameNow()-PHASE-10000;state.plots[0]={type:'pear',planted:state.started+PHASE-10000,compostedAt:state.started+PHASE-5000}");assert.equal(run('growthAge(state.plots[0])'),30000);run("state.room='home';state.x=365;state.y=302;sleepUntilMorning()");assert.ok(Math.abs(run('growthAge(state.plots[0])')-30000)<100);
run("state.room='world';world(gameNow())");console.log('PASS: compost purchase, single-portion carrying, 5x future growth only, no stacking/dry-plant use, save/load and nighttime/sleep pause.');

run("state=fresh('Night shift','boy');state.upgrade=7;state.room='world';state.started=gameNow()-PHASE;state.money=50000;state.seeds.apple=4;state.buyerSeed='pear';ensureWorkers();state.workers.harvester.x=334;state.workers.harvester.y=184;state.workers.harvester.cargo.apple=3;state.workers.seller.x=375;state.workers.seller.y=530;state.workers.seller.cargo.pear=2;state.workers.buyer.x=627;state.workers.buyer.y=530;state.plots[0]={type:'carrot',planted:state.started+1000}");
for(let n=0;n<600;n++){run('updateWorkers(.04)');assert.equal(run('Object.values(state.workers).some(w=>buildings.some(b=>insideBuilding(b,w.x,w.y)))'),false);}
assert.equal(run('state.pile.apple'),3);assert.equal(run('state.pile.pear'),2);assert.equal(run('state.money'),50000);assert.equal(run('state.seeds.apple'),4);assert.ok(run('state.plots[0]'));assert.equal(run("Object.values(state.workers).every(w=>w.commute==='away'&&w.x===1000)"),true);
run('save();state=null;load()');assert.equal(run("Object.values(state.workers).every(w=>w.commute==='away')"),true);
run('state.started=gameNow();updateWorkers(.04)');assert.equal(run("Object.values(state.workers).every(w=>w.commute==='returning'&&w.x<1000&&w.x>960)"),true);assert.equal(run('state.money'),50000);
for(let n=0;n<140;n++)run('updateCommutes(.04,gameNow())');assert.equal(run('Object.values(state.workers).every(w=>!w.commute)'),true);
assert.equal(run('state.pile.apple'),3);assert.equal(run('state.pile.pear'),2);
console.log('PASS: all four helpers stop at night, deposit mixed cargo exactly once, avoid buildings, leave right, persist offscreen, and return from the same road at dawn.');

run("state=fresh('Melon farmer','girl');state.started=gameNow()-180000;state.room='world';state.x=334;state.y=184;state.seeds.melon=1;selected='melon';tend(0)");assert.equal(run('state.plots[0].planted'),null);run('state.water=2;tend(0);state.plots[0].planted=gameNow()-89000;tend(0)');assert.equal(run('state.crops.melon'),0);run('state.plots[0].planted-=2000;tend(0)');assert.equal(run('state.crops.melon'),1);
assert.equal(run('CROPS.melon.seed'),100000);assert.equal(run('CROPS.melon.sell'),120000);assert.equal(run('CROPS.melon.grow'),90000);
run('state.seeds.melon=1;state.seeds.pear=2');assert.equal(run('bestSeed()'),'melon');
run("state.seeds=emptyCargo();state.upgrade=7;ensureWorkers();state.buyerSeed='melon';state.workers.buyer.x=627;state.workers.buyer.y=530;state.money=205000;updateBuyer(1)");assert.equal(run('state.seeds.melon'),2);assert.equal(run('state.money'),5000);
elements['trade-items'].rows=[];run("trade='market';renderTrade()");elements['trade-items'].rows[6].children[1].onclick();assert.equal(run('state.money'),125000);assert.equal(run('state.crops.melon'),0);
run('delete state.seeds.melon;delete state.crops.melon;delete state.pile.melon;save();state=null;load()');assert.equal(run('state.seeds.melon'),0);assert.equal(run('state.pile.melon'),0);assert.equal(run('state.name'),'Melon farmer');run("state.room='shop';interior(gameNow())");
console.log('PASS: melon watering/growth/prices/sale, helper priority/buying, existing-save migration and counter rendering.');

// Legacy progress is copied, not deleted; slot switching never overwrites another farm.
run("state=fresh('Original','girl');state.money=12345;state.upgrade=7;state.buyerSeed='melon';state.plots[0]={type:'pear',planted:gameNow(),compostedAt:gameNow()}");storage['farm-empire-v1']=run('JSON.stringify(state)');delete storage['farm-empire-slots-v1'];run('saveSlots=Array.from({length:4},(_,i)=>({name:"Farm "+(i+1),game:null}));activeSlot=0;initSlots();state=null;load()');
assert.equal(run('state.money'),12345);assert.equal(run('state.upgrade'),7);assert.ok(storage['farm-empire-v1']);assert.equal(run('saveSlots.length'),4);
assert.equal(run("renameSlot('Orchard')"),true);assert.equal(run('startNewSlot()'),true);assert.equal(run('activeSlot'),1);assert.equal(run('state'),null);assert.equal(run('saveSlots[0].game.money'),12345);
run("state=fresh('Second','boy');state.money=6789;save();renameSlot('Meadow')");assert.equal(run('switchSlot(0)'),true);assert.equal(run('state.name'),'Original');assert.equal(run('state.money'),12345);assert.equal(run('state.buyerSeed'),'melon');assert.equal(run('saveSlots[0].name'),'Orchard');assert.equal(run('switchSlot(1)'),true);assert.equal(run('state.name'),'Second');
for(const i of [2,3]){run(`switchSlot(${i});state=fresh('Farmer ${i}','boy');save()`);}assert.equal(run('startNewSlot()'),false);assert.equal(run('activeSlot'),3);assert.equal(run('saveSlots[1].game.money'),6789);
run('state=null;initSlots();load()');assert.equal(run('activeSlot'),3);assert.equal(run('state.name'),'Farmer 3');assert.equal(run('saveSlots[1].name'),'Meadow');
const oldSet=context.localStorage.setItem;context.localStorage.setItem=()=>{throw Error('Storage full')};assert.equal(run('switchSlot(0)'),false);assert.equal(run('activeSlot'),3);assert.equal(run('state.name'),'Farmer 3');context.localStorage.setItem=oldSet;
console.log('PASS: legacy migration, four independent games, rename persistence, save-before-switch, full-slot protection, active-slot reload and storage-failure protection.');
run("state=fresh('Compost upgrades','boy');state.room='items';trade='items';state.money=900000");assert.equal(run('buyComposter(0)'),false);assert.equal(run('buyCompostHeap()'),true);assert.equal(run('buyComposter(1)'),false);
for(let i=0;i<3;i++){run("state.room='items';trade='items'");assert.equal(run(`buyComposter(${i})`),true);assert.equal(run(`buyComposter(${i})`),false);run("state.room='world';trade=null;state.x=653;state.y=163;takeCompost()");assert.equal(run('state.compost'),[5,10,20][i]);run('takeCompost()');assert.equal(run('state.compost'),[5,10,20][i]);}
assert.equal(run('state.money'),0);run("state.x=334;state.y=184;state.plots[0]={type:'melon',planted:gameNow()};tend(0)");assert.equal(run('state.compost'),19);run('tend(0)');assert.equal(run('state.compost'),19);
run('save();state=null;load()');assert.equal(run('state.compostTier'),3);assert.equal(run('state.compost'),19);assert.equal(run('compostCapacity()'),20);
run('delete state.compostTier;state.compost=1;save();state=null;load()');assert.equal(run('compostCapacity()'),1);assert.equal(run('state.compost'),1);
run("state.room='items';trade='items';state.money=99999");assert.equal(run('buyComposter(0)'),false);run('state.money=100000;state.started=gameNow()-PHASE');assert.equal(run('buyComposter(0)'),false);
console.log('PASS: sequential compost upgrades, exact costs, refill capacities 5/10/20, one-per-plant consumption, legacy saves, persistence and purchase guards.');


run("activeSlot=0;state=fresh('Pause test','girl');state.upgrade=7;state.room='world';state.started=gameNow()-100000;state.plots[0]={type:'melon',planted:gameNow()-1000};ensureWorkers();last=1000;frame(1016)");
const runningTime=run('gameNow()');assert.ok(run('growthAge(state.plots[0])')>=1016);
elements['pause-game'].onclick();assert.equal(run('state.paused'),true);const frozen=run('JSON.stringify(state)');run('frame(500000);frame(600000);interact()');assert.equal(run('gameNow()'),runningTime);assert.equal(run('JSON.stringify(state)'),frozen);
run('save();state=null;load()');assert.equal(run('state.paused'),true);assert.equal(run('gameNow()'),runningTime);
elements['pause-game'].onclick();run('frame(600016)');assert.equal(run('gameNow()'),runningTime+16);
context.document.hidden=true;const hiddenTime=run('gameNow()');run('frame(700000)');assert.equal(run('gameNow()'),hiddenTime);context.document.hidden=false;
run('save();state=null;load()');assert.equal(run('gameNow()'),hiddenTime);
run('saveSlots[1].game=null;switchSlot(1);state=fresh("Other paused farm","boy");save();frame(700016);switchSlot(0)');assert.equal(run('gameNow()'),hiddenTime);
console.log('PASS: pause/resume freezes simulation, persisted pause, no offline/hidden-tab catchup, and inactive save slots keep their own frozen clock.');


run("activeSlot=0;state=fresh('Bronze hero','girl');state.room='market';trade='market';state.crops.melon=1;state.money=880000");elements['trade-items'].rows=[];run('renderTrade()');elements['trade-items'].rows[6].children[1].onclick();assert.equal(run('state.wizardUnlocked'),true);assert.equal(run('state.money'),1000000);assert.equal(run("cropAvailable('pineapple')"),false);
run("state.room='world';state.x=140;state.y=355;trade='wizard';state.money=999999");assert.equal(run('openBronzePortal()'),false);run('state.money=1000000');assert.equal(run('openBronzePortal()'),true);assert.equal(run('state.money'),0);assert.equal(run('state.level'),'standard');assert.equal(run('state.portalOpen'),true);assert.equal(run('openBronzePortal()'),false);
run('save();state=null;load()');assert.equal(run('state.portalOpen'),true);
const otherSlot=run('JSON.stringify(saveSlots[1])');run('state.upgrade=7;state.compostHeap=true;state.compostTier=3;state.seeds.melon=8;state.plots.push(null,null);state.x=220;state.y=350');assert.equal(run('enterBronzePortal()'),true);
assert.equal(run('state.level'),'bronze');assert.equal(run('state.money'),50);assert.equal(run('state.upgrade'),0);assert.equal(run('state.plots.length'),10);assert.equal(run('state.compostHeap'),false);assert.equal(run('cargoCount(state.seeds)+cargoCount(state.crops)+cargoCount(state.pile)'),0);assert.equal(run('state.name'),'Bronze hero');assert.equal(run('state.room'),'home');assert.equal(run('JSON.stringify(saveSlots[1])'),otherSlot);assert.equal(run("cropAvailable('pineapple')"),true);
run('state=null;load()');assert.equal(run('state.level'),'bronze');assert.equal(run('CROPS.pineapple.seed'),150000);assert.equal(run('CROPS.pineapple.sell'),200000);assert.equal(run('CROPS.pineapple.grow'),120000);
run("state.room='world';state.started=gameNow()-180000;state.x=334;state.y=184;state.seeds.pineapple=1;selected='pineapple';tend(0);state.water=2;tend(0);state.plots[0].planted=gameNow()-119000;tend(0)");assert.equal(run('state.crops.pineapple'),0);run('state.plots[0].planted-=1000;tend(0)');assert.equal(run('state.crops.pineapple'),1);
run("state=fresh('Auto wizard','boy');state.upgrade=5;ensureWorkers();state.workers.seller.cargo.melon=1;state.workers.seller.job='sell';state.workers.seller.x=375;state.workers.seller.y=530;updateWorkers(.04)");assert.equal(run('state.wizardUnlocked'),true);
console.log('PASS: manual/automatic melon unlock, portal price and single charge, delayed full reset, isolated save slots, Bronze persistence and pineapple growth/prices.');
const shields=elements['progress-shields'];shields.replaceChildren=function(){this.badges=[]};shields.append=function(b){this.badges.push(b)};
for(const [level,count] of [['standard',0],['bronze',1],['silver',2],['gold',3]]){run(`state.level='${level}';renderProgressShields()`);assert.equal(shields.badges.length,count);assert.deepEqual(shields.badges.map(b=>b.className),['bronze','silver','gold'].slice(0,count).map(l=>'progress-shield '+l));run('save();state=null;load()');assert.equal(run('state.level'),level);}
console.log('PASS: cumulative Bronze/Silver/Gold shields and level persistence.');
