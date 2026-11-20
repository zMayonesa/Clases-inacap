import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { courses, extras } from '../../src/content/catalog'
import { labs } from '../../src/content/labs'
async function go(page: Page, path: string) {
  await page.goto('./#/' + path)
  await expect(page.locator('main h1').first()).toBeVisible()
}
test('Panel móvil, navegación táctil, tema persistente y contenido de las seis asignaturas', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await go(page, '')
  await expect(page.getByRole('heading', { name: 'Panel de estudio' })).toBeVisible()
  await page.getByRole('button', { name: 'Activar modo claro' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page
    .getByRole('navigation', { name: 'Accesos móviles' })
    .getByRole('link', { name: 'Cursos' })
    .click()
  for (const c of [...courses, ...extras]) {
    await go(page, 'curso/' + c.id)
    await expect(page.getByRole('heading', { name: c.name, exact: true })).toBeVisible()
    await expect(page.locator('.lesson-row')).toHaveCount(c.lessons.length)
    await page.locator('.lesson-row').first().click()
    await expect(page.getByRole('heading', { name: 'Fundamentos' })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Abrir navegación' }).click()
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('link', { name: 'Calendario' })
    .click()
  await expect(page.getByRole('heading', { name: 'Plan de ocho semanas' })).toBeVisible()
  expect(errors).toEqual([])
})
test('Las guías del catálogo se abren y enlazan el ejercicio, rúbrica y trabajo correctos', async ({
  page,
}) => {
  for (const lab of labs) {
    await go(page, 'lab/' + lab.id)
    await expect(page.locator('main h1').first()).toHaveText(lab.title)
    await expect(page.getByRole('link', { name: 'Registrar resultados' })).toHaveAttribute(
      'href',
      '#/trabajo/' + lab.id,
    )
    await expect(page.getByRole('heading', { name: 'Criterios de autoevaluación' })).toBeVisible()
  }
})
test('Evaluación, historial, error, recomendación y reintento acreditado', async ({ page }) => {
  await go(page, 'clase/electronica/1')
  let quiz = page.locator('.quiz')
  await quiz.getByLabel('En serie con la fuente', { exact: false }).check()
  await quiz.getByRole('textbox').fill('18')
  await quiz.getByRole('button', { name: 'Corregir respuestas' }).click()
  await expect(quiz.getByText('0 de 2 respuestas correctas.')).toBeVisible()
  await go(page, 'progreso')
  await expect(page.getByText('Si R = 100 Ω e I = 0,2 A, ¿cuál es V?').first()).toBeVisible()
  await go(page, 'clase/electronica/1')
  quiz = page.locator('.quiz')
  await quiz.getByLabel('En paralelo con R', { exact: false }).check()
  await quiz.getByRole('textbox').fill('20,0')
  await quiz.getByRole('button', { name: 'Corregir respuestas' }).click()
  await expect(quiz.getByText('2 de 2 respuestas correctas.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Historial · 2 intentos')).toBeVisible()
  await go(page, 'progreso')
  await expect(page.getByText('1 / 36')).toBeVisible()
})
test('Tablero real, arranque, emergencia, fase abierta y reparación desde selectores táctiles', async ({
  page,
}) => {
  await go(page, 'tablero/directo')
  await page.getByRole('button', { name: 'Ejecutar', exact: true }).click()
  await page.getByRole('button', { name: /QF · Alimentación/ }).click()
  await page.getByRole('button', { name: 'S1 · Marcha' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('En régimen', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: /SE · Emergencia/ }).click()
  await expect(page.getByText('Detenido', { exact: true }).first()).toBeVisible()
  await go(page, 'tablero/diagnostico')
  await page.getByRole('button', { name: 'Evaluar circuito' }).click()
  await expect(page.getByText('× Revisar · Tres fases alimentan el motor')).toBeVisible()
  await page.getByText('Editor de componentes y conductores', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Origen', exact: true }).selectOption('fr.6')
  await page.getByRole('combobox', { name: 'Destino', exact: true }).selectOption('m.W')
  await page.getByRole('combobox', { name: 'Tipo de cable', exact: true }).selectOption('fuerza')
  await page.getByRole('button', { name: 'Conectar', exact: true }).click()
  await page.getByRole('button', { name: 'Evaluar circuito' }).click()
  await expect(page.getByText('✓ Cumple · Tres fases alimentan el motor')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Evaluar circuito' }).click()
  await expect(page.locator('.checklist')).not.toContainText('Revisar')
})
test('Construir un proyecto vacío, añadir y mover un componente, conectar y guardar una copia', async ({
  page,
}) => {
  await go(page, 'tablero/pulso')
  await page.getByRole('button', { name: 'Construir desde cero' }).click()
  await expect(page.locator('.part-body')).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Biblioteca', exact: true }).selectOption('dc')
  await page.getByRole('button', { name: 'Agregar componente' }).click()
  await expect(page.locator('.part-body')).toHaveCount(1)
  await page.getByRole('combobox', { name: 'Biblioteca', exact: true }).selectOption('start')
  await page.getByRole('button', { name: 'Agregar componente' }).click()
  await expect(page.locator('.part-body')).toHaveCount(2)
  await page.getByLabel('Posición X').fill('200')
  await page.getByLabel('Posición X').blur()
  await expect(page.locator('.board-part.selected .part-body')).toHaveAttribute('x', '200')
  await page.getByRole('combobox', { name: 'Origen', exact: true }).selectOption({ index: 1 })
  await page.getByRole('combobox', { name: 'Destino', exact: true }).selectOption({ index: 3 })
  await page.getByRole('button', { name: 'Conectar', exact: true }).click()
  await expect(page.locator('.conductor')).toHaveCount(1)
  await page.getByText('Proyecto, exportación y lista de bornes').click()
  await page.getByRole('button', { name: 'Guardar una copia' }).click()
  await page.reload()
  await expect(page.locator('.conductor')).toHaveCount(1)
})
test('Informe imprimible con adjunto y ciclo completo de respaldo', async ({ page }) => {
  await go(page, 'trabajo/lazo')
  await page.getByLabel('Nombre para la portada').fill('Estudiante de prueba')
  await page.getByLabel('Resultados y unidades').fill('Con 12 mA el transmisor indica 5 bar.')
  await page.getByLabel('Adjuntar evidencias').setInputFiles([
    { name: 'medidas.csv', mimeType: 'text/csv', buffer: Buffer.from('mA,bar\n12,5') },
    { name: 'esquema.png', mimeType: 'image/png', buffer: await readFile('public/icon-192.png') },
  ])
  await expect(page.getByRole('link', { name: 'medidas.csv' })).toBeVisible()
  for (const box of await page.locator('.choice input[type=checkbox]').all()) await box.check()
  await page.getByRole('button', { name: 'Registrar autoevaluación' }).click()
  await expect(page.getByText('Autoevaluación registrada.')).toBeVisible()
  await page.getByRole('link', { name: 'Preparar informe PDF' }).click()
  await expect(page.locator('.report-paper')).toContainText('Con 12 mA')
  await expect(page.locator('.report-paper')).toContainText('Estudiante de prueba')
  await page.evaluate(() => {
    window.print = () => document.documentElement.setAttribute('data-printed', 'yes')
  })
  await page.getByRole('button', { name: 'Imprimir / guardar PDF' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'yes')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.topbar')).toBeHidden()
  const pdf = await page.pdf({ format: 'A4' })
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  expect(pdf.length).toBeGreaterThan(5000)
  expect(pdf.toString('latin1')).toMatch(/\/Subtype\s*\/Image/)
  await page.emulateMedia({ media: 'screen' })
  await go(page, 'respaldo')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar respaldo' }).click()
  const path = await (await downloading).path()
  const buf = await readFile(path!)
  const data = JSON.parse(buf.toString())
  expect(data.files.map((f: { name: string }) => f.name).sort()).toEqual([
    'esquema.png',
    'medidas.csv',
  ])
  await go(page, 'trabajo/lazo')
  await page.getByLabel('Resultados y unidades').fill('Borrador sin importar')
  await go(page, 'respaldo')
  page.once('dialog', (d) => d.accept())
  await page
    .getByLabel('Elegir respaldo JSON')
    .setInputFiles({ name: 'academia.json', mimeType: 'application/json', buffer: buf })
  await expect(page.getByText('Respaldo restaurado con sus evidencias.')).toBeVisible()
  await go(page, 'trabajo/lazo')
  await expect(page.getByLabel('Resultados y unidades')).toHaveValue(
    'Con 12 mA el transmisor indica 5 bar.',
  )
})
test('Tarea de dibujo, guardado, exportación SVG y PDF', async ({ page }) => {
  await go(page, 'dibujo')
  await page.getByRole('combobox', { name: 'Herramienta', exact: true }).selectOption('coil')
  await page.getByRole('button', { name: 'Insertar por coordenadas' }).click()
  await page.reload()
  await expect(page.getByLabel('Elemento del plano').locator('option')).toHaveCount(2)
  const d = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar SVG' }).click()
  const exported = await readFile((await (await d).path())!, 'utf8')
  expect(exported).toContain('KM1')
  expect(exported).toContain('720mm')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.cad-paper')).toBeVisible()
  expect((await page.pdf()).length).toBeGreaterThan(1000)
})
test('Una recarga conserva la última anotación aunque IndexedDB siga ocupado', async ({ page }) => {
  await go(page, 'trabajo/lazo')
  // Una segunda conexión retiene la transacción hasta que se descarga la página.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const connection = indexedDB.open('academia-ar-v2')
    connection.onerror = () => reject(connection.error)
    connection.onsuccess = () => {
      const store = connection.result.transaction('records', 'readwrite').objectStore('records')
      const deadline = Date.now() + 15000
      function hold() {
        const request = store.get('migrated')
        request.onsuccess = () => {
          resolve()
          if (Date.now() < deadline) hold()
        }
      }
      hold()
    }
  }))
  const results = page.getByLabel('Resultados y unidades')
  await results.fill('Lectura final de 18 mA')
  await page.reload()
  await expect(results).toHaveValue('Lectura final de 18 mA')
  await page.reload()
  await expect(results).toHaveValue('Lectura final de 18 mA')
})
test('Controles de cálculo, matrices, registro y hoja de costos', async ({ page }) => {
  await go(page, 'lab/geo-2')
  await expect(page.locator('.readings')).toContainText('(2; 7)')
  await expect(page.getByRole('link', { name: 'Abrir herramienta oficial' })).toHaveAttribute(
    'href',
    /geogebra.org\/graphing/,
  )
  await go(page, 'lab/geo-5')
  await expect(page.locator('.readings')).toContainText('[19, 22]')
  await go(page, 'lab/modbus')
  await expect(page.locator('.readings')).toContainText('35,7 L')
  await page.getByLabel('IPv4 de la HMI').fill('192.168.1.130')
  await expect(page.locator('.readings')).toContainText('Subredes distintas')
  await go(page, 'lab/presupuesto')
  await expect(page.locator('.readings')).toContainText('66.000')
  const d = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar hoja CSV' }).click()
  expect((await d).suggestedFilename()).toBe('presupuesto.csv')
})
test('PWA sin conexión y rutas internas después de recarga', async ({ page, context }) => {
  await go(page, '')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect(page.getByText('Disponible offline')).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Panel de estudio' })).toBeVisible()
  await go(page, 'clase/matematicas/3')
  await expect(
    page.getByRole('heading', { name: 'Funciones cuadráticas y parábolas' }),
  ).toBeVisible()
  await go(page, 'lab/lazo')
  await expect(page.locator('.readings')).toContainText('5 bar')
  await context.setOffline(false)
})
test('Accesibilidad WCAG A/AA y anchura móvil en vistas principales', async ({ page }) => {
  test.setTimeout(120000)
  for (const route of [
    '',
    'curso/matematicas',
    'clase/maquinas/1',
    'laboratorios',
    'tablero/directo',
    'trabajo/lazo',
    'prueba/diagnostico',
    'dibujo',
    'plan',
    'progreso',
  ]) {
    await go(page, route)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      route,
    ).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      route,
    ).toBeTruthy()
  }
  await go(page, '')
  await page.getByRole('button', { name: 'Activar modo claro' }).click()
  const light = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(
    light.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => [n.target, n.failureSummary]),
    })),
  ).toEqual([])
})
test('Panel de escritorio, navegación por teclado y vista estrecha', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 940 })
  await go(page, '')
  await expect(page.getByRole('navigation', { name: 'Menú principal' })).toBeVisible()
  await page.getByRole('link', { name: 'Comenzar clase' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Del campo giratorio al eje' })).toBeVisible()
  await page.setViewportSize({ width: 360, height: 740 })
  await go(page, '')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})
