# Las campañas de Napoleón

Mapa interactivo para seguir, mientras lees una biografía de Napoleón, por dónde se movieron él y sus ejércitos, de Ajaccio (1769) a Santa Elena (1815).

**Para usarlo, abre `index.html` en el navegador.** No necesita instalar nada ni conexión a internet (sin conexión solo cambian las fuentes).

## Qué incluye

- **12 etapas**: los inicios, Italia (1796–97), Egipto y Siria, Marengo, Ulm y Austerlitz, Prusia y Polonia, España, Wagram, Rusia, Alemania (1813), Francia y Elba (1814) y los Cien Días.
- **Cada parada** trae la fecha, qué pasó y **cómo se llama hoy el lugar y en qué país está** (Eylau → Bagrationovsk, Rusia; Austerlitz → Slavkov u Brna, República Checa…).
- **Buscador**: escribe un nombre que aparezca en el libro (en español o con su nombre actual) y te lleva a esa parada.
- **Paso a paso**: botones Anterior/Siguiente (o las flechas del teclado) y «Recorrer» para animar la campaña. La «N» marca dónde está Napoleón en cada momento.
- Las batallas en las que Napoleón **no estuvo en persona** (Trafalgar, Bailén, Auerstedt…) aparecen con borde discontinuo.
- En Rusia, el **grosor de la ruta** sigue las cifras del gráfico de Minard.
- **Mapa táctico** de algunas batallas (de momento, Marengo): aldeas, ríos y la posición de cada general fase a fase.
- Fronteras actuales, ríos principales y modo oscuro.

## Cómo modificarlo

Los datos están en `data/campanas.json`. Cada parada tiene:

| Campo | Significado |
| --- | --- |
| `n` | Nombre (como suele aparecer en los libros en español) |
| `hoy` | Nombre y país actuales |
| `lat`, `lon` | Coordenadas |
| `f` | Fecha, tal como se muestra |
| `t` | `batalla`, `asedio`, `tratado`, `paso`, `ciudad` o `via` (punto de paso sin ficha, p. ej. en el mar) |
| `r` | Resultado: `v` victoria, `d` derrota, `i` indecisa |
| `sin` | `true` si Napoleón no estuvo presente |
| `mar` | `true` si a este punto se llega por mar |
| `fuera` | `true` para no tenerla en cuenta al encuadrar la campaña (lugares muy alejados) |
| `x` | Texto de la ficha |
| `libro` | Si el dato viene de la biografía, el porcentaje de lectura donde aparece |

Para enlazar una parada con un mapa táctico se añaden `"tactico": "<id>"` y `"fase": <número>` (la fase con la que se abre).

### Mapas tácticos

`data/tacticos.json` guarda los planos de batalla (de momento, Marengo). Cada batalla tiene:

- `lugares`: aldeas, granjas y ciudades (`t`: `ciudad`, `pueblo`, `granja`, `obra`), con `p: [lat, lon]`.
- `lineas`: ríos (`rio`), arroyos (`arroyo`) y caminos (`camino`), como listas de `[lat, lon]`.
- `fases`: cada una con hora (`h`), título, texto (`x`), `libro` opcional, y:
  - `u`: unidades con general (`n`), bando (`b`: `fr` o `au`), tipo (`t`: `inf`, `cab`, `art`, o `n` para un mando) y posición. `"x": true` la marca como destruida o capturada.
  - `f`: flechas de movimiento (`p`: puntos, `r: true` si es una retirada, `n` para un rótulo).
  - `m`: marcas sueltas (por ejemplo, dónde murió un general).

Tras editar, regenera la página:

```sh
npm install
npm run build
```

Esto crea `index.html` (y `dist/mapa-napoleon.html`, la misma página sin cabecera HTML). Los ríos (`data/rios.geojson`) se generan con `npm run rios`, que descarga Natural Earth.

## Fuentes de los datos geográficos

Fronteras: [Natural Earth](https://www.naturalearthdata.com/) vía `world-atlas`. Ríos: Natural Earth 1:10m (el Berézina, que no figura, está trazado a mano de forma aproximada). Las rutas unen las paradas en línea recta: muestran el recorrido general, no los caminos exactos.
