"use client";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Venue } from "@/lib/supabase";
import Image from "next/image";
import { signOut } from "@/lib/auth.client";

interface Props { venue: Venue; userId: string }

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const labelStyle = { color: "rgba(255,255,255,0.45)" };

export function LocalAdminClient({ venue: initialVenue, userId }: Props) {
  const [venue, setVenue] = useState(initialVenue);
  const [attendees, setAttendees] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initialVenue.name,
    address: initialVenue.address ?? "",
    open_time: initialVenue.open_time ?? "22:00",
    close_time: initialVenue.close_time ?? "06:00",
    radius_meters: String(initialVenue.radius_meters ?? 100),
  });

  // Contador de presencias en tiempo real
  useEffect(() => {
    const fetch = async () => {
      const { count } = await supabaseClient
        .from("presences")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venue.id)
        .eq("is_active", true);
      setAttendees(count ?? 0);
    };
    fetch();
    const channel = supabaseClient
      .channel(`presences-admin:${venue.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "presences", filter: `venue_id=eq.${venue.id}` }, fetch)
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, [venue.id]);

  async function toggleOpen() {
    setToggling(true);
    const res = await fetch("/api/local/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue_id: venue.id, is_open: !venue.is_open }),
    });
    if (res.ok) setVenue(v => ({ ...v, is_open: !v.is_open }));
    setToggling(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/local/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue_id: venue.id, ...form, radius_meters: parseInt(form.radius_meters) }),
    });
    const data = await res.json();
    if (data.id) setVenue(data);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-black pb-10">
      <header className="flex items-center justify-between px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <Image src="/iconofinal.png" alt="Insitus" width={28} height={28} className="rounded-lg" />
          <div>
            <p className="text-white/40 text-xs">Mi establecimiento</p>
            <h1 className="text-base font-bold text-white leading-tight">{venue.name}</h1>
          </div>
        </div>
        <button onClick={signOut} className="text-xs text-white/30 hover:text-white/60">Salir</button>
      </header>

      <main className="flex-1 px-5 py-6 flex flex-col gap-5">
        {/* Toggle abierto/cerrado */}
        <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-semibold text-base">Estado</p>
            <p className={`text-sm font-bold mt-0.5 ${venue.is_open ? "text-green-400" : "text-white/30"}`}>
              {venue.is_open ? "● Abierto" : "○ Cerrado"}
            </p>
          </div>
          <button
            onClick={toggleOpen}
            disabled={toggling}
            className="relative w-14 h-8 rounded-full transition-all disabled:opacity-50"
            style={{ background: venue.is_open ? "linear-gradient(135deg, #8296E3, #4762C7)" : "rgba(255,255,255,0.1)" }}
          >
            <span
              className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
              style={{ left: venue.is_open ? "calc(100% - 28px)" : "4px" }}
            />
          </button>
        </div>

        {/* Asistentes en tiempo real */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
            <span className="text-white text-xl font-bold">{attendees}</span>
          </div>
          <div>
            <p className="text-white font-semibold">Personas adentro</p>
            <p className="text-white/40 text-xs mt-0.5">Actualización en tiempo real</p>
          </div>
        </div>

        {/* Datos del establecimiento */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold">Datos del local</p>
            <button onClick={() => setEditing(!editing)} className="text-xs text-[#8296E3]">{editing ? "Cancelar" : "Editar"}</button>
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              {[
                { label: "Nombre", key: "name", placeholder: "Nombre del local" },
                { label: "Dirección", key: "address", placeholder: "Dirección completa" },
                { label: "Radio de detección (m)", key: "radius_meters", placeholder: "100" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs mb-1 uppercase tracking-wider" style={labelStyle}>{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
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
                      type="time" value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 mt-1" style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: "Dirección", value: venue.address },
                { label: "Horario", value: `${venue.open_time?.slice(0, 5)} – ${venue.close_time?.slice(0, 5)}` },
                { label: "Radio", value: `${venue.radius_meters}m` },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex justify-between">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
