import type {HeroIntent} from '../character/HeroMotor';

/** Uses physical codes: W works even on a Russian keyboard layout. */
export class PhysicalKeyboard {
  private readonly held=new Set<string>();
  private jumpQueued=false;
  private transformQueued=false;
  private strikeQueued=false;
  private pulseQueued=false;
  private readonly onKeyDown=(event:KeyboardEvent):void=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(!event.repeat&&event.code==='Space')this.jumpQueued=true;
    if(!event.repeat&&event.code==='KeyE')this.transformQueued=true;
    if(!event.repeat&&event.code==='KeyJ')this.strikeQueued=true;
    if(!event.repeat&&event.code==='KeyK')this.pulseQueued=true;
    this.held.add(event.code);
  };
  private readonly onKeyUp=(event:KeyboardEvent):void=>{this.held.delete(event.code);};
  private readonly onBlur=():void=>{this.clear();};
  constructor(private readonly target:Window=window){
    target.addEventListener('keydown',this.onKeyDown);
    target.addEventListener('keyup',this.onKeyUp);
    target.addEventListener('blur',this.onBlur);
  }
  read():HeroIntent{
    const pressed=(...codes:string[])=>codes.some(code=>this.held.has(code));
    const result:HeroIntent={
      forward:pressed('KeyW','ArrowUp'),
      back:pressed('KeyS','ArrowDown'),
      left:pressed('KeyA','ArrowLeft'),
      right:pressed('KeyD','ArrowRight'),
      jumpPressed:this.jumpQueued,
      transformPressed:this.transformQueued,
      strikePressed:this.strikeQueued,pulsePressed:this.pulseQueued
    };
    this.jumpQueued=false;this.transformQueued=false;this.strikeQueued=false;this.pulseQueued=false;
    return result;
  }
  clear():void{this.held.clear();this.jumpQueued=false;this.transformQueued=false;this.strikeQueued=false;this.pulseQueued=false;}
  dispose():void{
    this.target.removeEventListener('keydown',this.onKeyDown);
    this.target.removeEventListener('keyup',this.onKeyUp);
    this.target.removeEventListener('blur',this.onBlur);
  }
}

