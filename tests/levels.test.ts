import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS} from '../src/data/levels.ts';
import {FIRST_CHALLENGE,validateChallenge} from '../src/data/puzzles.ts';
test('10 distinct worlds planned',()=>{
 assert.equal(LEVELS.length,10);
 assert.equal(new Set(LEVELS.map(l=>l.id)).size,10);
 assert.equal(new Set(LEVELS.map(l=>l.name)).size,10);
});
test('bosses belong to stages 3 6 9',()=>assert.deepEqual(LEVELS.filter(l=>l.boss).map(l=>l.id),[3,6,9]));
test('logic challenge accepts only correct choice',()=>{
 for(let i=0;i<FIRST_CHALLENGE.choices.length;i++)
  assert.equal(validateChallenge(FIRST_CHALLENGE,i),i===FIRST_CHALLENGE.correct);
 assert.equal(validateChallenge(FIRST_CHALLENGE,-1),false);
});
