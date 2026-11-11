// Una partida de verdad con las combinadas, en Chrome sin ventana (11-nov-2026).
//   node --experimental-websocket pruebas/partida-combinadas.mjs <ruta de cdp.mjs> [carpeta de capturas]
// cdp.mjs es el ayudante de Chrome de las pruebas de la web (RECURSOS PAG WEB/scripts/pruebas-ingles/cdp.mjs).
// Falla si:
//  - en la portada no están los dos modos nuevos, o sus niveles no son los 4 de las fichas;
//  - una pregunta no trae la cuenta en grande y cuatro opciones distintas, una de ellas la buena;
//  - al cerrar la pregunta no sale el paso a paso, o no acaba en la respuesta buena;
//  - el nivel pasa del 4 o no llega al 4 acertando;
//  - con el paso a paso puesto, «Siguiente pregunta» se queda fuera de la pantalla (un proyector de 1366 × 768);
//  - hay algún error en la consola.
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const [cdpRuta, capturas] = process.argv.slice(2);
if (!cdpRuta) { console.error('Uso: partida-combinadas.mjs <ruta de cdp.mjs> [carpeta de capturas]'); process.exit(2); }
const { abrirChrome } = await import(pathToFileURL(cdpRuta).href);
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const URL_RETO = pathToFileURL(path.join(AQUI, '..', 'index.html')).href;

const fallos = [];
const mal = q => { fallos.push(q); console.log('FALLA: ' + q); };
// la cuenta que se ve, otra vez en la notación corta del motor, y su valor
const LEER = `(() => {
  const g = document.querySelector('#enunciado .grande');
  if (!g) return null;
  const t = g.innerHTML.replace(/<sup>(\\d+)<\\/sup>/g, '^$1').replace(/√(\\d+)/g, 'r($1)').replace(/<[^>]+>/g, '');
  const v = Combinadas.valor(t, false);
  return { cuenta: t, valor: v === null ? null : (v < 0 ? '−' + (-v) : String(v)),
    opciones: [...document.querySelectorAll('.resp')].map(b => b.textContent.slice(1)),
    leyenda: (document.querySelector('#enunciado .leyenda') || {}).textContent || '' };
})()`;

const nav = await abrirChrome({ puerto: 9581, ancho: 1366, alto: 768, limite: 6 * 60000 });
try {
  for (const modo of ['comb-pos', 'comb-ent']) {
    await nav.leer(URL_RETO, { espera: 1500 });
    const portada = await nav.evaluar(`(() => {
      const chip = document.querySelector('#selModo .chip[data-m="${modo}"]');
      if (!chip) return null;
      chip.click();
      return { niveles: [...document.querySelectorAll('#selNivel .chip')].map(b => b.textContent),
               nota: document.getElementById('notaNivel').textContent };
    })()`);
    if (!portada) { mal(`${modo}: no está en «¿Qué números trabajamos?»`); continue; }
    const quiero = ['1. Sin paréntesis', '2. Con un paréntesis', '3. Paréntesis y corchetes', '4. Potencias y raíces'];
    if (JSON.stringify(portada.niveles) !== JSON.stringify(quiero)) mal(`${modo}: los niveles son ${JSON.stringify(portada.niveles)}`);
    // nivel 1, que suba solo, y a jugar con 2 equipos
    await nav.evaluar(`document.querySelector('#selNivel .chip[data-n="1"]').click();
      document.querySelector('#selEquipos .chip[data-n="2"]').click();
      document.querySelector('#selAdapta .chip[data-a="true"]').click();
      document.getElementById('btnJugar').click(); true`);
    let maximo = 1, rondas = 0;
    for (let i = 0; i < 40; i++) {
      const q = await nav.evaluar(LEER);
      if (!q) { mal(`${modo}: ronda ${i}: no hay cuenta en grande`); break; }
      if (q.valor === null) mal(`${modo}: «${q.cuenta}» no se puede calcular`);
      if (q.opciones.length !== 4 || new Set(q.opciones).size !== 4) mal(`${modo}: «${q.cuenta}»: opciones ${JSON.stringify(q.opciones)}`);
      if (!q.opciones.includes(q.valor)) mal(`${modo}: «${q.cuenta}» = ${q.valor} y no está entre ${JSON.stringify(q.opciones)}`);
      if (!q.leyenda) mal(`${modo}: «${q.cuenta}» sin el recordatorio del orden`);
      if (modo === 'comb-pos' && q.opciones.some(o => o.startsWith('−'))) mal(`${modo}: una opción negativa con positivos ${JSON.stringify(q.opciones)}`);
      // acierta casi siempre (para subir) y falla una de cada cinco (para ver el rebote y que baja)
      const acierta = i % 5 !== 4;
      const r = await nav.evaluar(`(() => {
        const bs = [...document.querySelectorAll('.resp')];
        const b = bs.find(x => (x.textContent.slice(1) === ${JSON.stringify(q.valor)}) === ${acierta});
        b.click();
        // con un fallo rebota: el otro equipo acierta
        if (!${acierta}) { const ok = bs.find(x => x.textContent.slice(1) === ${JSON.stringify(q.valor)}); ok.click(); }
        const pasos = [...document.querySelectorAll('#visual .pasos li')].map(li => li.textContent);
        const nivel = [...document.querySelectorAll('#marcador small')].map(s => s.textContent);
        const sig = document.getElementById('btnSig');
        return { pasos, nivel, siguiente: !!sig, aLaVista: !!sig && sig.getBoundingClientRect().bottom <= innerHeight };
      })()`);
      if (!r.pasos.length) mal(`${modo}: «${q.cuenta}»: al cerrar no sale el paso a paso`);
      else if (r.pasos[r.pasos.length - 1] !== q.valor) mal(`${modo}: «${q.cuenta}»: el paso a paso acaba en ${r.pasos[r.pasos.length - 1]}, no en ${q.valor}`);
      if (!r.siguiente) mal(`${modo}: «${q.cuenta}»: sin «Siguiente pregunta»`);
      else if (!r.aLaVista) mal(`${modo}: «${q.cuenta}» (${r.pasos.length} pasos): «Siguiente pregunta» se queda fuera de la pantalla`);
      for (const s of r.nivel) { const n = Number((s.match(/Nivel (\d+)/) || [])[1]); if (n > 4) mal(`${modo}: nivel ${n}`); maximo = Math.max(maximo, n); }
      if (capturas && modo === 'comb-ent' && i === 12) writeFileSync(path.join(capturas, 'combinadas-pasos.png'), await nav.captura());
      await nav.evaluar(`document.getElementById('btnSig').click(); true`);
      if (capturas && modo === 'comb-ent' && i === 12) writeFileSync(path.join(capturas, 'combinadas-pregunta.png'), await nav.captura());
      rondas++;
    }
    if (maximo < 4) mal(`${modo}: acertando no se llega al nivel 4 (máximo ${maximo})`);
    const { errores } = await nav.leerAhora();
    if (errores.length) mal(`${modo}: errores en la consola: ${errores.join(' | ')}`);
    console.log(`${modo}: ${rondas} rondas, nivel máximo ${maximo}`);
  }
} finally {
  await nav.cerrar();
}
if (fallos.length) { console.log(`FALLA: ${fallos.length}`); process.exit(1); }
console.log('PASA: la partida de combinadas');
