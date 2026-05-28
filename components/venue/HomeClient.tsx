"use client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePresence } from "@/hooks/usePresence";
import { UserCard } from "@/components/user/UserCard";
import { BottomNav } from "@/components/ui/BottomNav";
import Image from "next/image";

interface Props { userId: string }

export function HomeClient({ userId }: Props) {
  const { isInsideVenue, activeVenue, error, isLoading } = useGeolocation(userId);
  const { presences } = usePresence(isInsideVenue && activeVenue ? activeVenue.id : null);

  const others = presences.filter(p => p.user_id !== userId);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-safe-top pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="text-lg font-bold tracking-[0.12em] text-white">Incontro</span>
        {activeVenue && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/60">{activeVenue.name}</span>
          </div>
        )}
        <div className="w-8" />
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
            <p className="text-white/60 text-sm">Necesitamos acceso a tu ubicación para mostrarte quién está cerca.</p>
          </div>
        ) : !isInsideVenue ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
            <span className="text-4xl">📍</span>
            <p className="text-white font-medium">No estás en ningún venue</p>
            <p className="text-white/40 text-sm">Andá a un boliche asociado para ver quién está ahí.</p>
          </div>
        ) : others.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
            <span className="text-4xl">🎉</span>
            <p className="text-white font-medium">Sos el primero</p>
            <p className="text-white/40 text-sm">Esperá a que llegue más gente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {others.map(p => (
              <UserCard key={p.user_id} profile={p.profiles} currentUserId={userId} venueId={activeVenue!.id} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
