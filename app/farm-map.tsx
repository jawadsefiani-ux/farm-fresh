"use client";

import { useEffect, useState } from "react";

type Zone = { code: string; name: string; width: number; length: number };
type Planting = { id: string; cropName: string; variety: string | null; plantingDate: string | null; status: string };
type ManifestZone = { code: string; pixel_rect: { x: number; y: number; width: number; height: number } };
type ZoneManifest = { coordinate_system: { image_width_px: number; image_height_px: number }; zones: ManifestZone[] };

type FarmMapProps = { zones: Zone[]; selected: string; occupied: Set<string>; onSelect: (code: string) => void };
type MapView = "focused" | "full";

const scanPath = "/farm-map/farm_top_plateau_exact_scan.png";
const manifestPath = "/farm-map/farm_fresh_exact_zone_manifest.json";
// This is a display-only viewport: it preserves the approved scan and its exact source coordinate system.
const focusedViewport = { x: 0, y: 0, width: 1948, height: 460 };

export function ZoneLabel({ code, rect }: { code: string; rect: ManifestZone["pixel_rect"] }) {
  return <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2 + 4} textAnchor="middle" className="farm-map-label">{code}</text>;
}

export function ZoneHighlight({ rect }: { rect: ManifestZone["pixel_rect"] }) {
  return <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} className="farm-zone-highlight" />;
}

export function FarmZone({ zone, selected, occupied, onSelect }: { zone: ManifestZone; selected: boolean; occupied: boolean; onSelect: (code: string) => void }) {
  const { rect } = { rect: zone.pixel_rect };
  return <g className={`farm-zone ${selected ? "is-selected" : ""} ${occupied ? "is-occupied" : ""}`} onClick={() => onSelect(zone.code)} role="button" tabIndex={0} aria-label={`Inspect zone ${zone.code}`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(zone.code); } }}>
    <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} className="farm-zone-shape" />
    {selected && <ZoneHighlight rect={rect} />}
    <ZoneLabel code={zone.code} rect={rect} />
  </g>;
}

export function FarmMap({ zones, selected, occupied, onSelect }: FarmMapProps) {
  const [manifest, setManifest] = useState<ZoneManifest | null>(null);
  const [mapView, setMapView] = useState<MapView>("focused");

  useEffect(() => {
    let cancelled = false;
    void fetch(manifestPath)
      .then(async (response) => { if (!response.ok) throw new Error("Could not load the approved zone manifest."); return response.json() as Promise<ZoneManifest>; })
      .then((data) => { if (!cancelled) setManifest(data); });
    return () => { cancelled = true; };
  }, []);

  if (!manifest) return <div className="farm-map-loading">Loading approved farm map…</div>;

  const { image_width_px: imageWidth, image_height_px: imageHeight } = manifest.coordinate_system;
  const viewport = mapView === "focused" ? focusedViewport : { x: 0, y: 0, width: imageWidth, height: imageHeight };
  const zoneCodes = new Set(zones.map((zone) => zone.code));

  return <div className={`farm-map-canvas ${mapView === "focused" ? "is-focused" : "is-full"}`} aria-label="Farm zone map">
    <div className="map-surface-note"><span>Approved surveyed map</span><div className="map-view-controls" role="group" aria-label="Map view"><button className={mapView === "focused" ? "active" : ""} aria-pressed={mapView === "focused"} onClick={() => setMapView("focused")}>Focused view</button><button className={mapView === "full" ? "active" : ""} aria-pressed={mapView === "full"} onClick={() => setMapView("full")}>Full map</button></div></div>
    <div className="farm-map-scroll">
      <svg className="farm-map-svg" viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`} role="img" aria-label={`${mapView === "focused" ? "Focused" : "Full"} interactive farm map`} preserveAspectRatio="xMidYMid meet">
        <image href={scanPath} x="0" y="0" width={imageWidth} height={imageHeight} />
        {manifest.zones.filter((zone) => zoneCodes.has(zone.code)).map((zone) => <FarmZone key={zone.code} zone={zone} selected={selected === zone.code} occupied={occupied.has(zone.code)} onSelect={onSelect} />)}
      </svg>
    </div>
    <p className="map-guidance">{mapView === "focused" ? "Focused view hides the unused lower scan area. " : "Full map shows the complete approved scan. "}Zone overlays use the approved manifest coordinates.</p>
  </div>;
}

export function ZoneDetailsPanel({ zone, plantings, onAdd }: { zone: Zone; plantings: Planting[]; onAdd: () => void }) {
  return <aside className="details zone-details-panel" aria-live="polite"><p className="eyebrow">ZONE DETAILS</p><h2>{zone.code}</h2><h3>{zone.name}</h3><div className="dimensions"><span><b>{zone.width} m</b> width</span><span><b>{zone.length} m</b> length</span><span><b>{zone.width * zone.length} m²</b> area</span></div><hr /><p className="eyebrow">CURRENT PLANTINGS</p>{plantings.length ? plantings.map((planting) => <div className="planting-mini" key={planting.id}><strong>{planting.cropName}{planting.variety ? ` · ${planting.variety}` : ""}</strong><span><span className={`pill ${planting.status}`}>{planting.status.replaceAll("_", " ")}</span> {planting.plantingDate || "Date unknown"}</span></div>) : <p className="muted">Nothing recorded here yet.</p>}<button className="primary full" onClick={onAdd}>+ Add planting</button><p className="history">Finished and removed plantings remain in the farm’s history.</p></aside>;
}
