import * as pc from 'playcanvas';
import '../style.css';
import { ProximityTrigger } from './game/interaction/ProximityTrigger';
import { firstPuzzle } from './game/education/levelOne';
import {HeroMotor} from './game/character/HeroMotor';
import {CharacterModels} from './game/character/CharacterModels';
import {PhysicalKeyboard} from './game/input/PhysicalKeyboard';

// Technical test scene only. Final hero, forest and puzzles require authored assets.
function requireElement<T extends HTMLElement>(selector:string):T{
  const result=document.querySelector<T>(selector);
  if(!result) throw new Error('Missing element: '+selector);
  return result;
}
const canvas=requireElement<HTMLCanvasElement>('#game');
const objective=requireElement<HTMLElement>('#objective');
const menu=requireElement<HTMLElement>('#menu');
const puzzleModal=requireElement<HTMLElement>('#puzzle');
const puzzleTitle=requireElement<HTMLElement>('#puzzle-title');
const question=requireElement<HTMLElement>('#question');
const answers=requireElement<HTMLElement>('#answers');
const feedback=requireElement<HTMLElement>('#feedback');

const app=new pc.Application(canvas);
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

const camera=new pc.Entity('camera');
camera.addComponent('camera',{clearColor:new pc.Color(.50,.73,.92),nearClip:.1,farClip:130});
app.root.addChild(camera);
camera.setPosition(0,7,14);
camera.lookAt(0,1,-2);

const sun=new pc.Entity('sun');
sun.addComponent('light',{type:'directional',intensity:1.6,color:new pc.Color(1,.95,.8),castShadows:false});
sun.setEulerAngles(45,35,0);app.root.addChild(sun);
const ambient=new pc.Entity('ambient-fill');
ambient.addComponent('light',{type:'omni',intensity:.85,range:40,color:new pc.Color(.65,.8,1)});
ambient.setPosition(0,8,3);app.root.addChild(ambient);

type PrimitiveKind='box'|'sphere'|'cylinder';
function make(name:string,kind:PrimitiveKind,rgb:[number,number,number],pos:[number,number,number],scale:[number,number,number]):pc.Entity{
  const entity=new pc.Entity(name);
  entity.addComponent('render',{type:kind});
  const material=new pc.StandardMaterial();
  material.diffuse=new pc.Color(...rgb);
  material.update();
  if(entity.render) entity.render.material=material;
  entity.setPosition(...pos);
  entity.setLocalScale(...scale);
  app.root.addChild(entity);
  return entity;
}

make('ground','box',[.24,.53,.34],[0,-.35,-2],[42,.6,42]);
for(let i=0;i<36;i++){
  const angle=i*2.399963;
  const radius=8+Math.sqrt(i)*1.55;
  const x=Math.cos(angle)*radius;
  const z=Math.sin(angle)*radius-3;
  if(Math.abs(x)<3 && z<7 && z>-15) continue;
  make('tree-trunk-'+i,'cylinder',[.38,.22,.12],[x,1.4,z],[.5,2.8,.5]);
  make('tree-crown-'+i,'sphere',[.19+(i%3)*.04,.44+(i%4)*.03,.26],[x,3.25,z],[2.2,2.4,2.2]);
}
const reactor=make('learning-station','sphere',[.15,.85,1],[0,1.4,-5],[1.25,1.25,1.25]);
make('station-base','cylinder',[.37,.54,.63],[0,.3,-5],[2.4,.6,2.4]);
make('gate-left','box',[.33,.48,.73],[-3,1.8,-12],[.8,3.6,.7]);
make('gate-right','box',[.33,.48,.73],[3,1.8,-12],[.8,3.6,.7]);
make('gate-top','box',[.35,.65,.83],[0,3.6,-12],[6.8,.7,.7]);
const gate=make('gate-lock','box',[.85,.28,.25],[0,1.55,-12],[5.3,3,.25]);
// This BLOCKOUT must be replaced with an original licensed 3D robot.
const hero=make('temporary-hero','box',[.18,.40,.92],[0,.9,4],[.95,1.8,.75]);
const heroHead=make('hero-head','box',[.70,.81,.93],[0,2.03,4],[.66,.55,.65]);
const carBlockout=make('temporary-car','box',[.13,.34,.82],[0,.65,4],[1.3,.8,2]);
carBlockout.enabled=false;
const heroAnchor=new pc.Entity('hero-anchor');
app.root.addChild(heroAnchor);
const models=new CharacterModels(app,heroAnchor);
const motor=new HeroMotor();
const keyboard=new PhysicalKeyboard();
let authoredModelsReady=false;
// The polished Blue Cop pair is supplied later in M1, after asset/rights review.
// Until then the engineering scene deliberately uses clearly labeled stand-ins.
void models.loadPair().then(ready=>{
  authoredModelsReady=ready;
  if(ready){
    hero.enabled=false;
    heroHead.enabled=false;
    carBlockout.enabled=false;
  }
});

