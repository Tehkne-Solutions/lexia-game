import { test, expect } from '@playwright/test';

test('Navega para a tela de login e interage com o formulario de autenticacao', async ({ page }) => {
  await page.goto('/login?returnTo=%2Fjourney', { waitUntil: 'domcontentloaded' });

  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  await emailInput.fill('teste.aluno@lexia.com');
  await page.fill('input[type="password"]', 'SenhaTeste123!');
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});