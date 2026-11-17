/** Portable deterministic enemy state transitions, shared by AI and tests. */
export type EnemyKind='crawler'|'drone'|'sentinel'|'hopper'|'charger'|'turret';
export type EnemyMode='patrol'|'windup'|'attack'|'recover';
export interface EnemyInput {
 kind:EnemyKind;mode:EnemyMode;now:number;modeUntil:number;
 x:number;y:number;homeX:number;homeY:number;playerX:number;playerY:number;
 direction:-1|1;lastFire:number;difficulty:number;
}
export interface EnemyDecision {
 mode:EnemyMode;modeUntil:number;direction:-1|1;moveX:number;
 moveY:number;fire:boolean;warning:boolean;charge:boolean;
}
const sign=(n:number): -1|1=>n<0?-1:1;
export function decideEnemy(a:EnemyInput,dt:number):EnemyDecision {
 const diff=Math.max(1,Math.min(3,a.difficulty));
 const dx=a.playerX-a.x,dist=Math.abs(dx);
 const within=dist<390&&Math.abs(a.playerY-a.y)<210;
 const facing=sign(dx),step=Math.max(0,Math.min(dt,.05));
 const base:EnemyDecision={mode:a.mode,modeUntil:a.modeUntil,direction:a.direction,
   moveX:0,moveY:0,fire:false,warning:false,charge:false};
 if(a.kind==='drone'){
   base.moveY=Math.sin(a.now*.006+a.homeX*.02)*1.7;
   base.moveX=Math.sin(a.now*.0015+a.homeX*.004)*2.2*diff;
   if(within){
     base.direction=facing;
     if(a.mode==='patrol'&&a.now>a.modeUntil){
       base.mode='windup';base.modeUntil=a.now+570;return {...base,warning:true};
     }
     if(a.mode==='windup'){
       if(a.now>=a.modeUntil){base.mode='attack';base.modeUntil=a.now+480;}
       else return {...base,warning:true};
     }
     if(base.mode==='attack'){
       base.moveX=facing*240*step*diff;
       base.moveY=sign(a.playerY-a.y)*145*step;
       if(a.now>base.modeUntil){base.mode='recover';base.modeUntil=a.now+1100;}
     }
   }
   if(a.mode==='recover'&&a.now>=a.modeUntil){base.mode='patrol';base.modeUntil=a.now+500;}
   return base;
 }
 if(a.kind==='turret'){
   base.direction=facing;
   if(a.mode==='patrol'&&within&&a.now-a.lastFire>(diff>=2?1500:1950)){
     return {...base,mode:'windup',modeUntil:a.now+600,warning:true};
   }
   if(a.mode==='windup'){
     if(a.now<a.modeUntil)return {...base,warning:true};
     return {...base,mode:'recover',modeUntil:a.now+1000,fire:true};
   }
   if(a.mode==='recover'&&a.now>=a.modeUntil){
     return {...base,mode:'patrol',modeUntil:a.now+450};
   }
   return base;
 }
 if(a.kind==='charger'||a.kind==='sentinel'){
   const detection=a.kind==='sentinel'?530:290;
   const ready=dist<detection&&a.now>a.modeUntil;
   if(a.mode==='patrol'&&ready){base.mode='windup';base.modeUntil=a.now+720;return {...base,warning:true,direction:facing};}
   if(a.mode==='windup'){
     if(a.now<a.modeUntil)return {...base,warning:true,direction:facing};
     base.mode='attack';base.modeUntil=a.now+(a.kind==='sentinel'?780:620);
   }
   if(base.mode==='attack'){
     base.charge=true;base.direction=facing;
     base.moveX=base.direction*(a.kind==='sentinel'?300:385)*step*diff;
     base.fire=a.kind==='sentinel'&&a.now-a.lastFire>950;
     if(a.now>=base.modeUntil){base.mode='recover';base.modeUntil=a.now+1150;}
     return base;
   }
   if(a.mode==='recover'){
     if(a.now<a.modeUntil)return {...base,moveX:-a.direction*30*step,warning:false};
     base.mode='patrol';base.modeUntil=a.now+350;
   }
 }
 if(a.kind==='hopper'){
   base.direction=dist<300?facing:a.direction;
   base.moveY=-Math.cos(a.now*.007)*1.4;
   if(dist<270)base.moveX=base.direction*(62+diff*25)*step;
   else base.moveX=base.direction*52*step;
   return base;
 }
 if(a.kind==='crawler'||a.kind==='charger'||a.kind==='sentinel'){
   const chasing=dist<250;
   base.direction=chasing?facing:a.direction;
   const boundary=Math.abs(a.x-a.homeX)>170;
   if(!chasing&&boundary)base.direction=a.x<a.homeX?1:-1;
   base.moveX=base.direction*(chasing?88:55)*step*diff;
 }
 return base;
}
