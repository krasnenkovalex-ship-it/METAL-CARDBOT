import {test,expect} from '@playwright/test';

test('memory, counting, mirrors and shapes can be completed with touch-sized controls',async({page},testInfo)=>{
  await page.goto('/tests/browser/puzzle-harness.html');
  const open=async(kind:string)=>{
    await page.evaluate(value=>(window as unknown as {openPuzzle:(kind:string)=>void}).openPuzzle(value),kind);
    await expect(page.locator('#challenge')).toBeVisible();
  };
  await open('memory');
  await page.screenshot({path:testInfo.outputPath('memory-puzzle.png')});
  await expect(page.locator('.challenge-sample').first()).toHaveText('?',{timeout:7000});
  for(const color of ['🔵','🟡','🔴'])await page.locator(`#challenge button[data-choice="${color}"]`).click();
  await expect(page.locator('body')).toHaveAttribute('data-completed','memory');
  await open('count');
  for(const index of ['0','1','2','3'])await page.locator(`#challenge button[data-choice="${index}"]`).click();
  await page.locator('#challenge button[data-choice="submit"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-completed','count');
  await open('mirrors');
  await page.screenshot({path:testInfo.outputPath('mirrors-puzzle.png')});
  for(const index of ['0','2'])await page.locator(`#challenge button[data-choice="${index}"]`).click();
  await expect(page.locator('body')).toHaveAttribute('data-completed','mirrors');
  await open('shapes');
  for(const shape of ['●','★','●'])await page.locator(`#challenge button[data-choice="${shape}"]`).click();
  await expect(page.locator('body')).toHaveAttribute('data-completed','shapes');
});
