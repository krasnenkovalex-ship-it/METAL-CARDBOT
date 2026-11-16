import Phaser from 'phaser';
import {CHALLENGES,validateChallenge} from '../data/puzzles';
export class PuzzleScene extends Phaser.Scene{
 constructor(){super('Puzzle');}
 create(data:{id?:string}={}){
   const challenge=CHALLENGES[data.id??'bridge']??CHALLENGES.bridge;
   const ui=this.add.container(0,0).setDepth(500);
   ui.add(this.add.rectangle(640,360,1280,720,0x06152c,.84));
   const card=this.add.rectangle(640,360,870,490,0x12375a,.98).setStrokeStyle(5,0x51d9ff);
   ui.add(card);
   ui.add(this.add.text(640,158,challenge.icon+'  ЛОГИЧЕСКАЯ МИССИЯ',{fontFamily:'system-ui',fontSize:'23px',fontStyle:'bold',color:'#80edff'}).setOrigin(.5));
   ui.add(this.add.text(640,208,challenge.title.toUpperCase(),{fontFamily:'system-ui',fontSize:'37px',fontStyle:'bold',color:'#fff5c2'}).setOrigin(.5));
   ui.add(this.add.text(640,297,challenge.question,{fontFamily:'system-ui',fontSize:'31px',color:'#ffffff',wordWrap:{width:800},align:'center'}).setOrigin(.5));
   const hint= this.add.text(640,518,'Найди правильный ответ',{fontFamily:'system-ui',fontSize:'21px',color:'#e0f5ff',align:'center',wordWrap:{width:790}}).setOrigin(.5);
   ui.add(hint);
   let done=false;
   for(let i=0;i<challenge.choices.length;i++){
     const x=388+i*252;
     const button=this.add.rectangle(x,407,217,78,0x1a70ad).setStrokeStyle(3,0x8aeaff).setInteractive({useHandCursor:true});
     const label=this.add.text(x,407,challenge.choices[i],{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#fff'}).setOrigin(.5);
     const choose=()=>{
       if(done)return;
       if(validateChallenge(challenge,i)){
         done=true;button.setFillStyle(0x4c9c64);hint.setText('ПРАВИЛЬНО! МЕХАНИЗМ ЗАРАБОТАЛ!').setColor('#c6ff8a');
         this.game.events.emit('puzzle:solved',challenge.id);
         this.time.delayedCall(650,()=>{this.scene.stop();this.scene.resume('Play');});
       }else{
         this.cameras.main.shake(140,.002);
         button.setFillStyle(0x8b4051);
         this.time.delayedCall(220,()=>{if(button.active)button.setFillStyle(0x1a70ad);});
         hint.setText(challenge.hint).setColor('#ffe39b');
       }
     };
     button.on('pointerdown',choose);label.setInteractive({useHandCursor:true}).on('pointerdown',choose);
     ui.add(button);ui.add(label);
   }
   const skip=this.add.text(640,585,'← ПРОДОЛЖИТЬ ПОЗЖЕ',{fontFamily:'system-ui',fontSize:'17px',fontStyle:'bold',color:'#c2e8ff'}).setOrigin(.5).setInteractive({useHandCursor:true});
   skip.on('pointerdown',()=>{if(done)return;this.game.events.emit('puzzle:cancel',challenge.id);this.scene.stop();this.scene.resume('Play');});
   ui.add(skip);
 }
}
