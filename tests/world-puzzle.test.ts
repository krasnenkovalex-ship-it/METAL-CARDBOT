import test from 'node:test';
import assert from 'node:assert/strict';
import {CircuitState,RelayState} from '../src/systems/WorldPuzzleRules.ts';
test('reactor: cannot connect without selecting a source',()=>{
 const c=new CircuitState();
 assert.equal(c.connect(2),'none');
 c.select(0);assert.equal(c.connect(2),'wrong');
 assert.equal(c.connected.size,0);
 assert.equal(c.connect(0),'correct');
 assert.equal(c.connected.size,1);
 c.select(1);assert.equal(c.connect(1),'correct');
 c.select(2);assert.equal(c.connect(2),'complete');
});
test('relay: wrong press restarts from first step without punishment',()=>{
 const m=new RelayState();
 assert.equal(m.press(2),'wrong');assert.equal(m.progress,0);
 assert.equal(m.press(0),'correct');assert.equal(m.press(1),'wrong');
 assert.equal(m.press(0),'correct');assert.equal(m.press(2),'correct');assert.equal(m.press(1),'complete');
});
