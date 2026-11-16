import Phaser from 'phaser';
import './style.css';
import {BootScene} from './scenes/BootScene';
import {MenuScene} from './scenes/MenuScene';
import {PlayScene} from './scenes/PlayScene';
import {PuzzleScene} from './scenes/PuzzleScene';
import {WinScene} from './scenes/WinScene';

const game=new Phaser.Game({
  type:Phaser.AUTO,parent:'game',width:1280,height:720,
  backgroundColor:'#122c4d',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  render:{pixelArt:false,antialias:true},
  physics:{default:'arcade',arcade:{gravity:{x:0,y:1600},debug:false}},
  scene:[BootScene,MenuScene,PlayScene,PuzzleScene,WinScene]
});

if(import.meta.env.DEV)(window as Window & {__metal2dGame?:Phaser.Game}).__metal2dGame=game;
