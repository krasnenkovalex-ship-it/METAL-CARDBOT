import Phaser from 'phaser';
export class WinScene extends Phaser.Scene{
 constructor(){super('Win')}
 create(data:{crystals?:number}){
  this.cameras.main.setBackgroundColor('#142d50');
  this.add.text(640,190,'🏆 МИССИЯ ЗАВЕРШЕНА!',{fontSize:'49px',fontFamily:'system-ui',fontStyle:'bold',color:'#d8ff90'}).setOrigin(.5);
  this.add.text(640,304,`Собрано кристаллов: ${data.crystals??0}`,{fontSize:'30px',color:'#e6faff'}).setOrigin(.5);
  this.add.text(640,378,'Следующие миры откроются по мере разработки.',{fontSize:'22px',color:'#9fd1ee'}).setOrigin(.5);
  const next=this.add.rectangle(640,506,360,70,0xbaf46a).setInteractive({useHandCursor:true});
  this.add.text(640,506,'↻ ИГРАТЬ ЕЩЁ РАЗ',{fontSize:'23px',color:'#173b25',fontStyle:'bold'}).setOrigin(.5);
  next.on('pointerdown',()=>this.scene.start('Play'));
 }
}
