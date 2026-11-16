/** Deterministic, platform-neutral movement and transformation state machine. */
export type HeroForm = 'robot' | 'vehicle';
export interface HeroIntent {
  forward:boolean; back:boolean; left:boolean; right:boolean;
  jumpPressed:boolean; transformPressed:boolean;
}
export interface HeroPose {
  x:number; y:number; z:number;
  heading:number; speed:number; form:HeroForm;
  transforming:boolean; transformProgress:number; targetForm:HeroForm; grounded:boolean; moving:boolean;
}
const approach=(current:number,target:number,rate:number,dt:number):number =>
  current+(target-current)*(1-Math.exp(-rate*dt));
const zero:HeroIntent={forward:false,back:false,left:false,right:false,jumpPressed:false,transformPressed:false};

export class HeroMotor {
  private x=0;
  private y=.9;
  private z=4;
  private vx=0;
  private vz=0;
  private vy=0;
  private heading=0;
  private form:HeroForm='robot';
  private nextForm:HeroForm='robot';
  private transformTimeLeft=0;
  private grounded=true;
  private coyoteTime=0;
  private jumpBuffer=0;
  private readonly floor=.9;
  readonly transformSeconds=.85;
  get pose():HeroPose{
    return {
      x:this.x,y:this.y,z:this.z,heading:this.heading,
      speed:Math.hypot(this.vx,this.vz),form:this.form,
      transforming:this.transformTimeLeft>0,transformProgress:this.transformTimeLeft>0?1-this.transformTimeLeft/this.transformSeconds:1,
      targetForm:this.nextForm,grounded:this.grounded,
      moving:Math.hypot(this.vx,this.vz)>.12
    };
  }
  reset(x=0,z=4):void{
    this.x=x;this.z=z;this.y=this.floor;
    this.vx=0;this.vz=0;this.vy=0;this.heading=0;
    this.form='robot';this.nextForm='robot';
    this.transformTimeLeft=0;this.grounded=true;
    this.coyoteTime=0;this.jumpBuffer=0;
  }
  setHorizontalPosition(x:number,z:number):void{this.x=x;this.z=z;}
  teleport(x:number,z:number):void{
    this.x=x;this.z=z;this.y=this.floor;
    this.vx=0;this.vz=0;this.vy=0;
    this.grounded=true;this.coyoteTime=0;this.jumpBuffer=0;
    this.transformTimeLeft=0;this.nextForm=this.form;
  }
  update(dt:number, input:HeroIntent=zero, blocked=false):HeroPose{
    const step=Math.max(0,Math.min(.05,dt));
    if(blocked)return this.pose;
    if(input.jumpPressed)this.jumpBuffer=.13;
    else this.jumpBuffer=Math.max(0,this.jumpBuffer-step);
    this.coyoteTime=this.grounded?.10:Math.max(0,this.coyoteTime-step);
    if(input.transformPressed&&this.grounded&&this.transformTimeLeft===0){
      this.nextForm=this.form==='robot'?'vehicle':'robot';
      this.transformTimeLeft=this.transformSeconds;
      this.vx=0;this.vz=0;
      this.jumpBuffer=0;
    }
    if(this.transformTimeLeft>0){
      this.transformTimeLeft=Math.max(0,this.transformTimeLeft-step);
      if(this.transformTimeLeft===0)this.form=this.nextForm;
      return this.pose;
    }
    const dx=Number(input.right)-Number(input.left);
    const dz=Number(input.back)-Number(input.forward);
    const length=Math.hypot(dx,dz)||1;
    const targetSpeed=this.form==='vehicle'?8.6:4.8;
    this.vx=approach(this.vx,dx/length*targetSpeed,dx||dz?10:15,step);
    this.vz=approach(this.vz,dz/length*targetSpeed,dx||dz?10:15,step);
    if(dx||dz){
      const targetHeading=Math.atan2(dx,-dz);
      const difference=Math.atan2(Math.sin(targetHeading-this.heading),Math.cos(targetHeading-this.heading));
      const turnRate=this.form==='vehicle'?7:12;
      this.heading+=Math.max(-turnRate*step,Math.min(turnRate*step,difference));
    }
    if(this.form==='robot'&&this.jumpBuffer>0&&this.coyoteTime>0){
      this.vy=6.8;this.grounded=false;this.coyoteTime=0;this.jumpBuffer=0;
    }
    if(!this.grounded){
      this.vy-=17*step;
      this.y+=this.vy*step;
      if(this.y<=this.floor){
        this.y=this.floor;this.vy=0;this.grounded=true;
      }
    }
    this.x+=this.vx*step;
    this.z+=this.vz*step;
    return this.pose;
  }
  /** Correct positional collision after integration, without corrupting velocity. */
  constrain(minX:number,maxX:number,minZ:number,maxZ:number):HeroPose{
    this.x=Math.min(maxX,Math.max(minX,this.x));
    this.z=Math.min(maxZ,Math.max(minZ,this.z));
    return this.pose;
  }
}

