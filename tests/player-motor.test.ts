import test from 'node:test';
import assert from 'node:assert/strict';
import {PlayerMotor,MOTOR_SETTINGS,type MotorInput} from '../src/systems/PlayerMotor.ts';
import {crossedSpringTop,SpringCooldown} from '../src/systems/SpringContact.ts';
const motorInput=(part:Partial<MotorInput>={}):MotorInput=>({
 now:1000,dt:1/60,axis:0,grounded:true,jumpPressed:false,
 jumpHeld:false,canJump:true,velocityX:0,velocityY:0,maxSpeed:300,...part
});
test('speed and braking independent of 30/60 fps',()=>{
 const simulate=(dt:number)=>{
  const m=new PlayerMotor();let vx=0,now=0;
  while(now<.7-1e-8){
   const out=m.step(motorInput({now:now*1000,dt,axis:1,velocityX:vx}));
   vx=out.velocityX;now+=dt;
  }
  return vx;
 };
 assert.equal(simulate(1/30),300);
 assert.equal(simulate(1/60),300);
});
test('jump buffering when landing and coyote grace after ledge',()=>{
 const m=new PlayerMotor();
 m.step(motorInput({now:0,grounded:true}));
 const grace=m.step(motorInput({now:100,grounded:false,jumpPressed:true,jumpHeld:true}));
 assert.equal(grace.jumped,true);assert.equal(grace.velocityY,MOTOR_SETTINGS.jumpVelocity);
 const another=new PlayerMotor();
 another.step(motorInput({now:0,grounded:false,jumpPressed:true,jumpHeld:true}));
 const buffered=another.step(motorInput({now:110,grounded:true,velocityY:0}));
 assert.equal(buffered.jumped,true);
});
test('no double-jump while holding key',()=>{
 const m=new PlayerMotor();
 assert.equal(m.step(motorInput({now:0,jumpPressed:true,jumpHeld:true})).jumped,true);
 assert.equal(m.step(motorInput({now:16,grounded:false,jumpHeld:true,velocityY:-590})).jumped,false);
 assert.equal(m.step(motorInput({now:32,grounded:false,jumpHeld:true,velocityY:-520})).jumped,false);
});
test('releasing jump early truncates ascent',()=>{
 const m=new PlayerMotor();
 m.step(motorInput({now:0,jumpPressed:true,jumpHeld:true}));
 const out=m.step(motorInput({now:16,grounded:false,velocityY:-600,jumpHeld:false}));
 assert.equal(out.velocityY,-600*MOTOR_SETTINGS.jumpCut);
});
test('spring only fires for crossing feet from above, not standing next to pad',()=>{
 const pad={left:1950,right:2110,top:569,bottom:591};
 assert.equal(crossedSpringTop({left:2000,right:2045,previousBottom:558,bottom:578,velocityY:400},pad),true);
 assert.equal(crossedSpringTop({left:2000,right:2045,previousBottom:600,bottom:600,velocityY:0},pad),false);
 assert.equal(crossedSpringTop({left:2000,right:2045,previousBottom:578,bottom:551,velocityY:-500},pad),false);
 assert.equal(crossedSpringTop({left:1800,right:1840,previousBottom:558,bottom:578,velocityY:400},pad),false);
});
test('spring cooldown prevents rapid second bounce',()=>{
 const spring=new SpringCooldown(570);
 assert.equal(spring.canActivate(1000),true);
 spring.activate(1000);
 assert.equal(spring.canActivate(1200),false);
 assert.equal(spring.canActivate(1570),true);
});
