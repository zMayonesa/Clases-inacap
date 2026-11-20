import { useState } from 'react'
import { courses, courseBy, initialChecks, lessonId, lessonRoute } from '../content/catalog'
import { finalQuestions } from '../content/finals'
import type { Question } from '../content/schema'
import { grade, type Attempt, type Answer } from '../core/grading'
import { dateKey, shiftDay } from '../core/plan'
import { change } from '../core/storage'
import { Flow, Head, LinkBtn } from './common'
import { useRecord, useRecords } from './hooks'
export type QuizItem = { q: Question; course: string; index: number }
export function Quiz({ id, items, title }: { id: string; items: QuizItem[]; title: string }) {
  const [answers, A] = useState<Record<number, string>>({}),
    [result, R] = useState<Attempt | null>(null),
    [msg, M] = useState(''),
    [busy, B] = useState(false)
  const [past, save] = useRecord<Attempt[]>('attempt:' + id, [])
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || result) return
    if (items.some((_, i) => !answers[i]?.trim())) {
      M('Responde cada pregunta antes de corregir.')
      return
    }
    B(true)
    const marked: Answer[] = items.map(({ q, course, index }, i) => ({
      lesson: lessonId(course, index),
      prompt: q.prompt,
      value: answers[i],
      ok: grade(q, answers[i]),
      explanation: q.explanation,
    }))
    const attempt = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      items: marked,
      passed: marked.every((x) => x.ok),
    }
    try {
      await save((h) => [...h, attempt])
      const dates = new Set(marked.map((a) => a.lesson))
      for (const l of dates) {
        const ok = marked.filter((a) => a.lesson === l).every((a) => a.ok)
        await change('review:' + l, { stage: 0, due: '' }, (prior) =>
          ok && prior.due ? prior : { stage: 0, due: shiftDay(dateKey(new Date()), ok ? 1 : 0) },
        )
      }
      R(attempt)
      M('Intento guardado en este dispositivo.')
    } catch {
      M('No se pudo guardar el intento. Puedes volver a intentar la corrección.')
    } finally {
      B(false)
    }
  }
  return (
    <section className="panel quiz">
      <h2>{title}</h2>
      <p>
        {items.length} preguntas · La corrección incluye procedimiento y repaso. Responde los
        números en las unidades indicadas.
      </p>
      <form onSubmit={submit}>
        {items.map(({ q, course, index }, i) => (
          <fieldset key={i} disabled={!!result}>
            <legend>
              {i + 1}. {q.prompt} {q.unit && '(' + q.unit + ')'}
            </legend>
            {q.diagram && <Flow steps={q.diagram} label="Diagrama de la pregunta" />}
            {q.options ? (
              q.options.map((s, j) => (
                <label className="choice" key={s}>
                  <input
                    type="radio"
                    name={id + '-' + i}
                    value={s}
                    checked={answers[i] === s}
                    onChange={() => A({ ...answers, [i]: s })}
                  />
                  <span className="opt-key">{String.fromCharCode(65 + j)}</span>
                  {s}
                </label>
              ))
            ) : (
              <label>
                Respuesta {q.unit && 'en ' + q.unit}
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  value={answers[i] || ''}
                  onChange={(e) => A({ ...answers, [i]: e.target.value })}
                />
              </label>
            )}
            {result && (
              <div className={result.items[i].ok ? 'feedback good' : 'feedback revise'}>
                <strong>
                  {result.items[i].ok ? 'Correcto' : 'Revisar'} · {String(q.answer)} {q.unit}
                </strong>
                <p>{q.explanation}</p>
                {!result.items[i].ok && (
                  <a href={lessonRoute(course, index)}>Repasar esta clase →</a>
                )}
              </div>
            )}
          </fieldset>
        ))}
        {result ? (
          <>
            <p>
              <strong>
                {result.items.filter((x) => x.ok).length} de {items.length} respuestas correctas.
              </strong>
            </p>
            <button
              type="button"
              onClick={() => {
                R(null)
                A({})
                M('')
              }}
            >
              Nuevo intento
            </button>
          </>
        ) : (
          <button className="primary" disabled={busy}>
            Corregir respuestas
          </button>
        )}
      </form>
      <p role="status">{msg}</p>
      {past.length > 0 && (
        <details>
          <summary>Historial · {past.length} intentos</summary>
          {[...past].reverse().map((a) => (
            <details key={a.id}>
              <summary>
                {new Date(a.date).toLocaleString('es-CL')} · {a.items.filter((x) => x.ok).length}/
                {a.items.length}
              </summary>
              <ul>
                {a.items.map((x, i) => (
                  <li key={i}>
                    {x.ok ? '✓' : '×'} {x.prompt} — Tu respuesta: {x.value}. {x.explanation}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </details>
      )}
    </section>
  )
}
export function QuizPage({ parts }: { parts: string[] }) {
  const [mode, cid, unit] = parts,
    c = courseBy(cid),
    diag = mode === 'diagnostico',
    u = Number(unit || 0)
  if (
    !diag &&
    (!c ||
      !['unidad', 'final'].includes(mode) ||
      (mode === 'unidad' && (!Number.isInteger(u) || !c.units[u])))
  )
    return <Head title="Evaluación no encontrada" back="#/evaluaciones" />
  const items: QuizItem[] = diag
    ? initialChecks.map((q, i) => ({ q, course: courses[i].id, index: [2, 0, 1, 2, 4, 5][i] }))
    : mode === 'final' && finalQuestions[cid]
      ? finalQuestions[cid].map((q, index) => ({ q, course: cid, index }))
      : c!.lessons.flatMap((l, i) =>
          mode === 'unidad' && Math.floor(i / 2) !== u
            ? []
            : [
                { q: l.check, course: c!.id, index: i },
                { q: l.exercise, course: c!.id, index: i },
              ],
        )
  const key = diag ? 'diagnostico' : mode === 'unidad' ? 'unit-' + cid + '-' + u : 'exam-' + cid
  return (
    <>
      <Head
        back="#/evaluaciones"
        where="Evaluaciones"
        title={
          diag
            ? 'Diagnóstico inicial'
            : mode === 'unidad'
              ? c!.units[u]
              : 'Examen final de práctica'
        }
        desc={
          diag
            ? 'Usa el resultado para elegir tus primeros repasos. Puedes volver a rendirlo.'
            : c!.name
        }
      />
      <Quiz
        key={key}
        id={key}
        items={items}
        title={diag ? 'Punto de partida' : 'Comprobar lo aprendido'}
      />
    </>
  )
}
export function Assessments() {
  const data = useRecords()
  return (
    <>
      <Head
        title="Evaluaciones"
        desc="Comprueba los fundamentos y vuelve a las clases que explican cada respuesta."
      />
      <div className="panel section-line">
        <div>
          <h2>Diagnóstico de entrada</h2>
          <p>
            Seis preguntas de las seis asignaturas. Incluye los ejercicios de la primera versión.
          </p>
        </div>
        <LinkBtn href="#/prueba/diagnostico">Abrir diagnóstico</LinkBtn>
      </div>
      <div className="card-grid">
        {courses.map((c) => (
          <section key={c.id} className="panel">
            <h2>{c.short}</h2>
            {c.units.map((u, i) => (
              <a className="row-link" href={'#/prueba/unidad/' + c.id + '/' + i} key={u}>
                {u}
                <span>4 preguntas →</span>
              </a>
            ))}
            <a className="row-link" href={'#/prueba/final/' + c.id}>
              <b>Examen final</b>
              <span>{((data['attempt:exam-' + c.id] || []) as Attempt[]).length} intentos →</span>
            </a>
          </section>
        ))}
      </div>
    </>
  )
}
