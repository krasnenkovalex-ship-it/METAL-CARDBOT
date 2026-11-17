/** Three fan-game hero archetypes; official character art is not bundled. */
export type HeroId='bluecop'|'megatrucker'|'phoenixfire';
export type HeroForm='robot'|'vehicle';
export interface HeroProfile{
 id:HeroId;name:string;nickname:string;type:string;
 description:string;ability:string;
 maxHealth:number;robotSpeed:number;vehicleSpeed:number;
 projectileDamage:number;attackInterval:number;meleeDamage:number;
 projectileColor:number;outlineColor:number;
}
export const HEROES:Record<HeroId,HeroProfile>={
 bluecop:{
  id:'bluecop',name:'БЛЮ КОП',nickname:'Страж порядка',type:'🚓 Полиция',
  description:'Быстрый герой. Энергетические выстрелы и точные удары.',
  ability:'ЭНЕРГОЛУЧ',maxHealth:4,robotSpeed:300,vehicleSpeed:490,
  projectileDamage:1,attackInterval:260,meleeDamage:1,
  projectileColor:0x4deaff,outlineColor:0x55bdff
 },
 megatrucker:{
  id:'megatrucker',name:'МЕГА ТРАКЕР',nickname:'Сила и защита',type:'🚚 Самосвал',
  description:'Тяжёлый защитник. Мощные снаряды и удар кулаком.',
  ability:'МЕГА-УДАР',maxHealth:6,robotSpeed:245,vehicleSpeed:370,
  projectileDamage:2,attackInterval:540,meleeDamage:2,
  projectileColor:0xffc346,outlineColor:0xffaa38
 },
 phoenixfire:{
  id:'phoenixfire',name:'ФЕНИКС ФАЙР',nickname:'Огненная скорость',type:'🚒 Пожарная машина',
  description:'Динамичный боец. Быстрые огненные заряды.',
  ability:'ОГНЕННЫЙ ЗАРЯД',maxHealth:3,robotSpeed:325,vehicleSpeed:470,
  projectileDamage:1,attackInterval:190,meleeDamage:1,
  projectileColor:0xff7259,outlineColor:0xff6476
 }
};
export const HERO_IDS:readonly HeroId[]=['bluecop','megatrucker','phoenixfire'];
let selectedHero:HeroId='bluecop';
export const chooseHero=(hero:HeroId):void=>{selectedHero=hero;};
export const currentHero=():HeroId=>selectedHero;
export const isHero=(value:string):value is HeroId=>value in HEROES;
