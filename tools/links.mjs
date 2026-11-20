import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { software } from '../src/content/software.ts'
const exec = promisify(execFile)
const info = await readFile('src/ui/Info.tsx', 'utf8'),
  base = 'https://portal.inacap.cl/carreras/area-automatizacion-electronica-y-robotica/'
const urls = [
  ...new Set([
    ...software.flatMap((s) => [s.url, s.docs]),
    ...Array.from(info.matchAll(/https:\/\/[^"'\s<>]+/g), (m) => m[0]).filter((u) => u !== base),
    base + 'tecnico-en-automatizacion-y-robotica',
    base + 'ingenieria-en-automatizacion-y-robotica',
    'https://www.geogebra.org/graphing?lang=en',
    'https://www.geogebra.org/classic?lang=en',
    'https://www.geogebra.org/apps/deployggb.js',
  ]),
]
let index = 0,
  bad = 0
async function check() {
  while (index < urls.length) {
    const url = urls[index++]
    try {
      const { stdout } = await exec('curl', [
        '-LsS',
        '--retry',
        '1',
        '--max-time',
        '25',
        '-o',
        '/dev/null',
        '-w',
        '%{http_code}',
        url,
      ])
      console.log(stdout, url)
      if (+stdout < 200 || +stdout >= 400) bad++
    } catch {
      bad++
      console.log('Error de transporte', url)
    }
  }
}
await Promise.all(Array.from({ length: 5 }, check))
console.log(urls.length + ' recursos · ' + bad + ' respuestas requieren revisión')
if (bad) process.exitCode = 1
