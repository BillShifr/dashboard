"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function ImportFileButton({
  accept = ".xlsx",
  disabled,
  onFile,
  children = "Импорт Excel",
}: {
  accept?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  children?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="inline-flex">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
