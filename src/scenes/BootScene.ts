import Phaser from 'phaser';
/** Original engineering geometry; replace with cleared sprite atlases in M1. */
export class BootScene extends Phaser.Scene{
 constructor(){super('Boot')}
 create(){
  const g=this.make.graphics({x:0,y:0});
  g.fillStyle(0x071b30).fillRoundedRect(9,40,62,51,10);
  g.fillStyle(0x1e60dd).fillRoundedRect(14,39,51,42,12);
  g.fillStyle(0xc7edff).fillRoundedRect(19,14,41,33,8);
  g.fillStyle(0x0b3154).fillRoundedRect(21,18,37,13,5);
  g.fillStyle(0x71efff).fillRoundedRect(24,23,31,6,3);
  g.fillStyle(0xffc859).fillRect(37,0,6,17);
  g.fillStyle(0x1456c8).fillRoundedRect(1,48,15,42,6).fillRoundedRect(64,48,15,42,6);
  g.fillStyle(0x0a2c47).fillRoundedRect(20,83,16,30,4).fillRoundedRect(45,83,16,30,4);
  g.fillStyle(0xd0edff).fillRoundedRect(17,108,23,8,3).fillRoundedRect(43,108,23,8,3);
  g.generateTexture('robot-engineering',80,120);g.clear();
  g.fillStyle(0x0b284a).fillRoundedRect(0,20,116,34,10);
  g.fillStyle(0x236ce4).fillRoundedRect(5,9,102,34,10);
  g.fillStyle(0xd7f5ff).fillRoundedRect(31,0,53,25,8);
  g.fillStyle(0x0d3454).fillRoundedRect(39,2,40,15,5);
  g.fillStyle(0xffd45d).fillRect(8,31,100,4);
  g.fillStyle(0x090f1c).fillCircle(25,54,17).fillCircle(92,54,17);
  g.fillStyle(0x9ad8f6).fillCircle(25,54,8).fillCircle(92,54,8);
  g.generateTexture('car-engineering',120,75);g.clear();
  g.fillStyle(0xffcf5f).fillCircle(16,16,13).fillStyle(0xffffff).fillCircle(12,11,4);
  g.generateTexture('energy',32,32);g.clear();
  g.fillStyle(0x54d8ff).fillRoundedRect(0,0,92,24,7);g.generateTexture('platform',92,24);
  g.destroy();this.scene.start('Menu');
 }
}
