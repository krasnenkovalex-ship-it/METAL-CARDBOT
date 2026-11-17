import Phaser from 'phaser';
import {markComplete} from '../systems/Progress';
import {audio} from '../systems/Audio';
import {HEROES,currentHero,chooseHero,type HeroId} from '../data/heroes';
import {CombatSystem} from '../systems/CombatSystem';
import {getRound,canFinishRound,type RoundDefinition,type RoundId} from '../data/rounds';
import {PlayerMotor} from '../systems/PlayerMotor';
import {KinematicPlatform} from '../systems/KinematicPlatform';
import {SpringPad} from '../systems/SpringPad';

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
 private readonly motor=new PlayerMotor();
 private readonly movingPlatforms:KinematicPlatform[]=[];
 private spring!:SpringPad;
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
 private decorateRound():void{
   // Authored stage identity on top of the shared, scrollable platform layout.
   const biome=this.round.biome;
   const color=this.round.color;
   for(let i=0;i<18;i++){
     const x=150+i*218,skyY=225+(i%4)*62;
     if(biome==='sky'){
       const island=this.add.ellipse(x,skyY+86,160+(i%3)*60,35,0x536e9b,.56).setDepth(-11);
       this.add.ellipse(x,skyY+67,145+(i%3)*45,22,0xd4deff,.58).setDepth(-10);
       this.tweens.add({targets:island,y:skyY+91,duration:1500+i*45,
         yoyo:true,repeat:-1,ease:'Sine.inOut'});
     }else if(biome==='factory'){
       this.add.rectangle(x,400,61,470,0x596b79,.35).setDepth(-12);
       this.add.rectangle(x+35,400,12,460,0xffab56,.37).setDepth(-11);
       const gear=this.add.text(x,210,'⚙',{fontSize:120+(i%3)*24,color:'#a6cad3'})
         .setOrigin(.5).setAlpha(.36).setDepth(-10);
       this.tweens.add({targets:gear,angle:i%2?360:-360,duration:9000+i*200,repeat:-1});
     }else if(biome==='ice'){
       this.add.triangle(x,220,0,0,55,0,22,150,0xaefbff,.37).setDepth(-11);
       const shard=this.add.ellipse(x+48,535,50,145,0xa8f4ff,.30).setDepth(3);
       this.tweens.add({targets:shard,alpha:.10,duration:1500+i*61,yoyo:true,repeat:-1});
     }else if(biome==='storm'){
       this.add.rectangle(x,250,16,350,0x9c85cb,.38).setDepth(-11);
       const orb=this.add.circle(x,140,18,0xf7b9f8,.5).setDepth(-10);
       this.tweens.add({targets:orb,alpha:.15,scale:1.5,duration:850+i*24,yoyo:true,repeat:-1});
     }else{
       const flower=this.add.circle(x,562,9,i%2?0xffdc7f:0x83e6ff,.75).setDepth(6);
       this.tweens.add({targets:flower,y:558,alpha:.35,duration:700+i*27,yoyo:true,repeat:-1});
     }
   }
   const caption=this.add.text(640,171,this.round.subtitle.toUpperCase(),{
     fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#fff9cf',
     stroke:'#09293e',strokeThickness:5}).setOrigin(.5).setScrollFactor(0).setDepth(80);
   this.tweens.add({targets:caption,alpha:0,duration:700,delay:3300});
   // Physical activity varies by round: spring jump, aerial lift, conveyor, ice and storms.
   // Physical spring is added after the hero and level surfaces exist.
 }
 private addBiomePlatforms():void{
   // Distinct upper paths; static top-only ledges or velocity-based kinematic platforms.
   type Platform=[number,number,number,boolean];
   const stages:Record<string,Platform[]>={
     forest:[[515,476,190,false],[3260,455,210,false]],
     sky:[[510,457,245,false],[1720,447,205,true],[2950,445,240,false]],
     factory:[[570,462,230,true],[1970,451,215,false],[3260,463,230,true]],
     ice:[[750,467,210,false],[1800,450,220,false],[2880,441,230,true]],
     storm:[[560,452,210,false],[1840,462,250,true],[2940,434,200,false]]
   };
   for(const [x,y,w,moving] of stages[this.round.biome]){
     if(moving){
       this.movingPlatforms.push(new KinematicPlatform(this,this.player,{
         x,y,width:w,axis:'y',range:54,
         periodMs:3500+this.roundId*230,tint:this.round.color
       }));
     }else{
       this.add.tileSprite(x,y,w,62,'terrain').setDepth(5).setTint(this.round.color);
       const solid=this.physics.add.staticImage(x,y-2,'platform-physics')
         .setDisplaySize(w,43).refreshBody().setVisible(false);
       const body=solid.body as Phaser.Physics.Arcade.StaticBody;
       body.checkCollision.left=false;body.checkCollision.right=false;body.checkCollision.down=false;
       this.physics.add.collider(this.player,solid);
     }
     this.add.rectangle(x,y-35,w,8,this.round.color,.58).setDepth(6);
   }
 }
 private addWorldSwitch():void{
   // A genuine in-world optional mechanism: shoot the upper glowing switch.
   const x=2260,y=307;
   const ring=this.add.circle(x,y,38,0x176a9b,.93).setStrokeStyle(7,0x9af6ff).setDepth(7);
   const core=this.add.circle(x,y,19,0xffe58b,.9).setDepth(8);
   const name=this.add.text(x,y-64,'🎯 АКТИВИРУЙ ВЫСТРЕЛОМ',{
     fontFamily:'system-ui',fontSize:'15px',fontStyle:'bold',color:'#edffff',
     stroke:'#143e67',strokeThickness:5}).setOrigin(.5).setDepth(9);
   this.tweens.add({targets:core,scale:1.32,duration:540,yoyo:true,repeat:-1});
   this.switchCore=core;
   this.combat.registerTarget(x,y,51,()=>{
     if(this.switchActivated)return;
     this.switchActivated=true;audio.effect('open');
     ring.setFillStyle(0x2d9b71).setStrokeStyle(7,0xc7ff9e);
     core.setFillStyle(0x8dff8b);
     name.setText('✓ СЕКРЕТ АКТИВИРОВАН!');
     this.cameras.main.flash(190,90,255,184,false);
     this.objective.setText('Секретный механизм найден! Бонусная энергия!');
     const pickup=this.add.circle(2330,390,23,0xcaff89,.95).setStrokeStyle(4,0xffffff).setDepth(11);
     this.tweens.add({targets:pickup,y:365,duration:780,yoyo:true,repeat:-1});
     this.physics.add.existing(pickup,true);
     const body=pickup.body as Phaser.Physics.Arcade.StaticBody;
     if(body){body.setCircle(23);body.updateFromGameObject();}
     this.physics.add.overlap(this.player,pickup,()=>{
       if(!pickup.active)return;
       pickup.destroy();this.hearts=Math.min(HEROES[this.heroId].maxHealth,this.hearts+1);
       audio.effect('pickup');
     });
   });
 }
 private applyGimmick(time:number,body:Phaser.Physics.Arcade.Body,delta:number):void{
   if(!this.player.active||this.puzzleLocked)return;
   const x=this.player.x;
   if(this.round.gimmick==='conveyor'&&body.blocked.down&&x>1810&&x<2330){
     this.player.setVelocityX(body.velocity.x+220*Math.min(delta/1000,.05));
   }else if(this.round.gimmick==='wind'&&this.player.y<540){
     this.player.setVelocityX(body.velocity.x+130*Math.sin(time*.0013)*Math.min(delta/1000,.05));
   }
   if(this.round.gimmick==='storm-pulse'&&time-this.lastStormPulse>5300){
     this.lastStormPulse=time;
     const bolt=this.add.text(1000+(Math.floor(time/5300)%3)*860,205,'ϟ',{
       fontFamily:'system-ui',fontSize:'170px',fontStyle:'bold',color:'#fff1a2'
     }).setDepth(8).setAlpha(.85);
     this.tweens.add({targets:bolt,alpha:0,scale:1.2,duration:480,
       onComplete:()=>bolt.destroy()});
   }
   void delta;
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
     if(this.gems===4)this.objective.setText(this.round.bossRequired?
       'Кристаллы собраны! Победи стража и иди к порталу.':
       'Все кристаллы собраны! К порталу!');
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
   this.scene.launch('Puzzle',{id,round:this.roundId});
 }
 private solvePuzzle(id:Mission):void{
   if(this.completed.has(id))return;
   this.completed.add(id);this.puzzleLocked=null;this.waitForExit.delete(id);
   if(id===this.round.puzzleIds[0]){
     this.bridgeBody.enableBody(false,1285,651,true,true).refreshBody().setVisible(false);
     this.bridgeArt.setVisible(true).setY(735);
     this.tweens.add({targets:this.bridgeArt,y:651,duration:1350,ease:'Back.easeOut'});
     this.openGate(this.gate1);
     this.checkpoint=1450;
     this.objective.setText('Мост открыт! Ищи второе испытание в '+this.round.name);
   } else {
     this.openGate(this.gate2);
     this.checkpoint=2790;
     this.combat.setBossShield(false);
     this.objective.setText(this.round.bossRequired?
       'Защита босса отключена! Победи его и собери кристаллы.':
       'Ворота открыты! Собери четыре кристалла и найди портал.');
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
   this.finishGuard=false;this.switchActivated=false;this.lastStormPulse=0;
   this.motor.reset();this.movingPlatforms.length=0;
   this.heroId=currentHero();
   this.car=false;this.changing=false;this.gems=0;this.hearts=HEROES[this.heroId].maxHealth;this.checkpoint=190;this.puzzleLocked=null;this.worldTimer=0;
   this.touch={left:false,right:false,jump:false,transform:false,shoot:false,punch:false};
   this.cameras.main.setBackgroundColor('#83cde9');
   this.cameras.main.setBounds(0,0,W,720);
   this.physics.world.setBounds(0,0,W,720);
   const panorama={forest:'sky',sky:'sky-valley',factory:'gear-factory',ice:'ice-caves',storm:'storm-citadel'} as const;
   this.add.image(640,360,panorama[this.round.biome]).setDisplaySize(1280,720)
     .setScrollFactor(0).setDepth(-30);
   for(const x of [850,2580,4310]){
     this.add.image(x,465,'forest-back').setDisplaySize(1740,700).setScrollFactor(.26)
       .setTint(this.round.backTint).setAlpha(this.round.biome==='forest'?.65:.10).setDepth(-20);
   }
   const fog=this.add.rectangle(0,0,W,720,0xffffff,.10).setOrigin(0).setDepth(-10);
   void fog;
   for(const x of [920,2640,4360]){
     this.add.image(x,520,'forest-front').setDisplaySize(1710,690).setScrollFactor(.75)
       .setTint(this.round.frontTint).setAlpha(this.round.biome==='forest'?.46:.13).setDepth(2);
   }
   this.player=this.physics.add.sprite(190,480,this.heroId+'-robot').setScale(.50).setDepth(12);
   this.player.setMaxVelocity(560,1100).setCollideWorldBounds(true).setBounce(.04);
   (this.player.body as Phaser.Physics.Arcade.Body).setSize(112,228,true);
   this.platform(570,1140);this.platform(2615,2370);
   this.decorateRound();
   this.addBiomePlatforms();
   this.spring=new SpringPad(this,this.player,{x:2030,y:606,width:135,force:825,color:this.round.color});
   this.bridgeArt=this.add.tileSprite(1285,651,290,100,'terrain').setDepth(5).setVisible(false);
   this.bridgeBody=this.physics.add.staticImage(1285,651,'platform-physics').setDisplaySize(290,100);
   this.bridgeBody.refreshBody().disableBody(true,true);
   this.physics.add.collider(this.player,this.bridgeBody);
   // The raised shortcut holds a collectible that takes a deliberate jump.
   if(this.round.biome==='sky'||this.round.biome==='ice'){
     this.movingPlatforms.push(new KinematicPlatform(this,this.player,{
       x:2170,y:494,width:330,axis:'x',range:98,periodMs:4000,tint:this.round.color
     }));
   }else{
     const high=this.physics.add.staticImage(2170,492,'platform-physics')
       .setDisplaySize(330,45).refreshBody().setVisible(false);
     this.add.tileSprite(2170,495,330,66,'terrain').setDepth(5);
     const body=high.body as Phaser.Physics.Arcade.StaticBody;
     body.checkCollision.left=false;body.checkCollision.right=false;body.checkCollision.down=false;
     this.physics.add.collider(this.player,high);
   }
   const high2=this.physics.add.staticImage(3410,479,'platform-physics').setDisplaySize(230,44).refreshBody().setVisible(false);
   this.add.tileSprite(3410,479,230,65,'terrain').setDepth(5);
   const upperBody=high2.body as Phaser.Physics.Arcade.StaticBody;
   upperBody.checkCollision.left=false;upperBody.checkCollision.right=false;upperBody.checkCollision.down=false;
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
     for(const moving of this.movingPlatforms)moving.destroy();
     this.movingPlatforms.length=0;
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
   this.heroId=id;chooseHero(id);this.car=false;this.motor.reset();
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
   if(!this.changing){
     const jumpPressed=Phaser.Input.Keyboard.JustDown(this.keys.jump)||this.touch.jump;
     const out=this.motor.step({
       now:time,dt:delta/1000,
       axis:(right?1:0)-(left?1:0) as -1|0|1,
       grounded:body.blocked.down||body.touching.down,
       jumpPressed,jumpHeld:this.keys.jump.isDown||this.touch.jump,
       canJump:!this.car,velocityX:body.velocity.x,velocityY:body.velocity.y,
       maxSpeed:this.car?HEROES[this.heroId].vehicleSpeed:HEROES[this.heroId].robotSpeed,
       slippery:this.round.gimmick==='ice-slide'
     });
     this.player.setVelocityX(out.velocityX);
     if(out.jumped){this.player.setVelocityY(out.velocityY);audio.effect('jump');}
     else if(out.velocityY!==body.velocity.y)this.player.setVelocityY(out.velocityY);
     this.touch.jump=false;
     if(Phaser.Input.Keyboard.JustDown(this.keys.one))this.switchHero('bluecop');
     if(Phaser.Input.Keyboard.JustDown(this.keys.two))this.switchHero('megatrucker');
     if(Phaser.Input.Keyboard.JustDown(this.keys.three))this.switchHero('phoenixfire');
     if(Phaser.Input.Keyboard.JustDown(this.keys.transform)||this.touch.transform){this.touch.transform=false;this.transform();}
     const fire=Phaser.Input.Keyboard.JustDown(this.keys.shoot)||this.touch.shoot;
     const punch=Phaser.Input.Keyboard.JustDown(this.keys.punch)||this.touch.punch;
     this.touch.shoot=false;this.touch.punch=false;
     if(fire){const face=this.player.flipX?-1:1;this.combat.shoot(this.player.x+face*600,this.player.y-34);}
     if(punch)this.combat.punch();

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
   this.applyGimmick(time,body,delta);
   for(const platform of this.movingPlatforms)platform.update(time,delta/1000);
   if(this.spring.update(time))audio.effect('jump');
   this.combat.update(delta,time);
   const stats=this.combat.summary;
   this.combatHUD.setText('❤️ '+this.hearts+'/'+HEROES[this.heroId].maxHealth+
     '   ⚔️ ВРАГИ '+stats.defeated+'/'+stats.total+
     '   🖱️ ЛКМ — ВЫСТРЕЛ / ПКМ — УДАР');
   for(const [id,x] of [[this.round.puzzleIds[0],875],[this.round.puzzleIds[1],2430]] as [Mission,number][]){
     if(this.completed.has(id)||this.puzzleLocked)continue;
     const inRange=Math.abs(this.player.x-x)<82&&Math.abs(this.player.y-518)<185;
     if(!inRange){this.waitForExit.delete(id);continue;}
     if(!this.waitForExit.has(id)){this.beginPuzzle(id);break;}
   }
   if(this.player.y>645)this.hit();
   if(!this.finishGuard&&this.player.x>=3540){
     const bossAlive=this.combat.bossAlive;
     if(canFinishRound(this.completed,this.round.puzzleIds,this.gems,this.round.bossRequired,bossAlive)){
       this.finishGuard=true;
       audio.effect('win');markComplete(this.roundId,this.gems);
       this.scene.start('Win',{crystals:this.gems,round:this.roundId,
         title:this.round.name,hero:this.heroId,enemyCount:this.combat.summary.defeated});
     }else{
       const msg=this.gems<4?'Осталось кристаллов: '+(4-this.gems):
         !this.round.puzzleIds.every(id=>this.completed.has(id))?'Реши оба логических испытания!':
         this.round.bossRequired&&bossAlive?'Победи главного стража!':'Ищи портал!';
       this.objective.setText(msg);
     }
   }
 }
}
