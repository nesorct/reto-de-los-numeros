// Pruebas del motor de las operaciones combinadas del reto (11-nov-2026).
//   node pruebas/test-combinadas.js
// El motor vive en index.html, en <script id="motor-combinadas">, sin tocar la página: aquí se saca ese bloque y se
// ejecuta en Node con un azar con semilla. Las cuentas son las de las fichas de UD1MAT (generar-ficha-combinadas.py,
// pos1-pos4 y ent1-ent4) y se comprueban igual: divisiones exactas, raíces de cuadrados perfectos y, con positivos,
// ninguna resta negativa a mitad de camino.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/<script id="motor-combinadas">([\s\S]*?)<\/script>/);
let fallos = 0;
const mal = (que) => { fallos++; if (fallos <= 40) console.log('FALLA: ' + que); };
if (!m) { console.log('FALLA: no está <script id="motor-combinadas"> en index.html'); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(m[1], ctx);
const C = ctx.Combinadas;
if (!C) { console.log('FALLA: el motor no define Combinadas'); process.exit(1); }

function semilla(s) {   // mulberry32
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const igual = (a, b, que) => { if (JSON.stringify(a) !== JSON.stringify(b)) mal(`${que}: ${JSON.stringify(a)} (esperaba ${JSON.stringify(b)})`); };

// 1. El valor, con el orden de siempre
igual(C.valor('40 − [3 × (2 + 4) − 6] : 4', true), 37, 'valor con corchetes');
igual(C.valor('(−2)^3 + [(−3) · (4 − (−2))]', false), -26, 'valor con potencia de un negativo');
igual(C.valor('r(25) × [9 − (5 − 2)]', true), 30, 'valor con raíz');
igual(C.valor('−[3 + (−5 − 2)] · 2', false), 8, 'valor con el menos delante del corchete');
igual(C.valor('(−12) : (−4) + 3', false), 6, 'valor con divisiones de negativos');
igual(C.valor('7 : 2 + 1', true), null, 'una división no exacta no vale');
igual(C.valor('r(20) + 1', true), null, 'una raíz no exacta no vale');
igual(C.valor('3 − 5 + 4', true), null, 'con positivos, ninguna resta negativa a mitad de camino');
igual(C.valor('3 − 5 + 4', false), 2, 'con enteros, la misma cuenta vale');

// 2. El paso a paso: una operación por línea, primero lo de dentro
igual(C.pasos('40 − [3 × (2 + 4) − 6] : 4'),
  ['40 − [3 × (2 + 4) − 6] : 4', '40 − [3 × 6 − 6] : 4', '40 − [18 − 6] : 4', '40 − 12 : 4', '40 − 3', '37'],
  'pasos de una cuenta con corchetes');
igual(C.pasos('2^3 + [(5 − 2) × 4]'), ['2^3 + [(5 − 2) × 4]', '2^3 + [3 × 4]', '2^3 + 12', '8 + 12', '20'],
  'pasos: los paréntesis antes que la potencia de fuera');
igual(C.pasos('(−12) : (−4) + 3'), ['(−12) : (−4) + 3', '3 + 3', '6'], 'pasos con negativos entre paréntesis');
igual(C.pasos('−[3 + (−5 − 2)] · 2'), ['−[3 + (−5 − 2)] · 2', '−[3 + (−7)] · 2', '−(−4) · 2', '4 · 2', '8'],
  'pasos: el menos delante del corchete');
igual(C.pasos('(3 − 9) · 2'), ['(3 − 9) · 2', '(−6) · 2', '−12'], 'pasos: un paréntesis que da negativo se queda');

// 3. Los errores de verdad, uno a uno
const err = (t, pos) => C.errores(t, pos);
igual(err('5 + 3 × 2', true).izq, 16, 'error: de izquierda a derecha');
igual(err('5 + 3 × 2', true).sumaPrimero, 16, 'error: sumar antes de multiplicar');
igual(err('40 − 12 + 3', true).derecha, 25, 'error: de derecha a izquierda en las del mismo rango');
igual(err('24 : 4 × 2', true).derecha, 3, 'error: dividir entre el producto');
igual(err('r(16) + 1', true).raizMitad, 9, 'error: la raíz como la mitad');
igual(err('(2 + 4) × 3', true).sinParentesis, 14, 'error: saltarse el paréntesis');
igual(err('10 − (2 + 3)', true).sinParentesis, 11, 'error: el menos delante del paréntesis');
igual(err('3^2 + 1', true).potPorExp, 7, 'error: la base por el exponente');
igual(err('(−3)^2 + 1', false).potSigno, -8, 'error: (−3)² como −9');
igual(err('(−4) · (−2) + 1', false).signoMul, -7, 'error: menos por menos, menos');
igual(err('5 − (−3)', false).restaNeg, 2, 'error: restar un negativo como si fuera positivo');
igual(err('−5 + 3', false).sumaSigno, -8, 'error: sumar los valores absolutos con el signo del primero');

// 4. Miles de cuentas por nivel: válidas, con su forma, su paso a paso y cuatro opciones
const TOPES = { true: [0, 150, 200, 200, 200], false: [0, 80, 100, 120, 150] };
const resumen = [];
for (const pos of [true, false]) {
  for (let nivel = 1; nivel <= 4; nivel++) {
    const rnd = semilla(1000 * nivel + (pos ? 1 : 2));
    let conDos = 0, distintas = new Set(), formas = {};
    const N = 3000;
    for (let i = 0; i < N; i++) {
      const q = C.generar(nivel, pos, rnd);
      const donde = `${pos ? 'positivos' : 'enteros'} nivel ${nivel}: «${q && q.cuenta}»`;
      if (!q) { mal(donde + ' no sale ninguna'); break; }
      distintas.add(q.cuenta);
      const forma = q.cuenta.replace(/\(−\d+\)|−\d+|\d+/g, 'n'); formas[forma] = (formas[forma] || 0) + 1;
      const v = C.valor(q.cuenta, pos);
      if (v === null) mal(donde + ' no es válida');
      if (v !== q.valor) mal(`${donde} valor ${q.valor}, y la cuenta da ${v}`);
      if (Math.abs(q.valor) > TOPES[pos][nivel]) mal(`${donde} se pasa del tope (${q.valor})`);
      if (pos && q.valor < 0) mal(donde + ' da negativo');
      // la forma de cada nivel
      const sinSigno = q.cuenta.replace(/\(−\d+\)/g, 'N');
      const conParentesis = /\(/.test(sinSigno.replace(/r\(\d+\)/g, 'R')), conCorchete = /\[/.test(q.cuenta);
      const conPotencia = /\^|r\(/.test(q.cuenta);
      if (nivel === 1 && (conParentesis || conCorchete || conPotencia)) mal(donde + ' el nivel 1 va sin paréntesis');
      if (nivel === 2 && (!conParentesis || conCorchete || conPotencia)) mal(donde + ' el nivel 2 lleva un paréntesis y nada más');
      if (nivel === 3 && (!conCorchete || conPotencia)) mal(donde + ' el nivel 3 lleva corchetes y no potencias');
      if (nivel === 4 && !conPotencia) mal(donde + ' el nivel 4 lleva potencias o raíces');
      // el paso a paso: empieza en la cuenta, acaba en el resultado, cambia en cada línea
      const p = q.pasos;
      if (p[0] !== q.cuenta) mal(`${donde} el paso a paso empieza por «${p[0]}»`);
      if (p[p.length - 1] !== String(q.valor).replace('-', '−')) mal(`${donde} el paso a paso acaba en «${p[p.length - 1]}»`);
      if (p.length < 3) mal(donde + ' el paso a paso tiene menos de dos operaciones');
      for (let k = 1; k < p.length; k++) if (p[k] === p[k - 1]) mal(`${donde} el paso ${k} repite el anterior`);
      for (let k = 0; k < p.length - 1; k++) if (C.valor(p[k], false) !== q.valor) mal(`${donde} el paso «${p[k]}» no vale lo mismo`);
      // las opciones: tres falsas, distintas, sin la buena; con positivos, ninguna negativa
      const d = q.distractores;
      if (d.length !== 3 || new Set(d).size !== 3 || d.includes(q.valor)) mal(`${donde} opciones falsas ${JSON.stringify(d)}`);
      if (pos && d.some(x => x < 0)) mal(`${donde} una opción falsa negativa con positivos ${JSON.stringify(d)}`);
      if (q.errores >= 2) conDos++;
      // el HTML: sin la notación corta
      if (/\^|r\(|\*/.test(q.html)) mal(`${donde} el HTML lleva la notación corta: ${q.html}`);
    }
    const pc = Math.round(100 * conDos / N);
    // todas las plantillas de la ficha salen, y ninguna por debajo de la mitad de lo que le toca (la primera versión,
    // por buscar dos errores de verdad, dejaba fuera las plantillas que solo admiten uno: «d + a × b» no salía nunca)
    const cuantas = (pos ? [0, 5, 5, 6, 6] : [0, 5, 5, 6, 6])[nivel];
    if (Object.keys(formas).length !== cuantas) mal(`${pos ? 'positivos' : 'enteros'} nivel ${nivel}: salen ${Object.keys(formas).length} plantillas de ${cuantas} (${Object.keys(formas).join(' | ')})`);
    for (const [f, k] of Object.entries(formas)) if (k < 0.5 * N / cuantas) mal(`${pos ? 'positivos' : 'enteros'} nivel ${nivel}: «${f}» sale poco (${k} de ${N})`);
    resumen.push(`${pos ? 'positivos' : 'enteros  '} nivel ${nivel}: ${distintas.size} cuentas distintas de ${N}; ${pc} % con dos errores de verdad o más`);
    // el mínimo, por nivel: con positivos hay plantillas que solo admiten un error de concepto («d + a × b»: ir de
    // izquierda a derecha; «a × b − x»: restar antes; «a × [b + (c − d)]»: quitar el corchete), y en esas la tercera
    // opción es un número cerca. Medido el 11-nov: 57, 77, 50 y 99 % con positivos; 100 % con enteros.
    const MINIMO = pos ? [0, 50, 70, 45, 90] : [0, 95, 95, 95, 95];
    if (pc < MINIMO[nivel]) mal(`${pos ? 'positivos' : 'enteros'} nivel ${nivel}: solo el ${pc} % lleva dos errores de verdad entre las opciones (mínimo ${MINIMO[nivel]})`);
    if (distintas.size < 500) mal(`${pos ? 'positivos' : 'enteros'} nivel ${nivel}: solo ${distintas.size} cuentas distintas`);
  }
}
console.log(resumen.join('\n'));
if (fallos) { console.log(`FALLA: ${fallos} fallos`); process.exit(1); }
console.log('PASA: el motor de las combinadas');
