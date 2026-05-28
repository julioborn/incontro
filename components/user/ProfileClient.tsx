"use client";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { BottomNav } from "@/components/ui/BottomNav";
import Image from "next/image";

interface Props { profileId: string; currentUserId: string }

export function ProfileClient({ profileId, currentUserId }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      });
  }, [resolvedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-3">
        <span className="text-4xl">👤</span>
        <p className="text-white font-medium">Perfil no encontrado</p>
        <p className="text-white/40 text-sm text-center px-8">
          Completá tu perfil para que otros te puedan ver.
        </p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="relative h-72">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.name ?? ""} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
            <span className="text-7xl text-white/30">{(profile.name ?? "?")[0].toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      <div className="px-5 -mt-6 pb-28">
        <h1 className="text-2xl font-bold text-white">{profile.name ?? "Sin nombre"}</h1>
        {profile.age && <p className="text-white/40 text-sm mt-0.5">{profile.age} años</p>}
        {profile.bio && <p className="text-white/70 text-sm mt-4 leading-relaxed">{profile.bio}</p>}
        {profile.instagram_handle && (
          <p className="text-[#8296E3] text-sm mt-3">@{profile.instagram_handle}</p>
        )}

        {isOwn && (
          <button
            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Editar perfil
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
