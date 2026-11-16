import type {HeroIntent} from '../character/HeroMotor';
export class TouchController {
  private readonly held=new Set<string>();
  private jump=false;
  private transform=false;
  constructor(root:HTMLElement){
    for(const element of root.querySelectorAll<HTMLButtonElement>('[data-control]')){
      const key=element.dataset.control!;
      element.addEventListener('pointerdown',(event:PointerEvent)=>{
        event.preventDefault();element.setPointerCapture(event.pointerId);
        this.held.add(key);
        if(key==='jump')this.jump=true;
        if(key==='transform')this.transform=true;
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
      jumpPressed:this.jump,transformPressed:this.transform
    };
    this.jump=false;this.transform=false;return intent;
  }
}
