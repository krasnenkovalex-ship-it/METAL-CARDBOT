import Phaser from 'phaser';
import {FIRST_CHALLENGE,validateChallenge} from '../data/puzzles';
export class PuzzleScene extends Phaser.Scene{
 constructor(){super('Puzzle')}
 create(){
  const c=FIRST_CHALLENGE;
  this.add.rectangle(640,360,1280,720,0x061627,.86);
  this.add.rectangle(640,358,790,475,0x173957).setStrokeStyle(3,0x70dcff);
  this.add.text(640,192,'⚡ ЭНЕРГЕТИЧЕСКИЙ МОСТ',{fontSize:'32px',fontStyle:'bold',color:'#c4f4ff'}).setOrigin(.5);
  this.add.text(640,269,c.question,{fontSize:'26px',color:'#ffffff',wordWrap:{width:730}}).setOrigin(.5);
  const hint=this.add.text(640,527,'Выбери правильное продолжение',{fontSize:'21px',color:'#f6ecb1'}).setOrigin(.5);
  c.choices.forEach((choice,i)=>{
    const x=374+i*266;
    const button=this.add.rectangle(x,387,232,83,0x3165a8).setStrokeStyle(2,0x6ecfff).setInteractive({useHandCursor:true});
    this.add.text(x,387,choice,{fontSize:'26px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
    button.on('pointerdown',()=>{
      if(validateChallenge(c,i)){
        hint.setText('Верно! Энергомост заработал!').setColor('#b9ff88');
        this.game.events.emit('puzzle:solved',c.id);
        this.time.delayedCall(480,()=>{this.scene.stop();this.scene.resume('Play')});
      }else{hint.setText(c.hint).setColor('#fff0a4')}
    });
  });
 }
}
