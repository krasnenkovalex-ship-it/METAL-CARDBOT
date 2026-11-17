import Phaser from 'phaser';
/**
 * A moving, immmovable Arcade Physics body.
 * Never tween a static-body position: physics must own its transform.
 */
export interface MovingPlatformOptions{
 x:number;y:number;width:number;
 axis:'x'|'y';range:number;periodMs:number;
 tint?:number;
}
export class KinematicPlatform{
 readonly body:Phaser.Physics.Arcade.Image;
 readonly artwork:Phaser.GameObjects.TileSprite;
 private readonly origin:number;
 private readonly omega:number;
 private previousX:number;
 private previousY:number;
 constructor(
  private readonly scene:Phaser.Scene,
  private readonly player:Phaser.Physics.Arcade.Sprite,
  private readonly opts:MovingPlatformOptions
 ){
  this.body=scene.physics.add.image(opts.x,opts.y-2,'platform-physics');
  this.body.setDisplaySize(opts.width,43);
  this.body.setVisible(false).setImmovable(true);
  const solid=this.body.body as Phaser.Physics.Arcade.Body;
  solid.setAllowGravity(false);
  solid.setSize(96,32,true);
  solid.checkCollision.down=false;
  solid.checkCollision.left=false;
  solid.checkCollision.right=false;
  this.artwork=scene.add.tileSprite(opts.x,opts.y,opts.width,65,'terrain')
   .setDepth(5).setTint(opts.tint??0xffffff);
  scene.physics.add.collider(player,this.body,undefined,()=>{
   const actor=player.body as Phaser.Physics.Arcade.Body;
   const platform=this.body.body as Phaser.Physics.Arcade.Body;
   // One-way ledges: only descending from above or standing on top.
   return actor.velocity.y>=-4 &&
    actor.prev.y+actor.height <= platform.top+16;
  });
  this.origin=opts.axis==='x'?opts.x:opts.y-2;
  this.omega=2*Math.PI/opts.periodMs;
  this.previousX=this.body.x;this.previousY=this.body.y;
 }
 update(timeMs:number,dtSeconds:number):void{
  const dt=Math.max(.001,Math.min(.05,dtSeconds));
  const target=this.origin+Math.sin(timeMs*this.omega)*this.opts.range;
  // Set velocity instead of teleporting the collider; Arcade resolves contacts.
  if(this.opts.axis==='x'){
    this.body.setVelocityX(Phaser.Math.Clamp((target-this.body.x)/dt,-220,220));
  }else{
    this.body.setVelocityY(Phaser.Math.Clamp((target-this.body.y)/dt,-180,180));
  }
  // Render the art at its true physics position.
  this.artwork.setPosition(this.body.x,this.body.y+2);
  const actor=this.player.body as Phaser.Physics.Arcade.Body;
  const platform=this.body.body as Phaser.Physics.Arcade.Body;
  const onTop=Math.abs(actor.bottom-platform.top)<12&&
   actor.right>platform.left+9&&actor.left<platform.right-9&&
   actor.velocity.y>=-5;
  if(onTop){
    // The moving ledge carries the player's feet along its horizontal course.
    const shiftX=this.body.x-this.previousX;
    if(Math.abs(shiftX)<30){
     this.player.x+=shiftX;
    }
  }
  this.previousX=this.body.x;this.previousY=this.body.y;
 }
 destroy():void{
  this.artwork.destroy();
  this.body.destroy();
 }
}
