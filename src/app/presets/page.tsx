import { unbounded } from "@/app/display-font";
import { requireUser } from "@/lib/auth";
import { listPresets } from "@/domain/presets/service";
import { PresetsFrame } from "@/components/shell/PresetsFrame";
import { PresetsPageContent } from "@/components/shell/PresetsPageContent";

export default async function PresetsPage() {
  const user = await requireUser();
  const rows = await listPresets(user);

  return (
    <PresetsFrame className={unbounded.variable}>
      <PresetsPageContent rows={rows} canCreate={user.role !== "viewer"} />
    </PresetsFrame>
  );
}
