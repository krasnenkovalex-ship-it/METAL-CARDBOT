export interface PointXZ {x:number;z:number}
export interface RectXZ {minX:number;maxX:number;minZ:number;maxZ:number}
export interface PathArea extends RectXZ {id:string;kind:'trail'|'junction'|'bridge'|'secret'}
export type Solid =
  | {id:string;kind:'tree'|'rock';x:number;z:number;radius:number}
  | {id:string;kind:'wall'|'post';bounds:RectXZ};
export interface CheckpointDef {id:string;rank:number;at:PointXZ;radius:number;needsGate?:boolean}

export const TECH_FOREST = {
  start:{x:0,z:9},
  station:{x:0,z:-1},
  portal:{x:0,z:-29},
  gate:{minX:-2.65,maxX:2.65,minZ:-10.35,maxZ:-9.65},
  water:{minX:-10,maxX:10,minZ:-20.05,maxZ:-16.55},
  paths:[
    {id:'arrival',kind:'trail',minX:-3.6,maxX:3.6,minZ:-10.9,maxZ:19},
    {id:'first-choice',kind:'junction',minX:-6.8,maxX:6.8,minZ:-13.3,maxZ:-10.5},
    {id:'west-river',kind:'bridge',minX:-6.8,maxX:-2.1,minZ:-21.0,maxZ:-12.5},
    {id:'east-river',kind:'bridge',minX:2.1,maxX:6.8,minZ:-21.0,maxZ:-12.5},
    {id:'secret-grove',kind:'secret',minX:-9.1,maxX:-5.8,minZ:-15.4,maxZ:-13.2},
    {id:'river-exit',kind:'junction',minX:-6.8,maxX:6.8,minZ:-22.1,maxZ:-20.25},
    {id:'west-garden',kind:'trail',minX:-6.8,maxX:-2.1,minZ:-27.0,maxZ:-21.5},
    {id:'east-garden',kind:'trail',minX:2.1,maxX:6.8,minZ:-27.0,maxZ:-21.5},
    {id:'second-choice-exit',kind:'junction',minX:-6.8,maxX:6.8,minZ:-27.8,maxZ:-25.8},
    {id:'portal-lane',kind:'trail',minX:-2.5,maxX:2.5,minZ:-31,maxZ:-26.2}
  ] as PathArea[],
  bridges:[
    {minX:-6.8,maxX:-2.1,minZ:-20.05,maxZ:-16.55},
    {minX:2.1,maxX:6.8,minZ:-20.05,maxZ:-16.55}
  ] as RectXZ[],
  solids:[
    {id:'reactor',kind:'rock',x:0,z:-1,radius:1.06},
    {id:'arrival-tree',kind:'tree',x:-2.8,z:5.6,radius:.42},
    {id:'arrival-rock',kind:'rock',x:2.75,z:-5.6,radius:.42},
    {id:'west-tree',kind:'tree',x:-5.9,z:-16.2,radius:.36},
    {id:'east-rock',kind:'rock',x:5.75,z:-14.7,radius:.42},
    {id:'west-garden-rock',kind:'rock',x:-5.8,z:-23.4,radius:.48},
    {id:'east-garden-tree',kind:'tree',x:5.75,z:-24.1,radius:.38},
    {id:'first-island',kind:'wall',bounds:{minX:-2.1,maxX:2.1,minZ:-20.2,maxZ:-13.3}},
    {id:'second-island',kind:'wall',bounds:{minX:-2.1,maxX:2.1,minZ:-25.8,maxZ:-22.1}},
    {id:'gate-west-post',kind:'post',bounds:{minX:-3.6,maxX:-2.6,minZ:-10.55,maxZ:-9.45}},
    {id:'gate-east-post',kind:'post',bounds:{minX:2.6,maxX:3.6,minZ:-10.55,maxZ:-9.45}}
  ] as Solid[],
  checkpoints:[
    {id:'start',rank:0,at:{x:0,z:9},radius:1.5},
    {id:'gate',rank:1,at:{x:0,z:-11.8},radius:1.7,needsGate:true},
    {id:'west-bank',rank:2,at:{x:-4.45,z:-21.0},radius:1.5,needsGate:true},
    {id:'east-bank',rank:2,at:{x:4.45,z:-21.0},radius:1.5,needsGate:true},
    {id:'portal-approach',rank:3,at:{x:0,z:-27.1},radius:1.5,needsGate:true}
  ] as CheckpointDef[],
  secret:{x:-8.1,z:-14.2}
} as const;

export const ROUTES = {
  west:[{x:0,z:9},{x:0,z:1},{x:2.25,z:1},{x:2.25,z:-3},{x:0,z:-4},{x:0,z:-9},{x:0,z:-11.8},{x:-4.2,z:-12},{x:-4.2,z:-18.2},{x:-4.2,z:-21},{x:0,z:-21.2},{x:-4.2,z:-21.2},{x:-4.2,z:-23},{x:-4.2,z:-26.4},{x:0,z:-27},{x:0,z:-29}],
  east:[{x:0,z:9},{x:0,z:1},{x:2.25,z:1},{x:2.25,z:-3},{x:0,z:-4},{x:0,z:-9},{x:0,z:-11.8},{x:4.2,z:-12},{x:4.2,z:-18.2},{x:4.2,z:-21},{x:0,z:-21.2},{x:4.2,z:-21.2},{x:4.2,z:-23},{x:4.2,z:-26.4},{x:0,z:-27},{x:0,z:-29}]
} satisfies Record<string,PointXZ[]>;
