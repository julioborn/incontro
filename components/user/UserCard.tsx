"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/supabase";

interface Props {
  profile: Profile;
  currentUserId: string;
  venueId: string;
}

export function UserCard({ profile, currentUserId, venueId }: Props) {
  const [liked, setLiked] = useState(false);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (liked || loading) return;
    setLoading(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user: profile.id, venue_id: venueId }),
    });
    const data = await res.json();
    setLiked(true);
    setMatched(data.matched);
    setLoading(false);
  }

  const displayName = profile.name ?? profile.first_name ?? "Sin nombre";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all active:scale-[0.99]"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Avatar circular */}
      <Link href={`/profile/${profile.id}`} className="flex-shrink-0">
        <div className="relative w-12 h-12 rounded-full overflow-hidden"
          style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}>
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
              {initial}
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <Link href={`/profile/${profile.id}`} className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{displayName}</p>
        {profile.birth_date && (() => {
          const b = new Date(profile.birth_date!);
          const today = new Date();
          const a = today.getFullYear() - b.getFullYear() -
            (today < new Date(today.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
          return <p className="text-white/40 text-xs mt-0.5">{a} años</p>;
        })()}
      </Link>

      {/* Like / Match */}
      {profile.id !== currentUserId && (
        <button
          onClick={handleLike}
          disabled={loading}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: liked
              ? "linear-gradient(135deg, #8296E3, #4762C7)"
              : "rgba(255,255,255,0.06)",
            border: liked ? "none" : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
          ) : matched ? (
            <span className="text-base">💫</span>
          ) : liked ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          )}
        </button>
      )}

      {/* Badge match */}
      {matched && (
        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full text-white"
          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
          MATCH
        </span>
      )}
    </div>
  );
}
