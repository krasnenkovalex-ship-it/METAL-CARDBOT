import type {HeroIntent} from '../character/HeroMotor';
export class TouchController {
  private readonly held=new Set<string>();
  private jump=false;
  private transform=false;
  private strike=false;
  private pulse=false;
  constructor(root:HTMLElement){
    for(const element of Array.from(root.querySelectorAll<HTMLButtonElement>('[data-control]'))){
      const key=element.dataset.control!;
      element.addEventListener('pointerdown',(event:PointerEvent)=>{
        event.preventDefault();element.setPointerCapture(event.pointerId);
        this.held.add(key);
        if(key==='jump')this.jump=true;
        if(key==='transform')this.transform=true;
        if(key==='strike')this.strike=true;
        if(key==='pulse')this.pulse=true;
      });
      const release=(event:PointerEvent)=>{event.preventDefault();this.held.delete(key);};
      element.addEventListener('pointerup',release);
      element.addEventListener('pointercancel',release);
      element.addEventListener('lostpointercapture',()=>this.held.delete(key));
    }
  }
  read():HeroIntent{
    const intent:HeroIntent={
      forward:this.held.has('forward'),back:this.held.has('back'),
      left:this.held.has('left'),right:this.held.has('right'),
      jumpPressed:this.jump,transformPressed:this.transform,
      strikePressed:this.strike,pulsePressed:this.pulse
    };
    this.jump=false;this.transform=false;this.strike=false;this.pulse=false;return intent;
  }
  clear():void{this.held.clear();this.jump=false;this.transform=false;this.strike=false;this.pulse=false;}
}

