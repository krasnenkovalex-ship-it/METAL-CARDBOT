/** Original synthesised melody and effects. No third-party samples or franchise audio. */
class AdventureAudio{
 private ctx:AudioContext|null=null;
 private timer:number|null=null;
 private step=0;
 private last=0;
 private muted=false;
 private readonly notes=[0,4,7,12,9,7,4,2,0,2,5,9,7,5,4,2,0,4,7,11,12,7,9,4,2,0,4,7,5,4,2,0];
 get playing(){return this.timer!==null&&!this.muted;}
 async start():Promise<void>{
   if(!this.ctx)this.ctx=new AudioContext();
   if(this.ctx.state==='suspended')await this.ctx.resume();
   if(this.timer!==null||this.muted)return;
   this.last=this.ctx.currentTime+.09;
   this.loop();
   this.timer=window.setInterval(()=>this.loop(),110);
 }
 private tone(note:number,start:number,duration:number,volume:number,type:OscillatorType='triangle'):void{
   if(!this.ctx||this.muted)return;
   const a=this.ctx.createOscillator(),b=this.ctx.createGain();
   a.type=type;a.frequency.setValueAtTime(note,start);
   b.gain.setValueAtTime(.0001,start);
   b.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.015);
   b.gain.exponentialRampToValueAtTime(.0001,start+duration);
   a.connect(b).connect(this.ctx.destination);a.start(start);a.stop(start+duration+.025);
 }
 private loop():void{
   if(!this.ctx||this.muted)return;
   while(this.last<this.ctx.currentTime+.30){
     const i=this.step%this.notes.length;
     const root=[196,164.8,174.6,146.8][Math.floor(i/8)];
     const note=root*Math.pow(2,this.notes[i]/12);
     this.tone(note*2,this.last,.16,.021);
     if(i%2===0)this.tone(root*.5,this.last,.34,.02,'sine');
     if(i%4===0)this.tone(root,this.last,.42,.008,'sine');
     this.last+=.232;this.step++;
   }
 }
 effect(which:'jump'|'pickup'|'transform'|'open'|'task'|'hit'|'win'):void{
   if(!this.ctx||this.muted)return;
   const tones:Record<typeof which,number[]>={
     jump:[450,580],pickup:[720,980,1240],transform:[240,320,520,740],
     open:[320,440,560,760],task:[550,660],hit:[250,190],win:[440,550,660,880,1100]
   };
   const now=this.ctx.currentTime+.01;
   for(const [i,hz] of tones[which].entries())this.tone(hz,now+i*.073,.17,.042);
 }
 toggle():boolean{
   this.muted=!this.muted;
   if(this.muted&&this.timer!==null){window.clearInterval(this.timer);this.timer=null;}
   if(!this.muted&&this.ctx){this.last=this.ctx.currentTime+.09;this.loop();this.timer=window.setInterval(()=>this.loop(),110);}
   return this.muted;
 }
}
export const audio=new AdventureAudio();
