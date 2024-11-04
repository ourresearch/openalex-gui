import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://openalex.org/works');
  await page.getByRole('button', { name: 'Unsaved search' }).click();
  await expect(page.getByRole('dialog')).toContainText('Login required');
  await page.locator('.v-overlay__scrim').click();
 
  await page.getByRole('main').locator('header').filter({ hasText: 'Works' }).getByRole('button').nth(2).click();
  await page.locator('header').filter({ hasText: 'Stats' }).getByRole('button').click();
  
  await page.getByText('No filters applied').click({
    button: 'right'
  });
  
  await page.getByRole('button', { name: 'works' }).click();
  await page.locator('div').filter({ hasText: /^sources$/ })
  await page.getByRole('button', { name: 'works' }).click();
  await page.getByText('No filters applied');

  await page.getByRole('button', { name: 'Unsaved search' }).click();
  await page.locator('div').filter({ hasText: 'Login required To save' }).nth(2).press('Escape');
  await page.getByRole('button', { name: 'works' }).click();
  await page.getByRole('button', { name: 'works' }).click();
  await page.getByText('What are you looking for?').click();

  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('#app')).toContainText('Your email'); 

  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.locator('#app')).toContainText('Signing up for an OpenAlex ');
  await page.locator('.v-overlay__scrim').click();
  await expect(page.getByRole('main')).toContainText('No filters applied');
  await expect(page.getByRole('main')).toContainText('open access');
  await expect(page.getByRole('main')).toContainText('topic');
  await page.locator('header').filter({ hasText: 'Stats' }).getByRole('button').click();
  await page.getByText('More', { exact: true }).click();
  await expect(page.locator('#app')).toContainText('More Count options');
  await page.locator('header').filter({ hasText: 'More Count options' }).getByRole('button').click();
  await page.getByRole('main').locator('header').filter({ hasText: 'Works' }).getByRole('button').nth(2).click();
  await page.getByRole('main').locator('header').filter({ hasText: 'Works' }).getByRole('button').nth(2).click();
  await page.getByRole('menuitem', { name: '10', exact: true }).click();
  await page.locator('header').filter({ hasText: 'Unsaved search' }).getByRole('button').nth(1).click();
  await expect(page.locator('#app')).toContainText('Login required');
  await page.locator('.v-overlay__scrim').click();
  await page.getByText('Show on page:').click();
  await page.locator('header').filter({ hasText: 'Unsaved search' }).getByRole('button').nth(3).click();
  await page.getByText('Get QR code to share').click();
  await expect(page.locator('#app')).toContainText('QR code for this page:');
  await page.locator('.v-overlay__scrim').click();
  await expect(page.getByRole('contentinfo')).toContainText('Made by OurResearch with support from Arcadia.');
});
