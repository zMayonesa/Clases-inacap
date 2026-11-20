# Registro de implementación

## Auditoría inicial

La revisión pública de partida fue `7d9b6b2`. La rama main publicaba la raíz mediante Pages. Contenía README e index.html, seis preguntas de opción múltiple, un cálculo de presión, un modelo de arranque accionado con botones y ocho casillas. Las claves de progreso anteriores son ar_done y ar_w0…ar_w7. El avance previo debe identificarse como diagnóstico e historial semanal, sin otorgar dominio de las nuevas unidades.

## Decisiones

- Aplicación estática con rutas hash para abrir enlaces directos en GitHub Pages. React, TypeScript, módulos de contenido y motores de cálculo independientes.
- Se conserva la base azul de la interfaz anterior. El panel de estudio dará acceso inmediato a la siguiente actividad. El tablero y los diagramas usarán SVG interactivo con etiquetas. El móvil tendrá formularios equivalentes a los gestos. La guía de accesibilidad de Refero fundamenta los blancos táctiles, etiquetas persistentes y foco visible.
- El aprendizaje, los archivos y los informes se almacenan en el navegador. Las herramientas externas se abrirán bajo demanda.
- La edición del tablero, los cálculos y la evaluación se comprobarán con circuitos válidos e inválidos, entradas de frontera y sesiones de navegador.

La matriz siguiente vincula cada bloque del encargo con sus verificaciones.

## Inventario implementado

| Requisito del encargo | Implementación y forma de comprobarla |
| --- | --- |
| 1–3. Repositorio, metodología y fuentes | Se auditó la versión pública original y se conservó su historial. La pantalla Fuentes distingue malla nacional, sede, material complementario y programa docente pendiente. Ver FUENTES.md |
| 4–5. Asignaturas y método de clase | 36 clases troncales en 18 unidades. Cada clase tiene requisito y enlace de nivelación, objetivo, teoría, figura, ejemplo por pasos, prácticas, corrección, contexto, síntesis, recuperación y evaluación |
| 6. Laboratorio virtual | 47 guías con dificultad, duración, filtro de curso, compatibilidad, preparación, procedimiento, reto, resultados, evidencias y rúbrica. Cada guía tiene trabajo asociado |
| 7. Tablero eléctrico | 26 tipos de componente con bornes y comportamiento. Edición táctil y por selectores, posición, zoom, propiedades, cableado, codos y capas, eliminación, proyectos JSON y auto­guardado. Las 13 maniobras se ensayan contra la netlist del estudiante. La práctica de diagnóstico empieza con una avería deliberada |
| 7. Motor y protecciones | Campo y giro por orden de fases, velocidad objetivo y dinámica de arranque/parada, estrella y triángulo por conexiones físicas de seis bornes, RUN del VFD, retardo TON, sobrecarga acumulada, térmico, fusible, termomagnético, ensayo de diferencial y medidas. Límites disponibles en la vista Modelo |
| 8–9. CADe SIMU y AutoCAD | Cuatro clases y cuatro prácticas por complemento. Procedencia legítima, requisitos de escritorio y rutas Android. Editor didáctico con capas, bloques didácticos, coordenadas, cotas, guardado, SVG y salida de impresión PDF |
| 10. GeoGebra | Seis actividades con comandos, predicción y resultado. Gráfica para puntos, rectas y parábolas; Classic para sistema, matrices e inversa. Exploradores locales con deslizadores y gráficos. La prueba en línea consulta el motor de GeoGebra y el CAS |
| 11–14. Bancos técnicos y gestión | Continua, Kirchhoff, RC, transistor y PWM. Instrumentación, calibración, presión y nivel. Celda IPv4, RTU, TCP local y cronograma de E/S. Costos CSV, indicadores, cronograma y matriz de decisión |
| 15. Compatibilidad externa | Doce fichas con licencia, propósito, curso, nivel, requisitos, tutorial y enlaces de editor. El acceso de escritorio y la ruta móvil se identifican en cada caso |
| 16–17. Tareas e informes | IndexedDB almacena texto y archivos. Estados, rúbrica, retroalimentación y guía docente importada. El informe incluye portada, asignatura, objetivos, teoría, herramientas, procedimiento, resultados, gráficos/capturas, análisis, conclusiones y referencias. Chrome genera el PDF mediante impresión |
| 18. Evaluaciones | Diagnóstico, dos preguntas por clase, evaluaciones de unidad y seis exámenes finales troncales con casos distintos. Se aceptan coma decimal, signo y tolerancia explícita. Se registran respuestas, errores y explicaciones. La revisión de documentos es autoevaluación |
| 19. Ocho semanas | Fecha de inicio y 30–120 min/día, ruta esencial o completa, continuidad después de días perdidos, estudio fraccionado y repasos según error y recuerdo. La ruta esencial se comprueba a 30 min/día, con las 36 clases y el proyecto |
| 20. Integrador | Seis etapas. El ensayo integrado acopla el nivel, contacto LIC-101, permiso KA1, contactor KM1, FR, velocidad del motor, caudal, LT 4–20 mA y registro de HMI. Permite guardar medidas directamente en el informe final |
| 21–23. Plataforma, arquitectura y funcionamiento local | Panel, navegación móvil y escritorio, temas, fuentes locales, diagramas y controles. Módulos de contenido, motores, interfaz y persistencia. Caché versionada del build, migración de ar_done/ar_w, respaldos con anexos y restauración transaccional |
| 24. Publicación | Pages ya estaba configurado para main en la raíz. La API de configuración devolvió HTTP 403 al solicitar modo workflow. Se conserva el publicador habilitado; el build estático en la raíz se compara byte a byte con dist en CI. Ningún otro repositorio interviene |
| 25–30. QA, aceptación y entrega | npm ci, comprobación de tipos, build reproducible, ensayos de modelos, persistencia, integración y accesibilidad, comandos reales y enlaces externos. La publicación requiere comprobar la revisión desplegada y abrir el sitio público |

