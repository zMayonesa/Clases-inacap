import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir, readFile } from 'node:fs/promises'
import { chromium, devices } from '@playwright/test'
const url = 'https://zmayonesa.github.io/Clases-inacap/',
  exec = promisify(execFile)
async function walk(dir = '') {
  const paths = []
  for (const e of await readdir('dist/' + dir, { withFileTypes: true })) {
    if (e.isDirectory()) paths.push(...(await walk(dir + e.name + '/')))
    else paths.push(dir + e.name)
  }
  return paths
}
const paths = await walk()
let index = 0
async function verify() {
  while (index < paths.length) {
    const p = paths[index++]
    const { stdout } = await exec(
      'curl',
      ['-fsSL', '--retry', '1', '--max-time', '35', url + (p === 'index.html' ? '' : p)],
      { encoding: 'buffer', maxBuffer: 4e6 },
    )
    if (!(await readFile('dist/' + p)).equals(stdout)) throw Error('La copia pública difiere: ' + p)
  }
}
await Promise.all(Array.from({ length: 4 }, verify))
console.log('URL pública y ' + paths.length + ' archivos del build comprobados byte a byte.')
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  ...(proxy ? { proxy: { server: new URL(proxy).origin } } : {}),
})
try {
  const ctx = await browser.newContext({
    ...devices['Pixel 7'],
    ignoreHTTPSErrors: process.env.ACADEMIA_PROXY_TLS === '1',
  })
  const page = await ctx.newPage()
  await page.goto(url)
  await page.getByRole('heading', { name: 'Panel de estudio' }).waitFor()
  await page.goto(url + '#/tablero/estrella')
  await page.getByRole('button', { name: 'Evaluar circuito' }).click()
  await page.getByText('✓ Cumple · Conmutación a triángulo').waitFor()
  console.log('Ensayo estrella–triángulo correcto en producción.')
  await page.goto(url + '#/lab/geo-6')
  await page.getByRole('button', { name: 'Cargar GeoGebra' }).click()
  const verifyExample = page.getByRole('button', { name: 'Introducir y comprobar ejemplo' })
  await verifyExample.waitFor({ timeout: 100000 })
  await verifyExample.click()
  await page.getByText('Ejemplo comprobado por GeoGebra: v = 1.').waitFor()
  console.log('GeoGebra Classic cargó y comprobó el determinante desde la academia pública.')
  await page.goto(url + '#/clase/instrumentacion/2')
  await page.getByRole('heading', { name: 'Lazos de 4–20 mA y señales de 0–10 V' }).waitFor()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await ctx.setOffline(true)
  await page.reload()
  await page.getByRole('heading', { name: 'Lazos de 4–20 mA y señales de 0–10 V' }).waitFor()
  console.log('Clase pública reabierta sin conexión en perfil Android emulado.')
} finally {
  await browser.close()
}
