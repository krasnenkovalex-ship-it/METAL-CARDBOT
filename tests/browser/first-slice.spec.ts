import {test,expect} from '@playwright/test';

test('keyboard mission opens the gate after the color circuit',async({page},testInfo)=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#menu')).toBeVisible();
  await page.locator('#start').click();
  await expect(page.locator('#form')).toHaveText('🤖 Робот');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🚓 Машина');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🤖 Робот');
  await page.keyboard.down('w');
  await page.waitForTimeout(2200);
  await page.keyboard.up('w');
  await expect(page.locator('#puzzle')).toBeVisible();
  for(const color of ['red','yellow','blue']){
    await page.locator(`#wires [data-color="${color}"]`).click();
    await page.locator(`#sockets [data-color="${color}"]`).click();
  }
  await expect(page.locator('#objective')).toHaveText('Собери три энергоячейки');
  await expect(page.locator('#puzzle')).toBeHidden();
  await page.screenshot({path:testInfo.outputPath('gate-open.png'),fullPage:true});
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
  }finally{await context.close();}
});
