import test from 'node:test';
import assert from 'node:assert/strict';
import {MazeCollision} from '../src/game/world/MazeCollision.ts';
import {ROUTES,TECH_FOREST,type PointXZ} from '../src/game/world/TechForestLayout.ts';
import type {HeroForm} from '../src/game/character/HeroMotor.ts';

const maze=new MazeCollision();
const travel=(route:PointXZ[],form:HeroForm,gateOpen:boolean):PointXZ=>{
  let position={...route[0]};
  for(const target of route.slice(1)){
    const length=Math.hypot(target.x-position.x,target.z-position.z);
    const steps=Math.ceil(length/.08);
    for(let i=1;i<=steps;i++){
      const next={x:position.x+(target.x-position.x)/(steps-i+1),z:position.z+(target.z-position.z)/(steps-i+1)};
      position=maze.move(position,next,form,gateOpen);
    }
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.18,`${form} cannot reach ${JSON.stringify(target)} from ${JSON.stringify(position)}`);
  }
  return position;
};

test('closed gate cannot be passed or bypassed by either form',()=>{
  for(const form of ['robot','vehicle'] as const){
    const blocked=maze.move({x:0,z:-8},{x:0,z:-12},form,false);
    assert.ok(blocked.z>-9.7);
    assert.equal(maze.canOccupy({x:0,z:-10},maze.radius(form),false),false);
  }
});
test('both forks, both bridges and both later routes reach the portal',()=>{
  for(const form of ['robot','vehicle'] as const){
    for(const route of Object.values(ROUTES)){
      const end=travel(route,form,true);
      assert.ok(Math.hypot(end.x-TECH_FOREST.portal.x,end.z-TECH_FOREST.portal.z)<.2);
    }
  }
});
test('solid tree, rock, wall and water stop movement',()=>{
  assert.equal(maze.canOccupy({x:-2.8,z:5.6},.43,true),false);
  assert.equal(maze.canOccupy({x:2.75,z:-5.6},.43,true),false);
  assert.equal(maze.canOccupy({x:0,z:-15},.43,true),false);
  assert.equal(maze.canOccupy({x:0,z:-18},.43,true),false);
  assert.equal(maze.canOccupy({x:-4.2,z:-18},.43,true),true);
});
test('right bridge is blocked until its planks have risen',()=>{
  assert.equal(maze.canOccupy({x:4.2,z:-18},.43,true,false),false);
  assert.equal(maze.canOccupy({x:4.2,z:-18},.43,true,true),true);
  const stopped=maze.move({x:4.2,z:-15.2},{x:4.2,z:-18.2},'robot',true,false);
  assert.ok(stopped.z>-16.55);
});
test('vehicle can follow the inner east lane around the rock to the final beacon',()=>{
  const path=[{x:3.65,z:-11.8},{x:3.65,z:-14.7},{x:3.65,z:-21}];
  const end=travel(path,'vehicle',true);
  assert.ok(Math.hypot(end.x-4.2,end.z+21)<1.5);
  assert.equal(maze.canOccupy({x:4.9,z:-14.7},maze.radius('vehicle'),true),false);
});
test('secret spur contains a reachable reward and returns to the main branch',()=>{
  for(const form of ['robot','vehicle'] as const){
    travel([{x:-4.2,z:-14.2},{x:-6.4,z:-14.2},TECH_FOREST.secret,{x:-6.4,z:-14.2},{x:-4.2,z:-14.2}],form,true);
  }
});
test('camera ray is stopped before a large wall',()=>{
  const clipped=maze.clipCamera({x:-4.2,z:-14},{x:0,z:-16},true);
  assert.ok(clipped.x< -2.1);
});
test('removing a soft mission obstacle physically opens the garden path',()=>{
  const withVine=new MazeCollision();
  withVine.setDynamicBlockers([{id:0,x:-4.2,z:-23.2,radius:1.4}]);
  const blocked=withVine.move({x:-4.2,z:-21.2},{x:-4.2,z:-24},'robot',true);
  assert.ok(blocked.z>-23);
  withVine.removeDynamicBlocker(0);
  const open=withVine.move(blocked,{x:-4.2,z:-24},'robot',true);
  assert.ok(open.z<-23.8);
});
