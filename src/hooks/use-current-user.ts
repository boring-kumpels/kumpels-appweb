"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@prisma/client";

type CurrentUserData = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => Promise<void>;
};

export function useCurrentUser(): CurrentUserData {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Lazy-load Supabase client to prevent build-time initialization
  const supabase = useMemo(() => {
    if (typeof window !== "undefined") {
      return createClientComponentClient();
    }
    return null;
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!supabase) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get current user from Supabase
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (userData.user) {
        setUser(userData.user);

        // Fetch the user's profile from the API
        const response = await fetch("/api/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await response.json();
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    fetchUserData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            setUser(session.user);

            // Fetch the user's profile when auth state changes
            try {
              const response = await fetch("/api/profile");
              if (response.ok) {
                const profileData = await response.json();
                setProfile(profileData);
              }
            } catch (err) {
              console.error("Error fetching profile:", err);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchUserData]);

  return { user, profile, isLoading, error, refetch: fetchUserData };
}
