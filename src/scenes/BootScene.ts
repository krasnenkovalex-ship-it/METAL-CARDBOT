import Phaser from 'phaser';
/** Original SVG artwork. All assets are shipped with the repo, no remote URLs. */
export class BootScene extends Phaser.Scene {
  constructor(){super('Boot');}
  preload(){
    this.load.svg('sky','assets/worlds/forest-sky.svg',{width:1920,height:1080});
    this.load.svg('forest-back','assets/worlds/forest-mid.svg',{width:2200,height:900});
    this.load.svg('forest-front','assets/worlds/forest-front.svg',{width:2200,height:900});
    this.load.svg('robot','assets/characters/hero-robot.svg',{width:200,height:280});
    this.load.svg('bluecop-robot','assets/characters/hero-robot.svg',{width:200,height:280});
    this.load.svg('bluecop-car','assets/characters/hero-car.svg',{width:300,height:150});
    this.load.svg('megatrucker-robot','assets/characters/megatrucker-robot.svg',{width:200,height:280});
    this.load.svg('megatrucker-car','assets/characters/megatrucker-car.svg',{width:300,height:150});
    this.load.svg('phoenixfire-robot','assets/characters/phoenixfire-robot.svg',{width:200,height:280});
    this.load.svg('phoenixfire-car','assets/characters/phoenixfire-car.svg',{width:300,height:150});
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
    g.generateTexture('terminal',70,120);g.clear();
    // Enemy sprites are original game art generated from geometry; no TV rips.
    g.fillStyle(0x24283b);g.fillRoundedRect(12,24,72,48,14);
    g.lineStyle(5,0xe36f8d);g.strokeRoundedRect(12,24,72,48,14);
    g.fillStyle(0xff4a68);g.fillCircle(36,45,10);g.fillCircle(61,45,10);
    g.fillStyle(0x111729);g.fillRect(16,68,20,14);g.fillRect(61,68,20,14);
    g.fillStyle(0xe2c5eb);g.fillTriangle(0,32,16,5,30,30);
    g.fillTriangle(65,30,80,5,96,32);
    g.generateTexture('enemy-crawler',96,90);g.clear();
    g.fillStyle(0x452453);g.fillEllipse(47,41,80,62);
    g.lineStyle(5,0xba6ff3);g.strokeEllipse(47,41,80,62);
    g.fillStyle(0xfb73ed);g.fillEllipse(47,41,42,21);
    g.fillStyle(0xffe7a2);g.fillCircle(46,42,8);
    g.fillStyle(0x432d5e);g.fillTriangle(6,37,2,79,36,56);
    g.fillTriangle(84,37,96,79,62,56);
    g.generateTexture('enemy-drone',96,95);g.clear();
    g.fillStyle(0x342038);g.fillRoundedRect(6,23,125,83,22);
    g.lineStyle(8,0xe76788);g.strokeRoundedRect(6,23,125,83,22);
    g.fillStyle(0xff8a54);g.fillRoundedRect(20,45,95,32,10);
    g.fillStyle(0xffe593);g.fillCircle(49,60,11);g.fillCircle(90,60,11);
    g.fillStyle(0x1b2039);g.fillRect(19,99,31,16);g.fillRect(90,99,27,16);
    g.fillStyle(0x952149);g.fillTriangle(15,26,37,0,50,29);g.fillTriangle(87,29,105,0,126,26);
    g.generateTexture('enemy-boss',137,120);g.destroy();
    this.scene.start('Menu');
  }
}
