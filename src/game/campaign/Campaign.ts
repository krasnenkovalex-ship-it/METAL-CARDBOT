import type {HeroForm} from '../character/HeroMotor';
import type {PointXZ} from '../world/TechForestLayout';

export type MissionKind='circuit'|'collect'|'memory'|'clear'|'patrol'|'count'|'mirrors'|'drones'|'shapes'|'finale';
export interface Mission {
  id:string;title:string;chapter:string;story:string;objective:string;kind:MissionKind;
  spawn:PointXZ;target:PointXZ;hint:string;
}

/** Ten short chapters with one concrete action and world consequence each. */
export const MISSIONS:readonly Mission[]=[
  {id:'arrival',chapter:'01',title:'Пробуждение леса',kind:'circuit',spawn:{x:0,z:9},target:{x:0,z:-1},
    story:'Технолес потемнел. Соедини три цветных провода, чтобы открыть первые ворота.',
    objective:'Подойди к сияющему реактору',hint:'Иди к фиолетовой башне и голубому свету.'},
  {id:'river',chapter:'02',title:'Энергия реки',kind:'collect',spawn:{x:0,z:-8},target:{x:0,z:-29},
    story:'Два моста ведут через реку. Найди три энергоячейки и доберись до портала.',
    objective:'Собери три энергоячейки',hint:'Золотые кристаллы стоят у развилок.'},
  {id:'echo',chapter:'03',title:'Эхо светлячков',kind:'memory',spawn:{x:0,z:-27.1},target:{x:0,z:-29},
    story:'Светлячки потеряли дорогу. Запомни их короткую световую песню и повтори её.',
    objective:'Повтори огоньки у портала',hint:'Посмотри на порядок огоньков, затем нажми те же цвета.'},
  {id:'vines',chapter:'04',title:'Сонные лианы',kind:'clear',spawn:{x:-4.45,z:-21},target:{x:-4.2,z:-24},
    story:'Мягкие механические лианы закрыли тропу. Робот может аккуратно оттолкнуть их рукой.',
    objective:'Убери 3 лианы ударом J',hint:'Подойди к сияющей лиане и нажми J. Машина не ударяет.'},
  {id:'patrol',chapter:'05',title:'Полицейский патруль',kind:'patrol',spawn:{x:4.2,z:-12},target:{x:4.2,z:-26},
    story:'Пора стать машиной. Проедь вдоль восточной тропы и зажги три путевых маяка.',
    objective:'Превратись в машину (E) и коснись 3 маяков',hint:'Нажми E, затем езжай по правой тропе.'},
  {id:'count',chapter:'06',title:'Батареи для друга',kind:'count',spawn:{x:0,z:1},target:{x:0,z:-1},
    story:'Маленькому помощнику нужны ровно четыре батареи. Загрузи нужное количество.',
    objective:'Загрузи ровно 4 батареи в реактор',hint:'Считай предметы по одному. Можно убрать лишний.'},
  {id:'mirrors',chapter:'07',title:'Зеркальная тропа',kind:'mirrors',spawn:{x:0,z:-21.2},target:{x:0,z:-21.2},
    story:'Луч света должен дойти до портала. Поверни три зеркала по подсказкам-стрелкам.',
    objective:'Поверни 3 зеркала и направь луч',hint:'От каждого зеркала луч поворачивает туда, куда смотрит стрелка.'},
  {id:'drones',chapter:'08',title:'Дружелюбные дроны',kind:'drones',spawn:{x:0,z:-27.1},target:{x:0,z:-25},
    story:'Три игрушечных дрона забыли, где их станции. Посылай мягкие световые импульсы клавишей K.',
    objective:'Верни 3 дрона световым импульсом K',hint:'Стань роботом, подойди и нажми K. Импульс сам найдёт близкого дрона.'},
  {id:'shapes',chapter:'09',title:'Шестерёнки узора',kind:'shapes',spawn:{x:0,z:1},target:{x:0,z:-1},
    story:'Механизм помнит простой узор: круг, звезда, круг. Восстанови порядок.',
    objective:'Собери узор шестерёнок',hint:'Посмотри на три силуэта сверху и повтори их снизу.'},
  {id:'home',chapter:'10',title:'Дорога домой',kind:'finale',spawn:{x:0,z:-11.8},target:{x:4.2,z:-21},
    story:'Технолес снова светится! Проедь к последнему маяку, стань роботом и войди в портал.',
    objective:'Машина → последний маяк → робот → портал',hint:'Сначала E для машины, после маяка E для робота.'}
];

export class Campaign {
  private index=0;
  private progress=0;
  private visited=new Set<number>();
  get mission():Mission{return MISSIONS[this.index];}
  get number():number{return this.index+1;}
  get count():number{return MISSIONS.length;}
  get done():boolean{return this.index===MISSIONS.length-1&&this.progress>=2;}
  get steps():number{return this.progress;}
  advance(kind:MissionKind):Mission|null{
    if(this.mission.kind!==kind||this.index===MISSIONS.length-1)return null;
    if((kind==='clear'||kind==='patrol'||kind==='drones')&&this.progress<3)return null;
    this.index++;this.progress=0;this.visited.clear();return this.mission;
  }
  markTarget(kind:'clear'|'drones',target:number):boolean{
    if(this.mission.kind!==kind||this.visited.has(target))return false;
    this.visited.add(target);this.progress=this.visited.size;return true;
  }
  visitPatrol(point:PointXZ,form:HeroForm):boolean{
    if(this.mission.kind!=='patrol'||form!=='vehicle')return false;
    const beacons=[{x:4.2,z:-14},{x:4.2,z:-21},{x:4.2,z:-25}];
    const target=beacons[this.progress];
    if(!target||Math.hypot(point.x-target.x,point.z-target.z)>1.35)return false;
    this.progress++;return true;
  }
  visitFinale(point:PointXZ,form:HeroForm):boolean{
    if(this.mission.kind!=='finale')return false;
    if(this.progress===0&&form==='vehicle'&&Math.hypot(point.x-4.2,point.z+21)<1.5){this.progress=1;return true;}
    if(this.progress===1&&form==='robot'&&Math.hypot(point.x,point.z+29)<2.2){this.progress=2;return true;}
    return false;
  }
}
