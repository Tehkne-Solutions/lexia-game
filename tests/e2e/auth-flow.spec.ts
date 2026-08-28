import { test, expect } from '@playwright/test';

test('Visitante clica em continuar missao e e direcionado para a jornada ou login', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.click('text=Continuar missão');
  await expect(page).toHaveURL(/.*(\/login|\/journey)/);
});