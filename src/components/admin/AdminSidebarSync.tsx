"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useConstructor } from "@/components/shell/constructor-context";

export function AdminSidebarSync({
  section,
}: {
  section: "users" | "reports";
}) {
  const router = useRouter();
  const { setCatalogSections } = useConstructor();

  useLayoutEffect(() => {
    setCatalogSections([
      {
        title: "Разделы",
        items: [
          {
            id: "users",
            label: "Пользователи",
            active: section === "users",
            onSelect: () => router.push("/admin"),
          },
          {
            id: "reports",
            label: "Отчёты",
            active: section === "reports",
            onSelect: () => router.push("/admin?section=reports"),
          },
        ],
      },
    ]);
    return () => setCatalogSections([]);
  }, [section, router, setCatalogSections]);

  return null;
}
