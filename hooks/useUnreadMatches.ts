"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";

export function useUnreadMatches(userId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { data } = await supabaseClient
        .from("matches")
        .select("id, user_a, new_for_a, new_for_b")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .eq("is_active", true);

      if (!data) return;
      const unread = data.filter(m =>
        (m.user_a === userId && m.new_for_a) ||
        (m.user_a !== userId && m.new_for_b)
      ).length;
      setCount(unread);
    };

    fetch();

    const channel = supabaseClient
      .channel(`unread-matches:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetch)
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [userId]);

  return count;
}
