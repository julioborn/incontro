"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { CityInput } from "@/components/ui/CityInput";

const MUSIC_GENRES = [
  "Electrónica", "Reggaeton", "Cumbia", "Trap", "House",
  "Pop", "Rock", "Hip Hop", "R&B", "Techno", "Salsa", "Tango",
];
const LOOKING_FOR = [
  "Conocer gente", "Bailar", "Hacer amigos", "Algo más", "Solo pasarla bien",
];
const GENDERS = [
  { value: "hombre", label: "Hombre" },
  { value: "mujer",  label: "Mujer" },
  { value: "otro",   label: "Otro" },
];

const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const lbl = { color: "rgba(255,255,255,0.4)" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-widest px-1" style={lbl}>{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] mb-1.5 uppercase tracking-widest" style={lbl}>{label}</label>
      {children}
    </div>
  );
}

interface Photo { id: string; url: string; position: number }

export function SettingsClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", bio: "", city: "", gender: "" as "" | "hombre" | "mujer" | "otro",
    instagram_handle: "", snapchat_handle: "", whatsapp: "",
    music_genres: [] as string[], looking_for: [] as string[],
  });

  useEffect(() => {
    supabaseClient.from("profiles").select("*").eq("id", userId).single()
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        setForm({
          name: data.name ?? "",
          bio: data.bio ?? "",
          city: data.city ?? "",
          gender: (data.gender as "" | "hombre" | "mujer" | "otro") ?? "",
          instagram_handle: data.instagram_handle ?? "",
          snapchat_handle: data.snapchat_handle ?? "",
          whatsapp: data.whatsapp ?? "",
          music_genres: data.music_genres ?? [],
          looking_for: data.looking_for ?? [],
        });
      });
    fetch("/api/profile/photos").then(r => r.json()).then(d => setPhotos(Array.isArray(d) ? d : []));
  }, [userId]);

  async function uploadFile(file: File, type: "avatar" | "photo"): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await fetch("/api/profile/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const url = await uploadFile(file, "avatar");
    if (url) {
      await supabaseClient.from("profiles").update({ avatar_url: url }).eq("id", userId);
      setProfile(p => p ? { ...p, avatar_url: url } : p);
    }
    setUploadingAvatar(false);
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 6) return;
    setUploadingPhoto(true);
    const url = await uploadFile(file, "photo");
    if (url) {
      const res = await fetch("/api/profile/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, position: photos.length }),
      });
      const data = await res.json();
      if (data.id) setPhotos(p => [...p, data]);
    }
    setUploadingPhoto(false);
  }

  async function handleDeletePhoto(id: string) {
    await fetch("/api/profile/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPhotos(p => p.filter(ph => ph.id !== id));
  }

  function toggleChip(field: "music_genres" | "looking_for", value: string) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  }

  async function handleSave() {
    setSaving(true);
    await supabaseClient.from("profiles").update({
      name: form.name,
      bio: form.bio,
      city: form.city,
      gender: form.gender || null,
      instagram_handle: form.instagram_handle,
      snapchat_handle: form.snapchat_handle,
      whatsapp: form.whatsapp,
      music_genres: form.music_genres.length ? form.music_genres : null,
      looking_for: form.looking_for.length ? form.looking_for : null,
    }).eq("id", userId);
    setSaving(false);
    router.push("/profile/me");
  }

  const displayName = profile?.name ?? profile?.first_name ?? "Usuario";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col min-h-screen bg-black pb-32">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.back()} className="text-white/50 hover:text-white text-xl px-1">‹</button>
        <h1 className="text-base font-bold text-white flex-1">Editar perfil</h1>
        <button onClick={handleSave} disabled={saving}
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
          {saving ? "..." : "Guardar"}
        </button>
      </header>

      <div className="flex flex-col gap-7 px-4 py-6">

        {/* ── FOTO DE PERFIL ── */}
        <Section title="Foto de perfil">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden" style={{ border: "2px solid rgba(130,150,227,0.4)" }}>
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={displayName} fill sizes="80px" className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>{initial}</div>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <div>
              <button onClick={() => avatarInputRef.current?.click()}
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: "rgba(130,150,227,0.12)", border: "1px solid rgba(130,150,227,0.25)", color: "#8296E3" }}>
                Cambiar foto
              </button>
              <p className="text-xs mt-1.5" style={lbl}>Foto principal del perfil</p>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </Section>

        {/* ── FOTOS ADICIONALES ── */}
        <Section title={`Fotos adicionales (${photos.length}/6)`}>
          <div className="grid grid-cols-3 gap-2">
            {photos.map(photo => (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.7)" }}>
                  <span className="text-white text-xs">✕</span>
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button onClick={() => photoInputRef.current?.click()}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors"
                style={{ ...inp, border: "1.5px dashed rgba(255,255,255,0.15)" }}>
                {uploadingPhoto ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span className="text-[10px]" style={lbl}>Agregar</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
        </Section>

        {/* ── INFORMACIÓN ── */}
        <Section title="Información básica">
          <Field label="Nombre completo">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tu nombre" className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
              style={inp} />
          </Field>
          <Field label="Ciudad">
            <CityInput
              value={form.city}
              onChange={val => setForm(f => ({ ...f, city: val }))}
            />
          </Field>
          <Field label="Género">
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map(g => (
                <button key={g.value} onClick={() => setForm(f => ({ ...f, gender: f.gender === g.value ? "" : g.value as "hombre" | "mujer" | "otro" }))}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={form.gender === g.value
                    ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff" }
                    : { ...inp, color: "rgba(255,255,255,0.5)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Contá algo sobre vos..." rows={3}
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
              style={inp} />
          </Field>
        </Section>

        {/* ── REDES SOCIALES ── */}
        <Section title="Redes sociales">
          {[
            { label: "Instagram", key: "instagram_handle", placeholder: "tu_usuario", prefix: "@" },
            { label: "Snapchat",  key: "snapchat_handle",  placeholder: "tu_usuario", prefix: "👻" },
            { label: "WhatsApp",  key: "whatsapp",          placeholder: "+54 9 11 1234-5678", prefix: "💬" },
          ].map(({ label, key, placeholder, prefix }) => (
            <Field key={key} label={label}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={lbl}>{prefix}</span>
                <input value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl text-white text-sm outline-none"
                  style={inp} />
              </div>
            </Field>
          ))}
        </Section>

        {/* ── GUSTOS MUSICALES ── */}
        <Section title="Gustos musicales">
          <div className="flex flex-wrap gap-2">
            {MUSIC_GENRES.map(g => (
              <button key={g} onClick={() => toggleChip("music_genres", g)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={form.music_genres.includes(g)
                  ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff" }
                  : { ...inp, color: "rgba(255,255,255,0.5)" }}>
                {g}
              </button>
            ))}
          </div>
        </Section>

        {/* ── QUÉ BUSCÁS ── */}
        <Section title="¿Qué buscás?">
          <div className="flex flex-col gap-2">
            {LOOKING_FOR.map(opt => (
              <button key={opt} onClick={() => toggleChip("looking_for", opt)}
                className="w-full py-3 px-4 rounded-2xl text-sm font-medium text-left flex items-center justify-between transition-all"
                style={form.looking_for.includes(opt)
                  ? { background: "rgba(130,150,227,0.15)", border: "1px solid rgba(130,150,227,0.4)", color: "#8296E3" }
                  : { ...inp, color: "rgba(255,255,255,0.6)" }}>
                {opt}
                {form.looking_for.includes(opt) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
