export type WireColor='red'|'blue'|'yellow';
export const WIRE_COLORS:readonly WireColor[]=['red','blue','yellow'] as const;
export interface CircuitResult {correct:boolean;completed:boolean;connected:number;message:string}
/** Educational task state is independent from DOM and rendering. */
export class ColorCircuit {
  private links=new Map<WireColor,WireColor>();
  connect(wire:WireColor,socket:WireColor):CircuitResult{
    if(this.links.has(wire)){
      return {correct:true,completed:this.completed,connected:this.links.size,message:'Этот провод уже подключён!'};
    }
    if(wire!==socket){
      return {correct:false,completed:false,connected:this.links.size,message:'Цвета разные. Попробуй найти такой же!'}; 
    }
    this.links.set(wire,socket);
    return {correct:true,completed:this.completed,connected:this.links.size,
      message:this.completed?'Все три провода подключены! Мост оживает!':'Отлично! Теперь выбери следующий провод.'};
  }
  isConnected(color:WireColor):boolean{return this.links.has(color);}
  get completed():boolean{return this.links.size===WIRE_COLORS.length;}
  get connected():number{return this.links.size;}
  reset():void{this.links.clear();}
}
