import {test,expect,type Page} from '@playwright/test';

const location=async(page:Page,axis:'x'|'z'):Promise<number>=>Number(await page.locator('#game').getAttribute('data-player-'+axis));
async function moveAxis(page:Page,axis:'x'|'z',target:number,tolerance=.35):Promise<void>{
  let stalled=0;
  for(let step=0;step<90;step++){
    const before=await location(page,axis);
    const form=await page.locator('#form').textContent();
    const allowed=form?.includes('Машина')?Math.max(tolerance,.72):Math.max(tolerance,.45);
    if(Math.abs(target-before)<=allowed)return;
    const key=axis==='x'?(target>before?'d':'a'):(target>before?'s':'w');
    await page.keyboard.down(key);
    // Software WebGL sometimes has no animation frame inside a short key pulse.
    // Lengthen only stalled pulses, then return to fine corrections.
    await page.waitForTimeout(Math.min(700,120+stalled*70));
    await page.keyboard.up(key);
    await page.waitForTimeout(40);
    const after=await location(page,axis);
    stalled=Math.abs(after-before)<.025?stalled+1:0;
    if(stalled>12)throw new Error(`Blocked on ${axis}: ${after}, wanted ${target}`);
  }
  throw new Error(`Could not reach ${axis}=${target}; at ${await location(page,axis)}`);
}
const chapter=async(page:Page,title:string):Promise<void>=>{
  await expect(page.locator('#chapter-title')).toHaveText(title,{timeout:30000});
  await page.locator('#chapter-start').click();
};

test('all ten story missions are playable in one browser session',async({page},testInfo)=>{
  test.setTimeout(600000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.locator('#start').click();
  await page.keyboard.down('w');
  try{await expect(page.locator('#puzzle')).toBeVisible({timeout:25000});}
  finally{await page.keyboard.up('w');}
  for(const color of ['red','yellow','blue']){
    await page.locator(`#wires [data-color="${color}"]`).click();
    await page.locator(`#sockets [data-color="${color}"]`).click();
  }
  await chapter(page,'Энергия реки');
  await moveAxis(page,'z',-11.8);
  await moveAxis(page,'x',-4.2);
  await moveAxis(page,'z',-21.2);
  await moveAxis(page,'x',0,1.0);
  await expect(page.locator('#progress')).toContainText('2 / 3');
  await moveAxis(page,'x',-4.2);
  await moveAxis(page,'z',-26.9);
  await moveAxis(page,'x',0,1.0);
  await expect(page.locator('#progress')).toContainText('3 / 3');
  await page.keyboard.down('w');
  try{await expect(page.locator('#chapter-title')).toHaveText('Эхо светлячков',{timeout:15000});}
  finally{await page.keyboard.up('w');}
  await chapter(page,'Эхо светлячков');
  await expect(page.locator('#challenge')).toBeVisible({timeout:10000});
  for(const value of ['🔵','🟡','🔴'])await page.locator(`#challenge button[data-choice="${value}"]`).click();
  await chapter(page,'Сонные лианы');
  await page.keyboard.down('w');
  try{
    for(let i=0;i<18;i++){
      if(await page.locator('#game').getAttribute('data-mission')==='patrol')break;
      await page.keyboard.press('j');await page.waitForTimeout(650);
    }
  }finally{await page.keyboard.up('w');}
  await chapter(page,'Полицейский патруль');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🚓 Машина',{timeout:12000});
  await page.keyboard.down('w');
  try{await expect(page.locator('#chapter-title')).toHaveText('Батареи для друга',{timeout:40000});}
  finally{await page.keyboard.up('w');}
  await chapter(page,'Батареи для друга');
  await page.keyboard.down('w');
  try{await expect(page.locator('#challenge')).toBeVisible({timeout:12000});}
  finally{await page.keyboard.up('w');}
  for(const index of ['0','1','2','3'])await page.locator(`#challenge button[data-choice="${index}"]`).click();
  await page.locator('#challenge button[data-choice="submit"]').click();
  await chapter(page,'Зеркальная тропа');
  await expect(page.locator('#challenge')).toBeVisible({timeout:10000});
  for(const index of ['0','2'])await page.locator(`#challenge button[data-choice="${index}"]`).click();
  await chapter(page,'Дружелюбные дроны');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🤖 Робот',{timeout:12000});
  for(let i=0;i<2;i++){await page.keyboard.press('k');await page.waitForTimeout(750);}
  await moveAxis(page,'z',-26.4);
  for(let i=0;i<10;i++){
    if(await page.locator('#game').getAttribute('data-mission')==='shapes')break;
    await page.keyboard.press('k');await page.waitForTimeout(900);
  }
  await chapter(page,'Шестерёнки узора');
  await page.keyboard.down('w');
  try{await expect(page.locator('#challenge')).toBeVisible({timeout:12000});}
  finally{await page.keyboard.up('w');}
  for(const value of ['●','★','●'])await page.locator(`#challenge button[data-choice="${value}"]`).click();
  await chapter(page,'Дорога домой');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🚓 Машина',{timeout:12000});
  await moveAxis(page,'x',4.2);
  await moveAxis(page,'z',-21);
  await expect(page.locator('#game')).toHaveAttribute('data-mission-progress','1');
  await page.keyboard.press('e');
  await expect(page.locator('#form')).toHaveText('🤖 Робот',{timeout:12000});
  await moveAxis(page,'z',-26.9);
  await moveAxis(page,'x',0,1.0);
  await page.keyboard.down('w');
  try{await expect(page.locator('#win')).toBeVisible({timeout:15000});}
  finally{await page.keyboard.up('w');}
  await page.screenshot({path:testInfo.outputPath('campaign-finale.png'),fullPage:true});
  expect(errors).toEqual([]);
});
