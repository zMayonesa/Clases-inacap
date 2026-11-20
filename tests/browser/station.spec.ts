import { test, expect } from '@playwright/test'
test('El proyecto integra nivel, motor, HMI y guarda una observación real en el informe', async ({
  page,
}) => {
  await page.goto('./#/proyecto')
  await page.getByRole('button', { name: 'Habilitar estación' }).click()
  await page.getByRole('button', { name: 'Avanzar estación 1 s' }).click()
  const bank = page
    .locator('.panel')
    .filter({ has: page.getByRole('heading', { name: 'Ensayo integrado de la estación' }) })
  await expect(bank.locator('.readings')).toContainText('Retenido')
  await bank.getByLabel('Enlace HMI').uncheck()
  await expect(bank.locator('.readings')).toContainText('Sin enlace físico')
  await page.getByRole('button', { name: 'Registrar observación en el informe final' }).click()
  await expect(page.getByRole('status')).toContainText('Observación agregada')
  await page.goto('./#/trabajo/proyecto-5')
  await expect(page.getByLabel('Resultados y unidades')).toHaveValue(
    /HMI Sin enlace físico.*KM1 activo/,
  )
})
