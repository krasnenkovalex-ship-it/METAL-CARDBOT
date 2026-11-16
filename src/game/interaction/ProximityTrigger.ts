export type TriggerState='ready'|'dwelling'|'active'|'waiting-for-exit'|'complete';

/** Proximity with dwell, dismissal hysteresis and one-shot completion. */
export class ProximityTrigger {
  private state:TriggerState='ready';
  private dwell=0;
  readonly id:string;
  readonly x:number;
  readonly z:number;
  readonly enterRadius:number;
  readonly exitRadius:number;
  readonly minDwell:number;
  constructor(id:string,x:number,z:number,enterRadius=2.2,exitRadius=3.2,minDwell=0.28){
    if(exitRadius<=enterRadius) throw new Error('Exit radius must exceed enter radius');
    this.id=id;this.x=x;this.z=z;
    this.enterRadius=enterRadius;this.exitRadius=exitRadius;this.minDwell=minDwell;
  }
  get status():TriggerState{return this.state;}
  update(x:number,z:number,dt:number,canActivate:boolean):boolean{
    if(this.state==='active'||this.state==='complete')return false;
    const distance=Math.hypot(x-this.x,z-this.z);
    if(this.state==='waiting-for-exit'){
      if(distance>this.exitRadius)this.state='ready';
      return false;
    }
    if(!canActivate||distance>this.enterRadius){
      this.state='ready';this.dwell=0;return false;
    }
    this.state='dwelling';this.dwell+=Math.max(0,dt);
    if(this.dwell>=this.minDwell){this.state='active';return true;}
    return false;
  }
  close(solved:boolean):void{
    if(this.state!=='active')return;
    this.state=solved?'complete':'waiting-for-exit';this.dwell=0;
  }
}
