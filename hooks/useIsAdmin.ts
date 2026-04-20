"use client";

import { useEffect, useState } from "react";

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/admin-check")
      .then(r => r.ok ? r.json() : { isSuperAdmin: false })
      .then(data => setIsAdmin(data.isSuperAdmin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  return isAdmin;
}
