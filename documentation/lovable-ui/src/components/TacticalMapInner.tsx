import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  Polygon,
  CircleMarker,
  useMap,
  LayersControl,
} from "react-leaflet";

export type MapDetection = {
  id: string;
  bearing: number;
  dist: number;
  conf: number;
  status: "pending" | "confirmed" | "dismissed";
};

const ORIGIN: [number, number] = [37.8651, -119.5383];
const METERS_PER_DEG_LAT = 111_111;

function offsetLatLng(bearing: number, dist: number): [number, number] {
  const rad = (bearing * Math.PI) / 180;
  const dLat = (Math.cos(rad) * dist) / METERS_PER_DEG_LAT;
  const dLng =
    (Math.sin(rad) * dist) /
    (METERS_PER_DEG_LAT * Math.cos((ORIGIN[0] * Math.PI) / 180));
  return [ORIGIN[0] + dLat, ORIGIN[1] + dLng];
}

const FIRE_PERIM: [number, number][] = [
  offsetLatLng(20, 60),
  offsetLatLng(50, 90),
  offsetLatLng(85, 80),
  offsetLatLng(70, 40),
  offsetLatLng(40, 30),
];

function Recenter({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 18, { duration: 0.6 });
  }, [target, map]);
  return null;
}

type Props = {
  detections: MapDetection[];
  hoverId: string | null;
  focusId: string | null;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
};

export default function TacticalMapInner({
  detections,
  hoverId,
  focusId,
  onConfirm,
  onDismiss,
}: Props) {
  const target = useMemo(() => {
    const id = focusId ?? hoverId;
    if (!id) return null;
    const d = detections.find((x) => x.id === id);
    return d ? offsetLatLng(d.bearing, d.dist) : null;
  }, [focusId, hoverId, detections]);

  return (
    <MapContainer
      center={ORIGIN}
      zoom={17}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#000" }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO &copy; OpenStreetMap"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenTopoMap &copy; OpenStreetMap"
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <Polygon
        positions={FIRE_PERIM}
        pathOptions={{
          color: "rgb(255,106,61)",
          fillColor: "rgb(255,106,61)",
          fillOpacity: 0.18,
          weight: 1.2,
          dashArray: "4 3",
        }}
      />

      <CircleMarker
        center={ORIGIN}
        radius={9}
        pathOptions={{
          color: "rgb(124,196,255)",
          fillColor: "rgb(124,196,255)",
          fillOpacity: 0.5,
          weight: 2,
        }}
      >
        <Popup>UAS-04 · sector C sweep</Popup>
      </CircleMarker>

      {detections
        .filter((d) => d.status !== "dismissed")
        .map((d) => {
          const pos = offsetLatLng(d.bearing, d.dist);
          const color =
            d.status === "confirmed"
              ? "rgb(124,196,255)"
              : "rgb(255,106,61)";
          const isHover = hoverId === d.id || focusId === d.id;
          return (
            <CircleMarker
              key={d.id}
              center={pos}
              radius={isHover ? 11 : 7}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                  <div>
                    <b>{d.id}</b> · conf {d.conf.toFixed(2)}
                  </div>
                  <div>
                    {String(d.bearing).padStart(3, "0")}° · {d.dist} m
                  </div>
                  {d.status === "pending" && (
                    <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                      <button
                        onClick={() => onConfirm(d.id)}
                        style={{
                          background: "rgb(124,196,255)",
                          color: "#000",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => onDismiss(d.id)}
                        style={{
                          background: "#333",
                          color: "#fff",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  {d.status === "confirmed" && (
                    <div style={{ marginTop: 4, color: "rgb(30,120,200)" }}>
                      ✓ Confirmed · relayed
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      <Recenter target={target} />
    </MapContainer>
  );
}
