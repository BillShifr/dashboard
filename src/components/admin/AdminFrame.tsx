"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useConstructor } from "@/components/shell/constructor-context";

export function AdminFrame({ children }: { children: ReactNode }) {
  const {
    setTitle,
    setMeta,
    setDetail,
    setSections,
    setCatalogSections,
    setToolbar,
  } = useConstructor();

  useEffect(() => {
    setTitle("Администрирование");
    setMeta(undefined);
    setDetail(undefined);
  }, [setTitle, setMeta, setDetail]);

  useLayoutEffect(() => {
    return () => {
      setSections([]);
      setCatalogSections([]);
      setToolbar(null);
    };
  }, [setSections, setCatalogSections, setToolbar]);

  return <div className="h-full overflow-auto px-6 py-8">{children}</div>;
}
