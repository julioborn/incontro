"use client";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";
import Image from "next/image";

interface MatchProfile {
  id: string;
  name: string | null;
  first_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface MatchRow {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  user_a_profile: MatchProfile;
  user_b_profile: MatchProfile;
}

interface Props { userId: string }

export function MatchesClient({ userId }: Props) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then(r => r.json())
      .then(d => {
        setMatches(Array.isArray(d) ? d : []);
        setLoading(false);
      });

    // Marcar todos los matches como vistos para este usuario
    fetch("/api/matches/seen", { method: "POST" });
  }, []);

  function getOtherProfile(match: MatchRow): MatchProfile {
    return match.user_a === userId ? match.user_b_profile : match.user_a_profile;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 className="text-xl font-bold text-white">Matches</h1>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
          {matches.length} match{matches.length !== 1 ? "es" : ""}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <span className="text-4xl">💫</span>
            <p className="text-white font-medium">Sin matches todavía</p>
            <p className="text-white/40 text-sm">Cuando haya like mutuo aparecerá acá.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map(match => {
              const other = getOtherProfile(match);
              const displayName = other?.name ?? other?.first_name ?? "Usuario";
              const initial = displayName[0]?.toUpperCase() ?? "?";

              return (
                <Link
                  key={match.id}
                  href={`/chat/${match.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors active:scale-[0.99]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Avatar */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: "1.5px solid rgba(130,150,227,0.4)" }}>
                    {other?.avatar_url ? (
                      <Image src={other.avatar_url} alt={displayName} fill sizes="48px" className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                        {initial}
                      </div>
                    )}
                    {/* Indicador de match */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: "#000", border: "1px solid rgba(130,150,227,0.4)" }}>
                      💫
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                    {other?.username && (
                      <p className="text-white/40 text-xs mt-0.5">@{other.username}</p>
                    )}
                  </div>

                  <span className="text-white/20 text-xl flex-shrink-0">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
