import Phaser from 'phaser';
export class MenuScene extends Phaser.Scene{
 constructor(){super('Menu')}
 create(){
  this.cameras.main.setBackgroundColor('#132d50');
  for(let i=0;i<65;i++){this.add.circle((i*137)%1280,(i*89)%720,1+i%4,0x73d9ff,.15+i%3*.09)}
  this.add.text(640,137,'METAL CARDBOT',{fontFamily:'system-ui',fontStyle:'bold',fontSize:'65px',color:'#e4faff'}).setOrigin(.5);
  this.add.text(640,212,'2D • ПРИКЛЮЧЕНИЯ ЭНЕРГОНА',{fontFamily:'system-ui',fontSize:'28px',color:'#a7f1ff'}).setOrigin(.5);
  this.add.text(640,310,'10 миров в плане · 1 игровая сцена в разработке',{fontFamily:'system-ui',fontSize:'25px',color:'#fff0b3'}).setOrigin(.5);
  this.add.text(640,384,'Бегай • Прыгай • Превращайся • Решай головоломки',{fontFamily:'system-ui',fontSize:'22px',color:'#deefff'}).setOrigin(.5);
  const start=this.add.rectangle(640,499,400,80,0xb2f65b).setInteractive({useHandCursor:true});
  this.add.text(640,499,'▶ НАЧАТЬ МИССИЮ',{fontFamily:'system-ui',fontSize:'27px',fontStyle:'bold',color:'#152a25'}).setOrigin(.5);
  start.on('pointerdown',()=>this.scene.start('Play'));
  this.add.text(640,650,'WASD / стрелки — идти · Пробел — прыгнуть · E — машина',{fontSize:'19px',color:'#b3d0f2'}).setOrigin(.5);
  this.add.text(640,687,'Инженерный прототип: оригинальные временные спрайты, без официальных моделей.',{fontSize:'13px',color:'#96acc7'}).setOrigin(.5);
 }
}
