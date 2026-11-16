export interface Challenge{id:string;question:string;choices:readonly string[];correct:number;hint:string}
export const FIRST_CHALLENGE:Challenge={
 id:'energy-bridge-01',
 question:'КРАСНЫЙ, СИНИЙ, КРАСНЫЙ, ... Что дальше?',
 choices:['СИНИЙ','ЗЕЛЁНЫЙ','ЖЁЛТЫЙ'],
 correct:0,
 hint:'Цвета чередуются: красный, синий, красный ...'
};
export const validateChallenge=(c:Challenge,choice:number):boolean=>
 Number.isInteger(choice)&&choice>=0&&choice<c.choices.length&&choice===c.correct;
