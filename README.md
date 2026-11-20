# Academia de Automatización y Robótica

Academia independiente de estudio personal para primer año, segundo semestre 2026, San Pedro de la Paz. La malla de INACAP identifica las asignaturas. Los materiales, ejemplos, modelos y rúbricas son contenidos complementarios de esta aplicación.

[Abrir la academia](https://zmayonesa.github.io/Clases-inacap/) · [Fuentes académicas](https://zmayonesa.github.io/Clases-inacap/#/fuentes) · [Registro de requisitos y QA](docs/SEGUIMIENTO.md)

## Estudiar desde Android

1. Abre el diagnóstico en **Evaluaciones**. En **Calendario** configura la fecha inicial y entre 30 y 120 minutos por día. La ruta esencial contiene las 36 clases troncales, 20 prácticas, las evaluaciones y las seis etapas del proyecto. La ruta completa recorre el catálogo de laboratorios.
2. Elige una asignatura. Lee los fundamentos, reproduce el ejemplo y realiza el ejercicio antes de abrir la corrección. Las dos preguntas de cada clase acreditan esa clase en el historial. Las respuestas erróneas llevan a repasos concretos.
3. En **Laboratorio virtual** filtra la asignatura y la dificultad. Cada guía incluye herramientas, tiempo, procedimiento, desafío, resultado esperado y evidencias. En matemáticas puedes usar los controles locales y cargar GeoGebra cuando tengas conexión.
4. En **Tablero eléctrico** elige una plantilla o **Construir desde cero**. Para cablear toca dos bornes o utiliza los selectores Origen y Destino. Asocia cada auxiliar a su bobina y usa las referencias de la guía para el ensayo automático. Pulsa **Ejecutar**, cierra QF y acciona marcha. Usa **Evaluar circuito** para probar tu propio proyecto desde reposo.
5. Registra medidas, archivos, imágenes y conclusiones en **Trabajos e informes**. Marca los criterios que hayas contrastado, abre la vista previa y elige **Imprimir / guardar PDF**. Las guías docentes se adjuntan desde cada curso. La autoevaluación queda en tu dispositivo.
6. Exporta una copia desde **Respaldo local**. Importarla en otro navegador restaura datos y adjuntos en una transacción. En Chrome, tras la primera carga y la indicación **Disponible offline**, se pueden abrir las clases y los bancos internos sin red. El menú de Chrome ofrece instalar o añadir a inicio cuando el dispositivo lo permite.

## Contenido

| Área | Material |
| --- | --- |
| Seis asignaturas oficiales del segundo semestre | 3 unidades con 2 clases cada una por asignatura, 18 evaluaciones de unidad en total y 6 exámenes finales con casos nuevos |
| Complementos | 4 clases de AutoCAD y 4 de CADe SIMU, con 8 laboratorios prácticos asociados |
| Laboratorio | 47 prácticas. Incluyen 13 de tablero, 6 de matemáticas, 8 de dibujo y CADe y 20 de electrónica, instrumentación, redes y gestión |
| Proyecto integrador | 6 entregas. Desde el encargo de bombeo hasta la documentación de la prueba final |
| Biblioteca | Fichas, compatibilidad, enlaces, licencias y ejercicios para 12 herramientas o familias de software |

## Desarrollo y verificación

Se requiere Node.js 24 y npm. El prefijo de publicación está configurado en Vite como `/Clases-inacap/` y las rutas de estudio usan hash. El build incluye las fuentes tipográficas y genera una caché versionada para recursos propios.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run check:links
node --import tsx tools/geo-live.mjs
```

Para usar un Chromium ya instalado, define `CHROMIUM_PATH` con la ruta al ejecutable antes de Playwright o del verificador de GeoGebra. La verificación de enlaces requiere curl y conexión. Las pruebas unitarias y los recorridos locales funcionan con los recursos del proyecto. El verificador de GeoGebra abre las aplicaciones públicas reales, comprueba sus respuestas y espera la inicialización del CAS.

## Organización

| Directorio | Responsabilidad |
| --- | --- |
| `src/content` | Unidades, clases, rúbricas, preguntas, casos finales, herramientas y etapas del proyecto |
| `src/board` | Catálogo de componentes, netlist por bornes, solver, secuencias de ensayo y editor táctil |
| `src/lab` | Instrumentos interactivos, funciones, matrices, GeoGebra, cronogramas y dibujo SVG |
| `src/core` | Modelos de cálculo, corrección, agenda y transacciones de IndexedDB |
| `src/ui` | Vistas de estudio, evaluación, informes, progreso y recursos |
| `tests` | Pruebas numéricas, de circuitos, persistencia, integración, móvil y accesibilidad |
| `tools` | Caché del build, comprobación de fuentes y verificación de comandos |
| `.github/workflows` | Instalación reproducible, compilación, pruebas y publicación de Pages |

## Datos y modelos

IndexedDB conserva progreso, intentos, intervalos de repaso, proyectos, diagramas, rúbricas e informes, con almacén de archivos binarios. Las ediciones sucesivas se combinan sobre el registro duradero, con notificación entre pestañas. El respaldo JSON incluye los bytes de las evidencias y comprueba las referencias antes de restaurar. Se migra el historial de las claves antiguas `ar_done` y `ar_w0…ar_w7` como antecedentes.

Las actividades con AutoCAD de escritorio y CADe SIMU se realizan en sus aplicaciones. Desde Android hay rutas equivalentes en el editor SVG y el tablero. En la estación integradora, KA1 conserva la habilitación, LIC-101 gobierna KM1 por histéresis, la velocidad de M1 determina el caudal y el registro 0 lleva el nivel a la HMI. Una observación del ensayo se añade directamente al informe final. El modelo eléctrico no dimensiona instalaciones reales. [Fundamentos y límites del simulador](https://zmayonesa.github.io/Clases-inacap/#/modelo)



## Publicación con la configuración del repositorio

Pages sirve la raíz de la rama main. La entrada de desarrollo está en `web/index.html`. Ejecuta `npm run pages:prepare` para actualizar la entrada pública, los recursos estáticos, el manifest y el service worker de la raíz. El repositorio incluye el build validado porque su fuente de Pages está configurada como rama. El comando `node tools/pages.mjs --check` detecta recursos faltantes u obsoletos.

El workflow verifica instalación, modelos, aplicación, artefactos y navegación en la rama de trabajo y en main. El publicador de Pages de GitHub despliega main. Si el administrador selecciona en el futuro la fuente workflow, la misma definición genera el artefacto y usa deploy-pages. La comprobación posterior al despliegue está en `node tools/verify-public.mjs`.
