"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
import { useApperioStore } from "@/store/apperio-store";

/**
 * Loads the authenticated user into the store on mount.
 *
 * currentUser is deliberately excluded from the store's partialize list, so it
 * is null after every reload. Fetching the profile here repopulates it, and
 * means a profile change on the server shows up on reload rather than
 * requiring a fresh login.
 *
 * Returns false until the first attempt settles.
 */
export function useHydrateCurrentUser(): boolean {
  const setCurrentUser = useApperioStore((s) => s.setCurrentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    userService
      .getProfile()
      .then((user) => {
        if (cancelled || !user?._id) return;

        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        setCurrentUser({
          id: String(user._id),
          email: user.email,
          name: name || undefined,
          betaAccess: user.betaAccess,
          betaTier: user.betaTier,
        });
      })
      .catch(() => {
        // 401 redirects are handled by the axios interceptor in services/config.ts.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [setCurrentUser]);

  return ready;
}
