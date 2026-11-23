"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceItem = {
  id: string;
  label: string;
  hint?: string;
  index?: string;
  active?: boolean;
  onSelect: () => void;
};

export type WorkspaceSection = {
  title: string;
  items: WorkspaceItem[];
};

type ConstructorState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  title: string;
  setTitle: (title: string) => void;
  meta?: string;
  setMeta: (meta: string | undefined) => void;
  sections: WorkspaceSection[];
  setSections: (sections: WorkspaceSection[]) => void;
  catalogSections: WorkspaceSection[];
  setCatalogSections: (sections: WorkspaceSection[]) => void;
  toolbar: ReactNode;
  setToolbar: (toolbar: ReactNode) => void;
};

const ConstructorContext = createContext<ConstructorState | null>(null);

export function ConstructorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Отчёты");
  const [meta, setMeta] = useState<string | undefined>(undefined);
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const [catalogSections, setCatalogSections] = useState<WorkspaceSection[]>(
    [],
  );
  const [toolbar, setToolbar] = useState<ReactNode>(null);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      title,
      setTitle,
      meta,
      setMeta,
      sections,
      setSections,
      catalogSections,
      setCatalogSections,
      toolbar,
      setToolbar,
    }),
    [open, title, meta, sections, catalogSections, toolbar, toggle],
  );

  return (
    <ConstructorContext.Provider value={value}>
      {children}
    </ConstructorContext.Provider>
  );
}

export function useConstructor() {
  const ctx = useContext(ConstructorContext);
  if (!ctx) throw new Error("ConstructorProvider required");
  return ctx;
}
