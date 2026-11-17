import Phaser from 'phaser';
import {audio} from '../systems/Audio';
import {HEROES,HERO_IDS,chooseHero,currentHero,type HeroId} from '../data/heroes';

/** Title screen with three *playable* character choices, not cosmetic cards. */
export class MenuScene extends Phaser.Scene{
 constructor(){super('Menu');}
 create(){
   this.cameras.main.setBackgroundColor('#58bfe9');
   this.add.image(640,360,'sky').setDisplaySize(1280,720);
   const forest=this.add.image(640,500,'forest-back').setDisplaySize(1280,535).setAlpha(.75);
   this.tweens.add({targets:forest,x:657,duration:6500,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   this.add.rectangle(640,365,1210,694,0x051c36,.75).setStrokeStyle(3,0x87dfff,.52);
   this.add.text(640,61,'МЕТАЛ КАРБОТ',{fontFamily:'system-ui',fontSize:'55px',fontStyle:'bold',color:'#effbff',
      stroke:'#0a3f78',strokeThickness:9}).setOrigin(.5);
   this.add.text(640,122,'КОМАНДА ГЕРОЕВ · ЭНЕРГЕТИЧЕСКИЙ ЛЕС',{fontFamily:'system-ui',fontSize:'22px',
      fontStyle:'bold',color:'#c7f6ff',letterSpacing:2}).setOrigin(.5);
   this.add.text(640,167,'Выбери своего Карбота!',{fontFamily:'system-ui',fontSize:'30px',
      fontStyle:'bold',color:'#ffe797'}).setOrigin(.5);
   const cards=new Map<HeroId,{border:Phaser.GameObjects.Rectangle;shine:Phaser.GameObjects.Rectangle}>();
   const cardWidth=302;
   HERO_IDS.forEach((id,i)=>{
     const p=HEROES[id],x=307+i*334,y=379;
     const glow=this.add.rectangle(x,y,cardWidth+12,326,p.outlineColor,.12).setStrokeStyle(4,p.outlineColor,.54);
     const border=this.add.rectangle(x,y,cardWidth,316,0x143956,.88).setStrokeStyle(3,0x6794b1);
     const portrait=this.add.image(x,y-54,id+'-robot').setScale(.54).setDepth(5);
     this.tweens.add({targets:portrait,y:y-64,duration:760+i*110,yoyo:true,repeat:-1,ease:'Sine.inOut'});
     this.add.text(x,y+59,p.name,{fontFamily:'system-ui',fontSize:'23px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5).setDepth(6);
     this.add.text(x,y+93,p.type,{fontFamily:'system-ui',fontSize:'17px',color:'#a8f4ff'}).setOrigin(.5).setDepth(6);
     this.add.text(x,y+125,p.nickname,{fontFamily:'system-ui',fontSize:'16px',color:'#ffdfa4'}).setOrigin(.5).setDepth(6);
     cards.set(id,{border,shine:glow});
     const select=()=>{
       chooseHero(id);
       for(const [key,value] of cards){
         const active=key===id;
         value.border.setStrokeStyle(active?6:3,active?0xeaff9d:0x6794b1);
         value.shine.setAlpha(active?.35:.12);
       }
       selectedLabel.setText('ВЫБРАН: '+p.name+'  ·  '+p.ability);
     };
     for(const o of [border,portrait])o.setInteractive({useHandCursor:true}).on('pointerdown',select);
     glow.setInteractive({useHandCursor:true}).on('pointerdown',select);
   });
   const selectedLabel=this.add.text(640,565,'ВЫБРАН: БЛЮ КОП  ·  ЭНЕРГОЛУЧ',{
     fontFamily:'system-ui',fontSize:'19px',fontStyle:'bold',color:'#d9ff9c'}).setOrigin(.5);
   // Initialise chosen hero and highlight the right card immediately.
   const init=currentHero();
   cards.get(init)?.border.setStrokeStyle(6,0xeaff9d);
   selectedLabel.setText('ВЫБРАН: '+HEROES[init].name+'  ·  '+HEROES[init].ability);
   const button=this.add.rectangle(640,628,452,72,0xd8ff82).setStrokeStyle(4,0xffffff)
     .setInteractive({useHandCursor:true});
   const label=this.add.text(640,628,'▶ НАЧАТЬ ПРИКЛЮЧЕНИЕ',{fontFamily:'system-ui',
     fontSize:'25px',fontStyle:'bold',color:'#193d40'}).setOrigin(.5).setInteractive({useHandCursor:true});
   const start=()=>{void audio.start().catch(()=>{});this.scene.start('Play');};
   button.on('pointerdown',start);label.on('pointerdown',start);
   this.add.text(640,686,'МЫШЬ: ЛКМ — ВЫСТРЕЛ · ПКМ — УДАР · E — ТРАНСФОРМАЦИЯ · 1/2/3 — СМЕНА ГЕРОЯ',
     {fontFamily:'system-ui',fontSize:'16px',color:'#c5e5f4'}).setOrigin(.5);
 }
}
