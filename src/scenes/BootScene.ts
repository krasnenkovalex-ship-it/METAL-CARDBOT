import Phaser from 'phaser';
/** Original SVG artwork. All assets are shipped with the repo, no remote URLs. */
export class BootScene extends Phaser.Scene {
  constructor(){super('Boot');}
  preload(){
    this.load.svg('sky','assets/worlds/forest-sky.svg',{width:1920,height:1080});
    this.load.svg('forest-back','assets/worlds/forest-mid.svg',{width:2200,height:900});
    this.load.svg('forest-front','assets/worlds/forest-front.svg',{width:2200,height:900});
    this.load.svg('robot','assets/characters/hero-robot.svg',{width:200,height:280});
    for(let frame=0;frame<4;frame++){
      this.load.svg('robot-run-'+frame,'assets/characters/hero-run-'+frame+'.svg',{width:200,height:280});
    }
    this.load.svg('car','assets/characters/hero-car.svg',{width:300,height:150});
    this.load.svg('terrain','assets/worlds/grass-rock-platform.svg',{width:320,height:100});
  }
  create(){
    const g=this.make.graphics({x:0,y:0});
    g.fillStyle(0x42dfff);g.fillRoundedRect(0,0,96,32,7);
    g.generateTexture('platform-physics',96,32);g.clear();
    g.fillStyle(0xffe999);g.fillTriangle(21,0,43,40,0,40);
    g.fillStyle(0xf39b35);g.fillTriangle(21,8,35,35,7,35);
    g.generateTexture('energy',44,44);g.clear();
    g.fillStyle(0xffd35e);g.fillCircle(22,22,20);g.fillStyle(0xfff5c4);g.fillCircle(16,14,7);
    g.generateTexture('spark',44,44);g.clear();
    g.fillStyle(0x0e3970);g.fillRoundedRect(0,0,70,120,10);
    g.fillStyle(0x1783cf);g.fillRoundedRect(8,8,54,105,7);
    g.fillStyle(0x74efff);g.fillRect(12,20,46,12);
    g.fillStyle(0xffc85c);g.fillCircle(35,67,20);
    g.generateTexture('terminal',70,120);g.destroy();
    this.scene.start('Menu');
  }
}
