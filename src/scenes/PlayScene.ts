import Phaser from 'phaser';
import {markComplete} from '../systems/Progress';
import {FIRST_CHALLENGE} from '../data/puzzles';

/** Vertical slice for level 1. Only campaign data exists for levels 2-10. */
export class PlayScene extends Phaser.Scene {
 private player!:Phaser.Physics.Arcade.Sprite;
 private cursors!:Phaser.Types.Input.Keyboard.CursorKeys;
 private keys!:Record<'left'|'right'|'jump'|'transform',Phaser.Input.Keyboard.Key>;
 private bridge!:Phaser.Physics.Arcade.Image;
 private gate!:Phaser.GameObjects.Rectangle;
 private solved=false;
 private activePuzzle=false;
 private vehicle=false;
 private crystals=0;
 private hud!:Phaser.GameObjects.Text;
 private objective!:Phaser.GameObjects.Text;

 constructor(){super('Play')}
 create(){
  this.solved=false;this.activePuzzle=false;this.vehicle=false;this.crystals=0;
  this.cameras.main.setBackgroundColor('#8dd3f3');
  this.physics.world.setBounds(0,0,3200,720);
  this.cameras.main.setBounds(0,0,3200,720);
  const far=this.add.graphics().setScrollFactor(.18);
  far.fillStyle(0xb6f2f9).fillRect(0,0,11000,720);
  for(let i=0;i<32;i++){
    const x=i*152-160;
    far.fillStyle(i%2?0x86cbbb:0x72b9a9,.8).fillEllipse(x,460,470,320);
  }
  const mid=this.add.graphics().setScrollFactor(.52);
  for(let i=0;i<48;i++){
    const x=i*97-140,y=435+(i%5)*12;
    mid.fillStyle(i%3===0?0x327c74:0x479a87,.83);
    mid.fillTriangle(x-65,y+30,x+65,y+30,x,y-155-(i%3)*20);
    mid.fillStyle(0x397d6e).fillRect(x-10,y-15,20,88);
  }
  const props=this.add.graphics();
  for(let i=0;i<24;i++){
    const x=130+i*135,y=550+(i%5)*8;
    props.fillStyle(i%4===0?0xffd17b:0x3f936e,.96);
    props.fillTriangle(x-38,y+35,x+38,y+35,x,y-50);
    props.fillStyle(0x2b625c).fillRect(x-6,y+28,12,40);
  }
  // Auto-activating terminal and physical bridge gap.
  props.fillStyle(0x244769).fillRoundedRect(780,380,190,200,20);
  props.fillStyle(0x73ecff).fillCircle(875,431,50);
  props.lineStyle(10,0xe8ffff,.85).strokeCircle(875,431,58);
  const floor=this.physics.add.staticGroup();
  for(const piece of [{x:560,w:1120},{x:2300,w:1800}]){
    const slab=floor.create(piece.x,642,'platform') as Phaser.Physics.Arcade.Image;
    slab.setDisplaySize(piece.w,70).refreshBody();
    this.add.rectangle(piece.x,612,piece.w,30,0x368467).setDepth(5);
  }
  this.bridge=this.physics.add.staticImage(1260,625,'platform');
  this.bridge.setDisplaySize(280,34).refreshBody();
  this.bridge.disableBody(true,true);
  this.gate=this.add.rectangle(1710,494,69,237,0x155c9f).setDepth(4);
  this.physics.add.existing(this.gate,true);
  this.player=this.physics.add.sprite(120,510,'robot-engineering').setDepth(8);
  this.player.setCollideWorldBounds(true).setBounce(.03);
  (this.player.body as Phaser.Physics.Arcade.Body).setSize(55,103,true);
  this.physics.add.collider(this.player,floor);
  this.physics.add.collider(this.player,this.bridge);
  this.physics.add.collider(this.player,this.gate);
  this.cameras.main.startFollow(this.player,false,.1,.1,0,25);
  for(const x of [915,1510,2200,2750]){
    const orb=this.physics.add.staticImage(x,557,'energy').setDepth(7);
    this.physics.add.overlap(this.player,orb,()=>{
      if(!orb.active)return;
      orb.destroy();this.crystals++;
      this.hud.setText('✦ КРИСТАЛЛЫ '+this.crystals+'/4');
    });
  }
  this.add.ellipse(3010,470,110,184,0x7ce5ff,.7).setDepth(6);
  this.add.text(3010,467,'★',{fontSize:'60px',color:'#ffffff'}).setOrigin(.5).setDepth(7);
  this.cursors=this.input.keyboard!.createCursorKeys();
  this.keys={
    left:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    right:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    jump:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    transform:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
  };
  this.hud=this.add.text(26,18,'✦ КРИСТАЛЛЫ 0/4',{fontFamily:'system-ui',fontSize:'24px',color:'#ffffff',stroke:'#123b5d',strokeThickness:5}).setScrollFactor(0).setDepth(20);
  this.objective=this.add.text(26,55,'Найди светящийся реактор',{fontFamily:'system-ui',fontSize:'20px',color:'#ffeaaa',stroke:'#123b5d',strokeThickness:5}).setScrollFactor(0).setDepth(20);
  this.add.text(1255,24,'A/D или ←/→ · Пробел · E',{fontFamily:'system-ui',fontSize:'18px',color:'#ffffff',stroke:'#123b5d',strokeThickness:5}).setOrigin(1,0).setScrollFactor(0).setDepth(20);
  this.game.events.off('puzzle:solved');
  this.game.events.on('puzzle:solved',(id:string)=>{
    if(id!==FIRST_CHALLENGE.id||this.solved)return;
    this.solved=true;this.activePuzzle=false;
    this.bridge.enableBody(false,1260,625,true,true);
    this.bridge.refreshBody();
    this.tweens.add({targets:this.gate,y:-200,duration:780,ease:'Sine.easeInOut',onComplete:()=>{
      (this.gate.body as Phaser.Physics.Arcade.StaticBody).enable=false;
    }});
    this.objective.setText('Мост открыт! Собери 4 кристалла и найди портал');
  });
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.game.events.off('puzzle:solved'));
 }
 update(){
  const body=this.player.body as Phaser.Physics.Arcade.Body;
  const speed=this.vehicle?390:270;
  if(this.keys.left.isDown||this.cursors.left.isDown)this.player.setVelocityX(-speed);
  else if(this.keys.right.isDown||this.cursors.right.isDown)this.player.setVelocityX(speed);
  else this.player.setVelocityX(body.velocity.x*.8);
  if(Math.abs(body.velocity.x)>10)this.player.setFlipX(body.velocity.x<0);
  if(Phaser.Input.Keyboard.JustDown(this.keys.transform)){
    this.vehicle=!this.vehicle;
    this.player.setTexture(this.vehicle?'car-engineering':'robot-engineering');
    body.setSize(this.vehicle?110:55,this.vehicle?60:103,true);
  }
  if(!this.vehicle&&body.blocked.down&&(Phaser.Input.Keyboard.JustDown(this.keys.jump)||this.cursors.up.isDown))this.player.setVelocityY(-680);
  if(!this.solved&&!this.activePuzzle&&Math.abs(this.player.x-870)<85&&Math.abs(this.player.y-530)<170){
    this.activePuzzle=true;this.player.setVelocity(0,0);
    this.scene.pause();this.scene.launch('Puzzle');
  }
  if(this.player.y>715){
    this.player.setPosition(this.solved?1440:760,475);
    this.player.setVelocity(0,0);
  }
  if(this.player.x>2960){
    if(this.crystals>=4){
      markComplete(1,this.crystals);
      this.scene.start('Win',{crystals:this.crystals});
    }else this.objective.setText('Найди все 4 кристалла перед выходом!');
  }
 }
}
