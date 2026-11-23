"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ZoomControl({
  zoom,
  min,
  max,
  step,
  onChange,
}: {
  zoom: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={zoom <= min}
        onClick={() => onChange(Math.max(min, zoom - step))}
        aria-label="Уменьшить"
      >
        <MinusIcon />
      </Button>
      <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={zoom >= max}
        onClick={() => onChange(Math.min(max, zoom + step))}
        aria-label="Увеличить"
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
