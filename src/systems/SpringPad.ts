import Phaser from 'phaser';
import {crossedSpringTop,SpringCooldown} from './SpringContact';
export interface SpringPadOptions{
 x:number;y:number;width?:number;force?:number;
 color?:number;
}
/**
 * Contact-only spring: collision sample uses previous and current foot positions.
 * Gimmick trigger doesn't care about hero proximity or map coordinate anymore.
 */
export class SpringPad {
 readonly cap:Phaser.GameObjects.Rectangle;
 private readonly body:Phaser.GameObjects.Rectangle;
 private readonly cooldown=new SpringCooldown(570);
 private readonly top:number;
 private readonly width:number;
 private readonly height=21;
 private readonly force:number;
 private readonly particles:Phaser.GameObjects.Arc[]=[];
 constructor(private readonly scene:Phaser.Scene,private readonly player:Phaser.Physics.Arcade.Sprite,
   opts:SpringPadOptions){
  this.width=opts.width??132;this.force=opts.force??820;
  this.top=opts.y-this.height/2;
  this.body=scene.add.rectangle(opts.x,opts.y+22,this.width-18,28,0x315577,.92)
    .setStrokeStyle(3,0xcfe6ff).setDepth(6);
  this.cap=scene.add.rectangle(opts.x,opts.y,this.width,this.height,opts.color??0x91f8a9,.96)
    .setStrokeStyle(4,0xebfffe).setDepth(7);
  const indicators=scene.add.text(opts.x,opts.y-47,'⇈',{fontSize:'37px',
    fontFamily:'system-ui',fontStyle:'bold',color:'#f2ffd8',
    stroke:'#0e4559',strokeThickness:5}).setOrigin(.5).setDepth(7);
  scene.tweens.add({targets:indicators,y:opts.y-59,duration:430,repeat:-1,yoyo:true});
 }
 update(now:number):boolean{
  const body=this.player.body as Phaser.Physics.Arcade.Body;
  const half=this.width/2;
  const feet={previousBottom:body.prev.y+body.height,bottom:body.bottom,
    left:body.left,right:body.right,velocityY:body.velocity.y};
  const pad={left:this.cap.x-half,right:this.cap.x+half,top:this.top,bottom:this.top+this.height};
  if(!this.cooldown.canActivate(now)||!crossedSpringTop(feet,pad))return false;
  this.cooldown.activate(now);
  this.player.setVelocityY(-this.force);
  this.scene.tweens.add({targets:this.cap,scaleY:.32,duration:90,yoyo:true,ease:'Sine.inOut'});
  this.scene.cameras.main.flash(70,70,220,190,false);
  for(let i=0;i<6;i++){
   const particle=this.scene.add.circle(this.cap.x,this.top,5+i%3*2,0xd3ff97,.88).setDepth(10);
   this.particles.push(particle);
   const theta=-Math.PI+(i/5)*Math.PI, dist=55+i*9;
   this.scene.tweens.add({targets:particle,x:this.cap.x+Math.cos(theta)*dist,
     y:this.top-45-Math.abs(Math.sin(theta)*dist),alpha:0,duration:420,
     onComplete:()=>particle.destroy()});
  }
  return true;
 }
}
