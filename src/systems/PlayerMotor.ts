/**
 * Deterministic platformer motor (seconds, pixels and milliseconds).
 *
 * Keeps input and physics decisions independent of rendering/Phaser Scene.
 * The Arcade body remains authoritative for collision resolution.
 */
export interface MotorInput {
 now:number;dt:number;axis:-1|0|1;
 grounded:boolean;jumpPressed:boolean;jumpHeld:boolean;canJump:boolean;
 velocityX:number;velocityY:number;maxSpeed:number;
 slippery?:boolean;
}
export interface MotorOutput {
 velocityX:number;velocityY:number;jumped:boolean;landing:boolean;
}
export const MOTOR_SETTINGS={
 acceleration:2600, airAcceleration:1800,
 deceleration:3100, airDeceleration:850,
 jumpVelocity:-670, jumpCut:0.48,
 coyoteMs:125,jumpBufferMs:135
} as const;
function approach(from:number,to:number,step:number):number {
 return from<to?Math.min(from+step,to):Math.max(from-step,to);
}
export class PlayerMotor {
 private lastGroundAt=-Infinity;
 private bufferUntil=-Infinity;
 private jumpCut=false;
 private wasGrounded=false;
 reset():void {
  this.lastGroundAt=-Infinity;
  this.bufferUntil=-Infinity;
  this.jumpCut=false;
  this.wasGrounded=false;
 }
 step(input:MotorInput):MotorOutput {
  const dt=Math.min(.05,Math.max(0,input.dt));
  const grounded=input.grounded;
  if(grounded)this.lastGroundAt=input.now;
  if(input.jumpPressed)this.bufferUntil=input.now+MOTOR_SETTINGS.jumpBufferMs;
  const target=input.axis*input.maxSpeed;
  const moving=input.axis!==0;
  const rate=moving?(grounded?MOTOR_SETTINGS.acceleration:MOTOR_SETTINGS.airAcceleration):
    (grounded?(input.slippery?560:MOTOR_SETTINGS.deceleration):MOTOR_SETTINGS.airDeceleration);
  const velocityX=approach(input.velocityX,target,rate*dt);
  let velocityY=input.velocityY;
  let jumped=false;
  if(input.canJump&&this.bufferUntil>=input.now&&
    input.now-this.lastGroundAt<=MOTOR_SETTINGS.coyoteMs){
    jumped=true;
    velocityY=MOTOR_SETTINGS.jumpVelocity;
    this.lastGroundAt=-Infinity;this.bufferUntil=-Infinity;
    this.jumpCut=false;
  }else if(input.canJump&&!grounded&&!input.jumpHeld&&velocityY<0&&!this.jumpCut){
    velocityY*=MOTOR_SETTINGS.jumpCut;
    this.jumpCut=true;
  }
  const landing=grounded&&!this.wasGrounded&&!jumped;
  this.wasGrounded=grounded&&!jumped;
  if(grounded&&!jumped)this.jumpCut=false;
  return {velocityX,velocityY,jumped,landing};
 }
}
