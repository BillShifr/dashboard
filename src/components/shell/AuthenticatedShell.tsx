"use client";

import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppTopbar } from "@/components/shell/AppTopbar";
import { ConstructorProvider } from "@/components/shell/constructor-context";
import type { HeaderUser } from "@/components/shell/UserMenu";

export function AuthenticatedShell({
  user,
  children,
}: {
  user: HeaderUser;
  children: React.ReactNode;
}) {
  return (
    <ConstructorProvider>
      <div className="flex h-svh overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar user={user} />
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </ConstructorProvider>
  );
}
