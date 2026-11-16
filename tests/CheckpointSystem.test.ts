import test from 'node:test';
import assert from 'node:assert/strict';
import {CheckpointSystem} from '../src/game/world/CheckpointSystem.ts';
import {HeroMotor} from '../src/game/character/HeroMotor.ts';
import {MazeCollision} from '../src/game/world/MazeCollision.ts';

test('checkpoints advance after the gate and recovery keeps the vehicle form',()=>{
  const checkpoints=new CheckpointSystem();
  assert.equal(checkpoints.visit({x:0,z:-11.8},false),null);
  assert.equal(checkpoints.visit({x:0,z:-11.8},true),'gate');
  assert.equal(checkpoints.visit({x:-4.45,z:-21},true),'west-bank');
  assert.equal(checkpoints.visit({x:0,z:9},true),null);
  const hero=new HeroMotor();
  hero.update(.016,{forward:false,back:false,left:false,right:false,jumpPressed:false,transformPressed:true});
  for(let i=0;i<20;i++)hero.update(.05);
  assert.equal(hero.pose.form,'vehicle');
  const safe=checkpoints.recover();
  assert.deepEqual(checkpoints.recoverIfUnsafe({x:30,z:-19},-4,'vehicle',new MazeCollision(),true,false),safe);
  assert.equal(checkpoints.recoverIfUnsafe(safe,.9,'vehicle',new MazeCollision(),true,false),null);
  hero.teleport(safe.x,safe.z);
  assert.equal(hero.pose.form,'vehicle');
  assert.equal(hero.pose.x,-4.45);
  assert.equal(hero.pose.z,-21);
});
