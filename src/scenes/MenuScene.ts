import Phaser from 'phaser';
import {audio} from '../systems/Audio';
export class MenuScene extends Phaser.Scene{
 constructor(){super('Menu');}
 create(){
   this.cameras.main.setBackgroundColor('#58bfe9');
   this.add.image(640,360,'sky').setDisplaySize(1280,720).setAlpha(.97);
   const back=this.add.image(640,490,'forest-back').setDisplaySize(1280,525).setAlpha(.64);
   this.tweens.add({targets:back,x:655,duration:6500,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   const shadow=this.add.rectangle(640,354,1190,640,0x08233c,.69).setStrokeStyle(2,0xb1efff,.4);
   shadow.setAlpha(.94);
   const robot=this.add.image(965,410,'robot').setScale(1.35).setDepth(5);
   this.tweens.add({targets:robot,y:398,duration:760,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   this.add.text(96,115,'МЕТАЛ КАРБОТ',{fontFamily:'system-ui',fontSize:'62px',fontStyle:'bold',color:'#edfaff',stroke:'#0c3456',strokeThickness:9});
   this.add.text(98,195,'БЛЮ КОП · ПРИКЛЮЧЕНИЕ 2D',{fontFamily:'system-ui',fontSize:'27px',fontStyle:'bold',color:'#7cecff'});
   this.add.text(99,269,'ТЕХНОЛЕС: СПАСЕНИЕ ЭНЕРГОЯДРА',{fontFamily:'system-ui',fontSize:'26px',fontStyle:'bold',color:'#ffe998'});
   this.add.text(99,328,'Беги, прыгай, превращайся в машину.\nРешай задачки и спасай друзей!',{fontFamily:'system-ui',fontSize:'24px',color:'#e2f1ff',lineSpacing:12});
   const button=this.add.rectangle(337,474,478,84,0xc5ff81).setStrokeStyle(4,0xffffff).setInteractive({useHandCursor:true});
   const label=this.add.text(337,474,'▶  НАЧАТЬ ИГРУ',{fontFamily:'system-ui',fontSize:'30px',fontStyle:'bold',color:'#15354a'}).setOrigin(.5);
   const begin=()=>{void audio.start().catch(()=>{/* browser blocked autoplay */});this.scene.start('Play');};
   button.on('pointerdown',begin);label.setInteractive({useHandCursor:true}).on('pointerdown',begin);
   this.add.text(100,573,'МИССИЯ 01 · Технолес',{fontFamily:'system-ui',fontSize:'21px',fontStyle:'bold',color:'#bbf1ff'});
   this.add.text(100,609,'10 миров запланировано · В работе первый уровень',{fontFamily:'system-ui',fontSize:'17px',color:'#d0eaff'});
   this.add.text(100,652,'A/D или стрелки — ходить   ·   ПРОБЕЛ — прыгать   ·   E — машина',{fontFamily:'system-ui',fontSize:'15px',color:'#a7c7d7'});
 }
}
