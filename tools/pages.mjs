import { copyFile, mkdir, readdir, readFile, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url)),
  dist = path.join(root, 'dist')
const dir = 'academia-assets'
const rootOutputs = [
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'sw.js',
  'terceros.txt',
]
const check = process.argv.includes('--check'),
  changed = []
const built = await readdir(path.join(dist, dir)),
  published = path.join(root, dir)
if (!check) await mkdir(published, { recursive: true })
for (const name of [...rootOutputs, ...built.map((f) => dir + '/' + f)]) {
  const src = path.join(dist, name),
    dst = path.join(root, name)
  if (check) {
    const [a, b] = await Promise.all([readFile(src), readFile(dst).catch(() => Buffer.alloc(0))])
    if (!a.equals(b)) changed.push(name)
  } else await copyFile(src, dst)
}
for (const name of await readdir(published).catch(() => [])) {
  if (built.includes(name)) continue
  if (check) changed.push(dir + '/' + name)
  else await unlink(path.join(published, name))
}
if (changed.length)
  throw Error(
    'Salida de Pages desactualizada: ' + changed.join(', ') + '. Ejecuta npm run pages:prepare.',
  )
console.log(
  check ? 'La raíz de Pages coincide con el build.' : 'Build preparado en la raíz de Pages.',
)
