import type {EnemyKind} from '../systems/EnemyBrain';
export type RoundId=1|2|3|4|5;
export type Biome='forest'|'sky'|'factory'|'ice'|'storm';
export type WorldGimmick='spring'|'wind'|'conveyor'|'ice-slide'|'storm-pulse';
export interface EnemyPlacement {x:number;y:number;kind:EnemyKind}
export interface RoundDefinition {
 id:RoundId;name:string;subtitle:string;biome:Biome;gimmick:WorldGimmick;
 description:string;color:number;skyTint:number;backTint:number;frontTint:number;
 puzzleIds:readonly [string,string];enemies:readonly EnemyPlacement[];
 crystals:readonly (readonly [number,number])[];
 bossRequired:boolean;starColor:number;
}
export const ROUNDS:readonly RoundDefinition[]=[
 {id:1,name:'ТЕХНОЛЕС',subtitle:'Тайна энергомоста',biome:'forest',gimmick:'spring',
  description:'Найди мост, включи реактор и одолей лесных мехов.',color:0x5ce1b9,
  skyTint:0xffffff,backTint:0xffffff,frontTint:0xffffff,
  puzzleIds:['bridge','generator'],crystals:[[650,493],[1650,494],[2170,405],[3120,495]],
  enemies:[{x:1080,y:532,kind:'crawler'},{x:1570,y:505,kind:'drone'},
    {x:2060,y:528,kind:'hopper'},{x:2680,y:514,kind:'drone'},
    {x:3040,y:531,kind:'crawler'},{x:3350,y:495,kind:'sentinel'}],
  bossRequired:false,starColor:0xdfff84},
 {id:2,name:'НЕБЕСНАЯ ДОЛИНА',subtitle:'Загадки светлячков',biome:'sky',gimmick:'wind',
  description:'Летающие мехи, движущиеся острова и испытание памяти.',color:0xbca4ff,
  skyTint:0xccdbff,backTint:0xbec8ff,frontTint:0xc5d8ff,
  puzzleIds:['echo-memory','gear-lift'],crystals:[[670,490],[1630,489],[2170,397],[3120,481]],
  enemies:[{x:1060,y:532,kind:'charger'},{x:1510,y:492,kind:'drone'},
    {x:2020,y:531,kind:'hopper'},{x:2580,y:484,kind:'drone'},
    {x:3010,y:525,kind:'charger'},{x:3400,y:478,kind:'turret'}],
  bossRequired:false,starColor:0xffc7e8},
 {id:3,name:'ЗАВОД ШЕСТЕРЁН',subtitle:'Пробуждение гиганта',biome:'factory',gimmick:'conveyor',
  description:'Сломанные механизмы, ускорители и первый настоящий босс.',color:0xffc66e,
  skyTint:0xffd5bc,backTint:0xdcafbb,frontTint:0xe6bbad,
  puzzleIds:['gear-sequence','factory-path'],crystals:[[650,480],[1640,487],[2160,403],[3090,480]],
  enemies:[{x:1100,y:530,kind:'crawler'},{x:1550,y:491,kind:'turret'},
    {x:2050,y:527,kind:'charger'},{x:2600,y:494,kind:'hopper'},
    {x:3060,y:530,kind:'turret'},{x:3380,y:477,kind:'sentinel'}],
  bossRequired:true,starColor:0xffdc8d},
 {id:4,name:'ЛЕДЯНЫЕ ПЕЩЕРЫ',subtitle:'Хрустальный свет',biome:'ice',gimmick:'ice-slide',
  description:'Скользкие тропы, отражение света и мехи-прыгуны.',color:0x8ff8ff,
  skyTint:0xd0ecff,backTint:0xc8e3f9,frontTint:0xb4edec,
  puzzleIds:['ice-mirror','ice-memory'],crystals:[[640,493],[1650,488],[2190,397],[3120,487]],
  enemies:[{x:1080,y:520,kind:'hopper'},{x:1540,y:476,kind:'drone'},
    {x:2050,y:528,kind:'hopper'},{x:2620,y:490,kind:'charger'},
    {x:3090,y:524,kind:'drone'},{x:3390,y:478,kind:'turret'}],
  bossRequired:false,starColor:0xb8fbff},
 {id:5,name:'ГРОЗОВАЯ ЦИТАДЕЛЬ',subtitle:'Финальный энергощит',biome:'storm',gimmick:'storm-pulse',
  description:'Отремонтируй энергоцепь и победи главного стража.',color:0xfca8e5,
  skyTint:0xb9b3dc,backTint:0xa38bb9,frontTint:0xc4a9db,
  puzzleIds:['storm-circuit','final-code'],crystals:[[645,487],[1650,493],[2170,402],[3130,482]],
  enemies:[{x:1090,y:525,kind:'charger'},{x:1550,y:490,kind:'turret'},
    {x:2030,y:527,kind:'drone'},{x:2610,y:484,kind:'hopper'},
    {x:3050,y:527,kind:'charger'},{x:3380,y:477,kind:'sentinel'}],
  bossRequired:true,starColor:0xffa4e4}
] as const;
export const MAX_ROUNDS=5;
export function getRound(id:number):RoundDefinition{
 const round=ROUNDS.find(x=>x.id===id);
 if(!round)throw new RangeError('Unknown round: '+id);
 return round;
}
export function nextRound(id:RoundId):RoundId|null{
 return id===MAX_ROUNDS?null:(id+1) as RoundId;
}
export function canFinishRound(
 solved:ReadonlySet<string>,puzzleIds:readonly [string,string],gems:number,
 bossRequired:boolean,bossAlive:boolean
):boolean{
 return puzzleIds.every(id=>solved.has(id))&&gems>=4&&(!bossRequired||!bossAlive);
}
