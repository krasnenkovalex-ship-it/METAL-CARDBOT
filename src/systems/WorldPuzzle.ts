import Phaser from 'phaser';
import {audio} from './Audio';
import {CircuitState,RelayState,type PairColor} from './WorldPuzzleRules';

/** A puzzle controller living in the scrollable game world, not a full-screen quiz. */
export type PuzzleKind='circuit'|'relay';
/**
 * WorldPuzzle uses spatial wiring nodes and timed relays as part of the level.
 * Has no Phaser scene transition. Each solved node lights its own physical cable.
 */
export class WorldPuzzle {
 active=false;
 ready=false;
 id:string|null=null;
 private readonly items:Phaser.GameObjects.GameObject[]=[];
 private readonly handles:Phaser.Time.TimerEvent[]=[];
 private readonly wires:Phaser.GameObjects.Graphics[]=[];
 private readonly colors=[0xfa667c,0x59cbff,0xffd76a] as const;
 private readonly sockets:PairColor[]=[2,0,1];
 private readonly circuit=new CircuitState();
 private readonly relay=new RelayState();
 private status:Phaser.GameObjects.Text|null=null;
 readonly positions:{left:readonly [number,number][];right:readonly [number,number][]}={
  left:[],right:[]
 };
 constructor(private readonly scene:Phaser.Scene,private readonly onSolved:(id:string)=>void,
  private readonly onCancel:(id:string)=>void){}
 private track<T extends Phaser.GameObjects.GameObject>(object:T):T{
  this.items.push(object);return object;
 }
 private later(delay:number,cb:()=>void):void{
  const timer=this.scene.time.delayedCall(delay,cb);
  this.handles.push(timer);
 }
 private circle(x:number,y:number,color:number,r=29):Phaser.GameObjects.Arc{
  return this.track(this.scene.add.circle(x,y,r,color,.95).setStrokeStyle(4,0xffffff,.88)
    .setDepth(25).setInteractive({useHandCursor:true}));
 }
 start(id:'bridge'|'generator',centerX:number):void {
  if(this.active)return;
  this.active=true;this.ready=false;this.id=id;
  const y=372;
  this.track(this.scene.add.rectangle(centerX,y,640,310,0x0b2947,.88)
    .setStrokeStyle(5,0x7ce8ff,.88).setDepth(18));
  this.track(this.scene.add.rectangle(centerX,y-142,603,38,0x163f65,.96)
    .setStrokeStyle(2,0xffdc78).setDepth(20));
  this.track(this.scene.add.text(centerX,y-142,id==='bridge'?
    '⚡ СОЕДИНИ ОДИНАКОВЫЕ ЦВЕТА':'⭐ ЗАПОМНИ СИГНАЛЫ ГЕНЕРАТОРА',{
      fontFamily:'system-ui',fontSize:'19px',fontStyle:'bold',color:'#edfbff'
    }).setOrigin(.5).setDepth(22));
  this.status=this.track(this.scene.add.text(centerX,y+128,'',{
    fontFamily:'system-ui',fontSize:'16px',fontStyle:'bold',
    color:'#d3f6ff',stroke:'#122d4b',strokeThickness:3,align:'center'
  }).setOrigin(.5).setDepth(24));
  const cancel=this.track(this.scene.add.text(centerX+272,y-141,'×',{
    fontFamily:'system-ui',fontSize:'30px',fontStyle:'bold',color:'#fff2a1'
  }).setOrigin(.5).setDepth(28).setInteractive({useHandCursor:true}));
  cancel.on('pointerdown',()=>{
   if(!this.id)return;
   const what=this.id;
   this.close();
   this.onCancel(what);
  });
  if(id==='bridge')this.setupCircuit(centerX,y);
  else this.setupRelay(centerX,y);
 }
 private setupCircuit(x:number,y:number):void{
  const left:[[number,number],[number,number],[number,number]]=[
    [x-181,y-66],[x-181,y],[x-181,y+66]];
  const right:[[number,number],[number,number],[number,number]]=[
    [x+181,y-66],[x+181,y],[x+181,y+66]];
  (this.positions as {left:readonly [number,number][];right:readonly [number,number][]}).left=left;
  (this.positions as {left:readonly [number,number][];right:readonly [number,number][]}).right=right;
  const nodes:Phaser.GameObjects.Arc[]=[];
  for(let i=0;i<3;i++){
   const color=i as PairColor;
   const node=this.circle(left[i][0],left[i][1],this.colors[i],30);
   this.track(this.scene.add.text(left[i][0]-49,left[i][1],String(i+1),{
    fontFamily:'system-ui',fontSize:'16px',fontStyle:'bold',color:'#fff'
   }).setOrigin(.5).setDepth(23));
   node.on('pointerdown',()=>{
    this.circuit.select(color);
    nodes.forEach((b,index)=>b.setStrokeStyle(index===color?7:4,index===color?0xe7ff89:0xffffff));
    this.status?.setText('Теперь выбери такой же цвет справа!');
    audio.effect('task');
   });
   nodes.push(node);
  }
  for(let j=0;j<3;j++){
   const socket=this.sockets[j];
   const node=this.circle(right[j][0],right[j][1],this.colors[socket],31);
   node.on('pointerdown',()=>{
     const result=this.circuit.connect(socket);
     if(result==='none'){this.status?.setText('Сначала выбери провод слева!');return;}
     if(result==='wrong'){
       this.status?.setText('Не совпало. Найди такую же пару!');
       this.scene.tweens.add({targets:node,scale:1.12,duration:130,yoyo:true});
       return;
     }
     const source=this.circuit.connected.size;
     const i=socket;
     const graphic=this.track(this.scene.add.graphics().setDepth(21));
     graphic.lineStyle(13,this.colors[i],.93);
     graphic.beginPath();graphic.moveTo(left[i][0]+33,left[i][1]);
     graphic.lineTo(right[j][0]-34,right[j][1]);graphic.strokePath();
     this.wires.push(graphic);
     node.setAlpha(.48);nodes[i].setAlpha(.48);
     this.status?.setText('Энергия подключена: '+source+'/3');
     this.scene.cameras.main.flash(90,40,220,255,false);
     audio.effect('open');
     if(result==='complete')this.success();
   });
  }
  this.ready=true;
  this.status?.setText('Нажми на цвет слева, потом на такой же справа.');
 }
 private setupRelay(x:number,y:number):void{
  const positions:[[number,number],[number,number],[number,number]]=[
   [x-180,y+12],[x,y+12],[x+180,y+12]];
  (this.positions as {left:readonly [number,number][];right:readonly [number,number][]}).left=positions;
  (this.positions as {left:readonly [number,number][];right:readonly [number,number][]}).right=[];
  const pads=positions.map(([px,py],i)=>{
    const pad=this.circle(px,py,this.colors[i],48);
    const glow=this.track(this.scene.add.circle(px,py,52,0xffffff,0)
      .setStrokeStyle(4,0xffffff,.35).setDepth(24));
    pad.on('pointerdown',()=>{
      if(!this.ready)return;
      this.scene.tweens.add({targets:pad,scale:1.15,duration:110,yoyo:true});
      const result=this.relay.press(i as PairColor);
      if(result==='wrong'){
        this.status?.setText('Порядок другой. Смотри ещё раз!');
        this.ready=false;this.later(530,()=>this.playRelay(pads));return;
      }
      this.status?.setText('Запомнил! '+this.relay.progress+'/3');
      audio.effect('pickup');
      if(result==='complete')this.success();
    });
    return pad;
  });
  this.later(380,()=>this.playRelay(pads));
 }
 private playRelay(pads:Phaser.GameObjects.Arc[]):void{
  if(!this.active)return;
  this.ready=false;this.relay.reset();
  this.status?.setText('Смотри: какой огонёк загорается первым?');
  for(const [i,padIndex] of this.relay.order.entries()){
    this.later(450+i*610,()=>{
      if(!this.active)return;
      const pad=pads[padIndex];
      this.scene.tweens.add({targets:pad,scale:1.38,duration:200,yoyo:true});
      audio.effect('task');
    });
  }
  this.later(520+this.relay.order.length*610,()=>{
    if(this.active){this.ready=true;this.status?.setText('Повтори сигналы на живых кнопках!');}
  });
 }
 private success():void{
  if(!this.active||this.id===null)return;
  this.ready=false;
  this.status?.setText('★ ВЕРНО! МИР МЕНЯЕТСЯ!').setColor('#c9ff8c');
  this.scene.cameras.main.flash(230,105,255,165,false);
  audio.effect('win');
  const solved=this.id;
  this.later(650,()=>{this.close();this.onSolved(solved);});
 }
 close():void{
  this.active=false;this.ready=false;this.id=null;
  for(const timer of this.handles)timer.remove(false);
  this.handles.length=0;
  for(const item of this.items)item.destroy();
  this.items.length=0;this.wires.length=0;
  this.status=null;
 }
}
