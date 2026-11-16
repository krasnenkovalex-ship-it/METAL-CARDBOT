import test from 'node:test';
import assert from 'node:assert/strict';
import {ProximityTrigger} from '../src/game/interaction/ProximityTrigger.ts';

test('opens automatically after a short approach',()=>{
 const t=new ProximityTrigger('gate',0,0);
 assert.equal(t.update(8,0,.6,true),false);
 assert.equal(t.update(1,0,.12,true),false);
 assert.equal(t.update(1,0,.18,true),true);
 assert.equal(t.status,'active');
});
test('does not spam while player remains close after cancellation',()=>{
 const t=new ProximityTrigger('gate',0,0);
 t.update(0,0,.4,true);t.close(false);
 assert.equal(t.update(0,0,5,true),false);
 assert.equal(t.update(4,0,.1,true),false);
 assert.equal(t.update(0,0,.4,true),true);
});
test('solved puzzle does not reopen',()=>{
 const t=new ProximityTrigger('gate',0,0);
 t.update(0,0,.4,true);t.close(true);
 assert.equal(t.status,'complete');
 assert.equal(t.update(4,0,1,true),false);
 assert.equal(t.update(0,0,1,true),false);
});
test('pause prevents automatic opening',()=>{
 const t=new ProximityTrigger('gate',0,0);
 assert.equal(t.update(0,0,1,false),false);
 assert.equal(t.update(0,0,.3,true),true);
});
