"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Venue } from "@/lib/supabase";

const MapPicker = dynamic(() => import("./MapPicker").then(m => m.MapPicker), { ssr: false, loading: () => (
  <div className="w-full h-[260px] rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <div className="w-6 h-6 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
  </div>
) });

const DAYS_ES: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

const RADIUS_LABELS: Record<number, string> = {
  10:  "10m — Zona muy precisa (interior exacto)",
  20:  "20m — Mesa o barra específica",
  30:  "30m — Local pequeño",
  50:  "50m — Local mediano o céntrico",
  75:  "75m — Local con patio o terraza",
  100: "100m — Tamaño estándar (recomendado)",
  150: "150m — Local grande",
  200: "200m — Con estacionamiento o fila afuera",
  300: "300m — Predio o complejo",
};

function getRadiusLabel(val: number): string {
  const keys = Object.keys(RADIUS_LABELS).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
  return RADIUS_LABELS[closest] ?? `${val}m`;
}

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const labelStyle = { color: "rgba(255,255,255,0.45)" };

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function uploadVenueImage(file: File): Promise<string | null> {
  const { supabaseClient } = await import("@/lib/supabase");
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage.from("venues").upload(path, file, { upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = supabaseClient.storage.from("venues").getPublicUrl(path);
  return data.publicUrl;
}

export function AdminClient() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);

  // Formulario
  const [form, setForm] = useState({
    name: "", address: "", lat: 0, lng: 0,
    radius_meters: 100, open_time: "22:00", close_time: "06:00",
    open_days: [] as string[], zone: null as [number,number][] | null,
    logo_url: null as string | null,
  });
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);

  // Buscador de dirección
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", address: "", lat: 0, lng: 0,
    radius_meters: 100, open_time: "22:00", close_time: "06:00",
    open_days: [] as string[], zone: null as [number,number][] | null,
    logo_url: null as string | null,
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editAddressQuery, setEditAddressQuery] = useState("");
  const [editAddressResults, setEditAddressResults] = useState<NominatimResult[]>([]);
  const [searchingEditAddress, setSearchingEditAddress] = useState(false);
  const editSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    fetch("/api/admin/locals")
      .then(r => r.json())
      .then(d => { setVenues(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  function onAddressInput(val: string) {
    setAddressQuery(val);
    setForm(f => ({ ...f, address: val, lat: 0, lng: 0 }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.length < 4) { setAddressResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingAddress(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const data: NominatimResult[] = await res.json();
      setAddressResults(data);
      setSearchingAddress(false);
    }, 600);
  }

  function selectAddress(result: NominatimResult) {
    setAddressQuery(result.display_name);
    setForm(f => ({ ...f, address: result.display_name, lat: parseFloat(result.lat), lng: parseFloat(result.lon) }));
    setAddressResults([]);
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      open_days: f.open_days.includes(day) ? f.open_days.filter(d => d !== day) : [...f.open_days, day],
    }));
  }

  async function handleCreate() {
    if (!form.name || !form.lat || !form.lng) return;
    setSaving(true);
    let logo_url = form.logo_url;
    if (formImageFile) logo_url = await uploadVenueImage(formImageFile);
    const res = await fetch("/api/admin/locals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, logo_url }),
    });
    const data = await res.json();
    if (data.id) {
      setVenues(v => [...v, data]);
      setShowForm(false);
      setForm({ name: "", address: "", lat: 0, lng: 0, radius_meters: 100, open_time: "22:00", close_time: "06:00", open_days: [], zone: null, logo_url: null });
      setAddressQuery("");
      setFormImageFile(null);
      setFormImagePreview(null);
    }
    setSaving(false);
  }

  function openEdit(venue: Venue) {
    setEditingVenue(venue);
    setEditForm({
      name: venue.name,
      address: venue.address ?? "",
      lat: venue.lat,
      lng: venue.lng,
      radius_meters: venue.radius_meters,
      open_time: venue.open_time ?? "22:00",
      close_time: venue.close_time ?? "06:00",
      open_days: venue.open_days ?? [],
      zone: (venue.zone as [number,number][] | null) ?? null,
      logo_url: venue.logo_url ?? null,
    });
    setEditAddressQuery(venue.address ?? "");
    setEditAddressResults([]);
    setEditImageFile(null);
    setEditImagePreview(venue.logo_url ?? null);
  }

  function onEditAddressInput(val: string) {
    setEditAddressQuery(val);
    setEditForm(f => ({ ...f, address: val, lat: 0, lng: 0 }));
    if (editSearchTimeout.current) clearTimeout(editSearchTimeout.current);
    if (val.length < 4) { setEditAddressResults([]); return; }
    editSearchTimeout.current = setTimeout(async () => {
      setSearchingEditAddress(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const data: NominatimResult[] = await res.json();
      setEditAddressResults(data);
      setSearchingEditAddress(false);
    }, 600);
  }

  function selectEditAddress(result: NominatimResult) {
    setEditAddressQuery(result.display_name);
    setEditForm(f => ({ ...f, address: result.display_name, lat: parseFloat(result.lat), lng: parseFloat(result.lon) }));
    setEditAddressResults([]);
  }

  function toggleEditDay(day: string) {
    setEditForm(f => ({
      ...f,
      open_days: f.open_days.includes(day) ? f.open_days.filter(d => d !== day) : [...f.open_days, day],
    }));
  }

  async function handleSaveEdit() {
    if (!editingVenue) return;
    setSaving(true);
    let logo_url = editForm.logo_url;
    if (editImageFile) logo_url = await uploadVenueImage(editImageFile);
    const res = await fetch("/api/admin/locals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingVenue.id, ...editForm, logo_url }),
    });
    const data = await res.json();
    if (data.id) {
      setVenues(v => v.map(venue => venue.id === data.id ? data : venue));
      setEditingVenue(null);
      setEditImageFile(null);
      setEditImagePreview(null);
    }
    setSaving(false);
  }

  async function handleInvite() {
    if (!inviteEmail || !showInvite) return;
    setSaving(true);
    const venue = venues.find(v => v.id === showInvite);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, venue_id: showInvite, venue_name: venue?.name }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setInviteResult({ email: inviteEmail, tempPassword: data.tempPassword });
      setShowInvite(null);
      setInviteEmail("");
    }
  }

  const ImageUpload = ({
    preview, onFile, label = "Imagen del local"
  }: { preview: string | null; onFile: (f: File, url: string) => void; label?: string }) => (
    <Field label={label}>
      <label className="block cursor-pointer">
        <input type="file" accept="image/*" className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = URL.createObjectURL(f);
            onFile(f, url);
          }} />
        {preview ? (
          <div className="relative w-full h-36 rounded-2xl overflow-hidden group">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              <p className="text-white text-xs font-medium">Cambiar imagen</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors hover:border-[#8296E3]"
            style={{ ...inputStyle, border: "1.5px dashed rgba(255,255,255,0.15)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Tocá para subir una foto</p>
          </div>
        )}
      </label>
    </Field>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-[11px] mb-1.5 uppercase tracking-widest" style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-black pb-10">
      {/* Header */}
      <header className="px-5 pt-12 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Panel Admin</h1>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Incontro</p>
            </div>
          </div>
          <Link href="/home"
            className="text-xs px-3 py-1.5 rounded-xl font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            ← App
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">
        {/* Título sección + botón */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-sm">Establecimientos</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {venues.length} {venues.length === 1 ? "lugar registrado" : "lugares registrados"}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: showForm ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #8296E3, #4762C7)" }}
          >
            {showForm ? "✕ Cancelar" : "+ Nuevo"}
          </button>
        </div>

        {/* Formulario nuevo */}
        {showForm && (
          <div className="rounded-2xl p-4 mb-5 flex flex-col gap-4 animate-slide-up"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(130,150,227,0.2)" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(#8296E3, #4762C7)" }} />
              <p className="text-white text-sm font-semibold">Nuevo establecimiento</p>
            </div>

            <ImageUpload preview={formImagePreview}
              onFile={(file, url) => { setFormImageFile(file); setFormImagePreview(url); }} />

            <Field label="Nombre">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Club Niceto"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={inputStyle} />
            </Field>

            <Field label="Dirección">
              <div className="relative">
                <input value={addressQuery} onChange={e => onAddressInput(e.target.value)}
                  placeholder="Buscá el establecimiento..."
                  className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none pr-10"
                  style={inputStyle} />
                {searchingAddress && <div className="absolute right-3 top-3.5 w-4 h-4 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />}
              </div>
              {addressResults.length > 0 && (
                <div className="mt-1 rounded-2xl overflow-hidden" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {addressResults.map((r, i) => (
                    <button key={i} onClick={() => selectAddress(r)}
                      className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/5 transition-colors"
                      style={{ borderBottom: i < addressResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
              {form.lat !== 0 && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#4ade80" }}>
                  <span>✓</span> Ubicación confirmada
                </p>
              )}
            </Field>

            {form.lat !== 0 && (
              <Field label="Mapa y zona de detección">
                <MapPicker lat={form.lat} lng={form.lng} radius={form.radius_meters} zone={form.zone}
                  onChange={(lat, lng, radius, zone) => setForm(f => ({ ...f, lat, lng, radius_meters: radius, zone: zone ?? null }))} />
              </Field>
            )}

            <Field label={`Radio de detección · ${form.radius_meters}m`}>
              <input type="range" min="10" max="300" step="5" value={form.radius_meters}
                onChange={e => setForm(f => ({ ...f, radius_meters: parseInt(e.target.value) }))}
                className="w-full accent-[#8296E3] mt-1" />
              <p className="text-xs mt-1.5" style={{ color: "#8296E3" }}>{getRadiusLabel(form.radius_meters)}</p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              {[{ label: "Abre", key: "open_time" }, { label: "Cierra", key: "close_time" }].map(({ label, key }) => (
                <Field key={key} label={label}>
                  <input type="time" value={form[key as "open_time" | "close_time"]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: "dark" }} />
                </Field>
              ))}
            </div>

            <Field label="Días">
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(DAYS_ES).map(([key, label]) => (
                  <button key={key} onClick={() => toggleDay(key)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={form.open_days.includes(key)
                      ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff" }
                      : { ...inputStyle, color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowForm(false); setAddressQuery(""); setAddressResults([]); }}
                className="flex-1 py-3 rounded-2xl text-sm font-medium" style={{ ...inputStyle, color: "rgba(255,255,255,0.4)" }}>
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={saving || !form.name || !form.lat}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {saving ? "Creando..." : "Crear local"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="text-2xl">🏢</span>
            </div>
            <p className="text-white/30 text-sm">No hay establecimientos</p>
            <p className="text-white/20 text-xs">Creá el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {venues.map(venue => (
              <div key={venue.id} className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Top strip */}
                <div className="h-1 w-full" style={{
                  background: venue.is_open
                    ? "linear-gradient(90deg, #4ade80, #22c55e)"
                    : "rgba(255,255,255,0.08)"
                }} />

                <div className="p-4">
                  {/* Nombre + badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        {venue.logo_url ? (
                          <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                            {venue.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{venue.name}</p>
                        {venue.address && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {venue.address.split(",").slice(0, 2).join(",")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                      venue.is_open
                        ? "text-green-400 bg-green-400/10"
                        : "bg-white/5"
                    }`} style={{ color: venue.is_open ? undefined : "rgba(255,255,255,0.25)" }}>
                      {venue.is_open ? "● Abierto" : "○ Cerrado"}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="flex items-center gap-4 mb-3">
                    {venue.open_time && venue.close_time && (
                      <div className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {venue.open_time.slice(0,5)} – {venue.close_time.slice(0,5)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {venue.zone ? "Zona personalizada" : `${venue.radius_meters}m radio`}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(venue)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: "rgba(130,150,227,0.12)", border: "1px solid rgba(130,150,227,0.2)", color: "#8296E3" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Editar
                    </button>
                    <button onClick={() => setShowInvite(venue.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ ...inputStyle, color: "rgba(255,255,255,0.5)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Asignar admin
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultado invitación */}
        {inviteResult && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-green-400/20 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-green-400 text-sm font-semibold">Cuenta creada</p>
            </div>
            <div className="rounded-xl p-3 flex flex-col gap-2" style={inputStyle}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Email</span>
                <span className="text-white">{inviteResult.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Contraseña temporal</span>
                <span className="text-white font-mono">{inviteResult.tempPassword}</span>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>Enviá estas credenciales al administrador.</p>
            <button onClick={() => setInviteResult(null)} className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Cerrar</button>
          </div>
        )}
      </main>

      {/* Modal editar */}
      {editingVenue && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-sm rounded-t-3xl flex flex-col" style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "92vh" }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-white font-semibold text-sm">{editingVenue.name}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Editar establecimiento</p>
              </div>
              <button onClick={() => setEditingVenue(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                ✕
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <ImageUpload preview={editImagePreview}
                onFile={(file, url) => { setEditImageFile(file); setEditImagePreview(url); }} />

              <Field label="Nombre">
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                  style={inputStyle} />
              </Field>

              <Field label="Dirección">
                <div className="relative">
                  <input value={editAddressQuery} onChange={e => onEditAddressInput(e.target.value)}
                    placeholder="Buscá la nueva dirección..."
                    className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none pr-10"
                    style={inputStyle} />
                  {searchingEditAddress && <div className="absolute right-3 top-3.5 w-4 h-4 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />}
                </div>
                {editAddressResults.length > 0 && (
                  <div className="mt-1 rounded-2xl overflow-hidden" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {editAddressResults.map((r, i) => (
                      <button key={i} onClick={() => selectEditAddress(r)}
                        className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/5"
                        style={{ borderBottom: i < editAddressResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {editForm.lat !== 0 && <p className="text-xs mt-1.5" style={{ color: "#4ade80" }}>✓ Ubicación actualizada</p>}
              </Field>

              <Field label="Mapa y zona de detección">
                <MapPicker
                  lat={editForm.lat || editingVenue.lat}
                  lng={editForm.lng || editingVenue.lng}
                  radius={editForm.radius_meters}
                  zone={editForm.zone ?? (editingVenue.zone as [number,number][] | null)}
                  onChange={(lat, lng, radius, zone) => setEditForm(f => ({ ...f, lat, lng, radius_meters: radius, zone: zone ?? null }))}
                />
              </Field>

              <Field label={`Radio · ${editForm.radius_meters}m`}>
                <input type="range" min="10" max="300" step="5" value={editForm.radius_meters}
                  onChange={e => setEditForm(f => ({ ...f, radius_meters: parseInt(e.target.value) }))}
                  className="w-full accent-[#8296E3] mt-1" />
                <p className="text-xs mt-1.5" style={{ color: "#8296E3" }}>{getRadiusLabel(editForm.radius_meters)}</p>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Abre", key: "open_time" as const }, { label: "Cierra", key: "close_time" as const }].map(({ label, key }) => (
                  <Field key={key} label={label}>
                    <input type="time" value={editForm[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                      style={{ ...inputStyle, colorScheme: "dark" }} />
                  </Field>
                ))}
              </div>

              <Field label="Días">
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(DAYS_ES).map(([key, label]) => (
                    <button key={key} onClick={() => toggleEditDay(key)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={editForm.open_days.includes(key)
                        ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff" }
                        : { ...inputStyle, color: "rgba(255,255,255,0.45)" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="flex gap-3 pt-1 pb-2">
                <button onClick={() => setEditingVenue(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium"
                  style={{ ...inputStyle, color: "rgba(255,255,255,0.4)" }}>
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} disabled={saving || !editForm.name}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar admin */}
      {showInvite && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-sm rounded-t-3xl p-5" style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(130,150,227,0.12)", border: "1px solid rgba(130,150,227,0.2)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8296E3" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Asignar administrador</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {venues.find(v => v.id === showInvite)?.name}
                </p>
              </div>
            </div>
            <Field label="Email del administrador">
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="admin@establecimiento.com" autoFocus
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={inputStyle} />
            </Field>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowInvite(null); setInviteEmail(""); }}
                className="flex-1 py-3 rounded-2xl text-sm font-medium"
                style={{ ...inputStyle, color: "rgba(255,255,255,0.4)" }}>
                Cancelar
              </button>
              <button onClick={handleInvite} disabled={saving || !inviteEmail}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {saving ? "Creando..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
