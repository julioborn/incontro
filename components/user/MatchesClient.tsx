"use client";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase";

interface MatchProfile {
  id: string; name: string | null; first_name: string | null;
  avatar_url: string | null; username: string | null;
}

interface MatchRow {
  id: string; user_a: string; user_b: string; created_at: string;
  new_for_a: boolean; new_for_b: boolean; has_new_message: boolean;
  user_a_profile: MatchProfile; user_b_profile: MatchProfile;
}

interface Props { userId: string; defaultTab?: "matches" | "chats" }

export function MatchesClient({ userId, defaultTab = "matches" }: Props) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"matches" | "chats">(defaultTab);

  useEffect(() => {
    fetch("/api/matches")
      .then(r => r.json())
      .then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false); });

    // Marcar matches como vistos al entrar
    fetch("/api/matches/seen", { method: "POST" });
  }, []);

  // Realtime para actualizar badges
  useEffect(() => {
    const channel = supabaseClient
      .channel("matches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        fetch("/api/matches").then(r => r.json()).then(d => {
          if (Array.isArray(d)) setMatches(d);
        });
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, []);

  function getOtherProfile(match: MatchRow): MatchProfile {
    return match.user_a === userId ? match.user_b_profile : match.user_a_profile;
  }

  function isNew(match: MatchRow): boolean {
    return match.user_a === userId ? match.new_for_a : match.new_for_b;
  }

  const newMatchesCount = matches.filter(m => isNew(m)).length;
  const newMessagesCount = matches.filter(m => m.has_new_message).length;

  // Ambos tabs muestran todos los matches — el badge solo indica cuáles son nuevos
  const displayed = matches;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="px-5 pt-12 pb-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 className="text-xl font-bold text-white mb-4">
          {tab === "matches" ? "Likes" : "Mensajes"}
        </h1>

        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { key: "matches", label: "Likes",    count: newMatchesCount },
            { key: "chats",   label: "Mensajes", count: newMessagesCount },
          ].map(({ key, label, count }) => (
            <button key={key}
              onClick={() => setTab(key as "matches" | "chats")}
              className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all"
              style={{
                color: tab === key ? "#fff" : "rgba(255,255,255,0.35)",
                borderBottom: tab === key ? "2px solid #8296E3" : "2px solid transparent",
              }}>
              {label}
              {count > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                  style={{ background: "#FF3B30" }}>
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <span className="text-4xl">💫</span>
            <p className="text-white font-medium">Sin matches todavía</p>
            <p className="text-white/40 text-sm">Cuando haya like mutuo aparecerá acá.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayed.map(match => {
              const other = getOtherProfile(match);
              const displayName = other?.name ?? other?.first_name ?? "Usuario";
              const initial = displayName[0]?.toUpperCase() ?? "?";
              const hasMsg = match.has_new_message;
              const matchIsNew = isNew(match);

              return (
                <Link key={match.id} href={`/chat/${match.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors active:scale-[0.99]"
                  style={{
                    background: (hasMsg || matchIsNew) ? "rgba(130,150,227,0.08)" : "rgba(255,255,255,0.05)",
                    border: (hasMsg || matchIsNew)
                      ? "1px solid rgba(130,150,227,0.25)"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden"
                      style={{ border: "1.5px solid rgba(130,150,227,0.4)" }}>
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt={displayName} fill sizes="48px" className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                          {initial}
                        </div>
                      )}
                    </div>
                    {matchIsNew && tab === "matches" && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF3B30]"
                        style={{ border: "2px solid #000" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${(hasMsg || matchIsNew) ? "text-white" : "text-white/80"}`}>
                      {displayName}
                    </p>
                    {other?.username && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                        @{other.username}
                      </p>
                    )}
                  </div>

                  {/* Badge mensaje nuevo */}
                  {hasMsg && tab === "chats" ? (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#FF3B30" }} />
                  ) : (
                    <span className="text-white/20 text-xl flex-shrink-0">›</span>
                  )}
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
