import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
async function files(path) {
  const out = []
  for (const item of await readdir('dist/' + path, { withFileTypes: true })) {
    const next = path + item.name
    if (item.isDirectory()) out.push(...(await files(next + '/')))
    else if (item.name !== 'sw.js') out.push('./' + next)
  }
  return out.sort()
}
const resources = await files(''),
  hash = createHash('sha256')
for (const url of resources) {
  hash.update(url)
  hash.update(await readFile('dist/' + url))
}
const key = 'academia-ar-' + hash.digest('hex').slice(0, 16)
const sw = [
  'const cacheName=' + JSON.stringify(key),
  'const assets=' + JSON.stringify(resources),
  'const base=new URL(self.registration.scope)',
  "self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(cacheName);await cache.addAll(assets.map(s=>new Request(new URL(s,base),{cache:'reload'})));await self.skipWaiting()})()))",
  "self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('academia-ar-')&&k!==cacheName)await caches.delete(k);await self.clients.claim()})()))",
  "self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;const rel='./'+url.pathname.slice(base.pathname.length);if(req.mode==='navigate'){event.respondWith((async()=>{const c=await caches.open(cacheName);return await c.match(new URL('index.html',base))||fetch(req)})());return}if(assets.includes(rel))event.respondWith((async()=>{const c=await caches.open(cacheName);return await c.match(new URL(rel,base))||fetch(req)})())})",
].join(';\n')
await writeFile('dist/sw.js', sw)
console.log('Caché educativa:', resources.length, 'recursos locales,', key)
