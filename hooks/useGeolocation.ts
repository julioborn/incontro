"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import { haversineDistance, isInsideVenueRadius, isVenueOpen, getVenueCloseDateTime } from "@/lib/geo";
import type { Venue } from "@/lib/supabase";

interface GeoState {
  coords: GeolocationCoordinates | null;
  error: string | null;
  isLoading: boolean;
  isInsideVenue: boolean;
  distance: number | null;
  activeVenue: Venue | null;
}

export function useGeolocation(userId: string | null) {
  const [state, setState] = useState<GeoState>({
    coords: null, error: null, isLoading: true,
    isInsideVenue: false, distance: null, activeVenue: null,
  });

  const watchIdRef    = useRef<number | null>(null);
  const presenceIdRef = useRef<string | null>(null);
  const wasInsideRef  = useRef<boolean>(false);
  const venuesRef     = useRef<Venue[]>([]);         // cache local de venues
  const lastVenueFetchRef = useRef<number>(0);

  // Carga venues y los cachea; refetch cada 60s
  const loadVenues = useCallback(async () => {
    const now = Date.now();
    if (now - lastVenueFetchRef.current < 60_000 && venuesRef.current.length > 0) return;
    const { data } = await supabaseClient.from("venues").select("*");
    if (data) venuesRef.current = data as Venue[];
    lastVenueFetchRef.current = now;
  }, []);

  const deactivatePresence = useCallback(async () => {
    if (!presenceIdRef.current || !userId) return;
    await supabaseClient
      .from("presences")
      .update({ is_active: false })
      .eq("id", presenceIdRef.current);
    presenceIdRef.current = null;
    wasInsideRef.current = false;
  }, [userId]);

  const activatePresence = useCallback(async (venue: Venue) => {
    if (!userId) return;
    const expires = getVenueCloseDateTime(venue);
    const { data } = await supabaseClient
      .from("presences")
      .upsert(
        { user_id: userId, venue_id: venue.id, is_active: true, expires_at: expires?.toISOString() ?? null },
        { onConflict: "user_id,venue_id" }
      )
      .select("id")
      .single();
    if (data) presenceIdRef.current = data.id;
    wasInsideRef.current = true;
  }, [userId]);

  const checkLocation = useCallback(async (coords: GeolocationCoordinates) => {
    if (!userId) return;

    await loadVenues();
    const venues = venuesRef.current;

    if (!venues.length) {
      if (wasInsideRef.current) await deactivatePresence();
      setState(s => ({ ...s, isInsideVenue: false, distance: null, activeVenue: null, isLoading: false }));
      return;
    }

    // Encontrar el venue más cercano
    let nearest: Venue | null = null;
    let minDist = Infinity;
    for (const venue of venues) {
      const d = haversineDistance(coords.latitude, coords.longitude, venue.lat, venue.lng);
      if (d < minDist) { minDist = d; nearest = venue; }
    }

    const inside = nearest
      ? isInsideVenueRadius(coords.latitude, coords.longitude, nearest) && isVenueOpen(nearest)
      : false;

    if (inside && nearest) {
      if (!wasInsideRef.current) await activatePresence(nearest);
      setState(s => ({ ...s, isInsideVenue: true, distance: minDist, activeVenue: nearest, isLoading: false, error: null }));
    } else {
      if (wasInsideRef.current) await deactivatePresence();
      setState(s => ({ ...s, isInsideVenue: false, distance: minDist === Infinity ? null : minDist, activeVenue: null, isLoading: false, error: null }));
    }
  }, [userId, loadVenues, activatePresence, deactivatePresence]);

  useEffect(() => {
    if (!userId) return;

    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", isLoading: false }));
      return;
    }

    // Forzar carga inicial de venues
    loadVenues();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState(s => ({ ...s, coords: pos.coords }));
        checkLocation(pos.coords);
      },
      (err) => setState(s => ({ ...s, error: err.message, isLoading: false })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    // Suscripción en tiempo real a cambios de venues (zona, radio, etc.)
    const channel = supabaseClient
      .channel("venues-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "venues" }, () => {
        lastVenueFetchRef.current = 0; // forzar refetch en próximo GPS update
      })
      .subscribe();

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      supabaseClient.removeChannel(channel);
      deactivatePresence();
    };
  }, [userId, checkLocation, loadVenues, deactivatePresence]);

  return state;
}
