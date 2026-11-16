import * as pc from 'playcanvas';
import type {WireColor} from '../education/ColorCircuit';
import type {HeroForm} from '../character/HeroMotor';
import {TECH_FOREST,type PointXZ,type RectXZ,type Solid} from './TechForestLayout';
import {MazeCollision,type DynamicBlocker} from './MazeCollision';
import {CheckpointSystem} from './CheckpointSystem';

type Shape='box'|'sphere'|'cone'|'cylinder';
type P=[number,number,number];

/** Rendering and state for one authored, physically navigable forest episode. */
export class ForestWorld {
  readonly stationX=TECH_FOREST.station.x;
  readonly stationZ=TECH_FOREST.station.z;
  readonly portalZ=TECH_FOREST.portal.z;
  private readonly root=new pc.Entity('TECH_FOREST_level_02');
  private readonly mats=new Map<string,pc.StandardMaterial>();
  private readonly maze=new MazeCollision();
  private readonly checkpoints=new CheckpointSystem();
  private readonly core:pc.Entity;
  private readonly portalCore:pc.Entity;
  private readonly leftDoor:pc.Entity;
  private readonly rightDoor:pc.Entity;
  private readonly portalParts:pc.Entity[]=[];
  private readonly powerLines=new Map<WireColor,[pc.Entity,pc.Entity]>();
  private readonly bridgePieces:pc.Entity[]=[];
  private readonly checkpointLights=new Map<string,pc.Entity>();
  private readonly crystals:{root:pc.Entity;x:number;z:number;collected:boolean}[]=[];
  private readonly secret:pc.Entity;
  private readonly guide:pc.Entity;
  private rotor!:pc.Entity;
  private openValue=0;
  private openTarget=false;
  private bridgeValue=0;
  private bridgeTarget=false;
  private pulse=0;
  private secretTaken=false;

