import { test, expect, type Page } from '@playwright/test';

// Centraliza el registro + la espera real de que la sesion quedo activa
// antes de continuar. Sin esta espera, el siguiente paso puede ejecutarse
// mientras el registro (llamada async al backend + guardado de token)
// todavia esta en curso.
async function registerNewUser(page: Page): Promise<string> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

  await page.goto('/register');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder(/Contrasena/).fill('password123');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page).toHaveURL('/');
  return email;
}

test.describe('Flujo principal de Job Helper', () => {
  test('registro, login y creacion de candidatura', async ({ page }) => {
    await registerNewUser(page);

    await expect(page.getByText('Mis candidaturas')).toBeVisible();

    await page.getByRole('button', { name: /Nueva candidatura/ }).click();
    await page.getByLabel('Empresa').fill('Acme Corp');
    await page.getByLabel('Puesto').fill('Backend Developer');
    await page.getByLabel('Descripcion de la oferta').fill('Buscamos un backend developer con Node.js');
    await page.getByRole('button', { name: 'Crear candidatura' }).click();

    await expect(page.getByText('Backend Developer')).toBeVisible();
  });

  test('completar perfil y generar un CV (Gemini mockeado)', async ({ page }) => {
    await registerNewUser(page);

    await page.goto('/profile');
    await page.getByLabel('Nombre completo').fill('Usuario E2E');
    await page.getByRole('button', { name: 'Guardar perfil' }).click();
    await expect(page.getByText('Perfil guardado')).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: /Nueva candidatura/ }).click();
    await page.getByLabel('Empresa').fill('Acme Corp');
    await page.getByLabel('Puesto').fill('Backend Developer');
    await page.getByLabel('Descripcion de la oferta').fill('Oferta de prueba');
    await page.getByRole('button', { name: 'Crear candidatura' }).click();

    await page.getByText('Backend Developer').click();
    await page.getByRole('button', { name: 'Generar CV' }).click();
    await page.getByRole('button', { name: 'Generar', exact: true }).click();

    await expect(page.getByText('CV generado')).toBeVisible();
    await expect(page.getByText('Usuario E2E')).toBeVisible();
  });
});