"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useConstructor } from "@/components/shell/constructor-context";

export function PresetsFrame({ children }: { children: ReactNode }) {
  const {
    setTitle,
    setMeta,
    setDetail,
    setSections,
    setCatalogSections,
    setToolbar,
  } = useConstructor();

  useEffect(() => {
    setTitle("Отчёты");
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

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
        {children}
      </div>
    </div>
  );
}
