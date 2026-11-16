import * as pc from 'playcanvas';
type Shape='box'|'sphere'|'cone'|'cylinder';
type P=[number,number,number];
type Colored={material:pc.StandardMaterial; color:P};

export class ForestWorld {
 readonly stationX=0;
 readonly stationZ=-1;
 readonly portalZ=-29;
 private readonly root=new pc.Entity('TECH_FOREST_level_01');
 private readonly mats=new Map<string,Colored>();
 private readonly core:pc.Entity;
 private readonly leftDoor:pc.Entity;
 private readonly rightDoor:pc.Entity;
 private readonly portalParts:pc.Entity[]=[];
 private readonly crystals:{root:pc.Entity;x:number;z:number;collected:boolean}[]=[];
 private openValue=0;
 private openTarget=false;
 private pulse=0;
 constructor(private readonly app:pc.Application){
   app.root.addChild(this.root);
   const palette:Record<string,P>={
     ground:[.15,.38,.24],grass:[.24,.50,.26],moss:[.25,.63,.34],
     earth:[.36,.31,.22],sand:[.56,.44,.29],rock:[.33,.38,.43],
     bark:[.29,.18,.12],barklight:[.41,.27,.16],pine:[.12,.35,.25],
     lime:[.32,.65,.36],lightleaf:[.49,.78,.43],gold:[.91,.67,.25],
     stone:[.49,.57,.62],steel:[.20,.31,.42],blue:[.07,.29,.77],
     deep:[.08,.19,.30],cyan:[.08,.89,.97],orange:[1,.50,.17],
     violet:[.48,.31,.80],cloud:[.72,.83,.87],red:[.91,.31,.29],
     white:[.90,.96,1]
   };
   for(const [key,value] of Object.entries(palette)){
     const m=new pc.StandardMaterial();
     m.diffuse=new pc.Color(...value);
     m.gloss=key==='steel'?.75:.42;
     m.metalness=key==='steel'||key==='blue'?.55:.04;
     if(key==='cyan'||key==='orange'||key==='gold'){
       m.emissive=new pc.Color(...value);
       m.emissiveIntensity=key==='cyan'?2: .36;
     }
     m.update();
     this.mats.set(key,{material:m,color:value});
   }
   this.app.scene.ambientLight=new pc.Color(.47,.55,.64);
   this.block('ground','box','ground',[0,-.47,-8],[52,.85,78]);
   // Winding visual walkways indicate a main direction while leaving exploration open.
   for(let i=0;i<35;i++){
     const z=11-i*1.16;
     const sway=Math.sin(i*.31)*.43;
     this.block('stone-path-'+i,'box',i%3?'earth':'sand',[sway,-.031,z],[4.3,.06,1.05]);
   }
   this.makeTreeRows();
   this.makeRockAndFlowers();
   // Distant background objects add depth without affecting the collision route.
   for(let i=0;i<10;i++){
     const x=(i%2?-1:1)*(19+i*.83),z=-30+i*4.3;
     this.block('far-hill-'+i,'sphere',i%2?'pine':'moss',[x,-1.2,z],[13,8,12]);
   }
   // A visible reactor that automatically opens a puzzle when approached.
   this.block('reactor-plinth','cylinder','stone',[this.stationX,.32,this.stationZ],[2.55,.57,2.55]);
   this.block('reactor-inlay','cylinder','steel',[0,.65,this.stationZ],[2.12,.18,2.12]);
   this.core=this.block('reactor-core','sphere','cyan',[0,1.55,this.stationZ],[.86,.86,.86]);
   for(let n=0;n<8;n++){
     const angle=n*Math.PI/4;
     const x=Math.cos(angle)*1.24,z=this.stationZ+Math.sin(angle)*1.24;
     this.block('reactor-node-'+n,'sphere',n%2?'orange':'cyan',[x,1.26,z],[.19,.19,.19]);
   }
   this.block('gate-left-column','box','stone',[-3.1,1.72,-10],[1,3.6,1.1]);
   this.block('gate-right-column','box','stone',[3.1,1.72,-10],[1,3.6,1.1]);
   this.block('gate-arch','box','gold',[0,3.48,-10],[7.15,.57,1.15]);
   this.block('gate-light','box','cyan',[0,3.14,-10],[5.3,.12,.25]);
   this.leftDoor=this.block('left-locked-gate','box','blue',[-1.38,1.45,-10],[2.73,2.91,.46]);
   this.rightDoor=this.block('right-locked-gate','box','blue',[1.38,1.45,-10],[2.73,2.91,.46]);
   this.block('river','box','cyan',[0,-.23,-18],[48,.08,4.1]);
   this.block('river-bank-near','box','rock',[0,-.14,-15.9],[48,.2,.5]);
   this.block('river-bank-far','box','rock',[0,-.14,-20.1],[48,.2,.5]);
   for(let n=0;n<6;n++){
     this.block('bridge-plank-'+n,'box','barklight',[0,.03,-16.4-n*.62],[4.4,.18,.5]);
   }
   for(const [i,x,z] of [[0,0,-13],[1,-1.4,-20.4],[2,1.1,-25.1]] as const){
     const c=new pc.Entity('energy-cell-'+i);
     this.root.addChild(c);
     c.setPosition(x,.98,z);
     this.part(c,'outer-crystal','sphere','gold',[0,0,0],[.48,.67,.48]);
     this.part(c,'inner-crystal','sphere','cyan',[0,0,0],[.23,.49,.23]);
     this.crystals.push({root:c,x,z,collected:false});
   }
   this.block('portal-floor','cylinder','steel',[0,.07,this.portalZ],[3,.27,3]);
   for(let i=0;i<12;i++){
     const a=i/12*Math.PI*2;
     const ring=this.block('portal-ring-'+i,'sphere','cyan',[Math.cos(a)*1.55,2.12+Math.sin(a)*1.55,this.portalZ],[.40,.40,.40]);
     this.portalParts.push(ring);
   }
   this.block('portal-core','sphere','violet',[0,2.05,this.portalZ],[1.52,1.52,.16]);
   this.block('finish-marker','cone','gold',[0,4.12,this.portalZ],[.58,1.1,.58]);
 }
 private part(parent:pc.Entity,name:string,type:Shape,mat:string,pos:P,scale:P,rotation?:P):pc.Entity{
   const e=new pc.Entity(name); e.addComponent('render',{type});
   if(e.render)e.render.material=this.mats.get(mat)!.material;
   e.setLocalPosition(...pos);e.setLocalScale(...scale);
   if(rotation)e.setLocalEulerAngles(...rotation);
   parent.addChild(e);return e;
 }
 private block(name:string,type:Shape,mat:string,pos:P,scale:P,rotation?:P):pc.Entity{
   return this.part(this.root,name,type,mat,pos,scale,rotation);
 }
 private makeTreeRows(){
   let seed=74321;
   const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   for(let i=0;i<68;i++){
     const side=i%2?-1:1;
     const x=side*(5+rng()*16);
     const z=-33+rng()*52;
     const h=1.8+rng()*2.8;
     const tree=new pc.Entity('tree-'+i);
     tree.setPosition(x,0,z);this.root.addChild(tree);
     this.part(tree,'trunk','cylinder','bark',[0,h*.38,0],[.24,h*.76,.24]);
     if(i%4===0){
       this.part(tree,'leaf-sphere','sphere','lightleaf',[0,h,0],[2.4,2.15,2.4]);
       this.part(tree,'upper-leaf','sphere','moss',[.4,h+.8,0],[1.5,1.3,1.5]);
     }else{
       for(let j=0;j<3;j++){
         this.part(tree,'pine-layer-'+j,'cone',j===0?'pine':j===1?'lime':'moss',
           [0,h*.57+j*.54,0],[2.0-j*.47,2.4-j*.37,2.0-j*.47]);
       }
     }
   }
 }
 private makeRockAndFlowers(){
   for(let i=0;i<64;i++){
     const x=(i%2?-1:1)*(3.0+(i*1.7)%12);
     const z=-31+(i*5.31)%48;
     const sc=.10+(i%3)*.07;
     this.block('flower-'+i,'sphere',i%3===0?'gold':i%3===1?'violet':'white',[x,.07,z],[sc,sc,sc]);
     if(i%5===0)this.block('rock-'+i,'sphere','rock',[x+(i%2)*.8,.1,z+.4],[.6,.29,.44]);
   }
   for(let i=0;i<8;i++){
     const side=i%2?-1:1;
     this.block('trail-obelisk-'+i,'box','stone',[side*4.4,.6,8-i*4.1],[.38,1.2,.38]);
     this.block('trail-lamp-'+i,'sphere','orange',[side*4.4,1.29,8-i*4.1],[.30,.30,.30]);
   }
 }
 get gateOpen():boolean{return this.openTarget;}
 get collectedCount():number{return this.crystals.filter(c=>c.collected).length;}
 get completed():boolean{return this.collectedCount===this.crystals.length;}
 openGate():void{this.openTarget=true;}
 /** Call after movement. Returns number of newly collected energy cells. */
 collect(x:number,z:number):number{
   let received=0;
   if(!this.openTarget)return received;
   for(const crystal of this.crystals){
     if(!crystal.collected&&Math.hypot(x-crystal.x,z-crystal.z)<1.2){
       crystal.collected=true;crystal.root.enabled=false;received++;
     }
   }
   return received;
 }
 isAtPortal(x:number,z:number):boolean{
   return this.completed&&Math.hypot(x,z-this.portalZ)<2.2;
 }
 update(elapsed:number,dt:number):void{
   this.pulse+=dt;
   this.core.rotate(0,dt*80,0);
   const s=1+Math.sin(this.pulse*4)*.045;
   this.core.setLocalScale(s,s,s);
   const target=this.openTarget?1:0;
   this.openValue+= (target-this.openValue)*Math.min(1,dt*2.4);
   this.leftDoor.setLocalPosition(-1.38-this.openValue*2.9,1.45,-10);
   this.rightDoor.setLocalPosition(1.38+this.openValue*2.9,1.45,-10);
   for(const [i,c] of this.crystals.entries()){
     if(c.collected)continue;
     c.root.setPosition(c.x,1+Math.sin(elapsed*2.7+i)*.17,c.z);
     c.root.rotate(0,dt*63,0);
   }
   for(const [i,orb] of this.portalParts.entries()){
     const a=i/12*Math.PI*2+elapsed*.48;
     orb.setLocalPosition(Math.cos(a)*1.55,2.12+Math.sin(a)*1.55,this.portalZ);
   }
 }
}
