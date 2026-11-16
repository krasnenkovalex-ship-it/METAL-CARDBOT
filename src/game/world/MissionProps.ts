import * as pc from 'playcanvas';
import type {MissionKind} from '../campaign/Campaign';
import type {ActionTarget} from '../combat/HeroActions';
import type {PointXZ} from './TechForestLayout';

type Prop={entity:pc.Entity;target:ActionTarget};
type Shot={entity:pc.Entity;from:pc.Vec3;to:pc.Vec3;age:number};
const POSITIONS={
  clear:[{x:-4.2,z:-23.2},{x:-4.2,z:-24.9},{x:-4.2,z:-26.4}],
  drones:[{x:-4.2,z:-24.4},{x:4.2,z:-24.4},{x:0,z:-21.2}],
  patrol:[{x:4.2,z:-14},{x:4.2,z:-21},{x:4.2,z:-25}]
} as const;

/** Original lightweight 3D props that make chapter actions visible in the world. */
export class MissionProps {
  private readonly root=new pc.Entity('mission-props');
  private readonly materials=new Map<string,pc.StandardMaterial>();
  private readonly groups=new Map<string,Prop[]>();
  private readonly rewards:pc.Entity[]=[];
  private readonly shots:Shot[]=[];
  private current:MissionKind='circuit';
  constructor(app:pc.Application){
    app.root.addChild(this.root);
    for(const [name,rgb] of Object.entries({gold:[1,.72,.16],cyan:[.1,.85,1],violet:[.58,.34,1],red:[1,.36,.38],steel:[.19,.31,.43],leaf:[.24,.73,.43]})){
      const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...rgb);
      if(name!=='steel'&&name!=='leaf'){m.emissive=new pc.Color(...rgb);m.emissiveIntensity=.55;}
      m.metalness=name==='steel'?.65:.12;m.gloss=.65;m.update();this.materials.set(name,m);
    }
    for(const [kind,locations] of Object.entries(POSITIONS)){
      const props:Prop[]=[];
      for(const [id,point] of locations.entries()){
        const entity=new pc.Entity(kind+'-'+id);this.root.addChild(entity);
        entity.setPosition(point.x,kind==='drones'?1.75:.85,point.z);
        if(kind==='clear'){
          this.part(entity,'soft-vine','sphere','leaf',[0,0,0],[.9,1.05,.68]);
          this.part(entity,'vine-light','sphere','cyan',[0,.42,-.3],[.27,.27,.14]);
        }else if(kind==='drones'){
          this.part(entity,'drone-hull','sphere','steel',[0,0,0],[.95,.42,.75]);
          this.part(entity,'drone-eye','sphere','cyan',[0,0,-.38],[.32,.21,.12]);
          for(const x of [-.55,.55])this.part(entity,'rotor','cylinder','gold',[x,.12,0],[.49,.05,.49]);
        }else{
          this.part(entity,'beacon-stand','cylinder','steel',[0,-.28,0],[.38,.55,.38]);
          this.part(entity,'beacon-light','sphere','gold',[0,.22,0],[.47,.47,.47]);
        }
        props.push({entity,target:{id,x:point.x,z:point.z,active:true}});
      }
      this.groups.set(kind,props);
    }
    for(const [id,point] of [{x:0,z:-29},{x:0,z:-1},{x:0,z:-21.2},{x:0,z:-27.1}].entries()){
      const reward=new pc.Entity('restored-system-'+id);this.root.addChild(reward);
      reward.setPosition(point.x,3.5,point.z);
      this.part(reward,'energy-ring','sphere',id%2?'gold':'violet',[0,0,0],[.55,.55,.55]);
      reward.enabled=false;this.rewards.push(reward);
    }
    this.setMission('circuit');
  }
  private part(parent:pc.Entity,name:string,type:'box'|'sphere'|'cylinder',material:string,position:[number,number,number],scale:[number,number,number]):pc.Entity{
    const entity=new pc.Entity(name);entity.addComponent('render',{type});
    if(entity.render){entity.render.material=this.materials.get(material)!;entity.render.castShadows=false;}
    entity.setLocalPosition(...position);entity.setLocalScale(...scale);parent.addChild(entity);return entity;
  }
  setMission(kind:MissionKind):void{
    this.current=kind;
    for(const [group,props] of this.groups)for(const prop of props){
      prop.target.active=true;prop.entity.enabled=group===kind||(kind==='finale'&&group==='patrol'&&prop.target.id===1);
    }
  }
  targets(kind:'clear'|'drones'):readonly ActionTarget[]{return this.groups.get(kind)?.map(p=>p.target)??[];}
  hit(kind:'clear'|'drones',id:number):boolean{
    const prop=this.groups.get(kind)?.[id];
    if(!prop||!prop.target.active)return false;
    prop.target.active=false;prop.entity.enabled=false;return true;
  }
  collectPatrol(index:number):void{
    const prop=this.groups.get('patrol')?.[index];
    if(prop){prop.target.active=false;prop.entity.enabled=false;}
  }
  reward(kind:'memory'|'count'|'mirrors'|'shapes'):void{
    const index={memory:0,count:1,mirrors:2,shapes:3}[kind];
    this.rewards[index].enabled=true;
  }
  projectile(from:PointXZ,to:PointXZ):void{
    const entity=new pc.Entity('gentle-energy-pulse');this.root.addChild(entity);
    this.part(entity,'glow','sphere','cyan',[0,0,0],[.28,.28,.28]);
    const start=new pc.Vec3(from.x,1.35,from.z),end=new pc.Vec3(to.x,1.7,to.z);
    entity.setPosition(start);this.shots.push({entity,from:start,to:end,age:0});
  }
  update(dt:number,elapsed:number):void{
    if(this.current==='drones')for(const prop of this.groups.get('drones')??[]){
      if(prop.target.active){prop.entity.setPosition(prop.target.x,1.75+Math.sin(elapsed*3+prop.target.id)*.15,prop.target.z);prop.entity.rotate(0,dt*55,0);}
    }
    for(const shot of [...this.shots]){
      shot.age+=dt;const t=Math.min(1,shot.age/.28);
      shot.entity.setPosition(shot.from.clone().lerp(shot.from,shot.to,t));
      if(t>=1){shot.entity.destroy();this.shots.splice(this.shots.indexOf(shot),1);}
    }
    for(const [index,entity] of this.rewards.entries())if(entity.enabled){
      const size=.55+Math.sin(elapsed*2+index)*.09;entity.setLocalScale(size/.55,size/.55,size/.55);
    }
  }
  dispose():void{this.root.destroy();for(const material of this.materials.values())material.destroy();}
}
