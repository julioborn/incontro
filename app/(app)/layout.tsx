import { getServerSession } from "@/lib/supabase.server";
import { redirect } from "next/navigation";
import { GeolocationProvider } from "@/contexts/GeolocationContext";
import { MatchFlash } from "@/components/ui/MatchFlash";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <GeolocationProvider userId={session.user.id}>
      {children}
      <MatchFlash userId={session.user.id} />
    </GeolocationProvider>
  );
}
