"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanbanIcon,
  LayoutTemplateIcon,
  PanelLeftIcon,
  ShieldIcon,
} from "lucide-react";
import { useConstructor } from "@/components/shell/constructor-context";
import { PRODUCT_CATALOG } from "@/components/shell/product-catalog";
import { cn } from "@/lib/utils";

export function AppSidebar({ role }: { role: "viewer" | "editor" | "admin" }) {
  const pathname = usePathname();
  const { open, setOpen, catalogSections, sections } = useConstructor();
  const productIcon = (id: string) =>
    PRODUCT_CATALOG.find((p) => p.kind === id)?.icon ?? LayoutTemplateIcon;
  const presetsActive =
    pathname === "/presets" || pathname.startsWith("/presets");
  const adminActive = pathname === "/admin" || pathname.startsWith("/admin");

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/25 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-out md:static md:translate-x-0",
          open
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full md:w-[4.5rem] md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 px-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
            ТФ
          </span>
          {open ? (
            <span className="min-w-0 text-[15px] font-semibold tracking-tight">
              Dashboard
            </span>
          ) : null}
          <button
            type="button"
            className="ml-auto hidden size-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent md:inline-flex"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Свернуть меню" : "Развернуть меню"}
          >
            <PanelLeftIcon className="size-4" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-2 py-3">
          <SidebarSection title={open ? "Проекты" : undefined}>
            <SidebarLink
              href="/presets"
              active={presetsActive}
              open={open}
              icon={<FolderKanbanIcon className="size-4" />}
            >
              Отчёты
            </SidebarLink>
            {role === "admin" ? (
              <SidebarLink
                href="/admin"
                active={adminActive}
                open={open}
                icon={<ShieldIcon className="size-4" />}
              >
                Администрирование
              </SidebarLink>
            ) : null}
          </SidebarSection>

          {catalogSections.map((section) => (
            <SidebarSection
              key={`cat-${section.title}`}
              title={open ? section.title : undefined}
            >
              {section.items.map((item) => {
                const Icon = productIcon(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors duration-200",
                      item.active
                        ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-85" />
                    {open ? (
                      <span className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="block truncate text-[11px] text-sidebar-foreground/50">
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </SidebarSection>
          ))}

          {sections.map((section) => (
            <SidebarSection
              key={section.title}
              title={open ? section.title : undefined}
            >
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onSelect}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    item.active
                      ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  {item.index ? (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-foreground/10 text-[11px] font-medium tabular-nums">
                      {item.index}
                    </span>
                  ) : (
                    <LayoutTemplateIcon className="size-4 shrink-0 opacity-80" />
                  )}
                  {open ? (
                    <span className="min-w-0">
                      <span className="block truncate">{item.label}</span>
                      {item.hint ? (
                        <span className="block truncate text-[11px] text-sidebar-foreground/50">
                          {item.hint}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              ))}
            </SidebarSection>
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      {title ? (
        <p className="px-2 text-xs font-medium text-sidebar-foreground/55">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function SidebarLink({
  href,
  active,
  open,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  open: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
      )}
    >
      {icon}
      {open ? children : <span className="sr-only">{children}</span>}
    </Link>
  );
}
