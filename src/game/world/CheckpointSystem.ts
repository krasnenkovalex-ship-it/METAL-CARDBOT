import {TECH_FOREST,type CheckpointDef,type PointXZ} from './TechForestLayout.ts';
import type {MazeCollision} from './MazeCollision';
import type {HeroForm} from '../character/HeroMotor';

export class CheckpointSystem {
  private active:CheckpointDef=TECH_FOREST.checkpoints[0];
  get id():string{return this.active.id;}
  get position():PointXZ{return {...this.active.at};}
  visit(p:PointXZ,gateOpen:boolean):string|null{
    for(const point of TECH_FOREST.checkpoints){
      if(point.rank<=this.active.rank||point.needsGate&&!gateOpen)continue;
      if(Math.hypot(p.x-point.at.x,p.z-point.at.z)<=point.radius){
        this.active=point;
        return point.id;
      }
    }
    return null;
  }
  recover():PointXZ{return this.position;}
  recoverIfUnsafe(p:PointXZ,y:number,form:HeroForm,maze:MazeCollision,gateOpen:boolean,bridgeOpen:boolean):PointXZ|null{
    return y<-2||!maze.canOccupy(p,maze.radius(form),gateOpen,bridgeOpen)?this.recover():null;
  }
}