const trigger=new ProximityTrigger('energy-gate-01',0,-5,2.4,3.2,.28);
let started=false;
let taskOpen=false;
let elapsed=0;

function openPuzzle():void{
  taskOpen=true;
  keyboard.clear();
  puzzleTitle.textContent=firstPuzzle.title;
  question.textContent=firstPuzzle.prompt;
  feedback.textContent='';
  answers.replaceChildren();
  for(const choice of firstPuzzle.choices){
    const button=document.createElement('button');
    button.type='button';
    button.textContent=choice.label;
    button.addEventListener('click',()=>{
      if(choice.value===firstPuzzle.answer){
        feedback.textContent=firstPuzzle.success;
        gate.enabled=false;
        reactor.setLocalScale(1.7,1.7,1.7);
        objective.textContent='Ворота открылись — путь свободен!';
        trigger.close(true);
        window.setTimeout(()=>{puzzleModal.classList.add('hidden');taskOpen=false;},800);
      }else{
        feedback.textContent=firstPuzzle.hint;
      }
    });
    answers.append(button);
  }
  puzzleModal.classList.remove('hidden');
}
requireElement<HTMLButtonElement>('#cancel').addEventListener('click',()=>{
  puzzleModal.classList.add('hidden');
  taskOpen=false;
  trigger.close(false);
});
requireElement<HTMLButtonElement>('#start').addEventListener('click',()=>{
  if(started)return;
  started=true;
  menu.classList.add('hidden');
  objective.textContent='Иди к голубому реактору';
  app.start();
});

app.on('update',(rawDt:number)=>{
  if(!started)return;
  const dt=Math.min(rawDt,.05);
  elapsed+=dt;
  const input=keyboard.read();
  motor.update(dt,input,taskOpen);
  const next=motor.pose;
  if(!taskOpen){
    if(trigger.status!=='complete' && next.z < -11 && Math.abs(next.x)<3.6){
      motor.constrain(-14,14,-11,14);
    }else{
      motor.constrain(-14,14,-17,14);
    }
  }
  const pose=motor.pose;
  models.apply(pose,elapsed);
  if(!authoredModelsReady){
    const isCar=pose.form==='vehicle';
    hero.enabled=!isCar;heroHead.enabled=!isCar;
    carBlockout.enabled=isCar;
    hero.setPosition(pose.x,pose.y,pose.z);
    heroHead.setPosition(pose.x,pose.y+1.13,pose.z);
    carBlockout.setPosition(pose.x,pose.y-.25,pose.z);
    const facing=pose.heading*180/Math.PI;
    hero.setEulerAngles(0,facing,0);
    heroHead.setEulerAngles(0,facing,0);
    carBlockout.setEulerAngles(0,facing,0);
  }
  if(trigger.update(pose.x,pose.z,dt,!taskOpen && pose.grounded && !pose.transforming))openPuzzle();
  const cp=camera.getPosition();
  const blend=Math.min(1,dt*4.5);
  camera.setPosition(
    cp.x+(pose.x-cp.x)*blend,
    7,
    cp.z+(pose.z+10-cp.z)*blend
  );
  camera.lookAt(pose.x,1.3,pose.z-2);
  reactor.rotate(0,dt*55,0);
});
