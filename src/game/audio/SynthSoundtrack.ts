/** Original algorithmic 16-step soundtrack. No copyrighted samples. */
export class SynthSoundtrack {
  private context:AudioContext|null=null;
  private timer:number|null=null;
  private step=0;
  private lastTime=0;
  private enabled=true;
  private readonly lead=[0,4,7,9,7,4,2,4,0,2,5,9,7,5,4,2];
  private readonly bass=[0,0,5,5,7,7,5,5];
  private readonly root=220;
  get playing():boolean{return this.timer!==null&&this.enabled;}
  async start():Promise<void>{
    if(!this.context)this.context=new AudioContext();
    if(this.context.state==='suspended')await this.context.resume();
    if(!this.enabled||this.timer!==null)return;
    this.lastTime=this.context.currentTime+.08;
    this.schedule();
    this.timer=window.setInterval(()=>this.schedule(),120);
  }
  private tone(frequency:number,start:number,duration:number,volume:number,type:OscillatorType='triangle'){
    if(!this.context)return;
    const osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.00011,volume),start+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(start);osc.stop(start+duration+.03);
  }
  private schedule(){
    if(!this.context||!this.enabled)return;
    while(this.lastTime<this.context.currentTime+.32){
      const index=this.step%16;
      const semitone=this.lead[index];
      const hz=this.root*Math.pow(2,semitone/12);
      this.tone(hz*2,this.lastTime,.18,.022,'triangle');
      if(index%2===0){
        const base=this.bass[Math.floor(index/2)];
        this.tone(this.root*.5*Math.pow(2,base/12),this.lastTime,.31,.026,'sine');
      }
      this.lastTime+=.245;
      this.step++;
    }
  }
  effect(kind:'correct'|'pickup'|'transform'|'wrong'|'victory'):void{
    if(!this.context||!this.enabled)return;
    const now=this.context.currentTime+.01;
    const notes=kind==='wrong'?[280,240]:kind==='transform'?[300,450,650,840]:
      kind==='victory'?[440,554,659,880]:kind==='pickup'?[700,1000]:[523,659,784];
    notes.forEach((note,i)=>this.tone(note,now+i*.075,.15,.045,'triangle'));
  }
  setEnabled(on:boolean):void{
    this.enabled=on;
    if(!on&&this.timer!==null){window.clearInterval(this.timer);this.timer=null;}
    if(on&&this.context&&this.timer===null){
      this.lastTime=this.context.currentTime+.08;
      this.schedule();
      this.timer=window.setInterval(()=>this.schedule(),120);
    }
  }
  dispose():void{
    if(this.timer!==null){window.clearInterval(this.timer);this.timer=null;}
    void this.context?.close();this.context=null;
  }
}
