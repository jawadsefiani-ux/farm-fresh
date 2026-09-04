"use client";

import { useEffect, useRef, useState } from "react";

type Zone = { code: string; name: string; width: number; length: number };
type Planting = { id: string; cropName: string; variety: string | null; plantingDate: string | null; status: string };
type Rect = { x: number; y: number; width: number; height: number };
type ManifestZone = { code: string; pixel_rect: Rect };
type ZoneManifest = { coordinate_system: { image_width_px: number; image_height_px: number }; zones: ManifestZone[] };
type Camera = { zoom: number; centerX: number; centerY: number };
type FarmMapProps = { zones: Zone[]; selected: string; occupied: Set<string>; onSelect: (code: string) => void };

const scanPath = "/farm-map/farm_top_plateau_exact_scan.png";
const manifestPath = "/farm-map/farm_fresh_exact_zone_manifest.json";
const fittedBounds: Rect = { x: 0, y: 0, width: 1948, height: 460 };
const minZoom = 1;
const maxZoom = 4;
const initialCamera: Camera = { zoom: 1, centerX: fittedBounds.width / 2, centerY: fittedBounds.height / 2 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ZoneLabel({ code, rect }: { code: string; rect: Rect }) {
  return <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2 + 4} textAnchor="middle" className="farm-map-label">{code}</text>;
}

export function ZoneHighlight({ rect }: { rect: Rect }) {
  return <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} className="farm-zone-highlight" />;
}

export function FarmZone({ zone, selected, occupied, onSelect }: { zone: ManifestZone; selected: boolean; occupied: boolean; onSelect: (code: string) => void }) {
  const rect = zone.pixel_rect;
  return <g className={`farm-zone ${selected ? "is-selected" : ""} ${occupied ? "is-occupied" : ""}`} onClick={() => onSelect(zone.code)} role="button" tabIndex={0} aria-label={`Inspect zone ${zone.code}`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(zone.code); } }}>
    <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} className="farm-zone-shape" />
    {selected && <ZoneHighlight rect={rect} />}
    <ZoneLabel code={zone.code} rect={rect} />
  </g>;
}

