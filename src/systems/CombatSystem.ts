import Phaser from 'phaser';
import {HEROES,type HeroId} from '../data/heroes';
import {canFire,hitDistance,meleeInRange,damageAfterArmor} from './CombatRules';
import {audio} from './Audio';

type EnemyKind='crawler'|'drone'|'sentinel';
type Enemy={sprite:Phaser.Physics.Arcade.Sprite;kind:EnemyKind;
  homeX:number;homeY:number;direction:number;hp:number;maxHp:number;
  armor:number;speed:number;lastAttack:number;alive:boolean;bar:Phaser.GameObjects.Rectangle};
type Bullet={sprite:Phaser.GameObjects.Arc;vx:number;vy:number;born:number;damage:number;enemy:boolean};
export type CombatState={defeated:number;total:number;shots:number;melee:number;enemyHits:number};

/** Arcade-style 2D combat. Visual hit detection independent of body scale. */
export class CombatSystem {
  private enemies:Enemy[]=[];
  private bullets:Bullet[]=[];
  private lastShot=-9999;
  private lastPunch=-9999;
  private defeated=0;
  private shots=0;
  private melee=0;
  private enemyHits=0;
  private readonly elapsedOrigin:number;
  constructor(
    private readonly scene:Phaser.Scene,
    private readonly player:Phaser.Physics.Arcade.Sprite,
    private hero:HeroId,
    private readonly onPlayerDamage:()=>void
  ){
    this.elapsedOrigin=scene.time.now;
  }
  setHero(hero:HeroId):void{this.hero=hero;this.lastShot=-9999;this.lastPunch=-9999;}
  get summary():CombatState{
    return {defeated:this.defeated,total:this.enemies.length,shots:this.shots,melee:this.melee,enemyHits:this.enemyHits};
  }
  /** Enemies intentionally remain non-lethal; checkpoint recovery is handled by the play scene. */
  spawn(x:number,y:number,kind:EnemyKind):void{
    const key=kind==='sentinel'?'enemy-boss':kind==='drone'?'enemy-drone':'enemy-crawler';
    const sprite=this.scene.physics.add.sprite(x,y,key).setDepth(11);
    const scale=kind==='sentinel'?1.40:kind==='drone'?.92:.95;
    sprite.setScale(scale);
    sprite.setImmovable(true);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    const hp=kind==='sentinel'?6:kind==='drone'?2:3;
    const bar=this.scene.add.rectangle(x,y-(kind==='sentinel'?94:65),kind==='sentinel'?130:64,7,0x68e89d).setDepth(12);
    this.enemies.push({sprite,kind,homeX:x,homeY:y,direction:-1,
      hp,maxHp:hp,armor:kind==='sentinel'?1:0,
      speed:kind==='sentinel'?48:kind==='drone'?56:64,
      lastAttack:0,alive:true,bar});
  }
  spawnStageOne():void{
    this.spawn(1040,531,'crawler');
    this.spawn(1530,524,'drone');
    this.spawn(2015,535,'crawler');
    this.spawn(2640,518,'drone');
    this.spawn(3020,525,'crawler');
    this.spawn(3390,493,'sentinel');
  }
  private burst(x:number,y:number,color:number,big=false):void{
    const circle=this.scene.add.circle(x,y,big?47:25,color,.58).setDepth(28).setStrokeStyle(4,0xffffff,.72);
    this.scene.tweens.add({targets:circle,scale:big?3:2.4,alpha:0,
      duration:big?470:290,onComplete:()=>circle.destroy()});
    for(let i=0;i<(big?14:6);i++){
      const a=i*Math.PI*2/(big?14:6),distance=(big?100:52);
      const spark=this.scene.add.circle(x,y,2+(i%3)*2,color).setDepth(28);
      this.scene.tweens.add({targets:spark,x:x+Math.cos(a)*distance,y:y+Math.sin(a)*distance,
        alpha:0,scale:0,duration:300+i*16,onComplete:()=>spark.destroy()});
    }
  }
  private damageEnemy(e:Enemy,raw:number):void{
    if(!e.alive)return;
    const damage=damageAfterArmor(raw,e.armor);
    e.hp=Math.max(0,e.hp-damage);
    e.bar.setDisplaySize((e.kind==='sentinel'?130:64)*e.hp/e.maxHp,7);
    this.enemyHits++;
    this.burst(e.sprite.x,e.sprite.y,HEROES[this.hero].projectileColor);
    e.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(115,()=>{if(e.sprite.active)e.sprite.clearTint();});
    if(e.hp===0){
      e.alive=false;this.defeated++;
      e.bar.destroy();
      this.burst(e.sprite.x,e.sprite.y,0xffe78b,true);
      audio.effect('pickup');
      this.scene.tweens.add({targets:e.sprite,alpha:0,scaleX:1.9,scaleY:1.9,
        angle:35,duration:350,onComplete:()=>e.sprite.destroy()});
    }
  }
  shoot(worldX:number,worldY:number,now=this.scene.time.now):boolean{
    if(!canFire(now,this.lastShot,this.hero))return false;
    this.lastShot=now;this.shots++;
    const profile=HEROES[this.hero];
    const sx=this.player.x+(worldX>=this.player.x?40:-40),sy=this.player.y-24;
    let dx=worldX-sx,dy=worldY-sy;
    const magnitude=Math.hypot(dx,dy);
    if(magnitude<10){dx=this.player.flipX?-1:1;dy=0;}
    else{dx/=magnitude;dy/=magnitude;}
    const speed=this.hero==='megatrucker'?570:this.hero==='phoenixfire'?840:730;
    const radius=this.hero==='megatrucker'?17:this.hero==='phoenixfire'?12:11;
    const orb=this.scene.add.circle(sx,sy,radius,profile.projectileColor,.95).setDepth(25)
      .setStrokeStyle(3,0xffffff,.85);
    this.scene.tweens.add({targets:orb,scale:1.25,yoyo:true,repeat:2,duration:90});
    this.bullets.push({sprite:orb,vx:dx*speed,vy:dy*speed,born:now,
      damage:profile.projectileDamage,enemy:false});
    this.burst(sx,sy,profile.projectileColor);
    audio.effect('transform');
    return true;
  }
  punch(now=this.scene.time.now):boolean{
    if(now-this.lastPunch<360)return false;
    this.lastPunch=now;this.melee++;
    const color=HEROES[this.hero].outlineColor;
    const face=this.player.flipX?-1:1;
    const x=this.player.x+face*80,y=this.player.y-5;
    const shock=this.scene.add.ellipse(x,y,155,105,color,.28)
      .setStrokeStyle(8,0xffffff,.72).setDepth(25);
    this.scene.tweens.add({targets:shock,scale:1.55,alpha:0,duration:210,
      onComplete:()=>shock.destroy()});
    for(const e of this.enemies){
      if(e.alive&&meleeInRange(this.player.x,this.player.y,e.sprite.x,e.sprite.y,face))
        this.damageEnemy(e,HEROES[this.hero].meleeDamage);
    }
    audio.effect('transform');
    return true;
  }
  /** Update patrols, pursuers, contact checks and both friendly and enemy bolts. */
  update(delta:number,now=this.scene.time.now):void{
    const dt=Math.min(Math.max(delta,0),60)/1000;
    for(const e of this.enemies){
      if(!e.alive||!e.sprite.active)continue;
      const chase=this.player.active&&Math.abs(this.player.x-e.sprite.x)<225;
      if(e.kind==='drone'){
        e.sprite.y=e.homeY+Math.sin((now-this.elapsedOrigin)*.003+e.homeX*.007)*47;
        e.sprite.x=e.homeX+Math.sin((now-this.elapsedOrigin)*.0015)*75;
      }else{
        const aim=chase?Math.sign(this.player.x-e.sprite.x):e.direction;
        e.direction=aim||e.direction;
        e.sprite.x+=e.direction*e.speed*dt;
        if(Math.abs(e.sprite.x-e.homeX)>148&&!chase)e.direction*=-1;
        e.sprite.y=e.homeY+(e.kind==='sentinel'?Math.sin(now*.003)*7:0);
      }
      e.sprite.setFlipX(e.direction>0);
      e.bar.setPosition(e.sprite.x,e.sprite.y-(e.kind==='sentinel'?94:65));
      if(hitDistance(this.player.x,this.player.y,e.sprite.x,e.sprite.y)<(e.kind==='sentinel'?102:64)){
        if(now-e.lastAttack>1100){e.lastAttack=now;this.onPlayerDamage();}
      }
      if(e.kind==='sentinel'&&now-e.lastAttack>1700&&Math.abs(this.player.x-e.sprite.x)<650){
        e.lastAttack=now;
        const sx=e.sprite.x,sy=e.sprite.y-28;
        const dir=Math.sign(this.player.x-sx)||-1;
        const orb=this.scene.add.circle(sx,sy,15,0xfd6273,.95)
          .setDepth(24).setStrokeStyle(3,0xffe4b0);
        this.bullets.push({sprite:orb,vx:dir*330,vy:0,born:now,damage:1,enemy:true});
      }
    }
    for(let i=this.bullets.length-1;i>=0;i--){
      const p=this.bullets[i];
      if(!p.sprite.active){this.bullets.splice(i,1);continue;}
      p.sprite.x+=p.vx*dt;p.sprite.y+=p.vy*dt;
      let remove=now-p.born>1900||p.sprite.y<80||p.sprite.y>710;
      if(!remove&&p.enemy&&hitDistance(p.sprite.x,p.sprite.y,this.player.x,this.player.y)<54){
        this.onPlayerDamage();this.burst(p.sprite.x,p.sprite.y,0xf96b8c);remove=true;
      }
      if(!remove&&!p.enemy){
        for(const e of this.enemies){
          if(e.alive&&hitDistance(p.sprite.x,p.sprite.y,e.sprite.x,e.sprite.y)<
            (e.kind==='sentinel'?87:54)){
            this.damageEnemy(e,p.damage);remove=true;break;
          }
        }
      }
      if(remove){p.sprite.destroy();this.bullets.splice(i,1);}
    }
  }
  destroy():void{
    for(const e of this.enemies){if(e.sprite.active)e.sprite.destroy();if(e.bar.active)e.bar.destroy();}
    for(const p of this.bullets)if(p.sprite.active)p.sprite.destroy();
    this.enemies.length=0;this.bullets.length=0;
  }
}
