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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Leaflet must be loaded client-side only
    import("leaflet").then(L => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [lat || -34.6037, lng || -58.3816],
        zoom: 18,
        zoomControl: true,
      });

      // Satélite Esri (gratuito, sin API key)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri", maxZoom: 20 }
      ).addTo(map);

      // Marcador draggable
      const marker = L.marker([lat || -34.6037, lng || -58.3816], { draggable: true }).addTo(map);

      // Círculo del radio
      const circle = L.circle([lat || -34.6037, lng || -58.3816], {
        radius,
        color: "#8296E3",
        fillColor: "#8296E3",
        fillOpacity: 0.15,
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
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar círculo cuando cambia el radio
  useEffect(() => {
    if (!circleRef.current) return;
    import("leaflet").then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (circleRef.current as any).setRadius(radius);
    });
  }, [radius]);

  // Centrar mapa si cambian las coords desde fuera (nueva dirección buscada)
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
      onChange(lat, lng, radius);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: "260px", border: "1px solid rgba(255,255,255,0.1)" }}
      />
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
        Arrastrá el marcador para ajustar la ubicación exacta
      </p>
    </div>
  );
}
