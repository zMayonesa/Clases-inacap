import 'fake-indexeddb/auto'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attach,
  backup,
  boot,
  change,
  detach,
  fileById,
  getSnapshot,
  restore,
} from '../src/core/storage'
import { emptyWork, type Work } from '../src/core/grading'
import { template } from '../src/board/practices'
test('Migración, escrituras concurrentes, evidencias y restauración transaccional', async (t) => {
  await boot(
    { getItem: (k) => (k === 'ar_done' ? '{"0":true,"2":true}' : k === 'ar_w3' ? '1' : null) },
    false,
  )
  await t.test('Recupera las seis antiguas respuestas y marcas sin otorgar clases nuevas', () => {
    assert.deepEqual(getSnapshot().legacy, { weeks: [4], diagnostic: { 0: true, 2: true } })
    assert.equal(getSnapshot()['attempt:maquinas-1'], undefined)
  })
  await t.test('Conserva dos actualizaciones simultáneas sin perder campos', async () => {
    await Promise.all([
      change('work:lazo', emptyWork, (w) => ({
        ...w,
        fields: { ...w.fields, results: '12 mA, 5 bar' },
      })),
      change('work:lazo', emptyWork, (w) => ({
        ...w,
        fields: { ...w.fields, author: 'Estudiante' },
      })),
    ])
    assert.equal((getSnapshot()['work:lazo'] as Work).fields.results, '12 mA, 5 bar')
  })
  await t.test('Serializa y restaura bytes y referencias de los adjuntos', async () => {
    const f = new File([Uint8Array.from([0, 128, 255, 13])], 'prueba.bin', {
      type: 'application/octet-stream',
    })
    await attach('work:lazo', [f])
    await change(
      'board:mi-copia',
      {},
      { name: 'Mi circuito', practice: 'directo', circuit: template('directo') },
    )
    const b = await backup()
    assert.equal(b.files.length, 1)
    await detach('work:lazo', b.files[0].id)
    assert.equal((await backup()).files.length, 0)
    await restore(JSON.parse(JSON.stringify(b)))
    const id = (getSnapshot()['work:lazo'] as Work).files[0]
    assert.deepEqual(
      [...new Uint8Array(await (await fileById(id))!.blob.arrayBuffer())],
      [0, 128, 255, 13],
    )
    assert.deepEqual(getSnapshot()['board:mi-copia'], b.records['board:mi-copia'])
  })
  await t.test('Un respaldo incompatible o truncado conserva los datos anteriores', async () => {
    const b = await backup()
    await assert.rejects(restore({ ...b, version: 2 }))
    await assert.rejects(restore({ ...b, files: [] }))
    const bad = structuredClone(b)
    bad.records['board:mi-copia'] = {
      name: 'X',
      practice: 'pulso',
      circuit: { parts: [], wires: [{ id: 'bad', a: 'x', b: 'y' }] },
    }
    await assert.rejects(restore(bad))
    assert.deepEqual(await backup(), b)
  })
  await t.test('Al abrir otra sesión, el estado se recupera desde IndexedDB', async () => {
    const old = await backup()
    await boot({ getItem: () => null }, false)
    assert.deepEqual(await backup(), old)
  })
})