  constructor(private readonly app:pc.Application){
    app.root.addChild(this.root);
    const palette:Record<string,P>={
      ground:[.13,.36,.24],trail:[.54,.44,.30],trailAlt:[.42,.34,.25],
      bark:[.27,.18,.11],barklight:[.43,.29,.18],pine:[.11,.34,.26],
      moss:[.27,.59,.34],leaf:[.47,.74,.39],gold:[.94,.65,.19],
      stone:[.49,.57,.62],rock:[.33,.39,.45],steel:[.20,.31,.42],
      blue:[.07,.29,.77],deep:[.08,.19,.30],cyan:[.08,.89,.97],
      electricBlue:[.08,.40,1],orange:[1,.50,.17],yellow:[1,.83,.12],
      violet:[.48,.31,.80],red:[.91,.31,.29],white:[.90,.96,1]
    };
    for(const [key,rgb] of Object.entries(palette)){
      const m=new pc.StandardMaterial();
      m.diffuse=new pc.Color(...rgb);
      m.gloss=key==='steel'?.75:.42;
      m.metalness=key==='steel'||key==='blue'?.55:.04;
      if(['cyan','electricBlue','orange','gold','red','yellow'].includes(key)){
        m.emissive=new pc.Color(...rgb);
        m.emissiveIntensity=key==='cyan'?2:key==='electricBlue'||key==='red'||key==='yellow'?1.4:.34;
      }
      m.update();this.mats.set(key,m);
    }
    const grain=this.makeTerrainGrain();
    for(const [key,tiling] of [['ground',new pc.Vec2(16,26)],['trail',new pc.Vec2(2,6)],['trailAlt',new pc.Vec2(2,4)]] as const){
      const material=this.mats.get(key)!;
      material.diffuseMap=grain;material.diffuseMapTiling=tiling;material.gloss=.14;material.update();
    }
    this.app.scene.ambientLight=new pc.Color(.47,.55,.64);
    this.block('forest-ground','box','ground',[0,-.47,-9],[54,.85,82]);
    this.buildPaths();
    this.buildForestWalls();
    this.buildSolids();
    this.buildScenery();
    this.buildLandmarks();
    this.buildBridges();
    this.buildCheckpoints();

    this.block('reactor-plinth','cylinder','stone',[0,.32,-1],[2.55,.57,2.55]);
    this.block('reactor-inlay','cylinder','steel',[0,.65,-1],[2.12,.18,2.12]);
    this.core=this.block('reactor-core','sphere','cyan',[0,1.55,-1],[.86,.86,.86]);
    for(let n=0;n<8;n++){
      const angle=n*Math.PI/4;
      this.block('reactor-node-'+n,'sphere',n%2?'orange':'cyan',
        [Math.cos(angle)*1.24,1.26,-1+Math.sin(angle)*1.24],[.19,.19,.19]);
    }
    for(const [index,color] of (['red','yellow','blue'] as WireColor[]).entries()){
      const x=(index-1)*.58,glow=color==='blue'?'electricBlue':color;
      this.block('conduit-shell-'+color,'box','steel',[x,.015,-5.9],[.18,.08,6.5]);
      const line=this.block('powered-conduit-'+color,'box',glow,[x,.065,-5.9],[.10,.04,6.48]);
      const signal=this.block('gate-signal-'+color,'sphere',glow,[x*2.35,2.77,-9.66],[.24,.24,.24]);
      line.enabled=false;signal.enabled=false;this.powerLines.set(color,[line,signal]);
    }
    this.block('gate-west-post','box','stone',[-3.1,1.72,-10],[1,3.6,1.1]);
    this.block('gate-east-post','box','stone',[3.1,1.72,-10],[1,3.6,1.1]);
    this.block('gate-arch','box','gold',[0,3.48,-10],[7.15,.57,1.15]);
    this.block('gate-light','box','cyan',[0,3.14,-10],[5.3,.12,.25]);
    this.leftDoor=this.block('left-locked-gate','box','blue',[-1.38,1.45,-10],[2.73,2.91,.46]);
    this.rightDoor=this.block('right-locked-gate','box','blue',[1.38,1.45,-10],[2.73,2.91,.46]);

    for(const [i,x,z] of [[0,0,-12],[1,0,-21.2],[2,0,-27.1]] as const){
      const c=new pc.Entity('energy-cell-'+i);this.root.addChild(c);c.setPosition(x,.98,z);
      this.part(c,'outer-crystal','sphere','gold',[0,0,0],[.48,.67,.48]);
      this.part(c,'inner-crystal','sphere','cyan',[0,0,0],[.23,.49,.23]);
      this.crystals.push({root:c,x,z,collected:false});
    }
    this.secret=new pc.Entity('secret-star');this.root.addChild(this.secret);
    this.secret.setPosition(TECH_FOREST.secret.x,1.15,TECH_FOREST.secret.z);
    this.part(this.secret,'star-core','sphere','gold',[0,0,0],[.48,.48,.48]);
    for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5;
      this.part(this.secret,'star-ray-'+i,'cone','yellow',
        [Math.cos(angle)*.40,Math.sin(angle)*.40,0],[.19,.44,.19],[0,0,-angle*180/Math.PI-90]);
    }

