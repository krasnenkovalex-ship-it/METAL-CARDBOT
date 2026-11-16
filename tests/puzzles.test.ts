import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGES,validateChallenge} from '../src/data/puzzles.ts';
test('two unique first-level educational tasks are defined',()=>{
 assert.notEqual(CHALLENGES.bridge.id,CHALLENGES.generator.id);
 assert.notEqual(CHALLENGES.bridge.question,CHALLENGES.generator.question);
});
test('first energy sequence has only one correct answer',()=>{
 const p=CHALLENGES.bridge;
 assert.equal(p.choices.filter((_,i)=>validateChallenge(p,i)).length,1);
 assert.equal(validateChallenge(p,0),true);
 assert.equal(validateChallenge(p,2),false);
});
test('four batteries is the correct generator answer',()=>{
 const p=CHALLENGES.generator;
 assert.equal(p.choices[p.correct],'4');
 assert.equal(validateChallenge(p,1),true);
 assert.equal(validateChallenge(p,0),false);
});
test('negative and out-of-range choices are never accepted',()=>{
 for(const p of Object.values(CHALLENGES)){
  assert.equal(validateChallenge(p,-1),false);
  assert.equal(validateChallenge(p,p.choices.length),false);
  assert.equal(validateChallenge(p,1.8),false);
 }
});
