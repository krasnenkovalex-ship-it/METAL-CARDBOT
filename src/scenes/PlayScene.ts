import Phaser from 'phaser';
import {markComplete} from '../systems/Progress';
import {audio} from '../systems/Audio';
import {HEROES,currentHero,chooseHero,type HeroId} from '../data/heroes';
import {CombatSystem} from '../systems/CombatSystem';
import {getRound,canFinishRound,type RoundDefinition,type RoundId} from '../data/rounds';

type Mission=string;
const W=3850;
export class PlayScene extends Phaser.Scene{
 private player!:Phaser.Physics.Arcade.Sprite;
 private combat!:CombatSystem;
 private heroId:HeroId='bluecop';
 private roundId:RoundId=1;
 private round!:RoundDefinition;
 private switchActivated=false;
 private switchCore!:Phaser.GameObjects.Arc;
 private lastSpring=0;
 private lastStormPulse=0;
 private finishGuard=false;
 private combatHUD!:Phaser.GameObjects.Text;
 private keys!:Record<'left'|'right'|'arrowLeft'|'arrowRight'|'jump'|'transform'|'shoot'|'punch'|'one'|'two'|'three',Phaser.Input.Keyboard.Key>;
 private bridgeBody!:Phaser.Physics.Arcade.Image;
 private bridgeArt!:Phaser.GameObjects.TileSprite;
 private gate1!:Phaser.GameObjects.Rectangle;
 private gate2!:Phaser.GameObjects.Rectangle;
 private puzzleLocked:Mission|null=null;
 private completed=new Set<Mission>();
 private waitForExit=new Set<Mission>();
 private car=false;
 private changing=false;
 private gems=0;
 private hearts=3;
 private checkpoint=190;
 private lastHit=0;
 private hud!:Phaser.GameObjects.Text;
 private objective!:Phaser.GameObjects.Text;
 private formLabel!:Phaser.GameObjects.Text;
 private worldTimer=0;
 private touch={left:false,right:false,jump:false,transform:false,shoot:false,punch:false};
 private decor:Phaser.GameObjects.GameObject[]=[];
 constructor(){super('Play');}
 init(data:{round?:number}={}){
   const n=Number(data.round??1);
   this.roundId=(Number.isInteger(n)&&n>=1&&n<=5?n:1) as RoundId;
   this.round=getRound(this.roundId);
 }
 private platform(x:number,w:number,y=651):void{
   this.add.tileSprite(x,y,w,100,'terrain').setDepth(5);
   const ground=this.physics.add.staticImage(x,y,'platform-physics');
   ground.setDisplaySize(w,100).refreshBody().setVisible(false);
   this.physics.add.collider(this.player,ground);
 }
 private terminal(x:number,label:string):void{
   const a=this.add.image(x,521,'terminal').setDepth(6).setScale(.83);
   this.tweens.add({targets:a,scaleX:.90,scaleY:.90,duration:740,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   const text=this.add.text(x,439,label,{fontSize:'18px',fontFamily:'system-ui',fontStyle:'bold',color:'#d9ffff',stroke:'#163f5b',strokeThickness:5}).setOrigin(.5).setDepth(7);
   this.tweens.add({targets:text,y:432,duration:700,yoyo:true,repeat:-1});
 }
 private energy(x:number,y:number):void{
   const gem=this.physics.add.staticImage(x,y,'energy').setDepth(7).setScale(1.0);
   this.tweens.add({targets:gem,y:y-16,duration:840,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   this.physics.add.overlap(this.player,gem,()=>{
     if(!gem.active)return;
     gem.destroy();this.gems++;audio.effect('pickup');
     this.cameras.main.flash(110,150,240,255,false);
     this.hud.setText('✦ КРИСТАЛЛЫ  '+this.gems+' / 4');
     if(this.gems===4)this.objective.setText('Все кристаллы собраны! К порталу!');
   });
 }
 private gate(x:number):Phaser.GameObjects.Rectangle{
   this.add.rectangle(x,439,120,25,0xffde73).setDepth(7);
   const pillar=this.add.rectangle(x,530,84,151,0x1a4269).setStrokeStyle(5,0x7beaff).setDepth(7);
   this.physics.add.existing(pillar,true);
   this.physics.add.collider(this.player,pillar);
   return pillar;
 }
 private openGate(gate:Phaser.GameObjects.Rectangle):void{
   audio.effect('open');
   this.tweens.add({targets:gate,y:250,alpha:0,duration:900,ease:'Cubic.easeInOut',
     onUpdate:()=>{(gate.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();},
     onComplete:()=>{const body=gate.body as Phaser.Physics.Arcade.StaticBody;body.enable=false;gate.setVisible(false);}
   });
 }
 private beginPuzzle(id:Mission):void{
   this.puzzleLocked=id;
   this.touch={left:false,right:false,jump:false,transform:false,shoot:false,punch:false};
   this.player.setVelocity(0,0);
   audio.effect('task');
   this.scene.pause();
   this.scene.launch('Puzzle',{id});
 }
 private solvePuzzle(id:Mission):void{
   if(this.completed.has(id))return;
   this.completed.add(id);this.puzzleLocked=null;this.waitForExit.delete(id);
   if(id==='bridge'){
     this.bridgeBody.enableBody(false,1285,651,true,true).refreshBody().setVisible(false);
     this.bridgeArt.setVisible(true).setY(735);
     this.tweens.add({targets:this.bridgeArt,y:651,duration:1350,ease:'Back.easeOut'});
     this.openGate(this.gate1);
     this.checkpoint=1450;
     this.objective.setText('Мост открыт! Найди генератор дальше по тропе');
   } else {
     this.openGate(this.gate2);
     this.checkpoint=2790;
     this.objective.setText('Генератор включён! Собери все кристаллы');
   }
 }
 private makeMobileControls():void{
   if(!window.matchMedia('(pointer:coarse)').matches)return;
   const make=(x:number,y:number,label:string,key:keyof typeof this.touch,color=0x0b4268)=>{
     const b=this.add.circle(x,y,68,color,.72).setStrokeStyle(3,0x9bebff,.8).setScrollFactor(0).setDepth(90).setInteractive();
     this.add.text(x,y,label,{fontSize:'37px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(91);
     b.on('pointerdown',()=>{this.touch[key]=true;});
     // Jump/transform are one-shot inputs: a short tap can begin and end
     // between game frames. Only direction keys should release immediately.
     if(key==='left'||key==='right'){
       b.on('pointerup',()=>{this.touch[key]=false;});
       b.on('pointerout',()=>{this.touch[key]=false;});
       b.on('pointerupoutside',()=>{this.touch[key]=false;});
     }
     return b;
   };
   make(102,621,'◀','left');
   make(274,621,'▶','right');
   make(1010,621,'↥','jump',0x355b8e);
   make(1184,621,'⇄','transform',0x78622e);
   const fire=make(924,504,'✦','shoot',0x235f93);
   const punch=make(1092,504,'✊','punch',0x84466d);
   void fire;void punch;
 }
 create(){
   this.completed.clear();this.waitForExit.clear();
   this.finishGuard=false;this.switchActivated=false;this.lastSpring=0;this.lastStormPulse=0;
   this.heroId=currentHero();
   this.car=false;this.changing=false;this.gems=0;this.hearts=HEROES[this.heroId].maxHealth;this.checkpoint=190;this.puzzleLocked=null;this.worldTimer=0;
   this.touch={left:false,right:false,jump:false,transform:false,shoot:false,punch:false};
   this.cameras.main.setBackgroundColor('#83cde9');
   this.cameras.main.setBounds(0,0,W,720);
   this.physics.world.setBounds(0,0,W,720);
   this.add.image(640,360,'sky').setDisplaySize(1280,720).setScrollFactor(0).setDepth(-30)
     .setTint(this.round.skyTint);
   for(const x of [850,2580,4310]){
     this.add.image(x,465,'forest-back').setDisplaySize(1740,700).setScrollFactor(.26)
       .setTint(this.round.backTint).setAlpha(.65).setDepth(-20);
   }
   const fog=this.add.rectangle(0,0,W,720,0xffffff,.10).setOrigin(0).setDepth(-10);
   void fog;
   for(const x of [920,2640,4360]){
     this.add.image(x,520,'forest-front').setDisplaySize(1710,690).setScrollFactor(.75)
       .setTint(this.round.frontTint).setAlpha(.46).setDepth(2);
   }
   this.player=this.physics.add.sprite(190,480,this.heroId+'-robot').setScale(.50).setDepth(12);
   this.player.setMaxVelocity(560,1100).setCollideWorldBounds(true).setBounce(.04);
   (this.player.body as Phaser.Physics.Arcade.Body).setSize(112,228,true);
   this.platform(570,1140);this.platform(2615,2370);
   this.decorateRound();
   this.bridgeArt=this.add.tileSprite(1285,651,290,100,'terrain').setDepth(5).setVisible(false);
   this.bridgeBody=this.physics.add.staticImage(1285,651,'platform-physics').setDisplaySize(290,100);
   this.bridgeBody.refreshBody().disableBody(true,true);
   this.physics.add.collider(this.player,this.bridgeBody);
   // The raised shortcut holds a collectible that takes a deliberate jump.
   const high=this.physics.add.staticImage(2170,492,'platform-physics').setDisplaySize(330,45).refreshBody().setVisible(false);
   this.add.tileSprite(2170,495,330,66,'terrain').setDepth(5);
   this.physics.add.collider(this.player,high);
   const high2=this.physics.add.staticImage(3410,479,'platform-physics').setDisplaySize(230,44).refreshBody().setVisible(false);
   this.add.tileSprite(3410,479,230,65,'terrain').setDepth(5);
   this.physics.add.collider(this.player,high2);
   this.add.rectangle(1285,665,280,40,0x1ca4d2,.35).setDepth(3);
   this.add.ellipse(1285,673,340,55,0x5cd4eb,.58).setDepth(3);
   this.terminal(875,'ИСПЫТАНИЕ А');
   this.terminal(2430,'ИСПЫТАНИЕ Б');
   this.gate1=this.gate(1770);
   this.gate2=this.gate(2740);
   for(const pos of this.round.crystals)this.energy(pos[0],pos[1]);
   for(const x of [580,1850,3140]){
     const sign=this.add.text(x,521,'➜',{fontFamily:'system-ui',fontSize:'58px',color:'#ffea8e',stroke:'#135778',strokeThickness:6}).setDepth(7);
     this.tweens.add({targets:sign,x:x+17,duration:700,yoyo:true,repeat:-1});
   }
   // Soft hazards: contact returns to the last checkpoint, never discarding progress.
   for(const x of [2020,3260]){
     const hazard=this.physics.add.staticImage(x,556,'spark').setTint(0xed7591).setScale(.94);
     this.tweens.add({targets:hazard,alpha:.55,duration:380,yoyo:true,repeat:-1});
     this.physics.add.overlap(this.player,hazard,()=>this.hit());
   }
   this.add.ellipse(3630,469,136,194,0x24dbfa,.56).setStrokeStyle(6,0xeeffb9).setDepth(7);
   this.add.text(3630,454,'★',{fontSize:'86px',color:'#fff3b5',stroke:'#296d98',strokeThickness:8}).setOrigin(.5).setDepth(8);
   this.tweens.add({targets:this.cameras.main,zoom:1.015,duration:1500,yoyo:true,repeat:-1});
   this.cameras.main.startFollow(this.player,false,.09,.10,0,70);
   this.cameras.main.setDeadzone(190,90);
   this.keys={
     left:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
     right:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
     arrowLeft:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
     arrowRight:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
     jump:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
     transform:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
     shoot:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J),
     punch:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K),
     one:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
     two:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
     three:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
   };
   this.add.rectangle(640,36,1260,61,0x092745,.82).setScrollFactor(0).setDepth(80).setStrokeStyle(2,0x81dbff,.25);
   this.add.text(24,12,'⚡ МЕТАЛ КАРБОТ  ·  РАУНД '+this.roundId+'/5  ·  '+this.round.name,{fontFamily:'system-ui',fontSize:'21px',fontStyle:'bold',color:'#c9f5ff'}).setScrollFactor(0).setDepth(81);
   this.hud=this.add.text(1210,15,'✦ КРИСТАЛЛЫ  0 / 4',{fontSize:'22px',fontFamily:'system-ui',fontStyle:'bold',color:'#ffe491'}).setOrigin(1,0).setScrollFactor(0).setDepth(81);
   this.objective=this.add.text(24,82,'Подойди к энергетическому терминалу',{fontSize:'20px',fontFamily:'system-ui',fontStyle:'bold',color:'#fff6c7',stroke:'#174366',strokeThickness:5}).setScrollFactor(0).setDepth(81);
   this.formLabel=this.add.text(1220,82,'🤖 '+HEROES[this.heroId].name+'  ·  E — МАШИНА',{fontSize:'16px',fontFamily:'system-ui',color:'#e7f6ff',stroke:'#174366',strokeThickness:4}).setOrigin(1,0).setScrollFactor(0).setDepth(81);
   const mute=this.add.text(1245,82,'♫',{fontSize:'25px',color:'#ccfaff'}).setOrigin(1,0).setScrollFactor(0).setDepth(90).setInteractive({useHandCursor:true});
   mute.on('pointerdown',()=>{const off=audio.toggle();mute.setText(off?'♪':'♫');});
   this.combat=new CombatSystem(this,this.player,this.heroId,()=>this.hit());
   this.combat.spawnRound(this.round.enemies,this.roundId);
   this.combat.setBossShield(this.round.bossRequired);
   this.addWorldSwitch();
   this.combatHUD=this.add.text(24,117,'❤️ '+this.hearts+'/'+HEROES[this.heroId].maxHealth+
     '   ⚔️ ВРАГИ 0/6  ·  ЛКМ ВЫСТРЕЛ / ПКМ УДАР',
     {fontFamily:'system-ui',fontSize:'17px',fontStyle:'bold',color:'#fce4aa',
     stroke:'#183852',strokeThickness:5}).setDepth(81).setScrollFactor(0);
   this.input.mouse?.disableContextMenu();
   this.input.on('pointerdown',(pointer:Phaser.Input.Pointer,targets:Phaser.GameObjects.GameObject[])=>{
     if(targets.length>0||this.puzzleLocked||this.changing)return;
     const at=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
     if(pointer.rightButtonDown())this.combat.punch();
     else if(pointer.leftButtonDown())this.combat.shoot(at.x,at.y);
   });
   this.makeMobileControls();
   this.game.events.off('puzzle:solved');this.game.events.off('puzzle:cancel');
   this.game.events.on('puzzle:solved',(id:Mission)=>this.solvePuzzle(id));
   this.game.events.on('puzzle:cancel',(id:Mission)=>{
     this.puzzleLocked=null;this.waitForExit.add(id);
   });
   this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
     this.combat.destroy();
     this.input.off('pointerdown');
     this.game.events.off('puzzle:solved');this.game.events.off('puzzle:cancel');
   });
 }
 private hit():void{
   if(this.time.now-this.lastHit<1300)return;
   this.lastHit=this.time.now;this.hearts=Math.max(0,this.hearts-1);
   this.combatHUD.setText('❤️ '+this.hearts+'/'+HEROES[this.heroId].maxHealth+'   ⚔️ ВРАГИ '+this.combat.summary.defeated+'/'+this.combat.summary.total);
   audio.effect('hit');
   this.cameras.main.shake(200,.005);
   this.player.setTint(0xff9cb0);
   this.time.delayedCall(550,()=>{if(this.player.active)this.player.clearTint();});
   this.player.setPosition(this.checkpoint,442);this.player.setVelocity(0,0);
   if(this.hearts===0){this.hearts=HEROES[this.heroId].maxHealth;
     this.objective.setText('Герой восстановился! Попробуй ещё раз!');}
 }
 private transform():void{
   if(this.changing)return;this.changing=true;this.player.setVelocityX(0);
   audio.effect('transform');
   this.tweens.add({targets:this.player,scaleX:.35,scaleY:.26,angle:12,duration:185,ease:'Sine.easeIn',
     onComplete:()=>{
       this.car=!this.car;
       this.player.setTexture(this.heroId+(this.car?'-car':'-robot'));
       this.player.setScale(this.car?.52:.50);
       this.player.setAngle(0);
       const body=this.player.body as Phaser.Physics.Arcade.Body;
       body.setSize(this.car?265:112,this.car?120:228,true);
       this.formLabel.setText(this.car?'🚗 '+HEROES[this.heroId].name+' · E — РОБОТ':'🤖 '+HEROES[this.heroId].name+' · E — МАШИНА');
       this.tweens.add({targets:this.player,scaleX:this.car?.57:.50,scaleY:this.car?.57:.50,duration:190,onComplete:()=>this.changing=false});
     }});
 }
 private switchHero(id:HeroId):void{
   if(this.heroId===id||this.changing||this.puzzleLocked)return;
   this.heroId=id;chooseHero(id);this.car=false;
   this.player.setTexture(id+'-robot');this.player.setScale(.50);this.player.setAngle(0);
   (this.player.body as Phaser.Physics.Arcade.Body).setSize(112,228,true);
   this.hearts=HEROES[id].maxHealth;this.combat.setHero(id);
   this.formLabel.setText('🤖 '+HEROES[id].name+' · E — МАШИНА');
   this.objective.setText('Герой выбран: '+HEROES[id].name+'!');
   this.cameras.main.flash(170,180,245,255,false);
 }
 update(time:number,delta:number){
   if(!this.player.active)return;
   const body=this.player.body as Phaser.Physics.Arcade.Body;
   const left=this.keys.left.isDown||this.keys.arrowLeft.isDown||this.touch.left;
   const right=this.keys.right.isDown||this.keys.arrowRight.isDown||this.touch.right;
   const speed=this.car?HEROES[this.heroId].vehicleSpeed:HEROES[this.heroId].robotSpeed;
   if(!this.changing){
     if(left)this.player.setVelocityX(-speed);
     else if(right)this.player.setVelocityX(speed);
     else this.player.setVelocityX(body.velocity.x*.72);
     if(Phaser.Input.Keyboard.JustDown(this.keys.one))this.switchHero('bluecop');
     if(Phaser.Input.Keyboard.JustDown(this.keys.two))this.switchHero('megatrucker');
     if(Phaser.Input.Keyboard.JustDown(this.keys.three))this.switchHero('phoenixfire');
     if(Phaser.Input.Keyboard.JustDown(this.keys.transform)||this.touch.transform){this.touch.transform=false;this.transform();}
     const fire=Phaser.Input.Keyboard.JustDown(this.keys.shoot)||this.touch.shoot;
     const punch=Phaser.Input.Keyboard.JustDown(this.keys.punch)||this.touch.punch;
     this.touch.shoot=false;this.touch.punch=false;
     if(fire){const face=this.player.flipX?-1:1;this.combat.shoot(this.player.x+face*600,this.player.y-34);}
     if(punch)this.combat.punch();
     if(!this.car&&(Phaser.Input.Keyboard.JustDown(this.keys.jump)||this.touch.jump)&&body.blocked.down){
       this.player.setVelocityY(-690);audio.effect('jump');
     }
     this.touch.jump=false;
   }
   if(!this.car&&!this.changing){
     const key=this.heroId==='bluecop'&&Math.abs(body.velocity.x)>18&&body.blocked.down?
       'robot-run-'+(Math.floor(time/115)%4):this.heroId+'-robot';
     if(this.player.texture.key!==key)this.player.setTexture(key);
   }
   if(Math.abs(body.velocity.x)>5){this.player.setFlipX(body.velocity.x<0);
     if(!this.car&&!this.changing)this.player.setAngle(Math.sin(time*.019)*2.0);
     else if(this.car&&!this.changing)this.player.setAngle(Math.sin(time*.028)*.8);
   }else if(!this.changing)this.player.setAngle(0);
   this.worldTimer=time;
   this.combat.update(delta,time);
   const stats=this.combat.summary;
   this.combatHUD.setText('❤️ '+this.hearts+'/'+HEROES[this.heroId].maxHealth+
     '   ⚔️ ВРАГИ '+stats.defeated+'/'+stats.total+
     '   🖱️ ЛКМ — ВЫСТРЕЛ / ПКМ — УДАР');
   for(const [id,x] of [['bridge',875],['generator',2430]] as [Mission,number][]){
     if(this.completed.has(id)||this.puzzleLocked)continue;
     const inRange=Math.abs(this.player.x-x)<82&&Math.abs(this.player.y-518)<185;
     if(!inRange){this.waitForExit.delete(id);continue;}
     if(!this.waitForExit.has(id)){this.beginPuzzle(id);break;}
   }
   if(this.player.y>645)this.hit();
   if(this.player.x>=3540){
     if(this.gems===4&&this.completed.has('bridge')&&this.completed.has('generator')){
       audio.effect('win');markComplete(1,this.gems);this.scene.start('Win',{crystals:this.gems});
     } else {
       const msg=this.gems<4?'Остались кристаллы: '+(4-this.gems):'Реши обе логические задачи!';
       this.objective.setText(msg);
     }
   }
 }
}
