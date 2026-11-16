import * as pc from 'playcanvas';
import '../style.css';
import {ProximityTrigger} from './game/interaction/ProximityTrigger';
import {ColorCircuit,WIRE_COLORS,type WireColor} from './game/education/ColorCircuit';
import {HeroMotor,type HeroIntent} from './game/character/HeroMotor';
import {AnimatedHero} from './game/character/AnimatedHero';
import {PhysicalKeyboard} from './game/input/PhysicalKeyboard';
import {TouchController} from './game/input/TouchController';
import {ForestWorld} from './game/world/ForestWorld';
import {SynthSoundtrack} from './game/audio/SynthSoundtrack';

function el<T extends HTMLElement>(id:string):T{
  const found=document.getElementById(id);
  if(!found)throw new Error('Missing element '+id);
  return found as T;
}
const canvas=el<HTMLCanvasElement>('game');
const objective=el<HTMLElement>('objective');
const progress=el<HTMLElement>('progress');
const menu=el<HTMLElement>('menu');
const puzzlePanel=el<HTMLElement>('puzzle');
const victory=el<HTMLElement>('win');
const feedback=el<HTMLElement>('feedback');
const story=el<HTMLElement>('story');
const wires=el<HTMLElement>('wires');
const sockets=el<HTMLElement>('sockets');
const circuitProgress=el<HTMLElement>('circuit-progress');

const app=new pc.Application(canvas);
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.scene.ambientLight=new pc.Color(.65,.72,.81);
const camera=new pc.Entity('follow-camera');
camera.addComponent('camera',{clearColor:new pc.Color(.54,.77,.91),nearClip:.15,farClip:125,fov:56});
app.root.addChild(camera);
camera.setPosition(0,6.2,18);
camera.lookAt(0,1,0);
const sun=new pc.Entity('sun');
sun.addComponent('light',{type:'directional',intensity:1.8,color:new pc.Color(1,.91,.72),castShadows:false});
sun.setEulerAngles(52,35,0);app.root.addChild(sun);
const fill=new pc.Entity('fill');
fill.addComponent('light',{type:'omni',intensity:.38,range:25,color:new pc.Color(.61,.83,1)});
fill.setPosition(0,6,-2);app.root.addChild(fill);

const world=new ForestWorld(app);
const hero=new AnimatedHero(app);
const motor=new HeroMotor();
motor.reset(0,9);
const keyboard=new PhysicalKeyboard();
const touch=new TouchController(el('touch'));
const audio=new SynthSoundtrack();
const trigger=new ProximityTrigger('energy-gate',world.stationX,world.stationZ,2.5,3.45,.3);
const circuit=new ColorCircuit();
let selected:WireColor|null=null;
let started=false;
let puzzleOpen=false;
let finished=false;
let elapsed=0;
let storyTimer:number|null=null;

function announce(message:string,duration=3900):void{
  if(storyTimer!==null)window.clearTimeout(storyTimer);
  story.textContent=message;story.classList.add('visible');
  storyTimer=window.setTimeout(()=>{story.classList.remove('visible');storyTimer=null;},duration);
}
function speak(message:string):void{
  if(!('speechSynthesis' in window))return;
  try{
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(message);
    u.lang='ru-RU';u.rate=.92;u.pitch=1;u.volume=.7;
    window.speechSynthesis.speak(u);
  }catch{/* voice is optional */}
}
const labelOf=(color:WireColor):string=>color==='red'?'🔴 Красный':color==='yellow'?'🟡 Жёлтый':'🔵 Синий';

