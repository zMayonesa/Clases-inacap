import { createRoot } from 'react-dom/client'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './style.css'
import { App } from './App'
import { boot } from './core/storage'
const root = createRoot(document.getElementById('root')!)
let legacy: Storage | undefined
try {
  legacy = window.localStorage
} catch {
  /* IndexedDB puede seguir disponible aunque el navegador bloquee localStorage. */
}
boot(legacy)
  .then(() => root.render(<App />))
  .catch(() =>
    root.render(
      <main>
        <h1>El almacenamiento local está bloqueado</h1>
        <p>
          Activa los datos del sitio en Chrome y recarga para abrir la academia. Tus evidencias y
          proyectos necesitan IndexedDB.
        </p>
      </main>,
    ),
  )
