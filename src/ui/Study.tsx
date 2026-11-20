import { useEffect, useState } from 'react'
import { courses, courseBy, extras, lessonId, lessonRoute } from '../content/catalog'
import { labs, findLab, recommendedLab } from '../content/labs'
import { software } from '../content/software'
import { passed } from '../core/plan'
import { change } from '../core/storage'
import { Flow, Head, Icon, LinkBtn, Note, ProgressBar } from './common'
import { useRecords } from './hooks'
import { Quiz } from './Assess'
import { Bench } from '../lab/Benches'
import { Schematic, WireTable } from '../board/Schematic'
import { template, practices } from '../board/practices'
export function Subjects() {
  return (
    <>
      <Head
        title="Asignaturas"
        desc="Seis cursos de segundo semestre con teoría, práctica y evaluación."
      />
      <CourseCards />
      <h2 className="section-title">Cursos complementarios</h2>
      <div className="card-grid">
        {extras.map((c) => (
          <a className="panel course-card" key={c.id} href={'#/curso/' + c.id}>
            <Icon name={c.id} />
            <h3>{c.name}</h3>
            <p>{c.intro}</p>
            <span>{c.lessons.length} clases →</span>
          </a>
        ))}
      </div>
    </>
  )
}
export function CourseCards() {
  const data = useRecords()
  return (
    <div className="course-grid">
      {courses.map((c) => {
        const done = c.lessons.filter((_, i) => passed(data, lessonId(c.id, i))).length
        return (
          <a className={'course-card ' + c.color} href={'#/curso/' + c.id} key={c.id}>
            <div className="course-mark">
              <Icon name={c.id} size={23} />
            </div>
            <h3>{c.short}</h3>
            <p>{c.intro}</p>
            <div className="card-foot">
              <span>{c.units.length} unidades</span>
              <span>
                {done}/{c.lessons.length} clases
              </span>
            </div>
            <ProgressBar value={done} total={c.lessons.length} label={'Progreso de ' + c.short} />
          </a>
        )
      })}
    </div>
  )
}
export function CoursePage({ id }: { id: string }) {
  const c = courseBy(id),
    data = useRecords()
  if (!c) return <Head title="Asignatura no encontrada" back="#/asignaturas" />
  return (
    <>
      <Head back="#/asignaturas" where="Asignaturas" title={c.name} desc={c.intro} />
      <div className="inline">
        <LinkBtn href={'#/base/' + id} sub>
          Repasar requisitos previos
        </LinkBtn>
        <LinkBtn href={'#/trabajo/guia-' + id} sub>
          Mis guías docentes
        </LinkBtn>
      </div>
      {c.units.map((u, j) => (
        <section className="panel unit" key={u}>
          <div className="section-line">
            <div>
              <small>Unidad {j + 1}</small>
              <h2>{u}</h2>
            </div>
            <Icon name={id} />
          </div>
          {c.lessons.slice(j * 2, j * 2 + 2).map((l, n) => {
            const i = j * 2 + n
            return (
              <a className="lesson-row" href={lessonRoute(id, i)} key={l.title}>
                <span className="lesson-num">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <b>{l.title}</b>
                  <small>{l.goal}</small>
                </span>
                <i>{passed(data, lessonId(id, i)) ? '✓' : '→'}</i>
              </a>
            )
          })}
          <a href={'#/prueba/unidad/' + id + '/' + j}>Evaluación de la unidad →</a>
        </section>
      ))}
      <div className="inline">
        <LinkBtn href={'#/laboratorios/' + id} sub>
          Laboratorios de la asignatura
        </LinkBtn>
        <LinkBtn href={'#/prueba/final/' + id}>Examen de práctica</LinkBtn>
      </div>
    </>
  )
}
export function Foundation({ id }: { id: string }) {
  const c = courseBy(id)
  if (!c) return <Head title="Asignatura no encontrada" />
  return (
    <>
      <Head back={'#/curso/' + id} where={c.short} title="Nivelación" />
      <section className="panel prose">
        <h2>Antes de empezar</h2>
        <p>{c.foundation}</p>
        <p>
          Reproduce el cálculo o dibujo de memoria. Luego compara cada paso con el texto anterior.
        </p>
        <button
          onClick={async () => {
            await change('plan:foundation-' + id, 0, 1)
            location.hash = lessonRoute(id, 0)
          }}
        >
          Registrar nivelación y abrir la primera clase
        </button>
      </section>
    </>
  )
}
export function LessonPage({ id, n }: { id: string; n: number }) {
  const c = courseBy(id),
    l = c?.lessons[n],
    lab = recommendedLab(id, n)
  useEffect(() => {
    if (l) void change('lastLesson', '', lessonRoute(id, n))
  }, [id, n, l])
  if (!c || !l) return <Head title="Clase no encontrada" back="#/asignaturas" />
  return (
    <>
      <Head
        back={'#/curso/' + id}
        where={c.short + ' · Unidad ' + (Math.floor(n / 2) + 1)}
        title={l.title}
        desc={l.goal}
      />
      <div className="lesson-layout">
        <article className="panel prose">
          <div className="chips">
            <span>
              Clase {n + 1} de {c.lessons.length}
            </span>
            <span>Estudio complementario</span>
          </div>
          <section>
            <h2>Antes de empezar</h2>
            <p>{c.foundation}</p>
            <a href={n ? lessonRoute(id, n - 1) : '#/base/' + id}>
              {n ? 'Repasar la clase anterior' : 'Abrir nivelación'} →
            </a>
          </section>
          <section>
            <h2>Fundamentos</h2>
            {l.theory.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </section>
          <Flow steps={l.diagram} label="Lectura del esquema" />
          <section>
            <h2>Ejemplo resuelto</h2>
            <ol className="procedure">
              {l.example.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2>Práctica guiada</h2>
            <ol>
              {l.guided.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {lab && (
              <LinkBtn href={'#/lab/' + lab.id} sub>
                Abrir laboratorio relacionado
              </LinkBtn>
            )}
          </section>
          {id === 'matematicas' && (
            <details className="math-lesson">
              <summary>Explorar aquí con GeoGebra y controles locales</summary>
              <Bench kind="geo" index={n} />
            </details>
          )}
          <section>
            <h2>Práctica independiente</h2>
            <p>
              {l.exercise.prompt}{' '}
              {l.exercise.unit && 'Expresa tu resultado en ' + l.exercise.unit + '.'}
            </p>
            <details>
              <summary>Consultar procedimiento de corrección</summary>
              <p>{l.exercise.explanation}</p>
            </details>
          </section>
          <section>
            <h2>Aplicación industrial</h2>
            <p>{l.industry}</p>
          </section>
          <section>
            <h2>Resumen y recuperación activa</h2>
            <p>{l.diagram.join(' → ')}</p>
            <p>{l.review}</p>
          </section>
        </article>
        <aside className="panel lesson-side">
          <Icon name={id} size={28} />
          <h3>{c.units[Math.floor(n / 2)]}</h3>
          {c.lessons.slice(Math.floor(n / 2) * 2, Math.floor(n / 2) * 2 + 2).map((v, j) => (
            <a className="row-link" key={v.title} href={lessonRoute(id, Math.floor(n / 2) * 2 + j)}>
              {v.title}
            </a>
          ))}
          <a href={'#/trabajo/guia-' + id}>Consultar mis guías →</a>
        </aside>
      </div>
      <Quiz
        id={lessonId(id, n)}
        items={[
          { q: l.check, course: id, index: n },
          { q: l.exercise, course: id, index: n },
        ]}
        title="Evaluación de la clase"
      />
      <div className="inline">
        <LinkBtn href={c.lessons[n + 1] ? lessonRoute(id, n + 1) : '#/prueba/final/' + id}>
          {c.lessons[n + 1] ? 'Siguiente clase' : 'Abrir examen de práctica'}
        </LinkBtn>
        <LinkBtn href="#/plan" sub>
          Calendario de repaso
        </LinkBtn>
      </div>
    </>
  )
}
export function LabCatalog({ course = '' }: { course?: string }) {
  const [sub, S] = useState(course),
    [lev, L] = useState(''),
    [q, Q] = useState('')
  const hits = labs.filter(
    (l) =>
      (!sub || l.course === sub) &&
      (!lev || l.level === lev) &&
      l.title.toLocaleLowerCase('es').includes(q.toLocaleLowerCase('es')),
  )
  return (
    <>
      <Head
        title="Laboratorio virtual de Automatización y Robótica"
        desc="Construye un circuito, mide una variable y conserva tus evidencias en el cuaderno."
      />
      <div className="fields panel">
        <label>
          Asignatura
          <select value={sub} onChange={(e) => S(e.target.value)}>
            <option value="">Todas</option>
            {[...courses, ...extras].map((c) => (
              <option value={c.id} key={c.id}>
                {c.short}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dificultad
          <select value={lev} onChange={(e) => L(e.target.value)}>
            <option value="">Todas</option>
            <option>Inicial</option>
            <option>Intermedio</option>
          </select>
        </label>
        <label>
          Buscar laboratorio
          <input type="search" value={q} onChange={(e) => Q(e.target.value)} />
        </label>
      </div>
      <p role="status">{hits.length} prácticas disponibles</p>
      <div className="card-grid">
        {hits.map((l) => (
          <a className="panel lab-card" href={'#/lab/' + l.id} key={l.id}>
            <Icon name={l.course} />
            <small>
              {courseBy(l.course)?.short} · {l.minutes} min · {l.level}
            </small>
            <h3>{l.title}</h3>
            <p>{l.objective}</p>
            <span>{l.tool} →</span>
          </a>
        ))}
      </div>
    </>
  )
}
export function LabDetail({ id }: { id: string }) {
  const l = findLab(id)
  if (!l) return <Head title="Laboratorio no encontrado" back="#/laboratorios" />
  const course = courseBy(l.course)!,
    cl = course.lessons[l.lesson]
  const isBoard = l.bench === 'board',
    bp = practices.some((x) => x[0] === id)
      ? id
      : ['pulso', 'directo', 'inversion', 'estrella'][l.lesson],
    ref = isBoard ? template(bp === 'diagnostico' ? 'directo' : bp) : null
  return (
    <>
      <Head back="#/laboratorios" where="Laboratorio virtual" title={l.title} desc={l.objective} />
      <div className="chips">
        <span>{course.short}</span>
        <span>
          {l.level} · {l.minutes} min
        </span>
        <span>{l.tool}</span>
      </div>
      <section className="panel prose">
        <h2>Preparación y fundamento</h2>
        <p>{cl.theory[0]}</p>
        <p>
          Requisito previo: <a href={lessonRoute(l.course, l.lesson)}>{cl.title}</a>.
        </p>
        <p>Compatibilidad: {l.android}.</p>
        <Flow steps={cl.diagram} />
        <h3>Procedimiento guiado</h3>
        <ol>
          {l.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      {isBoard && ref ? (
        <>
          <details className="panel">
            <summary>Diagrama de referencia y lista completa de conexiones</summary>
            <Schematic c={ref} mini />
            <WireTable c={ref} />
          </details>
          <LinkBtn href={'#/tablero/' + bp}>Construir y simular en el tablero</LinkBtn>
        </>
      ) : l.bench === 'cad' ? (
        <LinkBtn href="#/dibujo">Abrir editor didáctico</LinkBtn>
      ) : (
        <Bench kind={l.bench} index={l.lesson} />
      )}
      <section className="panel prose">
        <h2>Práctica independiente</h2>
        <p>{l.challenge}</p>
        <details>
          <summary>Contrastar resultados esperados</summary>
          <p>{l.expected}</p>
        </details>
        <h3>Evidencia e informe</h3>
        <ul>
          {l.evidence.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <h3>Criterios de autoevaluación</h3>
        <ul>
          {l.criteria.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <LinkBtn href={'#/trabajo/' + id}>Registrar resultados</LinkBtn>
      </section>
    </>
  )
}
export function SoftwarePage() {
  return (
    <>
      <Head
        title="Biblioteca de software"
        desc="Herramientas del semestre, condiciones de acceso y alternativas para estudiar desde Android."
      />
      <div className="inline">
        {extras.map((c) => (
          <LinkBtn key={c.id} href={'#/curso/' + c.id} sub>
            Curso de {c.short}
          </LinkBtn>
        ))}
      </div>
      {software.map((s) => (
        <details className="panel soft" key={s.id}>
          <summary>
            <Icon name={s.course} /> {s.name} <small>{s.level}</small>
          </summary>
          <p>{s.purpose}</p>
          <dl className="data-list">
            {[
              ['Asignatura', courseBy(s.course)?.name],
              ['Licencia y acceso', s.license],
              ['Windows y requisitos', s.windows],
              ['Android', s.android],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <h3>Primer ejercicio</h3>
          <ol>
            {s.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <div className="inline">
            <a href={s.url} target="_blank" rel="noreferrer">
              Sitio del editor ↗
            </a>
            <a href={s.docs} target="_blank" rel="noreferrer">
              Documentación ↗
            </a>
            <a href={'#/lab/' + s.activity}>Práctica relacionada →</a>
          </div>
        </details>
      ))}
      <Note>
        Los servicios externos requieren conexión o instalación propia. Packet Tracer se usa en la
        ruta de Ethernet e IPv4.
      </Note>
    </>
  )
}
