"use client";
import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number, radius: number) => void;
}

export function MapPicker({ lat, lng, radius, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const circleRef = useRef<unknown>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((containerRef.current as any)._leaflet_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (containerRef.current as any)._leaflet_id = null;
    }

    initializedRef.current = true;

    import("leaflet").then(L => {
      if (!containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = [lat || -34.6037, lng || -58.3816];

      const map = L.map(containerRef.current, {
        center,
        zoom: 18,
        zoomControl: true,
        maxZoom: 22,
      });

      // Satélite Google — cobertura global a zoom muy alto
      L.tileLayer(
        "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        {
          attribution: "Google",
          maxZoom: 22,
          maxNativeZoom: 21,
        }
      ).addTo(map);

      // Etiquetas de calles encima del satélite
      L.tileLayer(
        "https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}",
        { maxZoom: 22, maxNativeZoom: 21, opacity: 0.8 }
      ).addTo(map);

      const marker = L.marker(center, { draggable: true }).addTo(map);

      const circle = L.circle(center, {
        radius,
        color: "#8296E3",
        fillColor: "#8296E3",
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        onChange(pos.lat, pos.lng, radius);
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
        initializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar círculo cuando cambia el radio
  useEffect(() => {
    if (!circleRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (circleRef.current as any).setRadius(radius);
  }, [radius]);

  // Re-centrar cuando cambia lat/lng desde búsqueda externa
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    import("leaflet").then(L => {
      const latlng = L.latLng(lat, lng);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any).setView(latlng, 18);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (markerRef.current as any)?.setLatLng(latlng);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (circleRef.current as any)?.setLatLng(latlng);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: "260px", border: "1px solid rgba(255,255,255,0.1)" }}
      />
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
        Arrastrá el marcador · el círculo azul muestra el área de detección
      </p>
    </div>
  );
}
