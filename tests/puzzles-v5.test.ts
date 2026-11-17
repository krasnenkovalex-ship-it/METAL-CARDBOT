import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGES,allChallengeIds,validateChallenge} from '../src/data/puzzles.ts';
import {ROUNDS} from '../src/data/rounds.ts';
test('all ten round puzzles exist and have valid types',()=>{
 const ids=ROUNDS.flatMap(r=>r.puzzleIds);
 assert.equal(ids.length,10);assert.equal(new Set(ids).size,10);
 assert.equal(allChallengeIds.length,10);
 for(const id of ids){
   const c=CHALLENGES[id];
   assert.ok(c, 'Missing '+id);
   if(c.mode==='choice'){
     assert.ok(c.correct>=0&&c.correct<c.choices.length);
     assert.equal(c.choices.filter((_,i)=>validateChallenge(c,i)).length,1);
   }else if(c.mode==='memory'){
     assert.ok((c.sequence?.length??0)>=3);
     assert.ok(c.sequence?.every(i=>i>=0&&i<=2));
   }else if(c.mode==='dial'){
     assert.ok((c.dialTarget??0)>=0);
     assert.ok((c.dialSteps??0)>(c.dialTarget??0));
   }else if(c.mode==='wires'){
     assert.equal(c.choices.length,3);
   }else{assert.fail('Unknown puzzle mode: '+id);}
 }
});
test('round mechanics differ rather than repeating one quiz',()=>{
 assert.deepEqual(new Set(ROUNDS.flatMap(r=>r.puzzleIds.map(id=>CHALLENGES[id].mode))),
   new Set(['choice','memory','wires','dial']));
});
