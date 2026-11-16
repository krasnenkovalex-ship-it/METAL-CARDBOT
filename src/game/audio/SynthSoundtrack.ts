/** Original, browser-synthesized music and effects. No samples or third-party audio. */
export class SynthSoundtrack {
  private context:AudioContext|null=null;
  private timer:number|null=null;
  private step=0;
  private lastTime=0;
  private enabled=true;
  private noiseBuffer:AudioBuffer|null=null;
  private readonly lead=[0,4,7,12,9,7,4,2,0,2,4,7,9,7,4,2,0,4,7,11,12,11,7,4,2,4,7,9,7,4,2,0];
  private readonly roots=[220,174.61,196,164.81];
  get playing():boolean{return this.timer!==null&&this.enabled;}
  async start():Promise<void>{
    if(!this.context){
      this.context=new AudioContext();
      this.noiseBuffer=this.context.createBuffer(1,Math.floor(this.context.sampleRate*.5),this.context.sampleRate);
      const data=this.noiseBuffer.getChannelData(0);
      let seed=1789;
      for(let i=0;i<data.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        data[i]=(seed/2147483648-1)*(.6+.4*Math.sin(i*.21));
      }
    }
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
  private percussion(start:number,volume:number,duration=.065):void{
    if(!this.context||!this.noiseBuffer)return;
    const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain();
    source.buffer=this.noiseBuffer;
    filter.type='lowpass';filter.frequency.value=860;
    gain.gain.setValueAtTime(Math.max(.0001,volume),start);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(start);source.stop(start+duration+.01);
  }
  private schedule(){
    if(!this.context||!this.enabled)return;
    while(this.lastTime<this.context.currentTime+.32){
      const index=this.step%32;
      const root=this.roots[Math.floor(index/8)];
      const semitone=this.lead[index];
      const hz=root*Math.pow(2,semitone/12);
      this.tone(hz*2,this.lastTime,index%4===3?.27:.15,.017,'triangle');
      if(index%2===0){
        this.tone(root*.5,this.lastTime,.31,.022,'sine');
        this.percussion(this.lastTime,index%4===0?.010:.004);
      }
      if(index%8===0){
        this.tone(root,this.lastTime,.9,.008,'sine');
        this.tone(root*Math.pow(2,7/12),this.lastTime,.9,.006,'sine');
      }
      this.lastTime+=.23;
      this.step++;
    }
  }
  effect(kind:'correct'|'pickup'|'transform'|'wrong'|'victory'|'step'|'drive'|'land'|'gate'):void{
    if(!this.context||!this.enabled)return;
    const now=this.context.currentTime+.01;
    if(kind==='step'||kind==='drive'||kind==='land'){
      this.percussion(now,kind==='land'?.018:kind==='drive'?.006:.009,kind==='land'?.12:.045);
      if(kind==='drive')this.tone(95,now,.08,.008,'sawtooth');
      return;
    }
    const notes=kind==='wrong'?[310,260]:kind==='transform'?[220,330,494,740]:
      kind==='gate'?[330,440,554,659,880]:kind==='victory'?[440,554,659,880,1047]:
      kind==='pickup'?[659,988]:[523,659,784];
    notes.forEach((note,i)=>this.tone(note,now+i*.085,kind==='gate'?.25:.16,kind==='wrong'?.020:.033,'triangle'));
  }
  setEnabled(on:boolean):void{
    this.enabled=on;
    if(!on&&this.timer!==null){window.clearInterval(this.timer);this.timer=null;}
    if(on&&this.context&&this.timer===null){
      if(this.context.state==='suspended')void this.context.resume();
      this.lastTime=this.context.currentTime+.08;
      this.schedule();
      this.timer=window.setInterval(()=>this.schedule(),120);
    }
  }
  dispose():void{
    if(this.timer!==null){window.clearInterval(this.timer);this.timer=null;}
    void this.context?.close();this.context=null;this.noiseBuffer=null;
  }
}

