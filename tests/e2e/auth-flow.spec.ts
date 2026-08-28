import { test, expect } from '@playwright/test';

test('Visitante deslogado e redirecionado para login ao clicar em continuar missao', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Continuar missão');
  await expect(page).toHaveURL(/.*\/login/);
  await expect(page.locator('text=Entrar no Lexia')).toBeVisible({ timeout: 10000 });
});