    this.block('portal-floor','cylinder','steel',[0,.07,this.portalZ],[3,.27,3]);
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2;
      this.portalParts.push(this.block('portal-ring-'+i,'sphere','cyan',
        [Math.cos(a)*1.55,2.12+Math.sin(a)*1.55,this.portalZ],[.40,.40,.40]));
    }
    this.portalCore=this.block('portal-core','sphere','violet',[0,2.05,this.portalZ],[1.52,1.52,.16]);
    this.block('finish-marker','cone','gold',[0,4.12,this.portalZ],[.58,1.1,.58]);
    this.guide=this.block('next-goal-beacon','sphere','cyan',[0,3.3,-1],[.34,.34,.34]);
  }
  private part(parent:pc.Entity,name:string,type:Shape,mat:string,pos:P,scale:P,rotation?:P):pc.Entity{
    const e=new pc.Entity(name);e.addComponent('render',{type});
    if(e.render){e.render.material=this.mats.get(mat)!;e.render.castShadows=false;}
    e.setLocalPosition(...pos);e.setLocalScale(...scale);
    if(rotation)e.setLocalEulerAngles(...rotation);
    parent.addChild(e);return e;
  }
  private makeTerrainGrain():pc.Texture{
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
    const context=canvas.getContext('2d')!;
    context.fillStyle='#eeeeea';context.fillRect(0,0,96,96);
    let seed=1947;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<900;i++){
      const light=175+Math.floor(random()*80);
      context.fillStyle=`rgba(${light},${light},${light},${.12+random()*.25})`;
      context.beginPath();context.arc(random()*96,random()*96,.3+random()*1.6,0,Math.PI*2);context.fill();
    }
    const texture=new pc.Texture(this.app.graphicsDevice,{width:96,height:96,mipmaps:true});
    texture.addressU=pc.ADDRESS_REPEAT;texture.addressV=pc.ADDRESS_REPEAT;
    texture.minFilter=pc.FILTER_LINEAR_MIPMAP_LINEAR;texture.magFilter=pc.FILTER_LINEAR;
    texture.setSource(canvas);return texture;
  }
  private block(name:string,type:Shape,mat:string,pos:P,scale:P,rotation?:P):pc.Entity{
    return this.part(this.root,name,type,mat,pos,scale,rotation);
  }
  private slab(name:string,rect:RectXZ,mat:string,height=-.035):void{
    this.block(name,'box',mat,[(rect.minX+rect.maxX)/2,height,(rect.minZ+rect.maxZ)/2],
      [rect.maxX-rect.minX,.07,rect.maxZ-rect.minZ]);
  }
  private buildPaths():void{
    for(const area of TECH_FOREST.paths){
      if(area.kind==='bridge'){
        this.slab(area.id+'-near',{...area,minZ:TECH_FOREST.water.maxZ},'trail');
        this.slab(area.id+'-far',{...area,maxZ:TECH_FOREST.water.minZ},'trail');
      }else this.slab(area.id,area,area.kind==='secret'?'trailAlt':'trail');
    }
    this.block('river','box','cyan',[0,-.29,-18.3],[20,.07,3.5]);
    for(const z of [-16.45,-20.15]){
      for(const x of [-8.3,0,8.3])this.block('river-bank-'+x+'-'+z,'box','rock',[x,-.08,z],[3.0,.24,.38]);
    }
    for(const [i,x,z,angle] of [[0,-2.1,-12,90],[1,2.1,-12,-90],[2,-2.1,-21.1,90],[3,2.1,-21.1,-90]] as const){
      this.block('route-arrow-'+i,'cone',i%2?'gold':'cyan',[x,.075,z],[.42,.08,.62],[0,0,angle]);
    }
  }
  private buildForestWalls():void{
    const walls:[string,P,P][]=[
      ['arrival-west',[-3.85,.45,4.5],[.4,.9,29]],['arrival-east',[3.85,.45,4.5],[.4,.9,29]],
      ['fork-west',[-7.05,.45,-17],[.4,.9,9]],['fork-east',[7.05,.45,-17],[.4,.9,9]],
      ['garden-west',[-7.05,.45,-24.5],[.4,.9,6]],['garden-east',[7.05,.45,-24.5],[.4,.9,6]],
      ['final-west',[-2.75,.45,-29.4],[.4,.9,4]],['final-east',[2.75,.45,-29.4],[.4,.9,4]]
    ];
    for(const [name,pos,size] of walls){
      this.block('hedge-'+name,'box','pine',pos,size);
      this.block('hedge-leaves-'+name,'sphere','moss',[pos[0],pos[1]+.5,pos[2]],
        [size[0]+.35,.62,size[2]+.25]);
    }
  }
  private buildSolids():void{
    for(const solid of TECH_FOREST.solids){
      if(solid.kind==='post'||solid.id==='reactor')continue;
      if('bounds' in solid){
        const r=solid.bounds;
        this.block(solid.id,'box','rock',[(r.minX+r.maxX)/2,.77,(r.minZ+r.maxZ)/2],
          [r.maxX-r.minX,1.5,r.maxZ-r.minZ]);
        for(const x of [-1.25,1.25])this.makeTree(x,(r.minZ+r.maxZ)/2,2.8,'moss');
      }else if(solid.kind==='tree')this.makeTree(solid.x,solid.z,2.9,'pine');
      else this.block(solid.id,'sphere','rock',[solid.x,.30,solid.z],[solid.radius*2,.75,solid.radius*2]);
    }
  }
  private makeTree(x:number,z:number,height:number,leaf:string):void{
    const tree=new pc.Entity('tree');tree.setPosition(x,0,z);this.root.addChild(tree);
    this.part(tree,'trunk','cylinder','bark',[0,height*.32,0],[.33,height*.64,.33]);
    for(let j=0;j<3;j++)this.part(tree,'canopy-'+j,leaf==='leaf'?'sphere':'cone',leaf,
      [0,height*.48+j*.49,0],[2.0-j*.38,1.65-j*.16,2.0-j*.38]);
  }
  private buildScenery():void{
    let seed=74321;
    const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const coarse=window.matchMedia('(pointer:coarse)').matches;
    const treeCount=coarse?30:46;
    for(let i=0;i<treeCount;i++){
      const x=(i%2?-1:1)*(10.2+rng()*13),z=-34+rng()*49;
      this.makeTree(x,z,2.3+rng()*2.2,i%4?'pine':'leaf');
    }
    for(let i=0;i<45;i++){
      const x=(i%2?-1:1)*(3.1+(i*1.7)%12),z=-31+(i*5.31)%47;
      const scale=.10+(i%3)*.07;
      this.block('flower-'+i,'sphere',i%3?'violet':'gold',[x,.07,z],[scale,scale,scale]);
    }
    for(let i=0;i<(coarse?18:36);i++){
      const x=(i%2?-1:1)*(8.4+rng()*15),z=-32+rng()*49;
      const size=.35+rng()*.45;
      this.block('forest-shrub-'+i,'sphere',i%4?'moss':'leaf',[x,.18,z],[size,.35,size*1.2]);
    }
    for(let i=0;i<(coarse?12:24);i++){
      const x=(i%2?-1:1)*(7.5+rng()*12),z=-30+rng()*46;
      this.block('firefly-'+i,'sphere','cyan',[x,.8+rng()*2.5,z],[.08,.08,.08]);
    }
  }
  private buildLandmarks():void{
    this.block('golden-tree-trunk','cylinder','barklight',[-6.5,2.1,6.5],[.85,4.2,.85]);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      this.block('golden-crown-'+i,'sphere','orange',
        [-6.5+Math.cos(a)*1.4,4.35,6.5+Math.sin(a)*1.4],[2.2,1.7,2.2]);
    }
    this.block('violet-spire','cone','violet',[6,2.5,-1],[2.2,5,2.2]);
    this.block('violet-spire-light','sphere','cyan',[6,5.2,-1],[.55,.55,.55]);
    this.block('bridge-beacon','cone','gold',[-8.1,2.1,-18],[1.4,4.2,1.4]);
    this.block('bridge-beacon-cap','sphere','cyan',[-8.1,4.35,-18],[.48,.48,.48]);
    this.rotor=new pc.Entity('bridge-beacon-rotor');this.rotor.setPosition(-8.1,3.25,-17.15);this.root.addChild(this.rotor);
    for(let i=0;i<4;i++)this.part(this.rotor,'rotor-blade-'+i,'box','gold',[0,0,0],[.16,1.9,.13],[0,0,i*45]);
  }
  private buildBridges():void{
    for(const [side,x] of [['west',-4.45],['east',4.45]] as const){
      for(let i=0;i<8;i++){
        const plank=this.block(side+'-bridge-plank-'+i,'box','barklight',
          [x,side==='east'?-.82:.03,-16.77-i*.44],[4.5,.18,.48]);
        if(side==='east')this.bridgePieces.push(plank);
      }
      for(const rail of [-2.25,2.25]){
        const support=this.block(side+'-bridge-rail-'+rail,'box','gold',
          [x+rail,side==='east'?-.67:.18,-18.3],[.13,.16,3.6]);
        if(side==='east')this.bridgePieces.push(support);
      }
    }
  }
  private buildCheckpoints():void{
    for(const point of TECH_FOREST.checkpoints){
      this.block('checkpoint-ring-'+point.id,'cylinder','steel',
        [point.at.x,.06,point.at.z],[1.1,.05,1.1]);
      const light=this.block('checkpoint-light-'+point.id,'sphere','cyan',
        [point.at.x,.12,point.at.z],[.26,.10,.26]);
      light.enabled=point.rank===0;this.checkpointLights.set(point.id,light);
    }
  }
  get gateOpen():boolean{return this.openTarget;}
  get gatePassable():boolean{return this.openValue>.82;}
  get bridgePassable():boolean{return this.bridgeValue>.84;}
  get collectedCount():number{return this.crystals.filter(c=>c.collected).length;}
  get completed():boolean{return this.collectedCount===this.crystals.length;}
  get secretFound():boolean{return this.secretTaken;}
  get checkpoint():string{return this.checkpoints.id;}
  openGate():void{this.openTarget=true;this.setGuide({x:0,z:-11.8});}
  requestBridge(x:number,z:number):boolean{
    if(this.bridgeTarget||x<2.1||z<-16.6||z>-14.2)return false;
    this.bridgeTarget=true;return true;
  }
  energizeWire(color:WireColor):void{
    for(const part of this.powerLines.get(color)??[])part.enabled=true;
  }
  resolveMovement(from:PointXZ,to:PointXZ,form:HeroForm):PointXZ{
    return this.maze.move(from,to,form,this.gatePassable,this.bridgePassable);
  }
  setDynamicBlockers(blockers:readonly DynamicBlocker[]):void{this.maze.setDynamicBlockers(blockers);}
  removeDynamicBlocker(id:number):void{this.maze.removeDynamicBlocker(id);}
  canTransformAt(p:PointXZ,form:HeroForm):boolean{
    return this.maze.canOccupy(p,this.maze.radius(form),this.gatePassable,this.bridgePassable);
  }
  clipCamera(from:PointXZ,to:PointXZ):PointXZ{
    // The raised door still has a solid arch above the player. Keep the camera
    // on the hero's side of the entire gate frame even after the passage opens.
    return this.maze.clipCamera(from,to,false,this.bridgePassable);
  }
  recoverIfUnsafe(p:PointXZ,y:number,form:HeroForm):PointXZ|null{
    return this.checkpoints.recoverIfUnsafe(p,y,form,this.maze,this.gatePassable,this.bridgePassable);
  }
  setChapterAnchor(p:PointXZ):void{this.checkpoints.setChapterAnchor(p);}
  visitCheckpoint(p:PointXZ):string|null{
    const id=this.checkpoints.visit(p,this.gatePassable);
    if(id)this.checkpointLights.get(id)!.enabled=true;
    return id;
  }
  collect(x:number,z:number):number{
    if(!this.openTarget)return 0;
    let received=0;
    for(const crystal of this.crystals){
      if(!crystal.collected&&Math.hypot(x-crystal.x,z-crystal.z)<1.1){
        crystal.collected=true;crystal.root.enabled=false;received++;
      }
    }
    if(received){
      const next=this.crystals.find(c=>!c.collected);
      this.setGuide(next?{x:next.x,z:next.z}:TECH_FOREST.portal);
      if(!next&&this.portalCore.render){this.portalCore.render.material=this.mats.get('cyan')!;}
    }
    return received;
  }
  collectSecret(x:number,z:number):boolean{
    if(this.secretTaken||Math.hypot(x-TECH_FOREST.secret.x,z-TECH_FOREST.secret.z)>1.05)return false;
    this.secretTaken=true;this.secret.enabled=false;return true;
  }
  isAtPortal(x:number,z:number):boolean{
    return this.completed&&Math.hypot(x,z-this.portalZ)<2.2;
  }
  hint():string{
    if(!this.openTarget)return 'Ищи фиолетовую башню и сияющий реактор.';
    if(this.collectedCount===0)return 'За воротами выбери левую или правую тропу.';
    if(this.collectedCount===1)return 'Две тропы ведут через реку. Мост справа поднимется сам.';
    return this.completed?'Сияющий портал уже близко!':'Ищи следующий сияющий кристалл у развилки.';
  }
  setChapterLook(chapter:number):void{
    const looks:[P,P,P,P][]=[
      [[.11,.31,.23],[.12,.34,.29],[.29,.51,.32],[.51,.42,.30]],
      [[.11,.35,.30],[.10,.38,.34],[.36,.65,.42],[.54,.44,.31]],
      [[.13,.29,.33],[.12,.35,.42],[.30,.58,.61],[.49,.42,.36]],
      [[.23,.28,.31],[.26,.34,.38],[.59,.49,.56],[.57,.43,.35]],
      [[.18,.30,.29],[.16,.37,.38],[.42,.63,.53],[.56,.47,.36]],
      [[.30,.27,.20],[.33,.30,.22],[.62,.54,.31],[.59,.45,.29]],
      [[.12,.26,.32],[.12,.33,.40],[.35,.54,.63],[.50,.46,.38]],
      [[.20,.23,.34],[.24,.28,.43],[.51,.46,.65],[.50,.39,.36]],
      [[.30,.25,.25],[.34,.28,.30],[.65,.44,.41],[.58,.43,.36]],
      [[.15,.35,.30],[.14,.42,.38],[.51,.72,.51],[.56,.46,.32]]
    ];
    const [ground,pine,leaf,trail]=looks[Math.max(0,Math.min(9,chapter-1))];
    for(const [key,rgb] of [['ground',ground],['pine',pine],['leaf',leaf],['trail',trail]] as [string,P][]){
      const material=this.mats.get(key)!;material.diffuse=new pc.Color(...rgb);material.update();
    }
  }
  guideTo(p:PointXZ):void{this.setGuide(p);}
  private setGuide(p:PointXZ):void{this.guide.setPosition(p.x,3.3,p.z);}
  update(elapsed:number,dt:number):void{
    this.pulse+=dt;
    this.core.rotate(0,dt*80,0);
    const s=1+Math.sin(this.pulse*4)*.045;this.core.setLocalScale(s,s,s);
    this.openValue+=(Number(this.openTarget)-this.openValue)*Math.min(1,dt*2.4);
    this.leftDoor.setLocalPosition(-1.38-this.openValue*2.9,1.45,-10);
    this.rightDoor.setLocalPosition(1.38+this.openValue*2.9,1.45,-10);
    this.bridgeValue+=(Number(this.bridgeTarget)-this.bridgeValue)*Math.min(1,dt*2.1);
    for(const plank of this.bridgePieces){
      const p=plank.getLocalPosition();
      plank.setLocalPosition(p.x,(plank.name.includes('rail')?-.67:-.82)+this.bridgeValue*.85,p.z);
    }
    for(const [i,c] of this.crystals.entries()){
      if(c.collected)continue;
      c.root.setPosition(c.x,1+Math.sin(elapsed*2.7+i)*.17,c.z);
      c.root.rotate(0,dt*63,0);
    }
    if(!this.secretTaken){
      this.secret.setPosition(TECH_FOREST.secret.x,1.15+Math.sin(elapsed*3)*.14,TECH_FOREST.secret.z);
      this.secret.rotate(0,dt*55,0);
    }
    for(const [i,orb] of this.portalParts.entries()){
      const a=i/12*Math.PI*2+elapsed*.48;
      orb.setLocalPosition(Math.cos(a)*1.55,2.12+Math.sin(a)*1.55,this.portalZ);
    }
    this.guide.setLocalScale(s*.34,s*.34,s*.34);
    this.rotor.rotateLocal(0,0,dt*25);
  }
}
