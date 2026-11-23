"use client";

import { MenuIcon } from "lucide-react";
import { useConstructor } from "@/components/shell/constructor-context";
import { UserMenu, type HeaderUser } from "@/components/shell/UserMenu";
import { Button } from "@/components/ui/button";

export function AppTopbar({ user }: { user: HeaderUser }) {
  const { open, setOpen, title, meta, detail, toolbar } = useConstructor();

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2 md:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Меню разделов"
      >
        <MenuIcon />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-base tracking-tight md:text-lg">
          {title}
        </h1>
        {meta ? (
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        ) : null}
        {detail ? (
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {detail}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {toolbar}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
