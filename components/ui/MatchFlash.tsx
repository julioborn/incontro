"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";

export function MatchFlash({ userId }: { userId: string }) {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const channel = supabaseClient
      .channel(`match-flash:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "matches",
        filter: `user_b=eq.${userId}`,
      }, () => triggerFlash())
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "matches",
        filter: `user_a=eq.${userId}`,
      }, () => triggerFlash())
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [userId]);

  function triggerFlash() {
    setFlashing(true);
    setTimeout(() => setFlashing(false), 1800);
  }

  if (!flashing) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        border: "4px solid #FF3B30",
        borderRadius: "0px",
        animation: "matchPulse 0.4s ease-in-out 4",
        boxShadow: "inset 0 0 40px rgba(255,59,48,0.3), 0 0 40px rgba(255,59,48,0.2)",
      }}
    />
  );
}
