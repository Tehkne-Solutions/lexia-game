import { test, expect } from '@playwright/test';

test('Realiza login com usuario de teste e valida sessao autenticada', async ({ page }) => {
  await page.goto('https://lexia-game.vercel.app/login');
  await page.fill('input[type="email"]', 'teste.aluno@lexia.com');
  await page.fill('input[type="password"]', 'SenhaTeste123!');
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  await expect(page).not.toHaveURL(/.*\/login/);
});