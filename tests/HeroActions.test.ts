import test from 'node:test';
import assert from 'node:assert/strict';
import {HeroActions} from '../src/game/combat/HeroActions.ts';
import type {HeroPose} from '../src/game/character/HeroMotor.ts';

const pose:HeroPose={x:0,y:.9,z:0,heading:0,speed:0,form:'robot',transforming:false,
  transformProgress:1,targetForm:'robot',grounded:true,moving:false};
test('robot strike and gentle pulse hit nearby targets with cooldown',()=>{
  const actions=new HeroActions();
  const targets=[{id:1,x:1,z:0,active:true},{id:2,x:4,z:0,active:true}];
  assert.equal(actions.strike(pose,targets,0).hit,1);
  assert.equal(actions.strike(pose,targets,.2).fired,false);
  assert.equal(actions.pulse(pose,targets,0).hit,1);
  targets[0].active=false;
  assert.equal(actions.pulse(pose,targets,.7).hit,2);
  assert.equal(actions.strike({...pose,form:'vehicle'},targets,1).fired,false);
});
