export type PuzzleKind='wires'|'sequence'|'count'|'pattern'|'mirror'|'route'|'sort';
export interface LevelPlan{id:number;name:string;biome:string;puzzle:PuzzleKind;boss:boolean;gimmick:string;learning:string}
/** Campaign PLAN. Only level 1 has a playable scene. */
export const LEVELS:readonly LevelPlan[]=[
 {id:1,name:'Пробуждение Блю Копа',biome:'Небесный лес',puzzle:'wires',boss:false,gimmick:'Энергетический мост',learning:'Цвета и соответствия'},
 {id:2,name:'Долина эха',biome:'Светящийся лес',puzzle:'sequence',boss:false,gimmick:'Оживляющие сигналы',learning:'Рабочая память'},
 {id:3,name:'Завод шестерён',biome:'Механическая крепость',puzzle:'pattern',boss:true,gimmick:'Босс Зубастик — три фазы щита',learning:'Закономерности'},
 {id:4,name:'Город букв',biome:'Неоновый город',puzzle:'sort',boss:false,gimmick:'Сортировка карточек',learning:'Звуки и буквы'},
 {id:5,name:'Каньон чисел',biome:'Красные скалы',puzzle:'count',boss:false,gimmick:'Грузовик строит мост',learning:'Счёт до десяти'},
 {id:6,name:'Ледяной реактор',biome:'Ледяные пещеры',puzzle:'mirror',boss:true,gimmick:'Босс Криотрон — три фазы',learning:'Пространственная логика'},
 {id:7,name:'Магнитная долина',biome:'Магнитные скалы',puzzle:'route',boss:false,gimmick:'Движущиеся платформы',learning:'Планирование'},
 {id:8,name:'Небесная лаборатория',biome:'Облачные острова',puzzle:'sequence',boss:false,gimmick:'Небесный лифт',learning:'Память и внимание'},
 {id:9,name:'Грозовая крепость',biome:'Штормовое небо',puzzle:'pattern',boss:true,gimmick:'Босс Магнетрон — три фазы',learning:'Классификация'},
 {id:10,name:'Спасение энергоядра',biome:'Солнечная цитадель',puzzle:'route',boss:false,gimmick:'Финал с друзьями',learning:'Комбинирование навыков'}
] as const;
