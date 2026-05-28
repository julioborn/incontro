"use client";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { BottomNav } from "@/components/ui/BottomNav";
import { signOut } from "@/lib/auth.client";
import Image from "next/image";

interface Props { profileId: string; currentUserId: string }

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export function ProfileClient({ profileId, currentUserId }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [togglingGhost, setTogglingGhost] = useState(false);

  const [form, setForm] = useState({ name: "", bio: "", instagram_handle: "" });

  const isOwn = profileId === "me" || profileId === currentUserId;
  const resolvedId = profileId === "me" ? currentUserId : profileId;

  useEffect(() => {
    supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", resolvedId)
      .single()
      .then(({ data }) => {
        setProfile(data);
        if (data) {
          setForm({ name: data.name ?? "", bio: data.bio ?? "", instagram_handle: data.instagram_handle ?? "" });
          setGhostMode(!!data.ghost_mode);
        }
        setLoading(false);
      });
  }, [resolvedId]);

  async function toggleGhostMode() {
    setTogglingGhost(true);
    const newVal = !ghostMode;
    await supabaseClient.from("profiles").update({ ghost_mode: newVal }).eq("id", currentUserId);
    setGhostMode(newVal);
    setTogglingGhost(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data } = await supabaseClient
      .from("profiles")
      .update({ name: form.name, bio: form.bio, instagram_handle: form.instagram_handle })
      .eq("id", currentUserId)
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name ?? profile?.first_name ?? "Sin nombre";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  function calcAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const b = new Date(birthDate);
    const today = new Date();
    return today.getFullYear() - b.getFullYear() -
      (today < new Date(today.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  }
  const age = calcAge(profile?.birth_date ?? null);

  return (
    <div className="flex flex-col min-h-screen bg-black pb-24">
      {/* Avatar */}
      <div className="flex flex-col items-center pt-12 pb-6 px-5">
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4"
          style={{ border: "2px solid rgba(130,150,227,0.4)" }}>
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
              {initial}
            </div>
          )}
        </div>

        {!editing ? (
          <>
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            {age !== null && <p className="text-white/40 text-sm mt-0.5">{age} años</p>}
            {profile?.email && <p className="text-white/30 text-xs mt-1">{profile.email}</p>}
          </>
        ) : (
          <p className="text-white/40 text-xs">Editando perfil</p>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 px-5">
        {editing ? (
          <div className="flex flex-col gap-4">
            {[
              { label: "Nombre completo", key: "name", placeholder: "Tu nombre" },
              { label: "Bio", key: "bio", placeholder: "Contá algo sobre vos..." },
              { label: "Instagram", key: "instagram_handle", placeholder: "@usuario" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs mb-1.5 uppercase tracking-wider text-white/40">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                  style={inputStyle}
                />
              </div>
            ))}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60"
                style={inputStyle}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {profile?.bio && (
              <div className="px-4 py-3 rounded-xl" style={inputStyle}>
                <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Bio</p>
                <p className="text-white text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}
            {profile?.instagram_handle && (
              <div className="px-4 py-3 rounded-xl" style={inputStyle}>
                <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Instagram</p>
                <p className="text-[#8296E3] text-sm">@{profile.instagram_handle}</p>
              </div>
            )}

            {isOwn && (
              <div className="flex flex-col gap-2 mt-4">
                {/* Switch modo fantasma */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={inputStyle}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👻</span>
                    <div>
                      <p className="text-white text-sm font-medium">Modo fantasma</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {ghostMode ? "No aparecés ni ves a nadie" : "Sos visible para los demás"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleGhostMode}
                    disabled={togglingGhost}
                    className="relative w-12 h-6 rounded-full transition-all disabled:opacity-50 flex-shrink-0 ml-3"
                    style={{ background: ghostMode ? "linear-gradient(135deg, #8296E3, #4762C7)" : "rgba(255,255,255,0.15)" }}
                  >
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                      style={{ left: ghostMode ? "calc(100% - 22px)" : "2px" }} />
                  </button>
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
                >
                  Editar perfil
                </button>
                <button
                  onClick={signOut}
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ ...inputStyle, color: "rgba(255,100,100,0.8)" }}
                >
                  Cerrar sesión
                </button>

                {profile?.role === "superadmin" && (
                  <a
                    href="/admin"
                    className="w-full py-3 rounded-xl text-sm font-semibold text-center block"
                    style={{ background: "rgba(130,150,227,0.15)", border: "1px solid rgba(130,150,227,0.3)", color: "#8296E3" }}
                  >
                    ⚙️ Panel de administración
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
