import {test,expect} from '@playwright/test';
declare global{interface Window{__metal2dGame?:any}}
test('moving upper ledge uses an actual Arcade body and can carry the robot',async({page},testInfo)=>{
 const errors:string[]=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/');
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu'),null,{timeout:20000});
 await page.evaluate(()=>{
   const game=window.__metal2dGame;
   game?.scene?.start('Play',{round:2});
 });
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.roundId===2,null,{timeout:12000});
 const start=await page.evaluate(()=>{
   const stage=window.__metal2dGame?.scene?.getScene('Play');
   stage.combat.destroy(); // isolate the platform; this is NOT a full-level run
   const platform=stage.movingPlatforms.find((p:any)=>Math.abs(p.body.x-1720)<10);
   if(!platform)throw Error('Missing moving ledge at x=1720');
   stage.player.setPosition(1720,290);
   stage.player.setVelocity(0,0);
   return {baseY:platform.body.y};
 });
 await page.waitForTimeout(2200);
 const state=await page.evaluate(()=>{
   const stage=window.__metal2dGame?.scene?.getScene('Play');
   const platform=stage.movingPlatforms.find((p:any)=>Math.abs(p.body.x-1720)<10);
   const body=stage.player.body;
   return {platformY:platform.body.y,playerBottom:body.bottom,
     platformTop:platform.body.body.top,playerX:stage.player.x,playerY:stage.player.y,
     grounded:body.blocked.down||body.touching.down};
 });
 expect(Math.abs(state.platformY-start.baseY)).toBeGreaterThan(8);
 expect(state.playerX).toBeGreaterThan(1680);
 expect(Math.abs(state.playerBottom-state.platformTop)).toBeLessThan(28);
 await page.screenshot({path:testInfo.outputPath('moving-platform-collision.png')});
 expect(errors).toEqual([]);
});
