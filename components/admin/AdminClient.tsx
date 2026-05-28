"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/lib/supabase";

const DAYS_ES: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

const RADIUS_LABELS: Record<number, string> = {
  50:  "50m — Local muy pequeño o céntrico",
  100: "100m — Tamaño estándar (recomendado)",
  150: "150m — Local grande",
  200: "200m — Con estacionamiento o fila afuera",
  300: "300m — Predio o complejo",
};

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const labelStyle = { color: "rgba(255,255,255,0.45)" };

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
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
    open_days: [] as string[],
  });

  // Buscador de dirección
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const res = await fetch("/api/admin/locals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.id) {
      setVenues(v => [...v, data]);
      setShowForm(false);
      setForm({ name: "", address: "", lat: 0, lng: 0, radius_meters: 100, open_time: "22:00", close_time: "06:00", open_days: [] });
      setAddressQuery("");
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

  return (
    <div className="flex flex-col min-h-screen bg-black pb-10">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div>
          <Image src="/iconincontro.png" alt="Incontro" width={28} height={28} className="rounded-lg mb-1" />
          <h1 className="text-lg font-bold text-white">Panel Admin</h1>
        </div>
        <Link href="/home" className="text-xs text-white/40 hover:text-white/70">← App</Link>
      </header>

      <main className="flex-1 px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">
            Establecimientos <span className="text-white/30 text-sm">({venues.length})</span>
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
          >
            + Nuevo
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="rounded-2xl p-4 mb-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white text-sm font-semibold">Nuevo establecimiento</p>

            {/* Nombre */}
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Nombre</label>
              <input
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Club Niceto"
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none focus:border-[#8296E3]"
                style={inputStyle}
              />
            </div>

            {/* Búsqueda de dirección */}
            <div className="relative">
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Dirección</label>
              <div className="relative">
                <input
                  value={addressQuery}
                  onChange={e => onAddressInput(e.target.value)}
                  placeholder="Buscá el establecimiento..."
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none pr-8"
                  style={inputStyle}
                />
                {searchingAddress && (
                  <div className="absolute right-3 top-3 w-4 h-4 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
                )}
              </div>

              {/* Resultados */}
              {addressResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {addressResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => selectAddress(r)}
                      className="w-full text-left px-4 py-3 text-xs text-white/80 hover:bg-white/5 transition-colors"
                      style={{ borderBottom: i < addressResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}

              {/* Confirmación de coords */}
              {form.lat !== 0 && (
                <p className="text-xs mt-1.5" style={{ color: "#4ade80" }}>
                  ✓ Ubicación detectada: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                </p>
              )}
            </div>

            {/* Radio con slider */}
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>
                Radio de detección
              </label>
              <input
                type="range" min="50" max="300" step="50"
                value={form.radius_meters}
                onChange={e => setForm(f => ({ ...f, radius_meters: parseInt(e.target.value) }))}
                className="w-full accent-[#8296E3]"
              />
              <p className="text-xs mt-1" style={{ color: "#8296E3" }}>
                {RADIUS_LABELS[form.radius_meters]}
              </p>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-3">
              {[{ label: "Abre", key: "open_time" }, { label: "Cierra", key: "close_time" }].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>{label}</label>
                  <input
                    type="time" value={form[key as "open_time" | "close_time"]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                </div>
              ))}
            </div>

            {/* Días */}
            <div>
              <label className="block text-xs mb-2 uppercase tracking-wider" style={labelStyle}>Días</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DAYS_ES).map(([key, label]) => (
                  <button
                    key={key} onClick={() => toggleDay(key)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={form.open_days.includes(key)
                      ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff" }
                      : { ...inputStyle, color: "rgba(255,255,255,0.5)" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={() => { setShowForm(false); setAddressQuery(""); setAddressResults([]); }} className="flex-1 py-2.5 rounded-xl text-sm text-white/50" style={inputStyle}>
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.lat}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
              >
                {saving ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
          </div>
        ) : venues.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-12">No hay establecimientos cargados</p>
        ) : (
          <div className="flex flex-col gap-3">
            {venues.map(venue => (
              <div key={venue.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold">{venue.name}</p>
                    {venue.address && <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{venue.address}</p>}
                    <p className="text-white/30 text-xs mt-1">
                      {venue.open_time?.slice(0, 5)} – {venue.close_time?.slice(0, 5)}
                      {" · "}{venue.radius_meters}m
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${venue.is_open ? "text-green-400 bg-green-400/10" : "text-white/30 bg-white/5"}`}>
                    {venue.is_open ? "Abierto" : "Cerrado"}
                  </span>
                </div>
                <button
                  onClick={() => setShowInvite(venue.id)}
                  className="w-full py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
                  style={inputStyle}
                >
                  Asignar administrador
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resultado invitación */}
        {inviteResult && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(130,150,227,0.1)", border: "1px solid rgba(130,150,227,0.3)" }}>
            <p className="text-[#8296E3] text-sm font-semibold mb-2">✓ Cuenta creada</p>
            <p className="text-white/60 text-xs">Email: <span className="text-white">{inviteResult.email}</span></p>
            <p className="text-white/60 text-xs mt-1">Contraseña temporal: <span className="text-white font-mono">{inviteResult.tempPassword}</span></p>
            <p className="text-white/30 text-xs mt-2">Enviá estas credenciales al administrador del local.</p>
            <button onClick={() => setInviteResult(null)} className="mt-2 text-xs text-white/30 hover:text-white/60">Cerrar</button>
          </div>
        )}
      </main>

      {/* Modal invitar */}
      {showInvite && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-t-3xl p-6" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-semibold mb-4">Asignar administrador</p>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Email del administrador</label>
            <input
              type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="admin@establecimiento.com"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none mb-4"
              style={inputStyle}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowInvite(null); setInviteEmail(""); }} className="flex-1 py-3 rounded-xl text-sm text-white/50" style={inputStyle}>Cancelar</button>
              <button onClick={handleInvite} disabled={saving || !inviteEmail} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {saving ? "Creando..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
