import Phaser from 'phaser';
import {CHALLENGES,validateChallenge,type Challenge} from '../data/puzzles';
import {audio} from '../systems/Audio';

type PuzzleData={id?:string;round?:number};
type Clickable=Phaser.GameObjects.Arc|Phaser.GameObjects.Rectangle|Phaser.GameObjects.Text;
export class PuzzleScene extends Phaser.Scene{
 private solved=false;
 private status!:Phaser.GameObjects.Text;
 private challenge!:Challenge;
 constructor(){super('Puzzle');}
 create(data:PuzzleData={}){
   this.solved=false;
   this.challenge=CHALLENGES[data.id??'bridge']??CHALLENGES.bridge;
   const c=this.challenge;
   this.add.rectangle(640,360,1280,720,0x06142c,.89).setDepth(500);
   this.add.rectangle(640,363,972,604,0x143658,.98).setStrokeStyle(5,0x5be2ff).setDepth(501);
   this.add.rectangle(640,80,920,75,0x0b2443,.85).setStrokeStyle(2,0xc2f6ff,.42).setDepth(502);
   this.add.text(640,80,c.icon+'   ИСПЫТАНИЕ • РАУНД '+(data.round??1),{
     fontFamily:'system-ui',fontSize:'26px',fontStyle:'bold',color:'#94f0ff'
   }).setOrigin(.5).setDepth(503);
   this.add.text(640,153,c.title.toUpperCase(),{
     fontFamily:'system-ui',fontSize:'37px',fontStyle:'bold',color:'#ffe9a0'
   }).setOrigin(.5).setDepth(503);
   this.add.text(640,219,c.question,{
     fontFamily:'system-ui',fontSize:'25px',color:'#f4fbff',align:'center',wordWrap:{width:880}
   }).setOrigin(.5).setDepth(503);
   this.status=this.add.text(640,566,'Наблюдай, думай и пробуй!',{
     fontFamily:'system-ui',fontSize:'20px',fontStyle:'bold',color:'#d6f7ff',
     align:'center',wordWrap:{width:850}
   }).setOrigin(.5).setDepth(503);
   this.button(640,637,304,54,'← ПРОДОЛЖИТЬ ПОЗЖЕ',0x174869,()=>{
     if(this.solved)return;
     this.game.events.emit('puzzle:cancel',c.id);
     this.scene.stop();this.scene.resume('Play');
   },18);
   if(c.mode==='memory')this.createMemory(c);
   else if(c.mode==='wires')this.createWires(c);
   else if(c.mode==='dial')this.createDial(c);
   else this.createChoices(c);
 }
 private button(x:number,y:number,w:number,h:number,label:string,color:number,fn:()=>void,font=24):Phaser.GameObjects.Rectangle{
   const background=this.add.rectangle(x,y,w,h,color,.96).setStrokeStyle(3,0x98efff)
     .setInteractive({useHandCursor:true}).setDepth(503);
   const text=this.add.text(x,y,label,{fontFamily:'system-ui',fontSize:font+'px',fontStyle:'bold',
     color:'#ffffff',align:'center',wordWrap:{width:w-15}}).setOrigin(.5).setDepth(504)
     .setInteractive({useHandCursor:true});
   for(const b of [background,text] as Clickable[]){
     b.on('pointerdown',()=>{if(!this.solved)fn();});
     b.on('pointerover',()=>background.setStrokeStyle(5,0xeaff9c));
     b.on('pointerout',()=>background.setStrokeStyle(3,0x98efff));
   }
   return background;
 }
 private finish():void{
   if(this.solved)return;
   this.solved=true;this.status.setText('ВЕРНО! МЕХАНИЗМ АКТИВИРОВАН!').setColor('#d4ff8d');
   this.cameras.main.flash(250,120,255,200,false);
   audio.effect('win');
   this.game.events.emit('puzzle:solved',this.challenge.id);
   this.time.delayedCall(780,()=>{this.scene.stop();this.scene.resume('Play');});
 }
 private createChoices(c:Challenge):void{
   c.choices.forEach((choice,i)=>{
     const x=388+i*252;
     const b=this.button(x,411,214,86,choice,0x176ea9,()=>{
       if(validateChallenge(c,i)){b.setFillStyle(0x34915e);this.finish();}
       else{
         this.status.setText(c.hint).setColor('#ffe39d');b.setFillStyle(0x8e4559);
         this.cameras.main.shake(120,.002);
         this.time.delayedCall(260,()=>{if(b.active)b.setFillStyle(0x176ea9);});
       }
     },23);
   });
 }
 private createMemory(c:Challenge):void{
   const sequence=c.sequence??[0,1];
   const colors=[0xf46b79,0x42b9f8,0xffd765];
   const pads:Phaser.GameObjects.Arc[]=[];
   let showing=true;let index=0;let attempts=0;
   colors.forEach((color,i)=>{
     const pad=this.add.circle(390+i*250,390,71,color,.76)
       .setStrokeStyle(6,0xd9faff).setDepth(503).setInteractive({useHandCursor:true});
     this.add.text(390+i*250,390,['🔴','🔵','🟡'][i],{
       fontFamily:'system-ui',fontSize:'50px'
     }).setOrigin(.5).setDepth(504);
     pad.on('pointerdown',()=>{
       if(this.solved||showing)return;
       const expected=sequence[index];
       this.tweens.add({targets:pad,scale:1.15,duration:110,yoyo:true});
       if(i===expected){
         index++;
         this.status.setText('Правильно! '+index+' из '+sequence.length).setColor('#c6ff97');
         audio.effect('pickup');
         if(index===sequence.length)this.finish();
       }else{
         attempts++;index=0;showing=true;
         this.status.setText('Попробуй ещё. Смотри внимательно!').setColor('#ffe7a2');
         this.time.delayedCall(930,()=>playback());
       }
     });
     pads.push(pad);
   });
   const flash=(i:number)=>{
     const pad=pads[i];
     pad.setAlpha(1);
     this.tweens.add({targets:pad,scale:1.24,duration:150,yoyo:true});
     audio.effect('task');
   };
   const playback=()=>{
     if(!this.scene.isActive('Puzzle'))return;
     showing=true;index=0;
     this.status.setText('ЗАПОМИНАЙ ОГОНЬКИ ...').setColor('#9deaff');
     sequence.forEach((pad,index)=>{
       this.time.delayedCall(670*index+400,()=>flash(pad));
     });
     this.time.delayedCall(670*sequence.length+460,()=>{
       showing=false;this.status.setText('Теперь повтори последовательность!').setColor('#d7ff9b');
     });
   };
   const repeat=this.button(640,500,280,54,'🔁 ПОКАЗАТЬ ЕЩЁ',0x225e93,()=>{
     if(this.solved)return;
     showing=true;playback();
   },19);
   void repeat;void attempts;
   this.time.delayedCall(390,playback);
 }
 private createWires(c:Challenge):void{
   const colors:[string,number,string][]=[['КРАСНЫЙ',0xe75e76,'🔴'],['СИНИЙ',0x397edc,'🔵'],['ЖЁЛТЫЙ',0xe6bd4e,'🟡']];
   const positions=[0,1,2],order=[2,0,1];
   let selected=-1;const connected=new Set<number>();
   const line=this.add.graphics().setDepth(502);
   const leftButtons:Phaser.GameObjects.Arc[]=[];
   this.add.text(355,276,'ПРОВОДА',{fontSize:'18px',fontFamily:'system-ui',color:'#bdefff'}).setOrigin(.5).setDepth(502);
   this.add.text(905,276,'РАЗЪЁМЫ',{fontSize:'18px',fontFamily:'system-ui',color:'#bdefff'}).setOrigin(.5).setDepth(502);
   for(const [i,color] of colors.entries()){
     const y=334+i*83;
     const left=this.add.circle(365,y,34,color[1]).setStrokeStyle(4,0xffffff)
       .setDepth(503).setInteractive({useHandCursor:true});
     this.add.text(430,y,color[0],{fontSize:'18px',fontFamily:'system-ui',
       fontStyle:'bold',color:'#f8ffff'}).setDepth(503).setOrigin(0,.5);
     left.on('pointerdown',()=>{
       if(this.solved||connected.has(i))return;
       selected=i;this.status.setText('Выбери разъём такого же цвета справа.');
       leftButtons.forEach(b=>b.setStrokeStyle(4,0xffffff));
       left.setStrokeStyle(7,0xc4ff83);
     });leftButtons.push(left);
   }
   order.forEach((colorIndex,j)=>{
     const y=334+j*83;
     const col=colors[colorIndex];
     const right=this.add.circle(918,y,35,col[1]).setStrokeStyle(4,0xffffff)
       .setDepth(503).setInteractive({useHandCursor:true});
     right.on('pointerdown',()=>{
       if(this.solved||selected<0||connected.has(colorIndex))return;
       if(selected!==colorIndex){
         this.status.setText('Цвета не совпадают — попробуй другую пару!').setColor('#ffe09a');
         this.cameras.main.shake(110,.0015);return;
       }
       connected.add(colorIndex);
       line.lineStyle(13,col[1],1);
       line.beginPath();line.moveTo(365,334+selected*83);
       line.lineTo(918,y);line.strokePath();
       leftButtons[colorIndex].setAlpha(.5);
       right.setAlpha(.6);selected=-1;audio.effect('open');
       this.status.setText('Провод подключён! '+connected.size+'/3').setColor('#d5ff8f');
       if(connected.size===3)this.finish();
     });
   });
 }
 private createDial(c:Challenge):void{
   const steps=c.dialSteps??4,target=c.dialTarget??2;
   let pos=0;
   const gear=this.add.circle(635,400,104,0x236e9a,.88).setStrokeStyle(10,0xffdf79)
     .setDepth(503).setInteractive({useHandCursor:true});
   const symbol=this.add.text(635,398,'⚙️',{fontSize:'80px',fontFamily:'system-ui'}).setOrigin(.5).setDepth(504);
   const arrow=this.add.text(635,300,'▼',{fontSize:'39px',color:'#eaff9a'}).setOrigin(.5).setDepth(504);
   this.add.text(930,384,'ЦЕЛЬ: '+(target+1),{fontSize:'27px',color:'#eaff9a',
     fontFamily:'system-ui',fontStyle:'bold'}).setOrigin(.5).setDepth(504);
   this.add.text(361,390,'ПОЗИЦИЯ',{fontSize:'22px',color:'#bdeaff',
     fontFamily:'system-ui'}).setOrigin(.5).setDepth(503);
   const current=this.add.text(361,429,'1',{fontSize:'38px',fontStyle:'bold',
     fontFamily:'system-ui',color:'#fff'}).setOrigin(.5).setDepth(504);
   const turn=()=>{
     pos=(pos+1)%steps;
     this.tweens.add({targets:symbol,angle:symbol.angle+360/steps,duration:225,ease:'Sine.inOut'});
     gear.setFillStyle([0x286ba4,0x9b659e,0x9b7a34,0x389482,0x7963bc][pos]);
     current.setText(String(pos+1));
     this.status.setText('Поверни до позиции '+(target+1)+' и нажми АКТИВИРОВАТЬ.');
     audio.effect('task');
   };
   gear.on('pointerdown',turn);symbol.setInteractive({useHandCursor:true}).on('pointerdown',turn);
   this.button(635,512,308,58,'⚡ АКТИВИРОВАТЬ',0x287d65,()=>{
     if(pos===target)this.finish();
     else{this.status.setText(c.hint).setColor('#ffe398');this.cameras.main.shake(130,.001);}
   },21);
   void arrow;
 }
}
