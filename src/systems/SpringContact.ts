/** Verify actual player-feet contact with a horizontal spring cap, never proximity. */
export interface FeetSample{
 previousBottom:number;bottom:number;left:number;right:number;velocityY:number;
}
export interface SpringBounds{left:number;right:number;top:number;bottom:number}
export function crossedSpringTop(feet:FeetSample,pad:SpringBounds,tolerance=9):boolean {
 return feet.velocityY>=-25
  && feet.right>pad.left+4&&feet.left<pad.right-4
  && feet.previousBottom<=pad.top+tolerance
  && feet.bottom>=pad.top-tolerance
  && feet.bottom<=pad.bottom+16;
}
/** Activation can only happen after a fresh contact, cooldown protects from loops. */
export class SpringCooldown{
 private last=-Infinity;
 private readonly cooldownMs:number;
 constructor(cooldownMs=570){this.cooldownMs=cooldownMs;}
 canActivate(now:number):boolean{return now-this.last>=this.cooldownMs;}
 activate(now:number):void{this.last=now;}
 reset():void{this.last=-Infinity;}
}
