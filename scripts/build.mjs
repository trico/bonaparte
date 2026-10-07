// Genera el mapa: proyecta fronteras, ríos y paradas con d3-geo y los
// incrusta en la plantilla. El resultado no necesita conexión ni librerías.
//
//   index.html             página completa para abrir en el navegador
//   dist/mapa-napoleon.html  la misma página sin <html>/<head>, para publicarla como Artifact
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { geoConicConformal, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

const require = createRequire(import.meta.url);
const mundo = require("world-atlas/countries-50m.json");
const campanas = JSON.parse(await readFile("data/campanas.json", "utf8"));
const rios = JSON.parse(await readFile("data/rios.geojson", "utf8"));

// Zona dibujada: de Santa Elena a Moscú y de Lisboa a Palestina.
const ANCHO = 2000;
const zona = {
  type: "Polygon",
  coordinates: [[[-26, -20], [-26, 70], [45, 70], [45, -20], [-26, -20]]],
};
const proyeccion = geoConicConformal()
  .parallels([35, 55])
  .rotate([-12, 0])
  .fitWidth(ANCHO, zona);
const [[, y0], [, y1]] = geoPath(proyeccion).bounds(zona);
const ALTO = Math.ceil(y1 - y0);
proyeccion.translate([proyeccion.translate()[0], proyeccion.translate()[1] - y0]);
proyeccion.clipExtent([[0, 0], [ANCHO, ALTO]]);
const camino = geoPath(proyeccion).digits(1);

const paises = feature(mundo, mundo.objects.countries);
const fronteras = mesh(mundo, mundo.objects.countries, (a, b) => a !== b);
const costa = mesh(mundo, mundo.objects.countries, (a, b) => a === b);

const redondear = (v) => Math.round(v * 10) / 10;
const proyectar = (lon, lat) => proyeccion([lon, lat]).map(redondear);

for (const c of campanas) {
  for (const p of c.paradas) [p.mx, p.my] = proyectar(p.lon, p.lat);
}

// Nombres de países actuales, para orientarse. "z" es el zoom mínimo al que aparecen.
const etiquetas = [
  ["Francia", 46.8, 2.6, 1], ["España", 40.0, -3.8, 1], ["Portugal", 39.6, -8.1, 2],
  ["Italia", 42.6, 12.7, 1], ["Alemania", 51.2, 10.2, 1], ["Austria", 47.4, 14.4, 2],
  ["Suiza", 46.75, 8.0, 3], ["Bélgica", 50.6, 4.6, 4], ["Países Bajos", 52.3, 5.6, 3],
  ["Reino Unido", 53.3, -1.8, 1], ["Irlanda", 53.2, -8.0, 2], ["Polonia", 52.1, 19.3, 1],
  ["Rep. Checa", 49.8, 15.4, 2], ["Eslovaquia", 48.7, 19.6, 3], ["Hungría", 47.1, 19.4, 2],
  ["Lituania", 55.4, 23.8, 3], ["Letonia", 56.9, 25.2, 3], ["Bielorrusia", 53.6, 28.0, 2],
  ["Ucrania", 49.0, 31.0, 1], ["Rusia", 57.5, 38.0, 1], ["Rumanía", 45.9, 24.9, 2],
  ["Dinamarca", 56.0, 9.2, 3], ["Suecia", 60.0, 15.0, 2], ["Croacia", 45.4, 15.9, 4],
  ["Serbia", 44.1, 20.8, 3], ["Grecia", 39.4, 22.0, 2], ["Turquía", 39.0, 34.0, 1],
  ["Egipto", 27.0, 30.5, 1], ["Libia", 29.0, 18.0, 1], ["Túnez", 34.5, 9.2, 3],
  ["Argelia", 30.0, 3.0, 1], ["Marruecos", 31.8, -6.5, 2], ["Israel", 31.2, 34.85, 6],
  ["Siria", 35.0, 38.5, 3], ["Kaliningrado (Rusia)", 54.75, 21.3, 5],
  ["Bulgaria", 42.7, 25.3, 3], ["Bosnia", 44.2, 17.8, 4], ["Eslovenia", 46.1, 14.8, 6],
  ["Moldavia", 47.2, 28.5, 5], ["Estonia", 58.7, 25.6, 4], ["Noruega", 61.2, 9.0, 2],
  ["Malta", 35.75, 14.4, 6], ["Córcega", 42.15, 9.1, 4], ["Cerdeña", 40.1, 9.0, 4],
  ["Sicilia", 37.55, 14.1, 4], ["Elba", 42.75, 10.15, 8],
];
const mares = [
  ["Mar Mediterráneo", 35.0, 18.5, 1], ["Océano Atlántico", 42.0, -17.0, 1],
  ["Mar del Norte", 56.0, 3.0, 2], ["Mar Báltico", 56.3, 18.6, 2], ["Mar Negro", 43.3, 34.0, 1],
  ["Mar Adriático", 43.0, 15.2, 3], ["Mar Tirreno", 40.0, 11.8, 3], ["Golfo de Vizcaya", 45.4, -4.6, 3],
  ["Canal de la Mancha", 50.1, -2.0, 4],
];
const rotulo = ([n, lat, lon, z]) => {
  const [x, y] = proyectar(lon, lat);
  return { n, x, y, z };
};

const datos = {
  ancho: ANCHO,
  alto: ALTO,
  paises: etiquetas.map(rotulo),
  mares: mares.map(rotulo),
  campanas,
};

const mapaBase = [
  `<path class="tierra" d="${camino(paises)}"/>`,
  `<path class="rios" d="${camino(rios)}"/>`,
  `<path class="fronteras" d="${camino(fronteras)}"/>`,
  `<path class="costa" d="${camino(costa)}"/>`,
].join("\n");

const plantilla = await readFile("src/plantilla.html", "utf8");
const fragmento = plantilla
  .replace("<!--MAPA_BASE-->", () => mapaBase)
  .replace("/*DATOS*/", () => `const DATOS = ${JSON.stringify(datos)};`)
  .replaceAll("__ANCHO__", String(ANCHO))
  .replaceAll("__ALTO__", String(ALTO));

const completa = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${fragmento}
</body>
</html>
`;

await mkdir("dist", { recursive: true });
await writeFile("index.html", completa);
await writeFile("dist/mapa-napoleon.html", fragmento);
const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} KB`;
console.log(`index.html (${kb(completa)}) y dist/mapa-napoleon.html (${kb(fragmento)})`);
