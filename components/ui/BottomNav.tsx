"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadMatches } from "@/hooks/useUnreadMatches";
import { supabaseClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  return userId;
}

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H15v-5H9v5H4a1 1 0 01-1-1V9.5z" fill="currentColor"/>
      : <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H15v-5H9v5H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>}
  </svg>
);

const LikeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
      : <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>}
  </svg>
);

const ChatIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="currentColor"/>
      : <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>}
  </svg>
);

const ProfileIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {filled ? (
      <><circle cx="12" cy="8" r="4" fill="currentColor"/>
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
    ) : (
      <><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
    )}
  </svg>
);

export function BottomNav() {
  const path = usePathname();
  const userId = useCurrentUserId();
  const { newMatches, newMessages } = useUnreadMatches(userId);

  const ITEMS = [
    { href: "/home",       label: "Inicio",   Icon: HomeIcon,    badge: 0 },
    { href: "/matches",    label: "Likes",    Icon: LikeIcon,    badge: newMatches || 3 },
    { href: "/chats",      label: "Mensajes", Icon: ChatIcon,    badge: newMessages || 2 },
    { href: "/profile/me", label: "Perfil",   Icon: ProfileIcon, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 pb-safe"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.06)", height: "64px", overflow: "visible" }}>
      {ITEMS.map(({ href, label, Icon, badge }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all"
            style={{ color: active ? "#8296E3" : "rgba(255,255,255,0.35)" }}>
            {/* Wrapper del ícono con tamaño fijo para anclar el badge */}
            <span style={{ position: "relative", display: "inline-flex", width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
              <Icon filled={active} />
              {badge > 0 && (
                <span style={{
                  position: "absolute",
                  top: -6,
                  right: -8,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "#FF3B30",
                  border: "2px solid #000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#fff",
                  padding: "0 4px",
                  lineHeight: 1,
                  zIndex: 50,
                }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            {active && (
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#8296E3", marginTop: -2 }} />
            )}
            <span className="text-[10px] font-medium tracking-wide" style={{ opacity: active ? 1 : 0.7 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
