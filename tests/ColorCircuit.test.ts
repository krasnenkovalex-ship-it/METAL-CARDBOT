import test from 'node:test';
import assert from 'node:assert/strict';
import {ColorCircuit,WIRE_COLORS} from '../src/game/education/ColorCircuit.ts';
test('wrong match does not advance and explains difference',()=>{
 const c=new ColorCircuit();
 const result=c.connect('red','yellow');
 assert.equal(result.correct,false);
 assert.equal(result.connected,0);
 assert.match(result.message,/разные/);
});
test('connecting 3 matching colors activates world gate',()=>{
 const c=new ColorCircuit();
 for(const color of WIRE_COLORS)assert.equal(c.connect(color,color).correct,true);
 assert.equal(c.completed,true);assert.equal(c.connected,3);
});
test('same wire cannot count twice',()=>{
 const c=new ColorCircuit();
 c.connect('blue','blue');c.connect('blue','blue');
 assert.equal(c.connected,1);
});
test('task can reset independently of visual scene',()=>{
 const c=new ColorCircuit();
 c.connect('red','red');c.reset();
 assert.equal(c.connected,0);
 assert.equal(c.isConnected('red'),false);
});
