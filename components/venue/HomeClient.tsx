"use client";
import { useState, useEffect } from "react";
import { useGeoContext } from "@/contexts/GeolocationContext";
import { usePresence } from "@/hooks/usePresence";
import { UserCard } from "@/components/user/UserCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { supabaseClient } from "@/lib/supabase";

interface Props { userId: string }

export function HomeClient({ userId }: Props) {
  const { isInsideVenue, activeVenue, error, isLoading, distance } = useGeoContext();
  const { presences, totalCount } = usePresence(isInsideVenue && activeVenue ? activeVenue.id : null, userId);
  const [viewingPeople, setViewingPeople] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);

  // Cargar ghost mode
  useEffect(() => {
    supabaseClient
      .from("profiles")
      .select("ghost_mode")
      .eq("id", userId)
      .single()
      .then(({ data }) => { if (data) setGhostMode(!!data.ghost_mode); });
  }, [userId]);

  // presences ya viene filtrado sin el usuario actual ni fantasmas
  const others = presences;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="flex items-center justify-between px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-libre-baskerville)" }}>Insitus</span>
        <div className="flex items-center gap-2">
          {ghostMode && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              👻 Fantasma
            </span>
          )}
          {isInsideVenue && activeVenue && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-medium text-green-400">{activeVenue.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
            <p className="text-white/40 text-sm">Detectando ubicación...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
            <span className="text-4xl">📍</span>
            <p className="text-white font-medium">Permiso de ubicación requerido</p>
            <p className="text-white/40 text-sm">Activá la ubicación para poder conectarte con quienes están cerca.</p>
          </div>
        )}

        {!isLoading && !error && !isInsideVenue && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
            <span className="text-4xl">🌙</span>
            <p className="text-white font-medium">No estás en ningún lugar</p>
            <p className="text-white/40 text-sm">Cuando estés cerca de un establecimiento asociado, aparecerá acá.</p>
            {distance !== null && (
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                {distance < 1000
                  ? `${Math.round(distance)}m del establecimiento más cercano`
                  : `${(distance / 1000).toFixed(1)}km del establecimiento más cercano`}
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && isInsideVenue && activeVenue && (
          <div className="flex flex-col gap-4 animate-fade-in">

            {/* Modo fantasma activo */}
            {ghostMode && (
              <div className="rounded-2xl p-5 flex flex-col items-center gap-2 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-4xl">👻</span>
                <p className="text-white font-semibold">Estás en modo fantasma</p>
                <p className="text-white/40 text-sm">
                  Hay <span className="text-white font-bold">{totalCount}</span> {totalCount === 1 ? "persona" : "personas"} en {activeVenue.name}
                </p>
                <p className="text-white/25 text-xs mt-1">
                  Desactivá el modo fantasma desde tu perfil para ver quiénes son.
                </p>
              </div>
            )}

            {/* Vista normal */}
            {!ghostMode && (
              <>
                {!viewingPeople && (
                  <div
                    className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onClick={() => setViewingPeople(true)}
                  >
                    <div className="h-36 overflow-hidden">
                      {activeVenue.logo_url ? (
                        <img src={activeVenue.logo_url} alt={activeVenue.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, rgba(130,150,227,0.2), rgba(71,98,199,0.2))" }}>
                          <span className="text-5xl">🎉</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-bold text-lg">{activeVenue.name}</p>
                          {activeVenue.address && <p className="text-white/40 text-xs mt-0.5">{activeVenue.address}</p>}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full text-green-400 bg-green-400/10 flex-shrink-0 ml-2">Abierto</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex -space-x-1.5">
                          {[...Array(Math.min(others.length, 4))].map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: `hsl(${220 + i * 20}, 60%, 55%)` }}>
                              {others[i]?.profiles?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          ))}
                          {totalCount > 4 && (
                            <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-[10px] text-white"
                              style={{ background: "rgba(255,255,255,0.15)" }}>
                              +{totalCount - 4}
                            </div>
                          )}
                        </div>
                        <p className="text-white/50 text-xs">
                          {totalCount === 0 ? "Sé el primero" : `${totalCount} ${totalCount === 1 ? "persona" : "personas"} adentro`}
                        </p>
                      </div>
                      <button className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                        Ver quién está acá →
                      </button>
                    </div>
                  </div>
                )}

                {viewingPeople && (
                  <div className="animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-white font-semibold">{activeVenue.name}</h2>
                        <p className="text-white/40 text-xs mt-0.5">
                          {others.length === 0 ? "Nadie más por ahora" : `${others.length} ${others.length === 1 ? "persona" : "personas"}`}
                        </p>
                      </div>
                      <button onClick={() => setViewingPeople(false)} className="text-xs text-white/40 hover:text-white/70">
                        ← Volver
                      </button>
                    </div>
                    {others.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                        <span className="text-4xl">🎉</span>
                        <p className="text-white font-medium">Sos el primero</p>
                        <p className="text-white/40 text-sm">Esperá a que llegue más gente.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {others.map(p => (
                          <UserCard key={p.user_id} profile={p.profiles} currentUserId={userId} venueId={activeVenue.id} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
