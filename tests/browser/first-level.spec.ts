import {test,expect} from '@playwright/test';
declare global{interface Window{__metal2dGame?:any}}
test('menu renders, level starts, puzzle auto opens and solves',async({page},testInfo)=>{
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 const canvas=page.locator('canvas');
 await expect(canvas).toBeVisible();
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Menu')===true,null,{timeout:20000});
 await page.screenshot({path:testInfo.outputPath('forest-menu.png')});
 await page.mouse.click(337,474);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')===true);
 await page.screenshot({path:testInfo.outputPath('forest-platformer.png')});
 await page.keyboard.down('d');
 try{await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Puzzle')===true,null,{timeout:16000});}
 finally{await page.keyboard.up('d');}
 await page.screenshot({path:testInfo.outputPath('first-logic-task.png')});
 await page.mouse.click(388,407);
 await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')===true,null,{timeout:8000});
 const unlocked=await page.evaluate(()=>window.__metal2dGame?.scene?.getScene('Play')?.completed?.has('bridge'));
 expect(unlocked).toBe(true);
 await page.screenshot({path:testInfo.outputPath('bridge-open.png')});
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
  await page.touchscreen.tap(box!.x+box!.width*(337/1280),box!.y+box!.height*(474/720));
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.isActive('Play')===true,null,{timeout:12000});
  const rect=await canvas.boundingBox();
  await page.touchscreen.tap(rect!.x+rect!.width*(1184/1280),rect!.y+rect!.height*(621/720));
  await page.waitForFunction(()=>window.__metal2dGame?.scene?.getScene('Play')?.car===true,null,{timeout:8000});
  await page.screenshot({path:testInfo.outputPath('mobile-car.png')});
  expect(errors).toEqual([]);
 }finally{await context.close();}
});