## Condiciones de verificación

- Las pruebas de navegador usan Chromium y perfil táctil Pixel 7 de Playwright, junto con comprobaciones a 360 y 1440 px. Se revisaron capturas de escritorio y móvil. El entorno carece de un teléfono Android físico y de una instalación Windows para ejecutar las aplicaciones comerciales de escritorio. La prueba de accesibilidad automatizada cubre reglas WCAG A/AA seleccionadas y las vistas indicadas en Playwright.
- El PDF de la malla, la oferta de sede y los manuales se consultaron el 20 de noviembre de 2026. Los programas analíticos específicos de la sección siguen pendientes de contraste con las guías que importe el estudiante.
- El modo sin conexión requiere haber cargado la aplicación con éxito. GeoGebra remoto y las páginas de los proveedores requieren conectividad. El almacenamiento está vinculado al origen y al perfil de Chrome. El respaldo local permite conservar los adjuntos fuera del navegador.
- La emulación es de lógica industrial y modelos ideales. No implementa una instalación eléctrica validada, un PLC industrial, una red real ni un CAD profesional. El alumnado registra los resultados de CADe SIMU y AutoCAD mediante archivos y capturas; las aplicaciones de escritorio no están incrustadas.

## Resultados reproducibles del 20 de noviembre

- Instalación limpia con npm ci, comprobación TypeScript y build de producción completados. El comando pages.mjs --check contrasta la salida rastreada por Git con los archivos recién compilados.
- 45 pruebas de modelos, datos y persistencia aprobadas con Node. Incluyen 13 secuencias de tablero, cables abiertos y fases duplicadas, fallo de enclavamiento, caída de tensión de bobina, calentamiento, temporización, velocidad, escala 4–20 mA, matrices, planificación a 30 minutos y ciclo integrado del estanque.
- El verificador en línea ejecutó las seis actividades en GeoGebra público. Las lecturas numéricas fueron 3, 7, −1, 3, 19 y 1. CAS devolvió {{x = 3, y = 2}} para el sistema de dos ecuaciones.
- Se verificaron 33 URL externas de la academia; las 33 devolvieron HTTP 200. Los resultados de una consulta de disponibilidad no sustituyen las condiciones de licencia indicadas por cada editor.

- 12 recorridos de navegador aprobados localmente. Se comprobaron las 47 guías, el guardado y la importación de adjuntos, el PDF real con imagen incrustada, el editor SVG, la recuperación offline y el registro de una observación de la estación en el informe. Axe-core ejecutó reglas WCAG A/AA en diez vistas móviles y el panel claro.
