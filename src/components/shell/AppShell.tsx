"use client";

import dynamic from "next/dynamic";
import type { HeaderUser } from "@/components/shell/UserMenu";

const AuthenticatedShell = dynamic(() =>
  import("@/components/shell/AuthenticatedShell").then(
    (mod) => mod.AuthenticatedShell,
  ),
);

export function AppShell({
  user,
  children,
}: {
  user: HeaderUser | null;
  children: React.ReactNode;
}) {
  if (!user) return children;
  return <AuthenticatedShell user={user}>{children}</AuthenticatedShell>;
}
