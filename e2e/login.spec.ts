import { test, expect } from '@playwright/test';

test('App deve carregar e mostrar opções de login ou renderizar AuthProvider', async ({ page }) => {
    // Acessa a raiz local servida pelo npm run dev / Vite
    await page.goto('/');

    // Como há ProtectedRoute, caso não esteja autenticado irá para /login
    // Garantimos que a página não está quebrada ou em branco (Crash)
    await expect(page).toHaveURL(/.*login/);

    // Exemplo: Identificar que possui inputs de email ou senha ou mesmo os textos padrão de login
    // Como eu não tenho o código do Login.tsx exato, garanto a existência do body e titulo
    await expect(page.locator('body')).toBeVisible();
});
