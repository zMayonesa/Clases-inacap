import {machines} from './machines'
import {electronics} from './electronics'
import {instruments} from './instruments'
import {networks} from './networks'
import {management} from './management'
import {math} from './math'
import {cad,cade} from './cad'
import type {Course} from './schema'
export const courses:Course[]=[
 {id:'maquinas',name:'Control de Máquinas Eléctricas Rotativas',short:'Máquinas eléctricas',color:'blue',units:['Del campo al mando','Maniobras de potencia','Secuencias y diagnóstico'],intro:'Sigue la energía desde la red hasta el eje. Construye mandos que arrancan, se enclavan y se detienen.',foundation:'Un circuito cerrado conecta ambos polos de una fuente mediante una carga. La corriente atraviesa la carga; la tensión se mide entre sus extremos. Un contacto en reposo puede conducir (NC) o estar abierto (NA). Frecuencia en Hz significa ciclos por segundo. Para convertir vueltas por segundo a rpm multiplica por 60.',lessons:machines},
 {id:'electronica',name:'Electrónica Aplicada a la Automatización',short:'Electrónica aplicada',color:'orange',units:['Circuitos de continua','Componentes y señales','Conmutación y medida'],intro:'Calcula corrientes y tensiones, interpreta señales y contrasta tus predicciones en un banco de circuitos.',foundation:'Un prefijo cambia la escala de la unidad. 1 A = 1000 mA y 1 kΩ = 1000 Ω. Despejar es realizar la misma operación en ambos lados de una igualdad: V = I × R implica I = V/R para R distinta de cero. Un nodo ideal comparte potencial en todos sus puntos.',lessons:electronics},
 {id:'instrumentacion',name:'Instrumentación Industrial',short:'Instrumentación',color:'teal',units:['Variables y transmisores','Calibración y magnitudes','Lazos y diagnóstico'],intro:'Convierte señales en variables de proceso, calibra un transmisor e interpreta el lazo de un estanque.',foundation:'Una unidad permite comparar cantidades. 100 kPa = 1 bar, 1000 L = 1 m³ y 1 mA = 0,001 A. Una fracción expresa la parte del intervalo ya recorrida: en 0–80 L, 20 L ocupa 20/80 = 0,25 del intervalo.',lessons:instruments},
 {id:'redes',name:'Redes Industriales',short:'Redes industriales',color:'violet',units:['Enlace y direccionamiento','Topología y protocolos','Integración y continuidad'],intro:'Configura una celda PLC–HMI, interpreta registros y comprueba en qué capa se interrumpe un dato.',foundation:'Un bit toma dos valores. Ocho bits forman un byte. En binario cada posición vale el doble de la anterior: 1010₂ = 8 + 2 = 10. Una etiqueta identifica un dato de proceso y debe incluir tipo, unidad y origen.',lessons:networks},
 {id:'administracion',name:'Administración',short:'Administración',color:'amber',units:['Planificación y personas','Costos e indicadores','Control de proyectos'],intro:'Convierte un objetivo técnico en tareas, costos, indicadores y decisiones que puedas justificar.',foundation:'Un porcentaje es una fracción de cien. El 10 % de $20 000 es 0,10 × 20 000 = $2000. Expresa costos en CLP y conserva unidades de cantidad y tiempo. Una hora equivale a 60 minutos. Escribe primero el supuesto y después la operación.',lessons:management},
 {id:'matematicas',name:'Funciones y Matrices',short:'Funciones y matrices',color:'green',units:['Plano y rectas','Parábolas y sistemas','Álgebra matricial'],intro:'Predice un resultado, dibújalo en GeoGebra y compruébalo por sustitución o mediante operaciones de matrices.',foundation:'En una igualdad puedes sumar, restar, multiplicar o dividir ambos miembros por la misma cantidad (el divisor debe ser distinto de cero). En 2x+3=7 resta 3 y divide por 2 para llegar a x=2. Comprueba sustituyendo: 2×2+3=7. Lee (x,y) primero en horizontal y después en vertical.',lessons:math},
]
export const extras:Course[]=[
 {id:'autocad',name:'AutoCAD y dibujo técnico',short:'AutoCAD',color:'orange',units:['Dibujo y simbología','Documentación del tablero'],intro:'Desde una coordenada hasta un juego de planos de mando, fuerza y disposición con salida PDF.',foundation:'Una coordenada (x,y) expresa dos distancias a los ejes de referencia. En el plano del tablero una unidad es un milímetro. Una escala 1:10 representa diez milímetros reales con uno en la hoja.',lessons:cad},
 {id:'cade',name:'CADe SIMU',short:'CADe SIMU',color:'blue',units:['Entorno y arranque','Maniobras y diagnóstico'],intro:'Construye y ensaya maniobras en Windows con una ruta equivalente en el tablero táctil.',foundation:courses[0].foundation,lessons:cade}
]
export const allCourses=[...courses,...extras]
export function courseBy(id:string){return allCourses.find(c=>c.id===id)}
export const lessonId=(id:string,i:number)=>id+'-'+(i+1)
export const lessonRoute=(id:string,i:number)=>'#/clase/'+id+'/'+(i+1)
export const initialChecks=[machines[2].check,electronics[0].exercise,instruments[1].check,networks[2].check,management[4].check,math[5].check]
export const outcomes=['Relacionar campo, velocidad y protecciones en una secuencia ensayada.','Predecir y comprobar tensiones, corrientes y formas de señal.','Escalar y diagnosticar una medida desde el proceso hasta la indicación.','Documentar el recorrido de un dato y verificar su configuración.','Justificar recursos, plazo y costo de un proyecto simulado.','Modelar con funciones y verificar operaciones de matrices.']

