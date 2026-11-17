import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUNDS,MAX_ROUNDS,getRound,nextRound,canFinishRound} from '../src/data/rounds.ts';
import {decideEnemy} from '../src/systems/EnemyBrain.ts';

test('five playable round configurations have distinct identity, two tasks and six enemies',()=>{
 assert.equal(ROUNDS.length,5);
 assert.equal(MAX_ROUNDS,5);
 assert.equal(new Set(ROUNDS.map(r=>r.biome)).size,5);
 for(const r of ROUNDS){
  assert.equal(r.puzzleIds.length,2);
  assert.notEqual(r.puzzleIds[0],r.puzzleIds[1]);
  assert.ok(r.enemies.length>=6);
  assert.equal(r.crystals.length,4);
 }
});
test('five rounds transition sequentially and end with finale',()=>{
 assert.deepEqual(ROUNDS.map(r=>r.id),[1,2,3,4,5]);
 assert.equal(nextRound(1),2);assert.equal(nextRound(4),5);
 assert.equal(nextRound(5),null);
 assert.throws(()=>getRound(9),RangeError);
});
test('next round is impossible until both mechanisms and crystals and boss where required',()=>{
 const ids=ROUNDS[4].puzzleIds; const s=new Set([ids[0]]);
 assert.equal(canFinishRound(s,ids,4,true,false),false);
 s.add(ids[1]);
 assert.equal(canFinishRound(s,ids,3,true,false),false);
 assert.equal(canFinishRound(s,ids,4,true,true),false);
 assert.equal(canFinishRound(s,ids,4,true,false),true);
 assert.equal(canFinishRound(s,ids,4,false,true),true);
});
test('charger telegraphs before a dash instead of instant collision',()=>{
 const d={kind:'charger' as const,mode:'patrol' as const,now:2000,modeUntil:0,x:50,y:0,homeX:50,homeY:0,playerX:210,playerY:0,direction:1 as const,lastFire:0,difficulty:2};
 const warning=decideEnemy(d,.016);
 assert.equal(warning.mode,'windup');assert.equal(warning.warning,true);
 assert.equal(warning.moveX,0);
 const dash=decideEnemy({...d,mode:'windup',modeUntil:2100,now:2200},.016);
 assert.equal(dash.mode,'attack');assert.equal(dash.charge,true);
 assert.ok(dash.moveX>0);
});
test('turret respects fire rate; drone dives with readable warning; hopper jumps',()=>{
 const base={mode:'patrol' as const,now:2000,modeUntil:0,x:50,y:60,homeX:50,homeY:60,playerX:180,playerY:60,direction:1 as const,lastFire:1800,difficulty:2};
 assert.equal(decideEnemy({...base,kind:'turret'},.016).fire,false);
 const charge=decideEnemy({...base,kind:'turret',lastFire:0},.016);
 assert.equal(charge.mode,'windup');assert.equal(charge.warning,true);
 assert.equal(charge.fire,false);
 const bolt=decideEnemy({...base,kind:'turret',mode:'windup',modeUntil:2200,now:2300},.016);
 assert.equal(bolt.mode,'recover');assert.equal(bolt.fire,true);
 const drone=decideEnemy({...base,kind:'drone'},.016);
 assert.equal(drone.mode,'windup');assert.equal(drone.warning,true);
 const hopper=decideEnemy({...base,kind:'hopper'},.016);
 assert.notEqual(hopper.moveY,0);
});