export function FarmMap({ zones, selected, occupied, onSelect }: FarmMapProps) {
  const [manifest, setManifest] = useState<ZoneManifest | null>(null);
  const [error, setError] = useState("");
  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; centerX: number; centerY: number } | null>(null);
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const pointerRef = useRef(new Map<number, { x: number; y: number }>());
  const movedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(manifestPath)
      .then(async (response) => { if (!response.ok) throw new Error("Could not load the approved zone manifest."); return response.json() as Promise<ZoneManifest>; })
      .then((data) => { if (!cancelled) setManifest(data); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the approved zone manifest."); });
    return () => { cancelled = true; };
  }, []);

  if (!manifest) return <div className="farm-map-loading">{error || "Loading approved farm map…"}</div>;

  const { image_width_px: imageWidth, image_height_px: imageHeight } = manifest.coordinate_system;
  const viewWidth = fittedBounds.width / camera.zoom;
  const viewHeight = fittedBounds.height / camera.zoom;
  const clampCamera = (next: Camera): Camera => ({
    zoom: clamp(next.zoom, minZoom, maxZoom),
    centerX: clamp(next.centerX, viewWidth / 2, imageWidth - viewWidth / 2),
    centerY: clamp(next.centerY, viewHeight / 2, imageHeight - viewHeight / 2),
  });
  const setZoom = (zoom: number, focus?: { x: number; y: number; horizontal: number; vertical: number }) => setCamera((current) => {
    const nextZoom = clamp(zoom, minZoom, maxZoom);
    const nextWidth = fittedBounds.width / nextZoom;
    const nextHeight = fittedBounds.height / nextZoom;
    const next = focus ? { zoom: nextZoom, centerX: focus.x - (focus.horizontal - .5) * nextWidth, centerY: focus.y - (focus.vertical - .5) * nextHeight } : { ...current, zoom: nextZoom };
    return { zoom: nextZoom, centerX: clamp(next.centerX, nextWidth / 2, imageWidth - nextWidth / 2), centerY: clamp(next.centerY, nextHeight / 2, imageHeight - nextHeight / 2) };
  });
  const fit = () => setCamera(initialCamera);
  const pointerFocus = (clientX: number, clientY: number) => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return undefined;
    const horizontal = clamp((clientX - bounds.left) / bounds.width, 0, 1);
    const vertical = clamp((clientY - bounds.top) / bounds.height, 0, 1);
    return { x: camera.centerX - viewWidth / 2 + horizontal * viewWidth, y: camera.centerY - viewHeight / 2 + vertical * viewHeight, horizontal, vertical };
  };
  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const focus = pointerFocus(event.clientX, event.clientY);
    setZoom(camera.zoom + (event.deltaY < 0 ? .2 : -.2), focus);
  };
  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointerRef.current.values()];
    if (points.length === 2) { pinchRef.current = { distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y), zoom: camera.zoom }; dragRef.current = null; movedRef.current = true; return; }
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, centerX: camera.centerX, centerY: camera.centerY };
    movedRef.current = false;
    setDragging(true);
  };
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pointerRef.current.has(event.pointerId)) return;
    pointerRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointerRef.current.values()];
    if (points.length === 2 && pinchRef.current) { const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y); if (pinchRef.current.distance > 0) setZoom(pinchRef.current.zoom * distance / pinchRef.current.distance); return; }
    const drag = dragRef.current;
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !bounds) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) movedRef.current = true;
    setCamera(clampCamera({ zoom: camera.zoom, centerX: drag.centerX - deltaX / bounds.width * viewWidth, centerY: drag.centerY - deltaY / bounds.height * viewHeight }));
  };
  const onPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => { pointerRef.current.delete(event.pointerId); if (pointerRef.current.size < 2) pinchRef.current = null; if (dragRef.current?.pointerId === event.pointerId) { dragRef.current = null; setDragging(false); } };
  const blockClickAfterDrag = (event: React.MouseEvent<SVGSVGElement>) => { if (movedRef.current) { event.preventDefault(); event.stopPropagation(); movedRef.current = false; } };
  const zoneCodes = new Set(zones.map((zone) => zone.code));

  return <div className="farm-map-canvas" aria-label="Farm zone map">
    <div className="map-surface-note"><span>Approved surveyed map</span><div className="map-controls" role="group" aria-label="Map controls"><button aria-label="Zoom out" onClick={() => setZoom(camera.zoom - .25)}>−</button><input aria-label="Map zoom" type="range" min={minZoom} max={maxZoom} step="0.1" value={camera.zoom} onChange={(event) => setZoom(Number(event.target.value))} /><button aria-label="Zoom in" onClick={() => setZoom(camera.zoom + .25)}>+</button><button className="fit-map" onClick={fit}>Fit</button></div></div>
    <div className={`farm-map-scroll ${dragging ? "is-dragging" : ""}`}>
      <svg ref={svgRef} className="farm-map-svg" viewBox={`${camera.centerX - viewWidth / 2} ${camera.centerY - viewHeight / 2} ${viewWidth} ${viewHeight}`} role="img" aria-label="Interactive farm map" preserveAspectRatio="xMidYMid meet" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onClickCapture={blockClickAfterDrag}>
        <image href={scanPath} x="0" y="0" width={imageWidth} height={imageHeight} />
        {manifest.zones.filter((zone) => zoneCodes.has(zone.code)).map((zone) => <FarmZone key={zone.code} zone={zone} selected={selected === zone.code} occupied={occupied.has(zone.code)} onSelect={onSelect} />)}
      </svg>
    </div>
    <p className="map-guidance">Drag to pan, use the wheel or slider to zoom, and choose Fit to return to the active top-plateau overview.</p>
  </div>;
}

export function ZoneDetailsPanel({ zone, plantings, onAdd, onClose }: { zone: Zone; plantings: Planting[]; onAdd: () => void; onClose: () => void }) {
  return <aside className="details zone-details-panel" aria-live="polite"><button className="zone-details-close" aria-label="Close zone details" onClick={onClose}>×</button><p className="eyebrow">ZONE DETAILS</p><h2>{zone.code}</h2><h3>{zone.name}</h3><div className="dimensions"><span><b>{zone.width} m</b> width</span><span><b>{zone.length} m</b> length</span><span><b>{zone.width * zone.length} m²</b> area</span></div><hr /><p className="eyebrow">CURRENT PLANTINGS</p>{plantings.length ? plantings.map((planting) => <div className="planting-mini" key={planting.id}><strong>{planting.cropName}{planting.variety ? ` · ${planting.variety}` : ""}</strong><span><span className={`pill ${planting.status}`}>{planting.status.replaceAll("_", " ")}</span> {planting.plantingDate || "Date unknown"}</span></div>) : <p className="muted">Nothing recorded here yet.</p>}<button className="primary full" onClick={onAdd}>+ Add planting</button><p className="history">Finished and removed plantings remain in the farm’s history.</p></aside>;
}
