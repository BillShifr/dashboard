"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useConstructor } from "@/components/shell/constructor-context";

export function EditorFrame({
  title,
  meta,
  detail,
  children,
}: {
  title: string;
  meta?: string;
  detail?: string;
  children: ReactNode;
}) {
  const {
    setTitle,
    setMeta,
    setDetail,
    setSections,
    setCatalogSections,
    setToolbar,
  } = useConstructor();

  useEffect(() => {
    setTitle(title);
    setMeta(meta);
    setDetail(detail);
    setCatalogSections([]);
  }, [title, meta, detail, setTitle, setMeta, setDetail, setCatalogSections]);

  useLayoutEffect(() => {
    return () => {
      setTitle("Отчёты");
      setMeta(undefined);
      setDetail(undefined);
      setSections([]);
      setCatalogSections([]);
      setToolbar(null);
    };
  }, [
    setTitle,
    setMeta,
    setDetail,
    setSections,
    setCatalogSections,
    setToolbar,
  ]);

  return <div className="h-full min-h-0">{children}</div>;
}
