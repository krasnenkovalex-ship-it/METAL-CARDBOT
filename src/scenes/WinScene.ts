import Phaser from 'phaser';
export class WinScene extends Phaser.Scene{
 constructor(){super('Win');}
 create(data:{crystals?:number}){
   this.cameras.main.setBackgroundColor('#0e3352');
   this.add.image(640,360,'sky').setDisplaySize(1280,720).setAlpha(.9);
   this.add.image(640,490,'forest-back').setDisplaySize(1280,540).setAlpha(.65);
   this.add.rectangle(640,355,890,630,0x0d2945,.86).setStrokeStyle(4,0x93ecff);
   const star=this.add.text(640,156,'🏆  ⭐  🏆',{fontSize:'78px'}).setOrigin(.5);
   this.tweens.add({targets:star,scale:1.08,duration:750,yoyo:true,repeat:-1,ease:'Sine.inOut'});
   this.add.text(640,277,'МИССИЯ ВЫПОЛНЕНА!',{fontFamily:'system-ui',fontSize:'51px',fontStyle:'bold',color:'#d7ff8b'}).setOrigin(.5);
   this.add.text(640,350,'БЛЮ КОП СПАС ЭНЕРГОМОСТ!',{fontFamily:'system-ui',fontSize:'27px',fontStyle:'bold',color:'#baf5ff'}).setOrigin(.5);
   this.add.text(640,410,'Собрано кристаллов: '+(data.crystals??0)+' из 4',{fontSize:'25px',fontFamily:'system-ui',color:'#ffed9a'}).setOrigin(.5);
   const play=this.add.rectangle(640,530,390,78,0xc3fd75).setStrokeStyle(3,0xf6fff0).setInteractive({useHandCursor:true});
   const label=this.add.text(640,530,'↻ ИГРАТЬ ЕЩЁ РАЗ',{fontSize:'26px',fontFamily:'system-ui',fontStyle:'bold',color:'#184330'}).setOrigin(.5);
   const restart=()=>this.scene.start('Play');
   play.on('pointerdown',restart);label.setInteractive({useHandCursor:true}).on('pointerdown',restart);
   this.add.text(640,637,'Следующие миры готовим отдельно — качество важнее количества.',{fontSize:'18px',color:'#9fcfe9'}).setOrigin(.5);
 }
}
