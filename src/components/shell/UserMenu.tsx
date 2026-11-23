"use client";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABEL = {
  admin: "Администратор",
  editor: "Редактор",
  viewer: "Просмотр",
} as const;

export type HeaderUser = {
  fullName: string;
  login: string;
  role: keyof typeof ROLE_LABEL;
};

export function UserMenu({ user }: { user: HeaderUser }) {
  function logout() {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/api/auth/logout";
    document.body.append(form);
    form.submit();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[16rem] gap-1.5">
          <span className="truncate">{user.fullName}</span>
          <ChevronDownIcon className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {ROLE_LABEL[user.role]} · {user.login}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>Выйти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
