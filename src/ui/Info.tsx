import { Head } from './common'
import { outcomes, courses } from '../content/catalog'
export const officialPDF =
  'https://digital.inacap.cl/pdf_mallas/TECNOLOGIA-APLICADA/AUTOMATIZACION-Y-ROBOTICA/AUTOMATIZACION-Y-ROBOTICA-AR-ARO-2-IR-IRA-2-2026.pdf'
const area = 'https://portal.inacap.cl/carreras/area-automatizacion-electronica-y-robotica/'
export function Sources() {
  return (
    <>
      <Head
        title="Fuentes y alcance académico"
        desc="Academia independiente de estudio personal para segundo semestre, San Pedro de la Paz, 2026."
      />
      <article className="panel prose">
        <h2>Confirmado por INACAP</h2>
        <p>
          La página 3 de la malla 2026 presenta las rutas de Técnico e Ingeniería en Automatización
          y Robótica. La columna del segundo semestre incluye{' '}
          {courses.map((c) => c.name).join(', ')}. La página 2 describe competencias de egreso,
          entre ellas mantener instrumentación y diagnosticar fallas de sensores, actuadores,
          máquinas y accionamientos.
        </p>
        <p>
          La ficha institucional de Ingeniería lista San Pedro de la Paz entre las sedes. La malla
          corresponde a la ruta nacional. La programación de una sección específica se contrasta con
          sus guías docentes.
        </p>
        <ul>
          <li>
            <a href={officialPDF}>Malla curricular 2026 · PDF oficial</a>
          </li>
          <li>
            <a href={area + 'ingenieria-en-automatizacion-y-robotica'}>
              Ficha de Ingeniería en Automatización y Robótica
            </a>
          </li>
          <li>
            <a href={area + 'tecnico-en-automatizacion-y-robotica'}>
              Ficha de Técnico en Automatización y Robótica
            </a>
          </li>
          <li>
            <a href="https://portal.inacap.cl/sede-san-pedro-de-la-paz">Sede San Pedro de la Paz</a>
          </li>
        </ul>
        <h2>Propuesta técnica complementaria</h2>
        <p>
          Las unidades, clases, objetivos, simuladores y rúbricas fueron elaborados para esta
          academia. Los objetivos de práctica son los siguientes.
        </p>
        <ul>
          {outcomes.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p>
          Las fichas de software contienen enlaces de los editores y condiciones de acceso. Para
          matemáticas se consultaron la integración de GeoGebra y su manual de comandos.
        </p>
        <ul>
          <li>
            <a href="https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/">
              Integración oficial de GeoGebra
            </a>
          </li>
          <li>
            <a href="https://geogebra.github.io/docs/manual/en/Matrices/">
              Matrices en el manual oficial
            </a>
          </li>
          <li>
            <a href="https://geogebra.github.io/docs/manual/en/commands/Solve/">
              Comando Solve en CAS
            </a>
          </li>
        </ul>
        <h2>Pendiente de contraste con tu sección</h2>
        <p>
          La malla pública no detalla resultados de aprendizaje por unidad, horas por clase,
          ponderaciones ni guías del segundo semestre de esta sección. Puedes adjuntar el programa
          del profesor en «Mis guías docentes» dentro de cada asignatura y documentar su
          procedencia.
        </p>
      </article>
    </>
  )
}
export function Model() {
  return (
    <>
      <Head back="#/tablero/directo" where="Tablero" title="Modelo eléctrico y límites" />
      <article className="panel prose">
        <h2>Cómo se resuelve el circuito</h2>
        <p>
          Los conductores y contactos cerrados unen terminales en nodos. Cada fuente ideal asigna
          potenciales. Una bobina recibe energía cuando sus dos bornes pertenecen al mismo dominio
          de alimentación y su diferencia está dentro de ±10 % de la tensión nominal. Se recalculan
          los contactos hasta alcanzar un estado estable. Un mando que oscila se informa como
          inestable.
        </p>
        <p>
          El variador genera tres fases virtuales únicamente si hay tres fases de entrada válidas,
          RUN–COM cerrado y consigna positiva. El motor de tres bornes exige tres fases distintas.
          En el de seis bornes se verifica la conexión de los seis extremos en estrella o triángulo.
          La permutación de fases determina el signo del giro.
        </p>
        <h2>Velocidad, corriente y tiempo</h2>
        <p>
          Con p pares de polos, nₛ=60f/p. El objetivo bajo carga es 0,96nₛ. La respuesta usa
          n(t+Δt)=nobjetivo+(n(t)−nobjetivo)exp(−Δt/τ), con τ de 0,55 s en línea, 0,9 s en estrella
          y 0,8 s al parar. El estado de régimen empieza dentro del 5 % de la velocidad objetivo.
        </p>
        <p>
          La corriente de referencia es 4 A por unidad de carga. Se añade un factor transitorio
          proporcional a la diferencia de velocidad y un factor de un tercio en estrella. El térmico
          integra un índice aproximado de calentamiento; 95–96 abre y solo desactiva el contactor si
          el estudiante lo cableó en el mando. El amperímetro estima la corriente de motores cuyo
          camino de fuerza atraviesa su rama. El voltímetro compara nodos de una misma fuente.
        </p>
        <h2>Protección y diagnóstico</h2>
        <p>
          Un cortocircuito entre etiquetas de fase o fuentes incompatibles genera diagnóstico. El
          modelo busca un fusible o termomagnético cuya apertura aísle la falla. El diferencial
          monofásico tiene ensayo de disparo manual; la corriente de fuga a tierra no se calcula. La
          continuidad se comprueba con las fuentes aisladas. Las plantillas de cambio de giro y
          estrella–triángulo usan enclavamientos eléctricos por conexiones reales.
        </p>
        <p>
          El modelo omite arcos, curva de par dependiente de carga, caída de tensión en cables,
          coordinación selectiva, armónicos, tiempo mecánico de conmutación y normativa de
          dimensionamiento. El tablero es exclusivamente educativo y requiere validación profesional
          independiente para cualquier instalación real.
        </p>
      </article>
    </>
  )
}
