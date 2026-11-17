import Phaser from 'phaser';
import {HEROES,type HeroId} from '../data/heroes';
import {canFire,hitDistance,meleeInRange,damageAfterArmor} from './CombatRules';
import {decideEnemy,type EnemyKind,type EnemyMode} from './EnemyBrain';
import type {EnemyPlacement} from '../data/rounds';
import {audio} from './Audio';

type Enemy={
 sprite:Phaser.Physics.Arcade.Sprite;bar:Phaser.GameObjects.Rectangle;warning:Phaser.GameObjects.Text;
 kind:EnemyKind;homeX:number;homeY:number;direction:-1|1;hp:number;maxHp:number;
 armor:number;speed:number;lastContact:number;lastFire:number;alive:boolean;
 mode:EnemyMode;modeUntil:number;bossPhase:number
};
type Bullet={sprite:Phaser.GameObjects.Arc;vx:number;vy:number;born:number;damage:number;enemy:boolean};
type Target={x:number;y:number;radius:number;hp:number;active:boolean;onHit:()=>void};
export type CombatState={defeated:number;total:number;shots:number;melee:number;enemyHits:number;bossAlive:boolean;warnings:number};

/** Dynamic telegraphed combat for age five. All projectiles are dodgeable, no hard game-over. */
export class CombatSystem {
 private enemies:Enemy[]=[];
 private bullets:Bullet[]=[];
 private targets:Target[]=[];
 private lastShot=-9999;
 private lastPunch=-9999;
 private defeated=0;private shots=0;private melee=0;private enemyHits=0;
 private difficulty=1;
 private bossShield=false;
 private readonly elapsedOrigin:number;
 constructor(
   private readonly scene:Phaser.Scene,
   private readonly player:Phaser.Physics.Arcade.Sprite,
   private hero:HeroId,
   private readonly onPlayerDamage:()=>void
 ){this.elapsedOrigin=scene.time.now;}
 setHero(hero:HeroId):void{this.hero=hero;this.lastShot=-9999;this.lastPunch=-9999;}
 get summary():CombatState{
   return {defeated:this.defeated,total:this.enemies.length,shots:this.shots,
     melee:this.melee,enemyHits:this.enemyHits,bossAlive:this.bossAlive,
     warnings:this.enemies.filter(e=>e.alive&&e.mode==='windup').length};
 }
 get bossAlive():boolean{return this.enemies.some(e=>e.kind==='sentinel'&&e.alive);}
 setBossShield(shield:boolean):void{
   this.bossShield=shield;
   for(const e of this.enemies)if(e.kind==='sentinel'&&e.alive){
     e.sprite.setTint(shield?0x96cbff:0xffffff);
   }
 }
 registerTarget(x:number,y:number,radius:number,onHit:()=>void,hp=1):void{
   this.targets.push({x,y,radius,onHit,hp,active:true});
 }
 private spawn(x:number,y:number,kind:EnemyKind):void{
   const drone=kind==='drone',boss=kind==='sentinel',turret=kind==='turret';
   const key=boss||turret?'enemy-boss':drone||kind==='hopper'?'enemy-drone':'enemy-crawler';
   const sprite=this.scene.physics.add.sprite(x,y,key).setDepth(11);
   sprite.setScale(boss?1.25:turret?.84:drone?.82:.87).setImmovable(true);
   const body=sprite.body as Phaser.Physics.Arcade.Body;
   body.setAllowGravity(false);body.setEnable(false);
   if(kind==='charger')sprite.setTint(0xffae69);
   else if(kind==='hopper')sprite.setTint(0xa6f981);
   else if(turret)sprite.setTint(0xfcaccd);
   const hp=boss?9:turret?4:kind==='charger'?4:kind==='hopper'?3:drone?2:3;
   const bar=this.scene.add.rectangle(x,y-(boss?104:65),boss?130:67,8,0x72fbb0).setDepth(12);
   const warning=this.scene.add.text(x,y-118,'!',{fontFamily:'system-ui',fontSize:'36px',
     fontStyle:'bold',color:'#ffed7b',stroke:'#60204e',strokeThickness:5})
     .setOrigin(.5).setDepth(14).setVisible(false);
   this.enemies.push({sprite,bar,warning,kind,homeX:x,homeY:y,direction:-1,
     hp,maxHp:hp,armor:boss?1:0,speed:kind==='charger'?130:kind==='hopper'?105:60,
     lastContact:-9999,lastFire:-9999,alive:true,mode:'patrol',
     modeUntil:1000,bossPhase:1});
 }
 spawnRound(placements:readonly EnemyPlacement[],round:number):void{
   this.difficulty=1+Math.min(4,round-1)*.27;
   for(const p of placements)this.spawn(p.x,p.y,p.kind);
 }
 spawnStageOne():void{
   this.spawnRound([{x:1040,y:531,kind:'crawler'},{x:1530,y:522,kind:'drone'},
     {x:2015,y:531,kind:'crawler'},{x:2640,y:518,kind:'drone'},
     {x:3020,y:525,kind:'crawler'},{x:3390,y:493,kind:'sentinel'}],1);
 }
 private burst(x:number,y:number,color:number,big=false):void{
   const circle=this.scene.add.circle(x,y,big?43:21,color,.43).setStrokeStyle(4,0xffffff,.66).setDepth(28);
   this.scene.tweens.add({targets:circle,scale:big?3:2.4,alpha:0,duration:big?530:270,
     onComplete:()=>circle.destroy()});
   for(let i=0;i<(big?14:7);i++){
     const angle=i*Math.PI*2/(big?14:7),distance=big?115:55;
     const spark=this.scene.add.circle(x,y,3+(i%3),color,.96).setDepth(28);
     this.scene.tweens.add({targets:spark,x:x+Math.cos(angle)*distance,y:y+Math.sin(angle)*distance,
       alpha:0,scale:0,duration:280+i*18,onComplete:()=>spark.destroy()});
   }
 }
 private damageEnemy(e:Enemy,raw:number):void{
   if(!e.alive)return;
   if(this.bossShield&&e.kind==='sentinel'){
     this.burst(e.sprite.x,e.sprite.y,0x83dbff);return;
   }
   const damage=damageAfterArmor(raw,e.armor);
   e.hp=Math.max(0,e.hp-damage);
   e.bar.setDisplaySize((e.kind==='sentinel'?130:67)*e.hp/e.maxHp,8);
   this.enemyHits++;
   this.burst(e.sprite.x,e.sprite.y,HEROES[this.hero].projectileColor);
   e.sprite.setTintFill();
   this.scene.time.delayedCall(110,()=>{
     if(e.sprite.active)e.sprite.setTint(this.bossShield&&e.kind==='sentinel'?0x96cbff:0xffffff);
   });
   if(e.kind==='sentinel'){
     const phase=e.hp<=e.maxHp/3?3:e.hp<=e.maxHp*2/3?2:1;
     if(phase>e.bossPhase){
       e.bossPhase=phase;e.mode='windup';e.modeUntil=this.scene.time.now+800;
       this.burst(e.sprite.x,e.sprite.y,0xfbf2a6,true);
     }
   }
   if(e.hp<=0){
     e.alive=false;this.defeated++;
     e.bar.destroy();e.warning.destroy();
     this.burst(e.sprite.x,e.sprite.y,0xffe38e,true);
     audio.effect('pickup');
     this.scene.tweens.add({targets:e.sprite,alpha:0,scaleX:1.9,scaleY:1.9,
       angle:35,duration:340,onComplete:()=>e.sprite.destroy()});
   }
 }
 shoot(worldX:number,worldY:number,now=this.scene.time.now):boolean{
   if(!canFire(now,this.lastShot,this.hero))return false;
   this.lastShot=now;this.shots++;
   const profile=HEROES[this.hero],dir=worldX>=this.player.x?1:-1;
   const sx=this.player.x+dir*37,sy=this.player.y-27;
   let dx=worldX-sx,dy=worldY-sy;
   const len=Math.hypot(dx,dy);
   if(len<10){dx=this.player.flipX?-1:1;dy=0;}
   else{dx/=len;dy/=len;}
   const speed=this.hero==='megatrucker'?600:this.hero==='phoenixfire'?850:740;
   const radius=this.hero==='megatrucker'?18:11;
   const orb=this.scene.add.circle(sx,sy,radius,profile.projectileColor,.96)
     .setStrokeStyle(3,0xffffff).setDepth(25);
   this.bullets.push({sprite:orb,vx:dx*speed,vy:dy*speed,born:now,
     damage:profile.projectileDamage,enemy:false});
   this.burst(sx,sy,profile.projectileColor);
   audio.effect('transform');return true;
 }
 punch(now=this.scene.time.now):boolean{
   if(now-this.lastPunch<330)return false;
   this.lastPunch=now;this.melee++;
   const face=this.player.flipX?-1:1;
   const shock=this.scene.add.ellipse(this.player.x+face*76,this.player.y-8,155,95,
     HEROES[this.hero].outlineColor,.32).setStrokeStyle(7,0xffffff,.65).setDepth(24);
   this.scene.tweens.add({targets:shock,alpha:0,scale:1.4,duration:220,
     onComplete:()=>shock.destroy()});
   for(const e of this.enemies){
     if(e.alive&&meleeInRange(this.player.x,this.player.y,e.sprite.x,e.sprite.y,face,128))
       this.damageEnemy(e,HEROES[this.hero].meleeDamage);
   }
   for(const t of this.targets){
     if(t.active&&meleeInRange(this.player.x,this.player.y,t.x,t.y,face,128)){
       t.hp-=1;if(t.hp<=0){t.active=false;t.onHit();}
     }
   }
   audio.effect('transform');return true;
 }
 private enemyBolt(x:number,y:number,vx:number,vy:number,now:number,big=false):void{
   const orb=this.scene.add.circle(x,y,big?18:12,big?0xffb77d:0xf66d9e,.96)
     .setStrokeStyle(3,0xffefad).setDepth(24);
   this.bullets.push({sprite:orb,vx,vy,born:now,damage:1,enemy:true});
 }
 update(delta:number,now=this.scene.time.now):void{
   const dt=Math.max(0,Math.min(delta,50))/1000;
   for(const e of this.enemies){
     if(!e.alive||!e.sprite.active)continue;
     const d=decideEnemy({kind:e.kind,mode:e.mode,now,modeUntil:e.modeUntil,
       x:e.sprite.x,y:e.sprite.y,homeX:e.homeX,homeY:e.homeY,
       playerX:this.player.x,playerY:this.player.y,direction:e.direction,
       lastFire:e.lastFire,difficulty:this.difficulty},dt);
     e.mode=d.mode;e.modeUntil=d.modeUntil;e.direction=d.direction;
     e.sprite.x+=d.moveX;e.sprite.y+=d.moveY;
     if(e.kind==='hopper')e.sprite.y=e.homeY+Math.sin(now*.006+e.homeX)*39;
     if(e.kind==='drone'&&e.mode==='patrol')
       e.sprite.y=e.homeY+Math.sin(now*.003+e.homeX*.008)*45;
     if(e.kind!=='turret'&&e.mode!=='attack'&&Math.abs(e.sprite.x-e.homeX)>185)
       e.sprite.x=e.homeX+Math.sign(e.sprite.x-e.homeX)*185;
     e.sprite.setFlipX(e.direction>0);
     if(d.warning){
       e.warning.setVisible(true).setPosition(e.sprite.x,e.sprite.y-(e.kind==='sentinel'?158:112))
         .setAlpha(.55+Math.sin(now*.022)*.45);
       e.sprite.setScale(e.kind==='sentinel'?1.25+Math.sin(now*.025)*.045:.88+Math.sin(now*.025)*.025);
     }else{
       e.warning.setVisible(false);
       e.sprite.setScale(e.kind==='sentinel'?1.25:e.kind==='turret'?.84:e.kind==='drone'?.82:.87);
     }
     e.bar.setPosition(e.sprite.x,e.sprite.y-(e.kind==='sentinel'?104:65));
     if(hitDistance(e.sprite.x,e.sprite.y,this.player.x,this.player.y)<
       (e.kind==='sentinel'?94:e.kind==='drone'?58:65)&&now-e.lastContact>1250){
       e.lastContact=now;this.onPlayerDamage();
     }
     if((d.fire||(e.kind==='drone'&&e.mode==='attack'&&now-e.lastFire>1500))&&now-e.lastFire>650){
       e.lastFire=now;
       const dx=this.player.x-e.sprite.x,dy=this.player.y-e.sprite.y-20;
       const len=Math.max(1,Math.hypot(dx,dy));
       const speed=e.kind==='sentinel'?310:240;
       this.enemyBolt(e.sprite.x,e.sprite.y-21,dx/len*speed,dy/len*speed,now,e.kind==='sentinel');
     }
   }
   for(let i=this.bullets.length-1;i>=0;i--){
     const p=this.bullets[i];
     if(!p.sprite.active){this.bullets.splice(i,1);continue;}
     // Micro-steps prevent very fast bolts from skipping compact targets.
     const steps=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vy)*dt/32));
     let remove=now-p.born>(p.enemy?2600:1650)||p.sprite.y<50||p.sprite.y>750;
     for(let step=0;step<steps&&!remove;step++){
       p.sprite.x+=p.vx*dt/steps;p.sprite.y+=p.vy*dt/steps;
       if(p.enemy){
         if(hitDistance(p.sprite.x,p.sprite.y,this.player.x,this.player.y)<47){
           this.onPlayerDamage();this.burst(p.sprite.x,p.sprite.y,0xf66d9e);remove=true;
         }
       }else{
         for(const t of this.targets){
           if(t.active&&hitDistance(p.sprite.x,p.sprite.y,t.x,t.y)<t.radius){
             t.hp-=p.damage;if(t.hp<=0){t.active=false;t.onHit();}
             this.burst(t.x,t.y,0xffd775);remove=true;break;
           }
         }
         if(!remove)for(const e of this.enemies){
           if(e.alive&&hitDistance(p.sprite.x,p.sprite.y,e.sprite.x,e.sprite.y)<
             (e.kind==='sentinel'?84:52)){
             this.damageEnemy(e,p.damage);remove=true;break;
           }
         }
       }
     }
     if(remove){p.sprite.destroy();this.bullets.splice(i,1);}
   }
 }
 destroy():void{
   for(const e of this.enemies){
     if(e.sprite.active)e.sprite.destroy();
     if(e.bar.active)e.bar.destroy();if(e.warning.active)e.warning.destroy();
   }
   for(const p of this.bullets)if(p.sprite.active)p.sprite.destroy();
   this.enemies=[];this.bullets=[];this.targets=[];
 }
}
