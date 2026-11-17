import Phaser from 'phaser';
import {getRound,nextRound,type RoundId} from '../data/rounds';
import {HEROES,type HeroId} from '../data/heroes';
type VictoryData={crystals?:number;round?:number;title?:string;hero?:HeroId;enemyCount?:number};
export class WinScene extends Phaser.Scene{
 constructor(){super('Win');}
 create(data:VictoryData={}){
   const round=(Number.isInteger(data.round)&&data.round!>=1&&data.round!<=5?
     data.round:1) as RoundId;
   const def=getRound(round),next=nextRound(round);
   this.cameras.main.setBackgroundColor('#0e3352');
   this.add.image(640,360,'sky').setDisplaySize(1280,720).setTint(def.skyTint);
   const forest=this.add.image(640,470,'forest-back').setDisplaySize(1280,540).setTint(def.backTint).setAlpha(.75);
   this.tweens.add({targets:forest,x:655,duration:3800,yoyo:true,repeat:-1});
   this.add.rectangle(640,353,965,654,0x102c4c,.89).setStrokeStyle(5,def.starColor,.75);
   const stars=this.add.text(640,134,next?'⭐ ⭐ ⭐':'🏆 ⭐ 🏆',{
     fontFamily:'system-ui',fontSize:'78px',color:'#fff8a5'}).setOrigin(.5);
   this.tweens.add({targets:stars,scale:1.06,y:125,duration:730,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   this.add.text(640,239,next?'РАУНД '+round+' ПРОЙДЕН!':'ПОБЕДА! ВСЕ 5 РАУНДОВ!',{
     fontFamily:'system-ui',fontSize:next?'43px':'39px',fontStyle:'bold',
     color:'#d7ff8b',stroke:'#073c4b',strokeThickness:7}).setOrigin(.5);
   this.add.text(640,307,def.name+' · '+def.subtitle,{
     fontFamily:'system-ui',fontSize:'26px',fontStyle:'bold',color:'#c3f5ff'}).setOrigin(.5);
   const hero=HEROES[data.hero??'bluecop'];
   this.add.text(640,363,hero.name+' СПАС МИР!',{
     fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#ffe8aa'}).setOrigin(.5);
   this.add.text(640,409,'✦ Кристаллы '+(data.crystals??0)+'/4    ⚔ Врагов повержено: '+(data.enemyCount??0),{
     fontFamily:'system-ui',fontSize:'22px',color:'#e9f6ff'}).setOrigin(.5);
   const make=(x:number,y:number,w:number,text:string,fn:()=>void,color=0xbbfa7b)=>{
     const bg=this.add.rectangle(x,y,w,71,color,.98).setStrokeStyle(3,0xffffff)
       .setInteractive({useHandCursor:true});
     const title=this.add.text(x,y,text,{fontFamily:'system-ui',fontSize:'23px',
       fontStyle:'bold',color:'#15384b'}).setOrigin(.5).setInteractive({useHandCursor:true});
     bg.on('pointerdown',fn);title.on('pointerdown',fn);
   };
   if(next){
     make(640,521,460,'▶ НАЧАТЬ РАУНД '+next,()=>this.scene.start('Play',{round:next}));
     make(640,604,300,'↻ ПОВТОРИТЬ',()=>this.scene.start('Play',{round}),0x8ee5ec);
   }else{
     make(640,521,530,'🏆 КОМАНДА ПОБЕДИЛА!',()=>this.scene.start('Menu'));
     make(640,604,390,'↻ ИГРАТЬ СНАЧАЛА',()=>this.scene.start('Play',{round:1}),0x8ee5ec);
   }
   this.add.text(640,667,'СОХРАНЕНИЕ ПРОГРЕССА · МЕХАНИЗМЫ · СМЕЛОСТЬ · ЛОГИКА',{
     fontFamily:'system-ui',fontSize:'15px',color:'#a7d5e9'}).setOrigin(.5);
 }
}
