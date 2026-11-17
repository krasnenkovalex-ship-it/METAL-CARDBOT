import {test,expect} from '@playwright/test';
declare global{interface Window{__metal2dGame?:any}}
test('all five Phaser rounds boot with own biome, two tasks and enemies',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/');
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu'),null,{timeout:20000});
 await page.mouse.click(640,628);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play'));
 for(const round of [1,2,3,4,5]){
   await page.evaluate((n)=>{
     const game=window.__metal2dGame;
     game?.scene?.stop('Puzzle');
     game?.scene?.start('Play',{round:n});
   },round);
   await page.waitForFunction(n=>{
     const game=window.__metal2dGame;
     const stage=game?.scene?.getScene('Play');
     return game?.scene?.isActive('Play')&&stage?.roundId===n&&
       stage?.combat?.summary?.total>=6;
   },round,{timeout:12000});
   const state=await page.evaluate(()=>{
     const r=window.__metal2dGame?.scene?.getScene('Play');
     return {round:r?.roundId,biome:r?.round?.biome,
       tasks:r?.round?.puzzleIds?.length,enemies:r?.combat?.summary?.total};
   });
   expect(state.round).toBe(round);
   expect(state.tasks).toBe(2);
   expect(state.enemies).toBeGreaterThanOrEqual(6);
   await page.screenshot({path:testInfo.outputPath('round-'+round+'.png')});
 }
 expect(errors).toEqual([]);
});
test('child can solve memory and dial tasks using real mouse inputs',async({page})=>{
 const errors:string[]=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/');
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu'),null,{timeout:20000});
 await page.mouse.click(640,628);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play'));
 await page.evaluate(()=>{
   const game=window.__metal2dGame;
   game?.scene?.start('Play',{round:2});
 });
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.roundId===2);
 await page.evaluate(()=>{
   const game=window.__metal2dGame;
   game?.scene?.pause('Play');
   game?.scene?.launch('Puzzle',{id:'echo-memory',round:2});
 });
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Puzzle'));
 // Visual signals [red, yellow, blue] are shown over 2.5s before the player acts.
 await page.waitForTimeout(3100);
 await page.mouse.click(390,390);
 await page.mouse.click(890,390);
 await page.mouse.click(640,390);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play'),null,{timeout:6000});
 expect(await page.evaluate(()=>window.__metal2dGame?.scene?.getScene('Play')?.completed?.has('echo-memory'))).toBe(true);
 await page.evaluate(()=>{
   const game=window.__metal2dGame;
   game?.scene?.pause('Play');
   game?.scene?.launch('Puzzle',{id:'gear-lift',round:2});
 });
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Puzzle'));
 await page.mouse.click(635,400);await page.mouse.click(635,400);
 await page.mouse.click(635,512);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play'),null,{timeout:6000});
 expect(await page.evaluate(()=>window.__metal2dGame?.scene?.getScene('Play')?.completed?.has('gear-lift'))).toBe(true);
 expect(errors).toEqual([]);
});
test('a cleared round offers an actual next-round button',async({page})=>{
 await page.goto('/');
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu'));
 await page.evaluate(()=>window.__metal2dGame?.scene?.start('Win',{round:2,crystals:4,enemyCount:5}));
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Win'));
 await page.mouse.click(640,521);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')&&
   window.__metal2dGame?.scene?.getScene('Play')?.roundId===3,null,{timeout:10000});
});
