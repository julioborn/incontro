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
  id: string; user_a: string; user_b: string;
  unread_for_a: boolean; unread_for_b: boolean;
  user_a_profile: MatchProfile; user_b_profile: MatchProfile;
}

export function ChatsClient({ userId }: { userId: string }) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = () => {
    fetch("/api/matches")
      .then(r => r.json())
      .then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    const channel = supabaseClient
      .channel("chats-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchMatches)
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, []);

  function getOther(match: MatchRow): MatchProfile {
    return match.user_a === userId ? match.user_b_profile : match.user_a_profile;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 className="text-xl font-bold text-white">Mensajes</h1>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {matches.length} {matches.length === 1 ? "conversación" : "conversaciones"}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <span className="text-4xl">💬</span>
            <p className="text-white font-medium">Sin conversaciones</p>
            <p className="text-white/40 text-sm">Tus likes mutuos aparecen acá para chatear.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map(match => {
              const other = getOther(match);
              const displayName = other?.name ?? other?.first_name ?? "Usuario";
              const initial = displayName[0]?.toUpperCase() ?? "?";
              const hasNew = match.user_a === userId ? match.unread_for_a : match.unread_for_b;

              return (
                <Link key={match.id} href={`/chat/${match.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl active:scale-[0.99] transition-all"
                  style={{
                    background: hasNew ? "rgba(130,150,227,0.08)" : "rgba(255,255,255,0.05)",
                    border: hasNew ? "1px solid rgba(130,150,227,0.25)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
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
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${hasNew ? "text-white" : "text-white/80"}`}>
                      {displayName}
                    </p>
                    {other?.username && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>@{other.username}</p>
                    )}
                  </div>

                  {hasNew ? (
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
