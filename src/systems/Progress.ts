const KEY='metal-cardbot-2d-progress-v1';
export interface SaveData{unlocked:number;bestCrystals:Record<string,number>}
const DEFAULT:SaveData={unlocked:1,bestCrystals:{}};
export function loadProgress():SaveData{
 try{
  const data=JSON.parse(localStorage.getItem(KEY)??'null') as Partial<SaveData>|null;
  if(!data||!Number.isInteger(data.unlocked))return {...DEFAULT,bestCrystals:{}};
  return {unlocked:Math.max(1,Math.min(10,data.unlocked!)),bestCrystals:data.bestCrystals??{}};
 }catch{return {...DEFAULT,bestCrystals:{}}}
}
export function markComplete(level:number,crystals:number):SaveData{
 const state=loadProgress();
 state.unlocked=Math.max(state.unlocked,Math.min(10,level+1));
 state.bestCrystals[String(level)]=Math.max(crystals,state.bestCrystals[String(level)]??0);
 try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
 return state;
}
