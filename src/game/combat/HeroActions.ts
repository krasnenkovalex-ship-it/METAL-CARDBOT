import type {HeroPose} from '../character/HeroMotor';
import type {PointXZ} from '../world/TechForestLayout';

export interface ActionTarget extends PointXZ {id:number;active:boolean}
export interface ActionResult {fired:boolean;hit:number|null;from:PointXZ;to:PointXZ}

/** Soft-impact robot actions. Auto-aim keeps target practice accessible at age five. */
export class HeroActions {
  private lastStrike=-10;
  private lastPulse=-10;
  strike(pose:HeroPose,targets:readonly ActionTarget[],time:number):ActionResult{
    return this.act('strike',pose,targets,time);
  }
  pulse(pose:HeroPose,targets:readonly ActionTarget[],time:number):ActionResult{
    return this.act('pulse',pose,targets,time);
  }
  private act(kind:'strike'|'pulse',pose:HeroPose,targets:readonly ActionTarget[],time:number):ActionResult{
    const from={x:pose.x,z:pose.z};
    const range=kind==='strike'?2.2:5.8;
    const ready=kind==='strike'?time-this.lastStrike>=.42:time-this.lastPulse>=.62;
    const fallback={x:pose.x+Math.sin(pose.heading)*range,z:pose.z-Math.cos(pose.heading)*range};
    if(pose.form!=='robot'||pose.transforming||!ready)return {fired:false,hit:null,from,to:fallback};
    if(kind==='strike')this.lastStrike=time;else this.lastPulse=time;
    const candidates=targets.filter(target=>target.active&&Math.hypot(target.x-pose.x,target.z-pose.z)<=range)
      .sort((a,b)=>Math.hypot(a.x-pose.x,a.z-pose.z)-Math.hypot(b.x-pose.x,b.z-pose.z));
    const target=candidates[0];
    return {fired:true,hit:target?.id??null,from,to:target?{x:target.x,z:target.z}:fallback};
  }
}
