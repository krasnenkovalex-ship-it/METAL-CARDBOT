import * as pc from 'playcanvas';
import {CharacterModels} from './CharacterModels';
import type {HeroPose} from './HeroMotor';

type Shape='box'|'sphere'|'cylinder'|'cone';
type P=[number,number,number];
type ColorKey='blue'|'deep'|'white'|'metal'|'gold'|'glass'|'cyan'|'black'|'red';
const tones:Record<ColorKey,P>={
 blue:[.045,.28,.78], deep:[.025,.10,.24], white:[.85,.93,.98],
 metal:[.27,.38,.47], gold:[1,.67,.14], glass:[.055,.22,.36],
 cyan:[.08,.94,1], black:[.045,.07,.12], red:[.95,.15,.20]
};
/** Original stylized police-robot PLACEHOLDER; not an official Blue Cop model. */
export class AnimatedHero {
 readonly root=new pc.Entity('player-animated');
 private readonly robot=new pc.Entity('robot-form');
 private readonly vehicle=new pc.Entity('car-form');
 private readonly glb:CharacterModels;
 private readonly joints:{leftArm:pc.Entity;rightArm:pc.Entity;leftElbow:pc.Entity;rightElbow:pc.Entity;leftLeg:pc.Entity;rightLeg:pc.Entity;leftKnee:pc.Entity;rightKnee:pc.Entity};
 private readonly wheels:pc.Entity[]=[];
 private readonly transformGlow:pc.Entity;
 private previousElapsed=0;
 private assetReady=false;
 private readonly materials=new Map<ColorKey,pc.StandardMaterial>();
 constructor(private readonly app:pc.Application){
   app.root.addChild(this.root);
   this.root.addChild(this.robot);
   this.root.addChild(this.vehicle);
   this.glb=new CharacterModels(app,this.root);
   this.vehicle.enabled=false;
   for(const [name,rgb] of Object.entries(tones) as [ColorKey,P][]){
     const m=new pc.StandardMaterial();
     m.diffuse=new pc.Color(...rgb);
     m.metalness=name==='metal'?.82:name==='gold'?.62:.35;
     m.gloss= name==='glass'?.89:.72;
     if(name==='cyan'||name==='red'){
       m.emissive=new pc.Color(...rgb);
       m.emissiveIntensity=name==='cyan'?2.5:.5;
     }
     m.update();
     this.materials.set(name,m);
   }
   this.buildRobot();
   this.buildVehicle();
   this.transformGlow=this.part(this.root,'transformation-energy','cylinder','cyan',[0,-.86,0],[1.5,.04,1.5]);
   if(this.transformGlow.render)this.transformGlow.render.castShadows=false;
   this.transformGlow.enabled=false;
   this.joints={
      leftArm:this.robot.findByName('left-arm-pivot') as pc.Entity,
      rightArm:this.robot.findByName('right-arm-pivot') as pc.Entity,
      leftElbow:this.robot.findByName('left-elbow-pivot') as pc.Entity,
      rightElbow:this.robot.findByName('right-elbow-pivot') as pc.Entity,
      leftLeg:this.robot.findByName('left-leg-pivot') as pc.Entity,
      rightLeg:this.robot.findByName('right-leg-pivot') as pc.Entity,
      leftKnee:this.robot.findByName('left-knee-pivot') as pc.Entity,
      rightKnee:this.robot.findByName('right-knee-pivot') as pc.Entity
   };
 }
 private group(parent:pc.Entity,name:string,pos:P):pc.Entity{
   const entity=new pc.Entity(name);
   entity.setLocalPosition(...pos);
   parent.addChild(entity);
   return entity;
 }
 private part(parent:pc.Entity,name:string,shape:Shape,color:ColorKey,pos:P,size:P,rotation?:P):pc.Entity{
   const entity=this.group(parent,name,pos);
   entity.addComponent('render',{type:shape});
   if(entity.render)entity.render.material=this.materials.get(color)!;
   entity.setLocalScale(...size);
   if(rotation)entity.setLocalEulerAngles(...rotation);
   return entity;
 }
 private buildRobot():void{
   const p=this.part.bind(this);
   const b=this.robot;
   // Armored boots, jointed legs, hips, mechanical chest and illuminated visor.
   p(b,'pelvis','box','white',[0,-.12,0],[.83,.30,.52]);
   p(b,'waist-plate','box','gold',[0,-.18,-.32],[.45,.12,.10]);
   const legs:[string,number][]=[['left',-.26],['right',.26]];
   for(const [name,x] of legs){
     const pivot=this.group(b,name+'-leg-pivot',[x,-.22,0]);
     p(pivot,'thigh-'+name,'box','deep',[0,-.20,0],[.29,.48,.36]);
     const knee=this.group(pivot,name+'-knee-pivot',[0,-.40,-.09]);
     p(knee,'knee-'+name,'sphere','gold',[0,0,0],[.34,.24,.39]);
     p(knee,'shin-'+name,'cylinder','blue',[0,-.13,.06],[.31,.42,.36]);
     p(knee,'shin-ridge-'+name,'box','white',[0,-.13,-.23],[.21,.29,.10]);
     p(knee,'boot-'+name,'sphere','metal',[0,-.38,-.04],[.40,.20,.65]);
     p(knee,'boot-toe-'+name,'sphere','gold',[0,-.38,-.34],[.36,.13,.22]);
   }
   p(b,'lower-chest','box','deep',[0,.15,0],[.82,.55,.58]);
   p(b,'chest-core','box','white',[0,.49,0],[1.10,.76,.67]);
   p(b,'chest-armor','box','blue',[0,.47,-.40],[.90,.55,.14]);
   p(b,'windshield-left','box','glass',[-.25,.60,-.49],[.36,.30,.035]);
   p(b,'windshield-right','box','glass',[.25,.60,-.49],[.36,.30,.035]);
   p(b,'chest-led','box','cyan',[0,.25,-.50],[.24,.09,.05]);
   p(b,'backpack','box','deep',[0,.48,.37],[.77,.65,.30]);
   p(b,'back-emblem','box','gold',[0,.42,.55],[.33,.29,.05]);
   for(const [name,x] of [['left',-.73],['right',.73]] as const){
     const pivot=this.group(b,name+'-arm-pivot',[x,.76,0]);
     p(pivot,'pauldron-'+name,'sphere','blue',[0,-.05,0],[.53,.45,.64]);
     p(pivot,'shoulder-trim-'+name,'box','white',[0,-.08,-.26],[.33,.21,.11]);
     p(pivot,'upper-arm-'+name,'cylinder','metal',[0,-.32,0],[.29,.43,.34]);
     const elbow=this.group(pivot,name+'-elbow-pivot',[0,-.56,0]);
     p(elbow,'elbow-'+name,'sphere','gold',[0,0,0],[.28,.26,.29]);
     p(elbow,'gauntlet-'+name,'sphere','blue',[0,-.14,-.05],[.36,.38,.44]);
     p(elbow,'fist-'+name,'sphere','metal',[0,-.37,-.09],[.31,.25,.35]);
     // An integral wheel near each shoulder makes transformation readable.
     p(b,'shoulder-wheel-'+name,'cylinder','black',[x*1.36,.47,.25],[.39,.16,.39],[0,0,90]);
     p(b,'wheel-hub-'+name,'cylinder','metal',[x*1.52,.47,.25],[.20,.17,.20],[0,0,90]);
   }
   p(b,'neck','cylinder','metal',[0,.90,0],[.25,.21,.25]);
   p(b,'helm','box','blue',[0,1.21,0],[.57,.55,.50]);
   p(b,'faceplate','box','white',[0,1.11,-.27],[.42,.27,.08]);
   p(b,'visor','box','cyan',[0,1.31,-.31],[.43,.13,.09]);
   p(b,'helmet-crown','box','deep',[0,1.52,0],[.51,.16,.53]);
   p(b,'helmet-brow','sphere','white',[0,1.46,-.18],[.51,.13,.40]);
   p(b,'chin','sphere','metal',[0,.99,-.23],[.36,.15,.29]);
   p(b,'left-crest','cone','gold',[-.21,1.66,-.01],[.16,.36,.17]);
   p(b,'right-crest','cone','gold',[.21,1.66,-.01],[.16,.36,.17]);
 }
 private buildVehicle():void{
   const b=this.vehicle,p=this.part.bind(this);
   p(b,'underbody','box','deep',[0,-.50,0],[1.47,.43,2.30]);
   p(b,'hood','box','blue',[0,-.23,-.73],[1.43,.35,.81]);
   p(b,'front-grille','box','metal',[0,-.48,-1.17],[.87,.27,.09]);
   p(b,'front-bumper','box','white',[0,-.65,-1.18],[1.48,.18,.17]);
   p(b,'cabin','box','white',[0,-.08,.23],[1.20,.61,1.26]);
   p(b,'roof','box','blue',[0,.26,.25],[1.27,.15,1.37]);
   p(b,'front-glass','box','glass',[0,-.12,-.46],[1.04,.29,.06],[25,0,0]);
   p(b,'rear-glass','box','glass',[0,-.12,.91],[1.01,.29,.05],[-25,0,0]);
   for(const side of [-1,1]){
     p(b,'door-side-'+side,'box','blue',[side*.72,-.28,.21],[.07,.29,.85]);
     p(b,'side-stripe-'+side,'box','gold',[side*.78,-.38,.20],[.045,.07,1.21]);
     p(b,'side-glass-'+side,'box','glass',[side*.66,.02,.24],[.045,.24,.72]);
     for(const z of [-.77,.82]){
       const axle=this.group(b,'axle-'+side+'-'+z,[side*.77,-.65,z]);
       p(axle,'wheel-'+side+'-'+z,'cylinder','black',[0,0,0],[.36,.20,.36],[0,0,90]);
       p(axle,'rim-'+side+'-'+z,'cylinder','metal',[side*.14,0,0],[.20,.20,.20],[0,0,90]);
       this.wheels.push(axle);
     }
   }
   p(b,'left-headlight','box','cyan',[-.49,-.38,-1.18],[.32,.15,.08]);
   p(b,'right-headlight','box','cyan',[.49,-.38,-1.18],[.32,.15,.08]);
   p(b,'rear-left','box','red',[-.47,-.38,1.17],[.32,.12,.06]);
   p(b,'rear-right','box','red',[.47,-.38,1.17],[.32,.12,.06]);
   p(b,'lightbar-left','box','cyan',[-.24,.39,.05],[.43,.13,.24]);
   p(b,'lightbar-right','box','red',[.24,.39,.05],[.43,.13,.24]);
 }
 async loadLicensedAssets():Promise<boolean>{
   this.assetReady=await this.glb.loadPair();
   if(this.assetReady){
      this.robot.enabled=false;this.vehicle.enabled=false;
   }
   return this.assetReady;
 }
 update(pose:HeroPose,elapsed:number):void{
   const dt=Math.max(0,Math.min(.5,elapsed-this.previousElapsed));
   this.previousElapsed=elapsed;
   this.root.setPosition(pose.x,pose.y,pose.z);
   this.root.setEulerAngles(0,pose.heading*180/Math.PI,0);
   this.glb.apply(pose,elapsed);
   this.transformGlow.enabled=pose.transforming;
   if(pose.transforming){
     const glow=1.2+Math.sin(pose.transformProgress*Math.PI)*.9;
     this.transformGlow.setLocalScale(glow,.04,glow);
   }
   if(this.assetReady)return;
   const progress=pose.transforming?pose.transformProgress:1;
   const showForm=pose.transforming&&progress>.5?pose.targetForm:pose.form;
   this.robot.enabled=showForm==='robot';
   this.vehicle.enabled=showForm==='vehicle';
   const fold=pose.transforming?Math.sin(progress*Math.PI):0;
   const squeeze=pose.transforming?.32+.68*Math.abs(progress-.5)*2:1;
   this.robot.setLocalScale(squeeze,1-fold*.62,squeeze);
   this.vehicle.setLocalScale(squeeze,1-fold*.35,squeeze);
   const turn=pose.transforming?progress*145:0;
   this.robot.setLocalEulerAngles(0,turn,0);
   this.vehicle.setLocalEulerAngles(0,turn-145,0);
   const stride=pose.moving&&pose.grounded&&!pose.transforming?Math.sin(elapsed*(7+pose.speed*1.3)):0;
   const idle=pose.grounded&&!pose.moving&&!pose.transforming?Math.sin(elapsed*2.5)*.025:0;
   this.robot.setLocalPosition(0,idle+(pose.moving?Math.abs(stride)*.055:0),0);
   this.joints.leftArm.setLocalEulerAngles(stride*28+fold*75,0,-fold*42);
   this.joints.rightArm.setLocalEulerAngles(-stride*28+fold*75,0,fold*42);
   this.joints.leftElbow.setLocalEulerAngles(-Math.max(0,stride)*25-fold*75,0,0);
   this.joints.rightElbow.setLocalEulerAngles(-Math.max(0,-stride)*25-fold*75,0,0);
   this.joints.leftLeg.setLocalEulerAngles(-stride*29+fold*45,0,0);
   this.joints.rightLeg.setLocalEulerAngles(stride*29+fold*45,0,0);
   this.joints.leftKnee.setLocalEulerAngles(Math.max(0,stride)*36+fold*65,0,0);
   this.joints.rightKnee.setLocalEulerAngles(Math.max(0,-stride)*36+fold*65,0,0);
   this.vehicle.setLocalPosition(0,pose.moving?Math.sin(elapsed*14)*.018:0,0);
   for(const wheel of this.wheels)wheel.rotateLocal(pose.speed*dt*115,0,0);
   this.root.setLocalScale(1,1,1);
 }
}

