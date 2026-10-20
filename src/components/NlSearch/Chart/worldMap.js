// World map geometry for country charts (oxjob #1745).
// public/charts/countries-110m.json: world-atlas 2.0.2 (Natural Earth 1:110m, public domain),
// with each country's ISO alpha-2 code baked into properties.iso2 (job work/bake_map.js).
// Fetched once, only when a map is drawn.

let worldPromise = null;

export function loadWorld() {
  if (!worldPromise) {
    worldPromise = fetch("/charts/countries-110m.json")
      .then((r) => {
        if (!r.ok) throw new Error(`map geometry: HTTP ${r.status}`);
        return r.json();
      })
      .then((topo) => topoFeatures(topo, "countries").filter((f) => f.properties.iso2 !== "AQ"))
      .catch((e) => {
        worldPromise = null; // let the next draw retry
        throw e;
      });
  }
  return worldPromise;
}

// TopoJSON -> GeoJSON features (polygons only; the spec's delta-encoded, quantized arcs).
// shortcut: no points or lines; world-atlas countries are all (multi)polygons.
export function topoFeatures(topology, name) {
  const t = topology.transform;
  const [kx, ky] = t ? t.scale : [1, 1];
  const [dx, dy] = t ? t.translate : [0, 0];
  const arcs = topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([a, b]) => {
      if (t) {
        x += a;
        y += b;
      } else {
        x = a;
        y = b;
      }
      return [x * kx + dx, y * ky + dy];
    });
  });
  const arcPoints = (i) => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
  const ring = (ids) => ids.flatMap((i, k) => (k ? arcPoints(i).slice(1) : arcPoints(i)));
  const polygon = (rings) => rings.map(ring);
  return topology.objects[name].geometries
    .filter((g) => g.type === "Polygon" || g.type === "MultiPolygon")
    .map((g) => ({
      type: "Feature",
      id: g.id,
      properties: g.properties || {},
      geometry: {
        type: g.type,
        coordinates: g.type === "Polygon" ? polygon(g.arcs) : g.arcs.map(polygon),
      },
    }));
}
