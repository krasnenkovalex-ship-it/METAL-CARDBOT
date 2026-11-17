import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,HERO_IDS,chooseHero,currentHero,isHero} from '../src/data/heroes.ts';
import {canFire,meleeInRange,clampHealth,hitDistance,damageAfterArmor} from '../src/systems/CombatRules.ts';
test('three playable, distinct characters',()=>{
 assert.equal(HERO_IDS.length,3);
 assert.equal(new Set(HERO_IDS.map(x=>HEROES[x].name)).size,3);
 assert.notEqual(HEROES.megatrucker.projectileDamage,HEROES.bluecop.projectileDamage);
 assert.ok(HEROES.phoenixfire.attackInterval<HEROES.bluecop.attackInterval);
});
test('hero selection is stable and validated',()=>{
 chooseHero('megatrucker');assert.equal(currentHero(),'megatrucker');
 assert.equal(isHero('phoenixfire'),true);
 assert.equal(isHero('random'),false);
 chooseHero('bluecop');
});
test('shooting respects per-character cooldown',()=>{
 assert.equal(canFire(500,200,'bluecop'),true);
 assert.equal(canFire(400,200,'bluecop'),false);
 assert.equal(canFire(410,200,'phoenixfire'),true);
 assert.equal(canFire(410,200,'megatrucker'),false);
});
test('melee hits only close targets in the facing direction',()=>{
 assert.equal(meleeInRange(100,100,190,105,1),true);
 assert.equal(meleeInRange(100,100,0,100,1),false);
 assert.equal(meleeInRange(100,100,15,90,-1),true);
 assert.equal(meleeInRange(100,100,205,250,1),false);
});
test('contact and health rules remain bounded',()=>{
 assert.equal(hitDistance(0,0,3,4),5);
 assert.equal(clampHealth(-3,4),0);
 assert.equal(clampHealth(9,4),4);
 assert.equal(damageAfterArmor(2,0),2);
 assert.equal(damageAfterArmor(2,5),1);
});
