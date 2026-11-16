import {TECH_FOREST,type PointXZ,type RectXZ,type Solid} from './TechForestLayout.ts';
import type {HeroForm} from '../character/HeroMotor';

const inside=(p:PointXZ,r:RectXZ):boolean=>p.x>=r.minX&&p.x<=r.maxX&&p.z>=r.minZ&&p.z<=r.maxZ;
const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));

/** A small, deterministic XZ character collider. It has no render-engine dependency. */
export class MazeCollision {
  radius(form:HeroForm):number{return form==='vehicle'?.72:.43;}
  canOccupy(p:PointXZ,radius:number,gatePassable:boolean,rightBridgePassable=true):boolean{
    for(let i=0;i<=12;i++){
      const angle=i*Math.PI*2/12;
      const sample=i===12?p:{x:p.x+Math.cos(angle)*radius,z:p.z+Math.sin(angle)*radius};
      if(!TECH_FOREST.paths.some(path=>inside(sample,path)))return false;
      if(inside(sample,TECH_FOREST.water)&&!TECH_FOREST.bridges.some((bridge,index)=>(index===0||rightBridgePassable)&&inside(sample,bridge)))return false;
    }
    if(!gatePassable&&this.intersectsRect(p,radius,TECH_FOREST.gate))return false;
    return !TECH_FOREST.solids.some(solid=>this.intersectsSolid(p,radius,solid));
  }
  private intersectsRect(p:PointXZ,radius:number,rect:RectXZ):boolean{
    const dx=p.x-clamp(p.x,rect.minX,rect.maxX);
    const dz=p.z-clamp(p.z,rect.minZ,rect.maxZ);
    return dx*dx+dz*dz<radius*radius;
  }
  private intersectsSolid(p:PointXZ,radius:number,solid:Solid):boolean{
    if('bounds' in solid)return this.intersectsRect(p,radius,solid.bounds);
    const dx=p.x-solid.x,dz=p.z-solid.z;
    return dx*dx+dz*dz<(radius+solid.radius)**2;
  }
  move(from:PointXZ,to:PointXZ,form:HeroForm,gatePassable:boolean,rightBridgePassable=true):PointXZ{
    const radius=this.radius(form);
    let result={...from};
    const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.14));
    const dx=(to.x-from.x)/steps,dz=(to.z-from.z)/steps;
    for(let i=0;i<steps;i++){
      const both={x:result.x+dx,z:result.z+dz};
      if(this.canOccupy(both,radius,gatePassable,rightBridgePassable)){result=both;continue;}
      const slideX={x:result.x+dx,z:result.z};
      if(this.canOccupy(slideX,radius,gatePassable,rightBridgePassable))result=slideX;
      const slideZ={x:result.x,z:result.z+dz};
      if(this.canOccupy(slideZ,radius,gatePassable,rightBridgePassable))result=slideZ;
    }
    return result;
  }
  clipCamera(from:PointXZ,to:PointXZ,gatePassable:boolean,rightBridgePassable=true):PointXZ{
    let last={...from};
    const distance=Math.hypot(to.x-from.x,to.z-from.z);
    const steps=Math.max(1,Math.ceil(distance/.15));
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      const candidate={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t};
      if(!this.canOccupy(candidate,.12,gatePassable,rightBridgePassable))break;
      last=candidate;
    }
    return last;
  }
}
