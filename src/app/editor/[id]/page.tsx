import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPreset } from "@/domain/presets/service";
import { EditorShell } from "@/components/editor/EditorShell";
import { EditorFrame } from "@/components/shell/EditorFrame";

import { reportKindLabel } from "@/components/shell/product-catalog";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const preset = await getPreset(user, id);
  if (!preset) notFound();

  return (
    <EditorFrame
      title={preset.name}
      meta={`${reportKindLabel(preset.kind)} · v${preset.version}`}
    >
      <EditorShell
        presetId={preset.id}
        kind={preset.kind}
        version={preset.version}
        payload={preset.payload}
        readOnly={user.role === "viewer"}
      />
    </EditorFrame>
  );
}
