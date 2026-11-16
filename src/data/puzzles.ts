export interface Challenge{
 id:string;title:string;question:string;choices:readonly string[];correct:number;
 hint:string;icon:string;
}
export const CHALLENGES:Record<string,Challenge>={
 bridge:{
  id:'bridge',title:'Энергетический мост',icon:'⚡',
  question:'🔴 🔵 🔴 ... Какой цвет будет следующим?',
  choices:['🔵 СИНИЙ','🟢 ЗЕЛЁНЫЙ','🟡 ЖЁЛТЫЙ'],correct:0,
  hint:'Цвета чередуются: красный, синий, красный, синий.'
 },
 generator:{
  id:'generator',title:'Запусти генератор',icon:'🔋',
  question:'🔋 🔋 🔋 🔋 ... Сколько батарей перед тобой?',
  choices:['3','4','5'],correct:1,
  hint:'Считай батарейки по одной, слева направо: 1, 2, 3, 4.'
 }
};
export const FIRST_CHALLENGE=CHALLENGES.bridge;
export const validateChallenge=(c:Challenge,choice:number):boolean=>
 Number.isInteger(choice)&&choice>=0&&choice<c.choices.length&&choice===c.correct;
