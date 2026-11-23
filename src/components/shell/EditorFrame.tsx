"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useConstructor } from "@/components/shell/constructor-context";

export function EditorFrame({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  const { setTitle, setMeta, setSections, setCatalogSections, setToolbar } =
    useConstructor();

  useEffect(() => {
    setTitle(title);
    setMeta(meta);
    setCatalogSections([]);
  }, [title, meta, setTitle, setMeta, setCatalogSections]);

  useLayoutEffect(() => {
    return () => {
      setTitle("Отчёты");
      setMeta(undefined);
      setSections([]);
      setCatalogSections([]);
      setToolbar(null);
    };
  }, [setTitle, setMeta, setSections, setCatalogSections, setToolbar]);

  return <div className="h-full min-h-0">{children}</div>;
}
