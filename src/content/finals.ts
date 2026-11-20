import { choose as C, numberQ as N, type Question } from './schema'
export const finalQuestions: Record<string, Question[]> = {
  maquinas: [
    N(
      'Una placa indica cuatro polos, 60 Hz y 1746 rpm. Calcula el deslizamiento porcentual.',
      3,
      '%',
      'nₛ=60×60/2=1800 rpm. (1800−1746)/1800×100=3 %.',
    ),
    C(
      'El mando queda retenido incluso al abrir S0. En el esquema, el auxiliar toma +24 V antes de S0. ¿Qué explica el síntoma?',
      ['Un camino paralelo evita el paro', 'La frecuencia creció', 'La bobina necesita otra fase'],
      0,
      'El auxiliar mantiene A1 sin atravesar el paro común.',
    ),
    C(
      'Tras disparar FR, 95–96 abre pero KM1 sigue activo. ¿Qué comprobar?',
      [
        'La escala del dibujo',
        'Si existe una ruta a la bobina que evita 95–96',
        'El tamaño del cursor',
      ],
      1,
      'La función de protección depende de interrumpir todas las rutas de mando.',
    ),
    C(
      'KM1 alimenta U,V,W con L1,L2,L3. ¿Qué secuencia invierte el campo?',
      ['L2,L3,L1', 'L3,L1,L2', 'L2,L1,L3'],
      2,
      'Una permutación cíclica conserva el sentido. Intercambiar dos fases lo invierte.',
    ),
    N(
      'Un devanado recibe 230 V en estrella. Estima la tensión entre líneas.',
      398.37,
      'V',
      'U línea = √3 × 230 ≈ 398,37 V.',
      1,
    ),
    N(
      'Con 35 Hz, tres pares de polos y deslizamiento de 4 %, ¿cuáles son las rpm estimadas del eje?',
      672,
      'rpm',
      '60×35/3=700 rpm síncronas; 700×0,96=672 rpm.',
    ),
  ],
  electronica: [
    N(
      'Un shunt de 150 Ω recibe 16 mA. ¿Qué caída de tensión habrá?',
      2.4,
      'V',
      'Convierte a amperios: 0,016×150=2,4 V.',
    ),
    N(
      'Con 12 V sobre dos ramas de 300 Ω y 600 Ω en paralelo, ¿qué corriente total entrega la fuente?',
      60,
      'mA',
      '40 mA + 20 mA = 60 mA por la ley de nodos.',
    ),
    N(
      'Un RC de 47 kΩ y 10 µF tarda un τ en llegar a 63,2 %. ¿Cuánto vale τ?',
      0.47,
      's',
      '47 000×10×10⁻⁶=0,47 s.',
    ),
    C(
      'La base de un NPN queda a 0 V respecto del emisor. En el modelo ideal el transistor está…',
      ['Saturado', 'En corte', 'Rectificando una fase'],
      1,
      'Con excitación de base nula se interrumpe la corriente controlada.',
    ),
    N(
      'Un pulso de 20 V está alto 3 ms dentro de un período de 12 ms. ¿Cuál es su tensión eficaz?',
      10,
      'V',
      'D=3/12=0,25; Vef=20√0,25=10 V.',
    ),
    N(
      'Un ADC de 8 bits usa extremos inclusivos 0–5 V. ¿Qué código redondeado corresponde a 4 V?',
      204,
      'cuentas',
      '4/5×255=204.',
      0,
    ),
  ],
  instrumentacion: [
    N(
      'Un transmisor cubre −40 a 160 °C. ¿A qué porcentaje del intervalo se encuentra 10 °C?',
      25,
      '%',
      '(10+40)/200 ×100=25 %.',
    ),
    N(
      'Un lazo 4–20 mA corresponde a 3–15 bar. ¿Qué corriente representa 12 bar?',
      16,
      'mA',
      '(12−3)/(15−3)=0,75. 4+16×0,75=16 mA.',
    ),
    N(
      'Una referencia de 80 °C produce una indicación de 78,5 °C. Calcula la corrección que sumarías a la lectura.',
      1.5,
      '°C',
      'Error = −1,5 °C. La corrección es +1,5 °C.',
    ),
    N(
      'Un líquido de 800 kg/m³ alcanza 2,5 m. Usa g=9,81 y calcula la presión manométrica de fondo.',
      19620,
      'Pa',
      '800×9,81×2,5=19 620 Pa.',
      1,
    ),
    C(
      'Una bomba de entrada estaba encendida. El nivel está entre ambos umbrales de histéresis. La bomba…',
      ['Se mantiene encendida', 'Se apaga cada segundo', 'Invierte su giro'],
      0,
      'Dentro de la banda conserva la orden anterior.',
    ),
    C(
      'Lectura local normal y corriente normal, HMI siempre al doble del valor en todo el rango. ¿Qué hipótesis probar primero?',
      ['Lazo abierto', 'Ganancia de escalado en HMI', 'Desaparición de gravedad'],
      1,
      'Un error proporcional con señal bruta correcta apunta a la conversión posterior.',
    ),
  ],
  redes: [
    C(
      'Hay enlace en ambos puertos y el crudo recibido es 302. La HMI muestra 302 L en vez de 30,2 L. ¿En qué capa lógica revisar?',
      ['La alimentación del switch', 'Conversión de datos de aplicación', 'Longitud del cable'],
      1,
      'El crudo llegó; el factor de conversión debe ser 0,1 L por cuenta.',
    ),
    N(
      'En 10.0.0.160/27, ¿cuál es el último octeto de difusión?',
      191,
      '',
      'Los bloques de 32 abarcan 160 a 191.',
      0,
    ),
    C(
      'Una HMI en otra subred necesita enviar tráfico fuera de su red. El equipo que encamina es…',
      ['Un relé', 'Un switch exclusivamente de capa 2', 'Un router'],
      2,
      'El router toma decisiones según las redes de destino.',
    ),
    C(
      'Un equipo documenta 40001 como primer holding register y la PDU comienza en cero. ¿Qué dirección pide el cliente para 40003?',
      ['2', '3', '40003'],
      0,
      '40003 es el tercer registro. El desplazamiento respecto del primero es 2.',
    ),
    N(
      'Un dispositivo IO actualiza cada 5 ms. ¿Cuántos intervalos hay en 0,2 segundos?',
      40,
      'intervalos',
      '0,2 s=200 ms y 200/5=40.',
      0,
    ),
    C(
      'Al restaurar una configuración de red, ¿qué verifica la recuperación del proceso?',
      [
        'Solo el indicador luminoso',
        'La recepción de una medición actual, con unidad y calidad esperadas',
        'La fecha del instalador',
      ],
      1,
      'La comprobación atraviesa enlace, configuración y dato de aplicación.',
    ),
  ],
  administracion: [
    C(
      'El entregable es un circuito que debe detenerse ante emergencia. La evidencia más directa es…',
      [
        'Una tabla del ensayo y el circuito que permite repetirlo',
        'Una lista de marcas',
        'Una portada',
      ],
      0,
      'El ensayo registrado comprueba una condición verificable.',
    ),
    N(
      'Un puesto tiene disponibles 3,5 h y recibe tareas por 250 min. ¿Qué exceso de demanda presenta?',
      40,
      'min',
      '3,5×60=210 min. 250−210=40 min.',
    ),
    N(
      'Tres sensores a $12 500 y dos horas a $9000, con reserva de 8 %. ¿Cuál es el presupuesto?',
      59940,
      'CLP',
      'Base=37 500+18 000=55 500. Total=55 500×1,08=59 940.',
      0.5,
    ),
    N(
      'Una línea pasa de 30 a 36 piezas buenas por hora. ¿Cuál es el aumento relativo?',
      20,
      '%',
      '(36−30)/30 ×100=20 %.',
    ),
    N(
      'Tras 2 h de preparación hay ramas independientes de 4 y 6 h, y cierre de 3 h. ¿Cuál es el plazo mínimo?',
      11,
      'h',
      '2+máximo(4,6)+3=11 h.',
    ),
    N(
      'Una opción obtiene 5 en costo y 2 en cobertura. Los pesos son 0,3 y 0,7. Calcula su puntuación.',
      2.9,
      'puntos',
      '5×0,3 + 2×0,7 = 2,9.',
    ),
  ],
  matematicas: [
    N(
      'Una temperatura obedece T(t)=12−2t. ¿Qué altura tendrá el punto con t=4?',
      4,
      '°C',
      'Sustituye t=4: 12−8=4.',
    ),
    N('La recta pasa por (1,7) y (4,1). Calcula la pendiente.', -2, '', 'm=(1−7)/(4−1)=−6/3=−2.'),
    N(
      'La función g(x)=−2(x−3)²+8 llega a un máximo. ¿Cuál es su altura?',
      8,
      '',
      'El cuadrado es mínimo y vale cero en x=3, por lo que g(3)=8.',
    ),
    N('En 2x+y=11 y x−y=1, determina y.', 3, '', 'Al sumar: 3x=12, x=4. Entonces y=x−1=3.'),
    N(
      'Para A=[[2,1],[0,3]] y B=[[1,4],[2,5]], calcula la entrada (1,2) de AB.',
      13,
      '',
      'Fila [2,1] por columna [4,5]: 2×4+1×5=13.',
    ),
    C(
      'Una matriz tiene segunda fila igual al doble de la primera. La ecuación A·u=r…',
      [
        'Siempre tiene una solución única',
        'Puede tener infinitas o ninguna, según r',
        'Siempre tiene inversa',
      ],
      1,
      'El determinante se anula. El vector de términos independientes decide si las restricciones son compatibles.',
    ),
  ],
}

finalQuestions.maquinas[1].diagram = [
  '+24 → S0 NC → S1 NA → A1',
  '+24 → auxiliar KM1 NA → A1',
  'A2 → 0 V',
]
finalQuestions.redes[0].diagram = ['PLC · crudo 302', 'Switch · enlace activo', 'HMI · 302 L']
finalQuestions.instrumentacion[4].diagram = ['25 L · bomba ON', '30–70 L · banda', 'PV actual 55 L']
