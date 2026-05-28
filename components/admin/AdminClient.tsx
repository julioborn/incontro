"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/lib/supabase";

const DAYS_ES: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const labelStyle = { color: "rgba(255,255,255,0.45)" };

export function AdminClient() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const [form, setForm] = useState({
    name: "", address: "", lat: "", lng: "",
    radius_meters: "100", open_time: "22:00", close_time: "06:00",
    open_days: [] as string[],
  });
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    fetch("/api/admin/locals").then(r => r.json()).then(d => { setVenues(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

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
      body: JSON.stringify({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), radius_meters: parseInt(form.radius_meters) }),
    });
    const data = await res.json();
    setVenues(v => [...v, data]);
    setShowForm(false);
    setForm({ name: "", address: "", lat: "", lng: "", radius_meters: "100", open_time: "22:00", close_time: "06:00", open_days: [] });
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
    if (data.ok) { setInviteResult({ email: inviteEmail, tempPassword: data.tempPassword }); setShowInvite(null); setInviteEmail(""); }
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
        {/* Establecimientos */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Establecimientos <span className="text-white/30 text-sm">({venues.length})</span></h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
          >
            + Nuevo
          </button>
        </div>

        {/* Formulario nuevo local */}
        {showForm && (
          <div className="rounded-2xl p-4 mb-5 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white text-sm font-semibold mb-1">Nuevo establecimiento</p>
            {[
              { label: "Nombre", key: "name", placeholder: "Ej: Club Niceto" },
              { label: "Dirección", key: "address", placeholder: "Niceto Vega 5510, CABA" },
              { label: "Latitud", key: "lat", placeholder: "-34.5897" },
              { label: "Longitud", key: "lng", placeholder: "-58.4263" },
              { label: "Radio (metros)", key: "radius_meters", placeholder: "100" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs mb-1 uppercase tracking-wider" style={labelStyle}>{label}</label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              {[{ label: "Abre", key: "open_time" }, { label: "Cierra", key: "close_time" }].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs mb-1 uppercase tracking-wider" style={labelStyle}>{label}</label>
                  <input
                    type="time" value={form[key as keyof typeof form] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                </div>
              ))}
            </div>

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
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm text-white/50" style={inputStyle}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {saving ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de locales */}
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold">{venue.name}</p>
                    {venue.address && <p className="text-white/40 text-xs mt-0.5">{venue.address}</p>}
                    <p className="text-white/30 text-xs mt-1">
                      {venue.open_time?.slice(0, 5)} – {venue.close_time?.slice(0, 5)}
                      {venue.open_days && venue.open_days.length > 0 && (
                        <span className="ml-2">{venue.open_days.map(d => DAYS_ES[d]).join(", ")}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${venue.is_open ? "bg-green-400" : "bg-white/20"}`} />
                    <span className="text-xs" style={{ color: venue.is_open ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                      {venue.is_open ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvite(venue.id)}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-white/70 transition-colors hover:text-white"
                  style={inputStyle}
                >
                  Asignar administrador
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resultado de invitación */}
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

      {/* Modal invitar admin */}
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
