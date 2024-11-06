import { test, expect } from '@playwright/test';

const ScreenshotOptions  = {
  animations: 'disabled' as const, 
  maxDiffPixels: 200
};

test('Home Page Top', async ({ page }) => {
  await page.goto('/');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Search and analyze the world\'s research/);
  await expect(page).toHaveScreenshot('home-top.png', ScreenshotOptions);
});

test('Home Page Bottom', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Learn more').click();
  await expect(page).toHaveScreenshot('home-bottom.png', ScreenshotOptions);
});

test('Home Page Login Button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveScreenshot('home-login.png', ScreenshotOptions);
});

test('Home Page Sign Up Button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page).toHaveScreenshot('home-SignUp.png', ScreenshotOptions);
});

test('Home Page info Button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button').nth(2).click()
  await expect(page).toHaveScreenshot('home-info-menu.png', ScreenshotOptions);
});

test('Home Page Search', async ({ page }) => {
  await page.goto('/');
  await page.getByText('coriander OR cilantro').click();
  await expect(page).toHaveScreenshot('home-search-open.png', ScreenshotOptions);
  
  await page.getByText('press Enter').click();
  await expect(page).toHaveScreenshot('home-search-results.png', ScreenshotOptions);
});

test('Home Page Final Footer', async ({ page }) => {
  await page.goto('/');
  await  page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page).toHaveScreenshot('home-final.png', ScreenshotOptions);
});
