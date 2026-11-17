export type PuzzleMode='choice'|'memory'|'wires'|'dial';
export interface Challenge{
 id:string;title:string;question:string;mode:PuzzleMode;
 icon:string;hint:string;
 choices:readonly string[];correct:number;
 sequence?:readonly number[];
 dialTarget?:number;dialSteps?:number;
}
const choice=(id:string,title:string,icon:string,question:string,choices:string[],correct:number,hint:string):Challenge=>
 ({id,title,icon,question,mode:'choice',choices,correct,hint});
const memory=(id:string,title:string,icon:string,sequence:number[],hint:string):Challenge=>
 ({id,title,icon,question:'Посмотри на огоньки. Затем повтори порядок!',mode:'memory',
   choices:['🔴','🔵','🟡'],correct:-1,sequence,hint});
const wires=(id:string,title:string,icon:string,hint:string):Challenge=>
 ({id,title,icon,question:'Соедини 3 одинаковых цвета проводов!',mode:'wires',
   choices:['🔴','🔵','🟡'],correct:-1,hint});
const dial=(id:string,title:string,icon:string,target:number,steps:number,hint:string):Challenge=>
 ({id,title,icon,question:'Поверни механизм так, чтобы стрелка указывала на светящийся знак!',
   mode:'dial',choices:[],correct:-1,dialTarget:target,dialSteps:steps,hint});

export const CHALLENGES:Record<string,Challenge>={
 bridge:choice('bridge','Разбуди энергомост','⚡',
  '🔴 🔵 🔴 ... Какой цвет будет следующим?',
  ['🔵 СИНИЙ','🟢 ЗЕЛЁНЫЙ','🟡 ЖЁЛТЫЙ'],0,
  'Цвета чередуются: красный, синий, красный, синий.'),
 generator:choice('generator','Запусти генератор','🔋',
  '🔋 🔋 🔋 🔋 ... Сколько батарей перед тобой?',
  ['3','4','5'],1,'Считай батарейки по одной: 1, 2, 3, 4.'),
 'echo-memory':memory('echo-memory','Сигналы светлячков','✨',[0,2,1],
   'Смотри на вспышки слева направо, потом нажимай в том же порядке.'),
 'gear-lift':dial('gear-lift','Небесный подъёмник','⚙️',2,4,
   'Поворачивай большое колесо, пока стрелка не укажет на звезду.'),
 'gear-sequence':dial('gear-sequence','Шестерёнки завода','🔩',3,5,
   'Нужно совместить стрелку и подсвеченный зубец.'),
 'factory-path':choice('factory-path','Выбери путь робота','🧭',
   'Какой мост безопаснее: с одной, двумя или тремя опорами?',
   ['1 опора','3 опоры','2 опоры'],1,
   'Больше крепких опор — устойчивее мост.'),
 'ice-mirror':dial('ice-mirror','Поверни ледяное зеркало','🪞',1,4,
   'Отражай луч так, чтобы он попал в кристалл.'),
 'ice-memory':memory('ice-memory','Снежные сигналы','❄️',[1,0,2,1],
   'Огоньки горят по очереди. Запоминай по одному!'),
 'storm-circuit':wires('storm-circuit','Восстанови энергоцепь','🌩️',
   'Выбирай провод слева и разъём такого же цвета справа.'),
 'final-code':memory('final-code','Код главного стража','🛡️',[2,0,1,2],
   'Смотри внимательно и повторяй цвета. Это ослабит щит босса!')
};
export const FIRST_CHALLENGE=CHALLENGES.bridge;
export const validateChallenge=(c:Challenge,choice:number):boolean=>
 c.mode==='choice'&&Number.isInteger(choice)&&choice>=0&&choice<c.choices.length&&choice===c.correct;
export const allChallengeIds=Object.keys(CHALLENGES);
