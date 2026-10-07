// Descarga los ríos de Natural Earth (escala 1:10m), se queda con los de la
// zona de las campañas y los guarda simplificados en data/rios.geojson.
// Solo hace falta ejecutarlo si se quiere regenerar ese archivo.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const URL_RIOS =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson";
const CACHE = ".cache/rios10.geojson";
const ZONA = { oeste: -12, este: 42, sur: 28, norte: 60 };
const MAX_RANGO = 8; // scalerank: cuanto mayor, más secundario es el río

if (!existsSync(CACHE)) {
  await mkdir(".cache", { recursive: true });
  const res = await fetch(URL_RIOS);
  if (!res.ok) throw new Error(`No se pudo descargar ${URL_RIOS}: ${res.status}`);
  await writeFile(CACHE, await res.text());
}
const rios = JSON.parse(await readFile(CACHE, "utf8"));

const dentro = ([lon, lat]) =>
  lon >= ZONA.oeste && lon <= ZONA.este && lat >= ZONA.sur && lat <= ZONA.norte;
const redondear = ([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100];

// Elimina puntos casi alineados o muy próximos (simplificación sencilla).
function simplificar(linea) {
  const out = [];
  for (const p of linea.map(redondear)) {
    const u = out[out.length - 1];
    if (!u || Math.hypot(p[0] - u[0], p[1] - u[1]) >= 0.04) out.push(p);
  }
  const ultimo = redondear(linea[linea.length - 1]);
  const u = out[out.length - 1];
  if (u[0] !== ultimo[0] || u[1] !== ultimo[1]) out.push(ultimo);
  return out;
}

const lineas = [];
for (const f of rios.features) {
  if (!f.geometry || f.properties.scalerank > MAX_RANGO) continue;
  const partes =
    f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const parte of partes) {
    if (!parte.length || !parte.some(dentro)) continue;
    const s = simplificar(parte);
    if (s.length > 1) lineas.push(s);
  }
}

// El Berézina no está en Natural Earth: trazado aproximado a mano
// (Lepel → Borisov → Studianka → Bobruisk → desembocadura en el Dniéper).
lineas.push([
  [28.75, 54.85], [28.55, 54.6], [28.45, 54.42], [28.38, 54.33], [28.5, 54.2],
  [28.75, 53.85], [29.1, 53.4], [29.23, 53.15], [29.6, 52.8], [30.05, 52.55], [30.39, 52.37],
]);

await writeFile(
  "data/rios.geojson",
  JSON.stringify({ type: "MultiLineString", coordinates: lineas })
);
console.log(`data/rios.geojson: ${lineas.length} tramos`);
