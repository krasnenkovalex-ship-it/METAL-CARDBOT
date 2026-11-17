/** Pure world-puzzle state; safe to test without Phaser. */
export type PairColor=0|1|2;
export class CircuitState {
 readonly connected=new Set<PairColor>();
 private selected:PairColor|null=null;
 select(color:PairColor):void{
  if(!this.connected.has(color))this.selected=color;
 }
 connect(socket:PairColor):'none'|'wrong'|'correct'|'complete'{
  if(this.selected===null||this.connected.has(socket))return 'none';
  if(this.selected!==socket)return 'wrong';
  this.connected.add(socket);this.selected=null;
  return this.connected.size===3?'complete':'correct';
 }
 get chosen():PairColor|null{return this.selected;}
}
export class RelayState {
 readonly order:readonly PairColor[]=[0,2,1];
 private index=0;
 get progress():number{return this.index;}
 press(pad:PairColor):'wrong'|'correct'|'complete'{
  if(this.order[this.index]!==pad){this.index=0;return 'wrong';}
  this.index++;
  return this.index===this.order.length?'complete':'correct';
 }
 reset():void{this.index=0;}
}
