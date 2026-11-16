import test from 'node:test';
import assert from 'node:assert/strict';
import {HeroMotor, type HeroIntent} from '../src/game/character/HeroMotor.ts';
const base:HeroIntent={forward:false,back:false,left:false,right:false,jumpPressed:false,transformPressed:false};
test('W moves toward negative Z (physical forward)',()=>{
  const h=new HeroMotor();const start=h.pose.z;
  for(let i=0;i<60;i++)h.update(1/60,{...base,forward:true});
  assert.ok(h.pose.z<start-3);
});
test('A and D are opposite lateral directions',()=>{
  const a=new HeroMotor(); const d=new HeroMotor();
  for(let i=0;i<45;i++){a.update(1/60,{...base,left:true});d.update(1/60,{...base,right:true});}
  assert.ok(a.pose.x<-.5);assert.ok(d.pose.x>.5);
});
test('Space jumps and lands again',()=>{
  const h=new HeroMotor();
  h.update(.016,{...base,jumpPressed:true});
  assert.ok(h.pose.y>.9);
  for(let i=0;i<110;i++)h.update(.016,base);
  assert.equal(h.pose.grounded,true);assert.equal(h.pose.y,.9);
});
test('E transforms robot -> vehicle -> robot without duplicate toggles',()=>{
  const h=new HeroMotor();
  h.update(.016,{...base,transformPressed:true});
  assert.equal(h.pose.transforming,true);
  h.update(.016,{...base,transformPressed:true});
  for(let i=0;i<65;i++)h.update(.016,base);
  assert.equal(h.pose.form,'vehicle');
  h.update(.016,{...base,transformPressed:true});
  for(let i=0;i<65;i++)h.update(.016,base);
  assert.equal(h.pose.form,'robot');
});
test('no movement during transformation or modal blocking',()=>{
  const h=new HeroMotor();h.update(.016,{...base,transformPressed:true});
  const x=h.pose.x;const z=h.pose.z;
  for(let i=0;i<10;i++)h.update(.016,{...base,right:true});
  assert.equal(h.pose.x,x);assert.equal(h.pose.z,z);
  for(let i=0;i<70;i++)h.update(.016,base);
  const before=h.pose.z;
  for(let i=0;i<10;i++)h.update(.016,{...base,forward:true},true);
  assert.equal(h.pose.z,before);
});
test('vehicle travels faster than robot in free movement',()=>{
  const a=new HeroMotor();const b=new HeroMotor();
  for(let i=0;i<50;i++)a.update(.016,{...base,forward:true});
  b.update(.016,{...base,transformPressed:true});
  for(let i=0;i<70;i++)b.update(.016,base);
  for(let i=0;i<50;i++)b.update(.016,{...base,forward:true});
  assert.ok(4-b.pose.z>4-a.pose.z);
});
test('direction changes rotate over time without an instant flip',()=>{
  const h=new HeroMotor();
  h.update(.016,{...base,back:true});
  assert.ok(h.pose.heading>0&&h.pose.heading<Math.PI);
  for(let i=0;i<40;i++)h.update(.016,{...base,back:true});
  assert.ok(Math.abs(h.pose.heading-Math.PI)<.1);
});

