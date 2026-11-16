export type PuzzleKind='memory'|'count'|'mirrors'|'shapes';
export interface PuzzleResult {changed:boolean;complete:boolean;message:string}
const memory=['🔵','🟡','🔴'] as const;
const mirror=['↗','↖','↗'] as const;
const shapes=['●','★','●'] as const;

/** Small, replayable, non-punitive puzzles; the world reacts to completion. */
export class MissionPuzzle {
  readonly kind:PuzzleKind;
  private selections:string[]=[];
  private countSelected=new Set<number>();
  private mirrorValues=['↖','↖','↖'];
  private completeValue=false;
  constructor(kind:PuzzleKind){this.kind=kind;}
  get complete():boolean{return this.completeValue;}
  get sequence():readonly string[]{return this.kind==='memory'?memory:this.kind==='shapes'?shapes:mirror;}
  get progress():number{return this.kind==='count'?this.countSelected.size:this.kind==='mirrors'?this.mirrorValues.filter((v,i)=>v===mirror[i]).length:this.selections.length;}
  get values():readonly string[]{return this.kind==='mirrors'?this.mirrorValues:[...this.selections];}
  get selectedIndices():readonly number[]{return [...this.countSelected];}
  choose(value:string):PuzzleResult{
    if(this.completeValue)return {changed:false,complete:true,message:'Уже получилось!'};
    if(this.kind==='memory'||this.kind==='shapes'){
      const target=this.kind==='memory'?memory:shapes;
      if(value!==target[this.selections.length]){
        this.selections=[];
        return {changed:false,complete:false,message:'Почти! Начнём ещё раз, без штрафа.'};
      }
      this.selections.push(value);
      this.completeValue=this.selections.length===target.length;
      return {changed:true,complete:this.completeValue,message:this.completeValue?'Узор восстановлен!':'Верно! Что идёт дальше?'};
    }
    if(this.kind==='count'){
      const index=Number(value);
      if(!Number.isInteger(index)||index<0||index>=6)return {changed:false,complete:false,message:'Выбери батарею.'};
      if(this.countSelected.has(index))this.countSelected.delete(index);else this.countSelected.add(index);
      return {changed:true,complete:false,message:`Загружено ${this.countSelected.size}. Нужно ровно четыре.`};
    }
    const index=Number(value);
    if(!Number.isInteger(index)||index<0||index>=3)return {changed:false,complete:false,message:'Выбери зеркало.'};
    this.mirrorValues[index]=this.mirrorValues[index]==='↗'?'↖':'↗';
    this.completeValue=this.mirrorValues.every((v,i)=>v===mirror[i]);
    return {changed:true,complete:this.completeValue,message:this.completeValue?'Луч дошёл до портала!':'Зеркало повернулось. Куда теперь идёт луч?'};
  }
  submitCount():PuzzleResult{
    if(this.kind!=='count')return {changed:false,complete:false,message:''};
    this.completeValue=this.countSelected.size===4;
    return {changed:false,complete:this.completeValue,message:this.completeValue?'Четыре батареи на месте!':'Посчитай ещё раз: нужно ровно четыре. Можно убрать лишние.'};
  }
}