function renderCircuit():void{
  wires.replaceChildren();sockets.replaceChildren();
  for(const color of WIRE_COLORS){
    const b=document.createElement('button');
    b.type='button';b.dataset.color=color;b.className='wire';
    b.textContent=circuit.isConnected(color)?'✓ '+labelOf(color):labelOf(color);
    if(selected===color)b.classList.add('selected');
    if(circuit.isConnected(color))b.classList.add('connected');
    b.disabled=circuit.isConnected(color);
    b.addEventListener('click',()=>{
      selected=color;
      feedback.textContent='А теперь найди такой же цвет справа!';
      renderCircuit();
    });
    wires.append(b);
  }
  for(const color of ['yellow','red','blue'] as WireColor[]){
    const b=document.createElement('button');
    b.type='button';b.dataset.color=color;b.className='wire';
    b.textContent=circuit.isConnected(color)?'✓ Подключено':labelOf(color);
    if(circuit.isConnected(color))b.classList.add('connected');
    b.disabled=circuit.isConnected(color);
    b.addEventListener('click',()=>{
      if(!selected){feedback.textContent='Сначала выбери провод слева!';return;}
      const result=circuit.connect(selected,color);
      feedback.textContent=result.message;
      audio.effect(result.correct?'correct':'wrong');
      if(result.correct)selected=null;
      renderCircuit();
      if(result.completed)finishCircuit();
    });
    sockets.append(b);
  }
  circuitProgress.textContent='Подключено '+circuit.connected+' из 3';
}
function openCircuit():void{
  if(puzzleOpen||finished||circuit.completed)return;
  puzzleOpen=true;keyboard.clear();selected=null;
  feedback.textContent='Найди одинаковые цвета!';
  renderCircuit();puzzlePanel.classList.remove('hidden');
  announce('Энергомост выключен! Соедини три провода.');
  speak('Перед нами энергомост! Выбирай провод слева и подходящий разъём справа.');
}
function finishCircuit():void{
  world.openGate();trigger.close(true);
  objective.textContent='Собери три энергоячейки';
  audio.effect('victory');
  announce('Отлично! Ворота раздвигаются и открывают новый путь!',5500);
  speak('Ты справился! Ворота открылись. Найди три энергетических кристалла.');
  window.setTimeout(()=>{puzzlePanel.classList.add('hidden');puzzleOpen=false;},1050);
}
el<HTMLButtonElement>('hint').addEventListener('click',()=>{
  feedback.textContent='Выбирай один цвет слева и точно такой же цвет справа.';
  speak('Посмотри на цвета! Найди пару одного цвета.');
});
el<HTMLButtonElement>('cancel').addEventListener('click',()=>{
  puzzlePanel.classList.add('hidden');puzzleOpen=false;selected=null;
  trigger.close(false);
  announce('К станции можно вернуться позже.');
});
el<HTMLButtonElement>('start').addEventListener('click',()=>{
  if(started)return;
  started=true;menu.classList.add('hidden');
  void audio.start().catch(()=>{/* audio may be restricted by browser */});
  announce('Блю Коп готов! Иди к светящемуся реактору в лесу.',5000);
  speak('Вперёд, герой! Нам нужно включить энергомост. Подойди к светящейся станции.');
  app.start();
});
el<HTMLButtonElement>('replay').addEventListener('click',()=>window.location.reload());
let muted=false;
el<HTMLButtonElement>('mute').addEventListener('click',()=>{
  muted=!muted;audio.setEnabled(!muted);
  el<HTMLButtonElement>('mute').textContent=muted?'♪':'♫';
  el<HTMLButtonElement>('mute').setAttribute('aria-label',muted?'Включить музыку':'Выключить музыку');
});
// Licensed GLB models can be enabled later without changing the motor/controller.
if(import.meta.env.VITE_ENABLE_CHARACTER_GLB==='true')void hero.loadLicensedAssets();

function mergeInputs(a:HeroIntent,b:HeroIntent):HeroIntent{
  return {forward:a.forward||b.forward,back:a.back||b.back,left:a.left||b.left,
    right:a.right||b.right,jumpPressed:a.jumpPressed||b.jumpPressed,
    transformPressed:a.transformPressed||b.transformPressed};
}
app.on('update',(rawDt:number)=>{
  if(!started||finished)return;
  const dt=Math.min(.05,Math.max(0,rawDt));
  elapsed+=dt;
  const input=mergeInputs(keyboard.read(),touch.read());
  const wasTransforming=motor.pose.transforming;
  const oldForm=motor.pose.form;
  motor.update(dt,input,puzzleOpen);
  // The closed gate blocks the first path, without resetting earned progress.
  if(!world.gateOpen)motor.constrain(-8,8,-8.6,12);
  else motor.constrain(-8,8,-30,12);
  const pose=motor.pose;
  hero.update(pose,elapsed);
  if(!wasTransforming&&pose.transforming)audio.effect('transform');
  if(wasTransforming&&!pose.transforming&&oldForm!==pose.form){
    announce(pose.form==='vehicle'?'Трансформация завершена! Машина едет быстрее!':'Робот вернулся! Теперь можно прыгать.',2900);
  }
  const cp=camera.getPosition();
  const desiredY=pose.form==='vehicle'?5.1:6.2;
  const t=1-Math.exp(-dt*4.2);
  camera.setPosition(pc.math.lerp(cp.x,pose.x,t),pc.math.lerp(cp.y,desiredY,t),pc.math.lerp(cp.z,pose.z+9.7,t));
  camera.lookAt(pose.x,pose.form==='vehicle'?.7:1.5,pose.z-2.1);
  world.update(elapsed,dt);
  if(trigger.update(pose.x,pose.z,dt,!puzzleOpen&&pose.grounded&&!pose.transforming))openCircuit();
  const found=world.collect(pose.x,pose.z);
  if(found){
    audio.effect('pickup');
    progress.textContent='⚡ '+world.collectedCount+' / 3';
    announce('Кристалл найден! Уже '+world.collectedCount+' из 3.',2800);
    if(world.completed){
      objective.textContent='Доберись до светящегося портала!';
      speak('Отлично! Все три кристалла собраны. Найди сияющий портал.');
    }
  }
  if(world.isAtPortal(pose.x,pose.z)){
    finished=true;victory.classList.remove('hidden');
    audio.effect('victory');
    speak('Миссия выполнена! Ты помог Технолесу. Молодец!');
  }
});
window.addEventListener('resize',()=>app.resizeCanvas());
