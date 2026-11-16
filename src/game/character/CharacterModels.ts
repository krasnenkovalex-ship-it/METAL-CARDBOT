import * as pc from 'playcanvas';
import type { HeroPose, HeroForm } from './HeroMotor';

/**
 * Swappable GLB character renderer.
 *
 * Important: asset paths are an interface, NOT shipped copyrighted models.
 * Robot and car must be distinct original/cleared GLB assets.
 * Fallback primitives belong only to an engineering blockout.
 */
export class CharacterModels {
  private robot:pc.Entity|null=null;
  private vehicle:pc.Entity|null=null;
  private readonly anchor:pc.Entity;
  private readonly modelRoot:pc.Entity;
  private loadFailures:string[]=[];
  constructor(private readonly app:pc.Application, anchor:pc.Entity){
    this.anchor=anchor;
    this.modelRoot=new pc.Entity('hero-model-root');
    this.anchor.addChild(this.modelRoot);
  }
  get ready():boolean{return Boolean(this.robot&&this.vehicle);}
  get errors():readonly string[]{return this.loadFailures;}
  private load(url:string):Promise<pc.Entity>{
    return new Promise((resolve,reject)=>{
      this.app.assets.loadFromUrlAndFilename(url,url.split('/').pop()??'hero.glb','container',(error,asset)=>{
        if(error||!asset){reject(new Error(String(error??'Missing GLB asset')));return;}
        const resource=asset.resource as {instantiateRenderEntity:(options?:unknown)=>pc.Entity};
        resolve(resource.instantiateRenderEntity({castShadows:true}));
      });
    });
  }
  async loadPair(robotUrl='/assets/characters/hero-robot.glb',
    vehicleUrl='/assets/characters/hero-vehicle.glb'):Promise<boolean>{
    try{
      const [robot,vehicle]=await Promise.all([this.load(robotUrl),this.load(vehicleUrl)]);
      this.robot=robot;this.vehicle=vehicle;
      robot.enabled=true;vehicle.enabled=false;
      this.modelRoot.addChild(robot);this.modelRoot.addChild(vehicle);
      return true;
    }catch(error){
      this.loadFailures.push(String(error));
      return false;
    }
  }
  setForm(form:HeroForm):void{
    if(!this.ready)return;
    this.robot!.enabled=form==='robot';
    this.vehicle!.enabled=form==='vehicle';
  }
  apply(pose:HeroPose,time:number):void{
    this.anchor.setPosition(pose.x,pose.y,pose.z);
    this.modelRoot.setLocalEulerAngles(0,pose.heading*180/Math.PI,0);
    this.setForm(pose.form);
    // Tiny idle bounce is temporary. Real animation clips replace this in M1.
    const bob=pose.transforming?0:pose.form==='robot'&&pose.moving?Math.sin(time*12)*.015:0;
    this.modelRoot.setLocalPosition(0,bob,0);
    const s=pose.transforming?.98:1;
    this.modelRoot.setLocalScale(s,s,s);
  }
}
