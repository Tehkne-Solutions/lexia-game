import { test, expect } from '@playwright/test';

test('Navega para tela de login e interage com o formulario de autenticacao', async ({ page }) => {
  await page.goto('https://lexia-game.vercel.app/login', { waitUntil: 'domcontentloaded' });
  
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  
  await emailInput.fill('teste.aluno@lexia.com');
  await page.fill('input[type="password"]', 'SenhaTeste123!');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
});