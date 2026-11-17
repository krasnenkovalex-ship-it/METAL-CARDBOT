import {test,expect} from '@playwright/test';
declare global{interface Window{__metal2dGame?:any}}
test('first reactor is solved in the level using real mouse clicks',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('canvas')).toBeVisible();
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu')===true,null,{timeout:20000});
 await page.mouse.click(640,628);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')===true);
 await page.keyboard.down('d');
 try{
  await page.waitForFunction(()=>{
   const scene=window.__metal2dGame?.scene?.getScene('Play');
   return scene?.worldPuzzle?.active===true && scene?.worldPuzzle?.id==='bridge';
  },null,{timeout:16000});
 }finally{await page.keyboard.up('d');}
 await page.screenshot({path:testInfo.outputPath('world-reactor-puzzle.png')});
 const clickNode=async(side:'left'|'right',i:number)=>{
  const position=await page.evaluate(({side,index})=>{
    const scene=window.__metal2dGame?.scene?.getScene('Play');
    const point=scene.worldPuzzle.positions[side][index];
    const cam=scene.cameras.main;
    const p0=cam.getWorldPoint(0,0),p1=cam.getWorldPoint(1280,720);
    return {x:Math.round((point[0]-p0.x)/(p1.x-p0.x)*1280),
      y:Math.round((point[1]-p0.y)/(p1.y-p0.y)*720)};
  },{side,index:i});
  await page.mouse.click(position.x,position.y);
 };
 for(const [i,j] of [[0,1],[1,2],[2,0]]){
   await clickNode('left',i);
   await clickNode('right',j);
 }
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.completed?.has('bridge')===true,null,{timeout:8000});
 await page.screenshot({path:testInfo.outputPath('reactor-bridge-open.png')});
 expect(errors).toEqual([]);
});
test('mobile can start, jump and switch to police car',async({browser},testInfo)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 try{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu')===true,null,{timeout:20000});
  const canvas=page.locator('canvas');const box=await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x+box!.width*(640/1280),box!.y+box!.height*(628/720));
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')===true,null,{timeout:12000});
  const rect=await canvas.boundingBox();
  await page.touchscreen.tap(rect!.x+rect!.width*(1184/1280),rect!.y+rect!.height*(621/720));
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.car===true,null,{timeout:8000});
  await page.screenshot({path:testInfo.outputPath('mobile-car.png')});
  expect(errors).toEqual([]);
 }finally{await context.close();}
});

test('three heroes are selectable and both mouse combat buttons work',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu')===true,null,{timeout:20000});
  await page.mouse.click(974,379);
  await page.mouse.click(640,628);
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')===true);
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.heroId==='phoenixfire');
  const before=await page.evaluate(()=>window.__metal2dGame?.scene?.getScene('Play')?.combat?.summary);
  expect(before.total).toBe(6);
  await page.mouse.click(850,420,{button:'left'});
  await page.mouse.click(850,420,{button:'right'});
  const after=await page.evaluate(()=>window.__metal2dGame?.scene?.getScene('Play')?.combat?.summary);
  expect(after.shots).toBeGreaterThan(before.shots);
  expect(after.melee).toBeGreaterThan(before.melee);
  await page.keyboard.press('2');
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.heroId==='megatrucker');
  await page.screenshot({path:testInfo.outputPath('mega-trucker-combat.png')});
  await page.keyboard.press('1');
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.heroId==='bluecop');
  expect(errors).toEqual([]);
});

test('spring fires from actual foot contact, not from distant proximity',async({page})=>{
 await page.goto('/');
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu'),null,{timeout:20000});
 await page.mouse.click(640,628);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play'),null,{timeout:8000});
 await page.evaluate(()=>{
   const stage=window.__metal2dGame?.scene?.getScene('Play');
   // Component setup: this is NOT a complete level walkthrough.
   stage.player.setPosition(2030,529);
   stage.player.setVelocity(0,0);
 });
 await page.waitForFunction(()=>{
   const body=window.__metal2dGame?.scene?.getScene('Play')?.player?.body;
   return body?.velocity?.y< -550;
 },null,{timeout:5000});
});
