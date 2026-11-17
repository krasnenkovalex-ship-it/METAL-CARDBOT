import {HEROES,type HeroId} from '../data/heroes.ts';
export const hitDistance=(ax:number,ay:number,bx:number,by:number):number=>Math.hypot(ax-bx,ay-by);
export const meleeInRange=(hx:number,hy:number,ex:number,ey:number,face:-1|1,reach=115):boolean=>{
 const dx=ex-hx;
 return dx*face>=-12&&dx*face<=reach&&Math.abs(ey-hy)<96;
};
export const canFire=(now:number,last:number,id:HeroId):boolean=>
 Number.isFinite(now)&&now-last>=HEROES[id].attackInterval;
export const damageAfterArmor=(damage:number,armor:number):number=>Math.max(1,damage-armor);
export const clampHealth=(health:number,max:number):number=>Math.min(max,Math.max(0,health));
