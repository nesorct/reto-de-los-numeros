# El reto de los números

Juego por equipos de la **unidad 1 de Matemáticas (Números)** del Ámbito Científico, 2.º de ESO.
Se proyecta en la pizarra y juega la clase entera.

**Enlace:** https://nesorct.github.io/reto-de-los-numeros/

Un fichero HTML suelto. Se abre de un doble clic y no hay que instalar nada; con internet carga la
fuente Lexend y sin él usa la del sistema.

```
index.html      el juego (se llama así porque es lo que sirve GitHub Pages)
```

## Cómo se juega

De 2 a 6 equipos. A cada equipo le toca una pregunta con cuatro opciones y, si acierta, suma
puntos. **Si falla, la pregunta rebota al equipo siguiente**, que puede llevarse la mitad.

| Qué números | |
|---|---|
| Leer y escribir positivos | de la cifra a la letra y al revés, también en contexto: un estadio, una montaña, una biblioteca… |
| Leer y escribir negativos | con la recta y con situaciones: temperaturas, plantas de un edificio, deudas, buceo |
| Descomposición | suma de valores, en unidades y cuánto vale una cifra según dónde está |
| Redondear | a cualquier lugar; en los niveles bajos, con la recta delante |
| Operar con naturales | las cuatro operaciones, jerarquía, paréntesis, potencias, raíces y problemas |
| Operar con enteros | la recta, el opuesto, el valor absoluto, la regla de los signos y problemas |
| Mezcla de todo | |

## Los niveles

Seis, de las decenas (hasta 99) a los millones grandes (hasta 999.999.999). **Del 3 en adelante no
solo crecen los números: entran la jerarquía de operaciones, los paréntesis y las potencias**, que
es donde de verdad se atascan.

El nivel puede **subir y bajar solo**: cada equipo lleva el suyo, sube al segundo acierto seguido y
baja a cada fallo. Acertar en un nivel alto vale más (4 + 2 × nivel), así que a nadie le compensa
quedarse abajo. También se puede dejar **fijo para todos** y moverlo a mano con «+ nivel» y
«− nivel».

## Las opciones falsas son errores de verdad

No son números al azar: son los fallos que salen en la pizarra. Sumar sin llevarse, restar siempre la
cifra pequeña de la grande, escribir «veinte mil cinco» como 20005, redondear hacia el lado que no
es o quitar las cifras en vez de redondear. Para acertar hay que hacer la cuenta, no descartar.

## Modo pizarra

Un número al azar para trabajarlo con toda la clase. Se ve en cifras o en letra y, cuando toca, se
abren su lectura, su descomposición, la tabla de posiciones (se toca una cifra y dice cuánto vale),
sus redondeos y un botón para escucharlo.

## Teclado

A-D o 1-4 para responder y Enter para la pregunta siguiente. En el modo pizarra, la flecha derecha
saca otro número.

## Sin datos del alumnado

Los equipos se llaman «Equipo 1», «Equipo 2»… No se escribe ningún nombre, no hay servidor ni
cuenta y no se guarda nada: al recargar, la partida empieza de cero.

## Historial

- **2026-09-30.** Publicado en GitHub Pages.
- **2026-10-06.** **La partida ya no se queda sin «Siguiente pregunta».** Tras un fallo, el rebote programaba
  repintar la barra a los 1,4 s; si el equipo del rebote contestaba antes (un clic rápido o las teclas A-D), ese
  repintado llegaba tarde y dejaba **solo «Terminar partida»**. Ahora el temporizador se cancela al cerrar la
  pregunta y, con la pregunta contestada, la barra pone siempre «Siguiente pregunta». Probado en el navegador:
  la versión anterior se atascaba en la primera ronda y la nueva jugó **300 rondas seguidas** (227 rebotes) sin
  pararse. **Las partidas no tienen límite de rondas:** solo acaban con «Terminar partida».
