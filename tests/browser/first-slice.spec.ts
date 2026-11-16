import {test,expect} from '@playwright/test';

const coordinate=async(page:import('@playwright/test').Page,axis:'X'|'Z'):Promise<number>=>
  Number(await page.locator('#game').getAttribute('data-player-'+axis.toLowerCase()));
const holdUntil=async(page:import('@playwright/test').Page,key:string,axis:'X'|'Z',target:number,direction:'above'|'below'):Promise<void>=>{
  await page.keyboard.down(key);
  try{
    const reading=expect.poll(()=>coordinate(page,axis),{timeout:25000,intervals:[50,100,150]});
    if(direction==='above')await reading.toBeGreaterThan(target);
    else await reading.toBeLessThan(target);
  }finally{await page.keyboard.up(key);}
};

test('keyboard mission opens the gate after the color circuit',async({page},testInfo)=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#menu')).toBeVisible();
  await page.locator('#start').click();
  await expect(page.locator('#form')).toHaveText('🤖 Робот');
  await page.screenshot({path:testInfo.outputPath('robot-start.png'),fullPage:true});
  await page.evaluate(()=>{
    document.documentElement.dataset.lastKey='';
    window.addEventListener('keydown',event=>{document.documentElement.dataset.lastKey=event.code;},{once:true});
  });
  await page.keyboard.press('e');
  await expect(page.locator('html')).toHaveAttribute('data-last-key','KeyE');
  await expect(page.locator('#form')).toHaveText('🚓 Машина',{timeout:12000});
  await page.screenshot({path:testInfo.outputPath('vehicle-start.png'),fullPage:true});
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🤖 Робот');
  await page.keyboard.down('w');
  try{
    await expect(page.locator('#puzzle')).toBeVisible({timeout:20000});
  }finally{await page.keyboard.up('w');}
  await page.screenshot({path:testInfo.outputPath('reactor-puzzle.png'),fullPage:true});
  for(const color of ['red','yellow','blue']){
    await page.locator(`#wires [data-color="${color}"]`).click();
    await page.locator(`#sockets [data-color="${color}"]`).click();
  }
  await expect(page.locator('#objective')).toHaveText('Собери три энергоячейки');
  await expect(page.locator('#puzzle')).toBeHidden();
  await page.keyboard.down('w');
  await page.waitForTimeout(850);
  await page.keyboard.up('w');
  expect(await coordinate(page,'Z')).toBeGreaterThan(.25);
  await holdUntil(page,'d','X',2.1,'above');
  await holdUntil(page,'w','Z',-3.2,'below');
  await holdUntil(page,'a','X',.45,'below');
  await page.keyboard.down('w');
  try{await expect(page.locator('#game')).toHaveAttribute('data-checkpoint','gate',{timeout:25000});}
  finally{await page.keyboard.up('w');}
  await holdUntil(page,'w','Z',-11.7,'below');
  await page.setViewportSize({width:1280,height:720});
  await page.screenshot({path:testInfo.outputPath('gate-and-first-fork-1280.png'),fullPage:true});
  await holdUntil(page,'a','X',-4.1,'below');
  // Software WebGL can deliver a long frame while a key is held. Correct a
  // wall-side overshoot before walking past the tree on the west river path.
  if(await coordinate(page,'X') < -4.8)await holdUntil(page,'d','X',-4.7,'above');
  await holdUntil(page,'w','Z',-18.5,'below');
  await page.screenshot({path:testInfo.outputPath('west-river-bridge-1280.png'),fullPage:true});
  await holdUntil(page,'w','Z',-20.6,'below');
  await expect(page.locator('#game')).toHaveAttribute('data-checkpoint','west-bank');
  await page.screenshot({path:testInfo.outputPath('west-bridge-1280.png'),fullPage:true});
  if(await coordinate(page,'X') < -4.8)await holdUntil(page,'d','X',-4.7,'above');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🚓 Машина',{timeout:12000});
  await holdUntil(page,'w','Z',-23,'below');
  await page.screenshot({path:testInfo.outputPath('vehicle-in-maze-1280.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('mobile controls show the vehicle transformation',async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try{
    await page.goto('/');
    await page.locator('#start').tap();
    await expect(page.locator('#touch')).toBeVisible();
    await page.locator('[data-control="transform"]').tap();
    await expect(page.locator('#form')).toHaveText('🚓 Машина');
    await page.screenshot({path:testInfo.outputPath('mobile-vehicle.png'),fullPage:true});
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#touch')).toBeVisible();
    await page.screenshot({path:testInfo.outputPath('mobile-landscape.png'),fullPage:true});
  }finally{await context.close();}
});
