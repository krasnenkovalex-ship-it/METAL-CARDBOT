export interface Choice {label:string;value:string}
export interface Puzzle {id:string;title:string;prompt:string;choices:Choice[];answer:string;success:string;hint:string}
export const firstPuzzle:Puzzle={
  id:'gate-colors-01',
  title:'Почини энергомост',
  prompt:'Красный кристалл зажжёт провод такого же цвета. Выбери его!',
  choices:[{label:'🔴 Красный',value:'red'},{label:'🟡 Жёлтый',value:'yellow'},{label:'🔵 Синий',value:'blue'}],
  answer:'red',
  success:'Отлично! Энергомост включён!',
  hint:'Посмотри на кристалл. Какой провод совпадает с ним по цвету?'
};