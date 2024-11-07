import { test, expect } from '@playwright/test';

const ScreenshotOptions  = {
  animations: 'disabled' as const, 
  threshold: 0.95
};

test('Home Page Top', async ({ page }) => {
  await page.goto('/');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/OpenAlex/);
  await expect(page).toHaveScreenshot('home-top.png', ScreenshotOptions);
});

test('Home Page Bottom', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Learn more').click();
  await expect(page).toHaveScreenshot('home-bottom.png', ScreenshotOptions);
});

// test('Home Page Login Button', async ({ page }) => {
//   await page.goto('/');
//   await page.getByRole('button', { name: 'Log in' }).click()
//   await expect(page).toHaveScreenshot('home-login.png', ScreenshotOptions);
// });

// test('Home Page Sign Up Button', async ({ page }) => {
//   await page.goto('/');
//   await page.getByRole('button', { name: 'Sign up' }).click()
//   await expect(page).toHaveScreenshot('home-SignUp.png', ScreenshotOptions);
// });

// test('Home Page info Button', async ({ page }) => {
//   await page.goto('/');
//   await page.getByRole('button').nth(2).click()
//   await expect(page).toHaveScreenshot('home-info-menu.png', ScreenshotOptions);
// });

test('Home Page Search', async ({ page }) => {
  await page.goto('/');
  await page.getByText('coriander OR cilantro').click();
  await expect(page).toHaveScreenshot('home-search-open.png', ScreenshotOptions);
  
 
});

test('Home Page Final Footer', async ({ page }) => {
  await page.goto('/');
  await  page.evaluate(() => document.querySelector('footer')?.scrollIntoView({ behavior: 'instant'}));
  await expect(page).toHaveScreenshot('home-final.png', ScreenshotOptions);
});
